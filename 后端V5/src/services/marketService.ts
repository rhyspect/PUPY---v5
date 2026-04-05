import { supabase } from '../config/supabase.js';
import { MarketProduct, ApiResponse, PaginatedResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const SAFE_SELLER_FIELDS = `
  id,
  username,
  email,
  age,
  gender,
  resident_city,
  frequent_cities,
  hobbies,
  mbti,
  signature,
  avatar_url,
  bio,
  is_verified,
  created_at,
  updated_at,
  last_login
`;

const SAFE_PET_FIELDS = `
  id,
  user_id,
  name,
  type,
  breed,
  gender,
  personality,
  age,
  weight,
  images,
  bio,
  vaccinated,
  health_status,
  pedigree_info,
  is_digital_twin,
  digital_twin_data,
  created_at,
  updated_at
`;

const MARKET_WITH_RELATIONS_SELECT = `*,
  seller:users!market_products_seller_id_fkey(${SAFE_SELLER_FIELDS}),
  pet:pets!market_products_pet_id_fkey(${SAFE_PET_FIELDS})`;

const SELLER_PRODUCTS_SELECT = `*,
  pet:pets!market_products_pet_id_fkey(${SAFE_PET_FIELDS})`;

export class MarketService {
  static async createProduct(
    sellerId: string,
    data: {
      pet_id?: string;
      title: string;
      description: string;
      category: string;
      price?: number;
      images: string[];
      type: 'breeding' | 'service' | 'care_product' | 'toy' | 'food';
      requirements?: string;
    },
  ): Promise<ApiResponse<MarketProduct>> {
    try {
      const productId = uuidv4();
      const { error } = await supabase
        .from('market_products')
        .insert({
          id: productId,
          seller_id: sellerId,
          ...data,
          status: 'active',
        });

      if (error) throw error;

      const product = await this.getProductById(productId);
      return {
        success: true,
        data: product as MarketProduct,
        message: 'Product created successfully.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create product.',
        code: 500,
      };
    }
  }

  static async getProductById(productId: string): Promise<MarketProduct | null> {
    try {
      const { data, error } = await supabase
        .from('market_products')
        .select('*')
        .eq('id', productId)
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch {
      return null;
    }
  }

  static async getProductsByCategory(
    category: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<MarketProduct & { seller: any; pet: any }>> {
    try {
      const offset = (page - 1) * limit;

      const [productsRes, countRes] = await Promise.all([
        supabase
          .from('market_products')
          .select(MARKET_WITH_RELATIONS_SELECT)
          .eq('category', category)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase
          .from('market_products')
          .select('id', { count: 'exact', head: true })
          .eq('category', category)
          .eq('status', 'active'),
      ]);

      const total = countRes.count || 0;

      return {
        success: true,
        data: productsRes.data || [],
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
        message: 'Products loaded.',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: { total: 0, page: 1, limit, total_pages: 0 },
        error: error.message || 'Failed to load products.',
      };
    }
  }

  static async searchProducts(
    keyword: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<MarketProduct & { seller: any; pet: any }>> {
    try {
      const offset = (page - 1) * limit;

      const [productsRes, countRes] = await Promise.all([
        supabase
          .from('market_products')
          .select(MARKET_WITH_RELATIONS_SELECT)
          .eq('status', 'active')
          .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase
          .from('market_products')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`),
      ]);

      const total = countRes.count || 0;

      return {
        success: true,
        data: productsRes.data || [],
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
        message: 'Products loaded.',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: { total: 0, page: 1, limit, total_pages: 0 },
        error: error.message || 'Failed to load products.',
      };
    }
  }

  static async getSellerProducts(
    sellerId: string,
  ): Promise<ApiResponse<(MarketProduct & { pet: any })[]>> {
    try {
      const { data, error } = await supabase
        .from('market_products')
        .select(SELLER_PRODUCTS_SELECT)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        message: 'Seller products loaded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load seller products.',
        code: 500,
      };
    }
  }

  static async updateProduct(
    productId: string,
    updates: Partial<MarketProduct>,
  ): Promise<ApiResponse<MarketProduct>> {
    try {
      const { data, error } = await supabase
        .from('market_products')
        .update(updates)
        .eq('id', productId)
        .select('*')
        .limit(1);

      if (error || !data || data.length === 0) {
        throw error || new Error('Failed to update product.');
      }

      return {
        success: true,
        data: data[0],
        message: 'Product updated.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update product.',
        code: 500,
      };
    }
  }

  static async deleteProduct(productId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('market_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      return {
        success: true,
        data: null,
        message: 'Product deleted.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete product.',
        code: 500,
      };
    }
  }

  static async getBreedingMarket(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<MarketProduct & { seller: any; pet: any }>> {
    try {
      const offset = (page - 1) * limit;

      const [productsRes, countRes] = await Promise.all([
        supabase
          .from('market_products')
          .select(MARKET_WITH_RELATIONS_SELECT)
          .eq('type', 'breeding')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase
          .from('market_products')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'breeding')
          .eq('status', 'active'),
      ]);

      const total = countRes.count || 0;

      return {
        success: true,
        data: productsRes.data || [],
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
        message: 'Breeding market loaded.',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: { total: 0, page: 1, limit, total_pages: 0 },
        error: error.message || 'Failed to load breeding market.',
      };
    }
  }

  static async getFeed(
    category?: string,
    type?: string,
    limit: number = 20,
  ): Promise<ApiResponse<(MarketProduct & { seller: any; pet: any })[]>> {
    try {
      const query = supabase
        .from('market_products')
        .select(MARKET_WITH_RELATIONS_SELECT)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query.eq('category', category);
      }

      if (type) {
        query.eq('type', type as MarketProduct['type']);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || [],
        message: 'Market feed loaded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load market feed.',
        code: 500,
      };
    }
  }
}

export default MarketService;
