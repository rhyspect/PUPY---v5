import config from '../config/index.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import type { AdminOverview, ApiResponse, PaginatedResponse, SafeUser } from '../types/index.js';

const countRows = async (table: string) => {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

const buildPagination = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  total_pages: Math.max(1, Math.ceil(total / limit)),
});

export class AdminService {
  static async getOverview(): Promise<ApiResponse<AdminOverview>> {
    try {
      const [
        users,
        pets,
        matches,
        messages,
        diaries,
        products,
        breedingRequests,
        notifications,
        recentUsersRes,
        recentPetsRes,
        recentMessagesRes,
      ] = await Promise.all([
        countRows('users'),
        countRows('pets'),
        countRows('matches'),
        countRows('messages'),
        countRows('diaries'),
        countRows('market_products'),
        countRows('breeding_requests'),
        countRows('notifications'),
        supabase
          .from('users')
          .select('id, username, email, resident_city, is_verified, created_at, last_login')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('pets')
          .select('id, name, type, gender, created_at, owner:users!pets_user_id_fkey(id, username, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('messages')
          .select('id, content, created_at, sender:users!messages_sender_id_fkey(id, username), receiver:users!messages_receiver_id_fkey(id, username)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      return {
        success: true,
        data: {
          stats: {
            users,
            pets,
            matches,
            messages,
            diaries,
            products,
            breedingRequests,
            notifications,
          },
          health: {
            environment: config.nodeEnv,
            apiBaseUrl: config.apiBaseUrl,
            supabaseConfigured: Boolean(config.supabase.url && config.supabase.anonKey),
            googleAiConfigured: Boolean(config.googleAi.apiKey),
            adminEmailCount: config.admin.allowedEmails.length,
            timestamp: new Date().toISOString(),
          },
          recentUsers: (recentUsersRes.data || []) as AdminOverview['recentUsers'],
          recentPets:
            recentPetsRes.data?.map((pet: any) => ({
              id: pet.id,
              name: pet.name,
              type: pet.type,
              gender: pet.gender,
              created_at: pet.created_at,
              owner: Array.isArray(pet.owner) ? pet.owner[0] : pet.owner,
            })) || [],
          recentMessages:
            recentMessagesRes.data?.map((message: any) => ({
              id: message.id,
              content: message.content,
              created_at: message.created_at,
              sender: Array.isArray(message.sender) ? message.sender[0] : message.sender,
              receiver: Array.isArray(message.receiver) ? message.receiver[0] : message.receiver,
            })) || [],
        },
        message: '后台总览加载成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '加载后台总览失败。',
        code: 500,
      };
    }
  }

  static async getUsers(page = 1, limit = 20, keyword = ''): Promise<PaginatedResponse<SafeUser>> {
    try {
      const offset = (page - 1) * limit;
      let listQuery = supabase
        .from('users')
        .select('id, username, email, age, gender, resident_city, frequent_cities, hobbies, mbti, signature, avatar_url, bio, is_verified, created_at, updated_at, last_login')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      let countQuery = supabase.from('users').select('id', { count: 'exact', head: true });

      if (keyword) {
        const expression = `username.ilike.%${keyword}%,email.ilike.%${keyword}%`;
        listQuery = listQuery.or(expression);
        countQuery = countQuery.or(expression);
      }

      const [listRes, countRes] = await Promise.all([listQuery, countQuery]);
      return {
        success: true,
        data: (listRes.data || []) as SafeUser[],
        pagination: buildPagination(countRes.count || 0, page, limit),
        message: '用户列表加载成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: buildPagination(0, page, limit),
        error: error.message || '加载用户列表失败。',
      };
    }
  }

  static async updateUserVerification(userId: string, isVerified: boolean): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabaseAdmin.from('users').update({ is_verified: isVerified }).eq('id', userId);
      if (error) throw error;
      return {
        success: true,
        data: null,
        message: isVerified ? '用户已通过审核。' : '用户已取消审核通过。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '更新审核状态失败。',
        code: 500,
      };
    }
  }

  static async getPets(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    try {
      const offset = (page - 1) * limit;
      const [listRes, countRes] = await Promise.all([
        supabase
          .from('pets')
          .select('*, owner:users!pets_user_id_fkey(id, username, email, is_verified)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase.from('pets').select('id', { count: 'exact', head: true }),
      ]);
      return {
        success: true,
        data: listRes.data || [],
        pagination: buildPagination(countRes.count || 0, page, limit),
        message: '宠物列表加载成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: buildPagination(0, page, limit),
        error: error.message || '加载宠物列表失败。',
      };
    }
  }

  static async getMarketProducts(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    try {
      const offset = (page - 1) * limit;
      const [listRes, countRes] = await Promise.all([
        supabase
          .from('market_products')
          .select('*, seller:users!market_products_seller_id_fkey(id, username, email), pet:pets(id, name, type)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase.from('market_products').select('id', { count: 'exact', head: true }),
      ]);
      return {
        success: true,
        data: listRes.data || [],
        pagination: buildPagination(countRes.count || 0, page, limit),
        message: '商品列表加载成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: buildPagination(0, page, limit),
        error: error.message || '加载商品列表失败。',
      };
    }
  }

  static async getBreedingRequests(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    try {
      const offset = (page - 1) * limit;
      const [listRes, countRes] = await Promise.all([
        supabase
          .from('breeding_requests')
          .select('*, sender:users!breeding_requests_sender_id_fkey(id, username, email), receiver:users!breeding_requests_receiver_id_fkey(id, username, email), sender_pet:pets!breeding_requests_sender_pet_id_fkey(id, name, type), receiver_pet:pets!breeding_requests_receiver_pet_id_fkey(id, name, type)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase.from('breeding_requests').select('id', { count: 'exact', head: true }),
      ]);
      return {
        success: true,
        data: listRes.data || [],
        pagination: buildPagination(countRes.count || 0, page, limit),
        message: '繁育请求加载成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: buildPagination(0, page, limit),
        error: error.message || '加载繁育请求失败。',
      };
    }
  }
}

export default AdminService;
