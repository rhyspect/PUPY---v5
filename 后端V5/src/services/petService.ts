import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import type { ApiResponse, CreatePetRequest, Pet } from '../types/index.js';

function normalizeOppositeGenderOptions(gender?: string) {
  const normalized = (gender || '').trim().toLowerCase();
  if (normalized === 'male' || normalized === '公') return ['female', '母'];
  if (normalized === 'female' || normalized === '母') return ['male', '公'];
  return gender ? [gender] : [];
}

export class PetService {
  static async createPet(userId: string, data: CreatePetRequest): Promise<ApiResponse<Pet>> {
    try {
      const petId = uuidv4();
      const { error } = await supabase.from('pets').insert({
        id: petId,
        user_id: userId,
        ...data,
        is_digital_twin: false,
      });

      if (error) {
        throw error;
      }

      const pet = await this.getPetById(petId);
      return {
        success: true,
        data: pet as Pet,
        message: 'Pet created successfully.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create pet.',
        code: 500,
      };
    }
  }

  static async getPetById(petId: string): Promise<Pet | null> {
    try {
      const { data, error } = await supabase.from('pets').select('*').eq('id', petId).limit(1);
      if (error || !data || data.length === 0) {
        return null;
      }
      return data[0] as Pet;
    } catch {
      return null;
    }
  }

  static async getPetsByUserId(userId: string): Promise<ApiResponse<Pet[]>> {
    try {
      const { data, error } = await supabase.from('pets').select('*').eq('user_id', userId);
      if (error) {
        throw error;
      }

      return {
        success: true,
        data: (data || []) as Pet[],
        message: 'Pets loaded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load pets.',
        code: 500,
      };
    }
  }

  static async updatePet(userId: string, petId: string, updates: Partial<Pet>): Promise<ApiResponse<Pet>> {
    try {
      const { data, error } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', petId)
        .eq('user_id', userId)
        .select('*')
        .limit(1);

      if (error || !data || data.length === 0) {
        throw error || new Error('Pet not found or no permission.');
      }

      return {
        success: true,
        data: data[0] as Pet,
        message: 'Pet updated.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update pet.',
        code: 500,
      };
    }
  }

  static async deletePet(userId: string, petId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from('pets').delete().eq('id', petId).eq('user_id', userId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: null,
        message: 'Pet deleted.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete pet.',
        code: 500,
      };
    }
  }

  static async createDigitalTwin(
    userId: string,
    petId: string,
    modelUrl: string,
    aiPersonality: string,
  ): Promise<ApiResponse<Pet>> {
    try {
      const digitalTwinData = {
        model_url: modelUrl,
        generated_at: new Date().toISOString(),
        ai_personality: aiPersonality,
      };

      const { data, error } = await supabase
        .from('pets')
        .update({
          is_digital_twin: true,
          digital_twin_data: digitalTwinData,
        })
        .eq('id', petId)
        .eq('user_id', userId)
        .select('*')
        .limit(1);

      if (error || !data || data.length === 0) {
        throw error || new Error('Pet not found or no permission.');
      }

      return {
        success: true,
        data: data[0] as Pet,
        message: 'Digital twin created.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create digital twin.',
        code: 500,
      };
    }
  }

  static async getBreedingPets(
    petType: string,
    gender: string,
    limit = 20,
    offset = 0,
  ): Promise<ApiResponse<Pet[]>> {
    try {
      const targetGenderOptions = normalizeOppositeGenderOptions(gender);
      const query = supabase
        .from('pets')
        .select('*, owner:users!pets_user_id_fkey(id, username, avatar_url)')
        .eq('type', petType)
        .eq('health_status', 'healthy')
        .eq('vaccinated', true)
        .range(offset, offset + limit - 1);

      if (targetGenderOptions.length > 0) {
        query.in('gender', targetGenderOptions);
      } else {
        query.eq('gender', gender);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: (data || []) as Pet[],
        message: 'Breeding pets loaded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load breeding pets.',
        code: 500,
      };
    }
  }

  static async getDiscoveryFeed(
    userId: string,
    petType?: string,
    petGender?: string,
    limit = 20,
  ): Promise<ApiResponse<any[]>> {
    try {
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      const excludedUserIds = new Set<string>([userId]);
      for (const match of existingMatches || []) {
        const otherUserId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;
        if (otherUserId) {
          excludedUserIds.add(otherUserId);
        }
      }

      const genderOptions = normalizeOppositeGenderOptions(petGender);
      const excludedList = Array.from(excludedUserIds);
      const variants = [
        { petType, genderOptions },
        { petType: undefined, genderOptions },
        { petType, genderOptions: [] as string[] },
        { petType: undefined, genderOptions: [] as string[] },
      ];
      const seenKeys = new Set<string>();
      let discoveryRows: any[] = [];

      for (const variant of variants) {
        const variantKey = JSON.stringify(variant);
        if (seenKeys.has(variantKey)) {
          continue;
        }
        seenKeys.add(variantKey);

        const query = supabase
          .from('pets')
          .select(
            `*,
            owner:users!pets_user_id_fkey(
              id,
              username,
              age,
              gender,
              resident_city,
              frequent_cities,
              hobbies,
              mbti,
              signature,
              avatar_url,
              bio,
              is_verified
            )`,
          )
          .order('created_at', { ascending: false })
          .limit(limit);

        if (excludedList.length > 0) {
          query.not('user_id', 'in', `(${excludedList.join(',')})`);
        }

        if (variant.petType) {
          query.eq('type', variant.petType);
        }

        if (variant.genderOptions.length > 0) {
          query.in('gender', variant.genderOptions);
        }

        const { data, error } = await query;
        if (error) {
          throw error;
        }

        discoveryRows = data || [];
        if (discoveryRows.length > 0) {
          break;
        }
      }

      return {
        success: true,
        data: discoveryRows,
        message: 'Discovery feed loaded.',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load discovery feed.',
        code: 500,
      };
    }
  }
}

export default PetService;
