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
          error: '邮箱或用户名已存在。',
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
        throw new Error('注册成功但未能读取用户信息。');
      }

      return {
        success: true,
        data: { user: this.toSafeUser(user), token },
        message: '注册成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '注册失败，请稍后再试。',
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
          error: '账号不存在或邮箱未注册。',
          code: 401,
        };
      }

      const user = userData[0] as User;
      const passwordMatch = await bcryptjs.compare(data.password, user.password_hash);
      if (!passwordMatch) {
        return {
          success: false,
          error: '密码不正确。',
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
        message: '登录成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登录失败，请稍后再试。',
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
        throw error || new Error('未找到可更新的用户。');
      }

      return {
        success: true,
        data: this.toSafeUser(data[0] as User),
        message: 'Update succeeded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '更新用户信息失败。',
        code: 500,
      };
    }
  }
}

export default AuthService;
