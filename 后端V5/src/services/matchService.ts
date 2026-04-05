import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';

const SAFE_MATCH_USER_FIELDS = `
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

const SAFE_MATCH_PET_FIELDS = `
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
import type { ApiResponse, Match, PaginatedResponse } from '../types/index.js';

function normalizePersonality(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export class MatchService {
  static calculateCompatibilityScore(
    petA: any,
    petB: any,
    ownerA: any,
    ownerB: any,
  ): number {
    let score = 0;

    if (petA.type && petA.type === petB.type) {
      score += 30;
    }

    const personalityA = normalizePersonality(petA.personality);
    const personalityB = normalizePersonality(petB.personality);
    if (personalityA && personalityB) {
      if (personalityA === personalityB) {
        score += 20;
      } else if (
        (personalityA.includes('外向') && personalityB.includes('温柔')) ||
        (personalityB.includes('外向') && personalityA.includes('温柔')) ||
        (personalityA.includes('活泼') && personalityB.includes('稳定')) ||
        (personalityB.includes('活泼') && personalityA.includes('稳定'))
      ) {
        score += 15;
      } else {
        score += 8;
      }
    }

    if (ownerA.resident_city && ownerA.resident_city === ownerB.resident_city) {
      score += 20;
    } else if (
      ownerA.frequent_cities?.includes(ownerB.resident_city) ||
      ownerB.frequent_cities?.includes(ownerA.resident_city)
    ) {
      score += 10;
    }

    const compatibleMbtis: Record<string, string[]> = {
      ENFP: ['INTJ', 'INFJ'],
      ENTP: ['INTJ', 'INTP'],
      ENFJ: ['INFP', 'ISFP'],
      ENTJ: ['INTP', 'ISFP'],
      INFP: ['ENFJ', 'ENTJ'],
      INFJ: ['ENFP', 'ENTP'],
      INTP: ['ENTP', 'ENTJ'],
      ISTJ: ['ESFJ', 'ISFJ'],
      ISFJ: ['ISTJ', 'ESFJ'],
      ESFJ: ['ISTJ', 'ISFJ'],
      ESFP: ['ISFP', 'ISTP'],
      ISFP: ['ESFP', 'ENFJ'],
      ISTP: ['ESFP', 'ESTP'],
      ESTP: ['ISTP', 'ESFP'],
    };

    if (
      compatibleMbtis[ownerA.mbti]?.includes(ownerB.mbti) ||
      compatibleMbtis[ownerB.mbti]?.includes(ownerA.mbti)
    ) {
      score += 15;
    } else if (ownerA.mbti && ownerA.mbti === ownerB.mbti) {
      score += 8;
    }

    const commonHobbies = ownerA.hobbies?.filter((hobby: string) => ownerB.hobbies?.includes(hobby)).length || 0;
    if (commonHobbies > 0) {
      score += Math.min(10, commonHobbies * 3);
    }

    return Number((Math.min(100, score) / 100).toFixed(2));
  }

  static async createMatch(
    userAId: string,
    userBId: string,
    petAId: string,
    petBId: string,
  ): Promise<ApiResponse<Match>> {
    try {
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`)
        .limit(1);

      if (existingMatch && existingMatch.length > 0) {
        return {
          success: false,
          error: '匹配记录已存在。',
          code: 400,
        };
      }

      const [petAResult, petBResult, userAResult, userBResult] = await Promise.all([
        supabase.from('pets').select('*').eq('id', petAId).limit(1),
        supabase.from('pets').select('*').eq('id', petBId).limit(1),
        supabase.from('users').select('*').eq('id', userAId).limit(1),
        supabase.from('users').select('*').eq('id', userBId).limit(1),
      ]);

      if (
        !petAResult.data?.length ||
        !petBResult.data?.length ||
        !userAResult.data?.length ||
        !userBResult.data?.length
      ) {
        return {
          success: false,
          error: '宠物或用户不存在。',
          code: 404,
        };
      }

      const compatibilityScore = this.calculateCompatibilityScore(
        petAResult.data[0],
        petBResult.data[0],
        userAResult.data[0],
        userBResult.data[0],
      );

      const matchId = uuidv4();
      const { error } = await supabase.from('matches').insert({
        id: matchId,
        user_a_id: userAId,
        user_b_id: userBId,
        pet_a_id: petAId,
        pet_b_id: petBId,
        compatibility_score: compatibilityScore,
        status: 'pending',
      });

      if (error) {
        throw error;
      }

      const match = await this.getMatchById(matchId);
      return {
        success: true,
        data: match as Match,
        message: '喜欢已记录，等待系统匹配。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '创建匹配失败。',
        code: 500,
      };
    }
  }

  static async getMatchById(matchId: string): Promise<Match | null> {
    try {
      const { data, error } = await supabase.from('matches').select('*').eq('id', matchId).limit(1);
      if (error || !data || data.length === 0) {
        return null;
      }
      return data[0] as Match;
    } catch {
      return null;
    }
  }

  static async updateMatchStatus(
    matchId: string,
    status: 'matched' | 'rejected',
  ): Promise<ApiResponse<Match>> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId)
        .select('*')
        .limit(1);

      if (error || !data || data.length === 0) {
        throw error || new Error('更新失败。');
      }

      return {
        success: true,
        data: data[0],
        message: '匹配状态已更新。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '更新匹配状态失败。',
        code: 500,
      };
    }
  }

  static async getMatchesForUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Match & { pet_a: any; pet_b: any; user_a: any; user_b: any }>> {
    try {
      const offset = (page - 1) * limit;

      const [matchesRes, countRes] = await Promise.all([
        supabase
          .from('matches')
          .select(
            `*,
            pet_a:pets!matches_pet_a_id_fkey(${SAFE_MATCH_PET_FIELDS}),
            pet_b:pets!matches_pet_b_id_fkey(${SAFE_MATCH_PET_FIELDS}),
            user_a:users!matches_user_a_id_fkey(${SAFE_MATCH_USER_FIELDS}),
            user_b:users!matches_user_b_id_fkey(${SAFE_MATCH_USER_FIELDS})`,
          )
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`),
      ]);

      const total = countRes.count || 0;
      return {
        success: true,
        data: matchesRes.data || [],
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
        message: '匹配记录已加载。',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: { total: 0, page: 1, limit, total_pages: 0 },
        error: error.message || '加载匹配记录失败。',
      };
    }
  }
}

export default MatchService;
