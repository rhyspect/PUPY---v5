import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import type {
  ApiResponse,
  JWTPayload,
  LoginRequest,
  RegisterRequest,
  SafeUser,
  UpdateUserRequest,
  User,
} from '../types/index.js';

export class AuthService {
  static toSafeUser(user: User): SafeUser {
    const { password_hash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static async register(data: RegisterRequest): Promise<ApiResponse<{ user: SafeUser; token: string }>> {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${data.email},username.eq.${data.username}`)
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        return {
          success: false,
          error: 'User already exists or the email is already in use.',
          code: 400,
        };
      }

      const salt = await bcryptjs.genSalt(10);
      const passwordHash = await bcryptjs.hash(data.password, salt);
      const userId = uuidv4();

      const { error } = await supabaseAdmin.from('users').insert({
        id: userId,
        username: data.username,
        email: data.email,
        password_hash: passwordHash,
        age: data.age,
        gender: data.gender,
        resident_city: data.resident_city,
        is_verified: false,
      });

      if (error) {
        throw error;
      }

      await supabaseAdmin.from('user_stats').insert({
        user_id: userId,
        level: 1,
        experience_points: 0,
        achievements: [],
      });

      const token = this.generateToken({
        user_id: userId,
        email: data.email,
        username: data.username,
      });

      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User was created but could not be read back.');
      }

      return {
        success: true,
        data: { user: this.toSafeUser(user), token },
        message: 'Registration succeeded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed.',
        code: 500,
      };
    }
  }

  static async login(data: LoginRequest): Promise<ApiResponse<{ user: SafeUser; token: string }>> {
    try {
      const { data: userData, error } = await supabase.from('users').select('*').eq('email', data.email).limit(1);

      if (error || !userData || userData.length === 0) {
        return {
          success: false,
          error: 'User not found.',
          code: 401,
        };
      }

      const user = userData[0] as User;
      const passwordMatch = await bcryptjs.compare(data.password, user.password_hash);
      if (!passwordMatch) {
        return {
          success: false,
          error: 'Password is incorrect.',
          code: 401,
        };
      }

      await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

      const token = this.generateToken({
        user_id: user.id,
        email: user.email,
        username: user.username,
      });

      return {
        success: true,
        data: { user: this.toSafeUser(user), token },
        message: 'Login succeeded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed.',
        code: 500,
      };
    }
  }

  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).limit(1);
      if (error || !data || data.length === 0) {
        return null;
      }
      return data[0] as User;
    } catch {
      return null;
    }
  }

  static async updateUser(userId: string, updates: UpdateUserRequest): Promise<ApiResponse<SafeUser>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .limit(1);

      if (error || !data || data.length === 0) {
        throw error || new Error('Update failed.');
      }

      return {
        success: true,
        data: this.toSafeUser(data[0] as User),
        message: 'Update succeeded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Update failed.',
        code: 500,
      };
    }
  }
}

export default AuthService;
