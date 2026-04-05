import type { Owner, Pet } from '../types';
import { getStoredLocale } from '../utils/locale';

const DEFAULT_API_BASE_URL =
  typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? ''
    : 'http://localhost:3001';

const normalizeBaseUrl = (value?: string) =>
  (value || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  age?: number;
  gender?: string;
  resident_city?: string;
  frequent_cities?: string[];
  hobbies?: string[];
  mbti?: string;
  signature?: string;
  avatar_url?: string;
  photos?: string[];
  bio?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export interface ApiPetRecord {
  id: string;
  user_id?: string;
  name: string;
  type?: string;
  gender?: string;
  personality?: string;
  breed?: string;
  age?: number;
  weight?: number;
  images?: string[];
  bio?: string;
  is_digital_twin?: boolean;
  digital_twin_data?: {
    model_url?: string;
    generated_at?: string;
    ai_personality?: string;
  };
  health_status?: string;
  vaccinated?: boolean;
  pedigree_info?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiDiscoveryPet extends ApiPetRecord {
  owner?: ApiUser;
}

export interface AuthPayload {
  user: ApiUser;
  token: string;
}

export interface OnboardingBootstrapInput {
  owner: Partial<Owner>;
  pet: Partial<Pet>;
  auth: {
    username?: string;
    email?: string;
    password?: string;
    phone?: string;
    mode: 'email' | 'phone' | 'demo';
    quickAccess?: boolean;
  };
}

export interface ApiChatRoom {
  id: string;
  user_a_id: string;
  user_b_id: string;
  last_message?: string | null;
  last_message_time?: string | null;
  updated_at?: string;
  other_user?: ApiUser;
  unread_count?: number;
}

export interface ApiDiaryRecord {
  id: string;
  user_id: string;
  pet_id: string;
  title: string;
  content: string;
  images?: string[];
  mood?: string;
  tags?: string[];
  is_public?: boolean;
  likes_count?: number;
  comments_count?: number;
  created_at?: string;
  pet?: ApiPetRecord;
  user?: ApiUser;
}

export interface ApiPrayerRecord {
  id: string;
  user_id: string;
  pet_id: string;
  prayer_text: string;
  ai_response?: string;
  sentiment?: string;
  created_at?: string;
  pet?: ApiPetRecord;
}

export interface ApiNotification {
  id: string;
  user_id: string;
  message: string;
  type: 'match' | 'message' | 'breeding' | 'like' | 'system';
  related_user_id?: string | null;
  is_read: boolean;
  created_at?: string;
}

export interface ApiMarketProduct {
  id: string;
  seller_id: string;
  pet_id?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  images?: string[];
  status?: 'active' | 'sold' | 'inactive';
  type?: 'breeding' | 'service' | 'care_product' | 'toy' | 'food';
  requirements?: string | null;
  created_at?: string;
  seller?: ApiUser;
  pet?: ApiPetRecord;
}

export interface ApiMatchRecord {
  id: string;
  user_a_id: string;
  user_b_id: string;
  pet_a_id: string;
  pet_b_id: string;
  compatibility_score?: number | null;
  status: 'pending' | 'matched' | 'rejected';
  created_at?: string;
  user_a?: ApiUser;
  user_b?: ApiUser;
  pet_a?: ApiPetRecord;
  pet_b?: ApiPetRecord;
}

export interface ApiComment {
  id: string;
  user_id: string;
  content: string;
  created_at?: string;
  user?: ApiUser;
}

export interface AdminOverview {
  stats: {
    users: number;
    pets: number;
    matches: number;
    messages: number;
    diaries: number;
    products: number;
    breedingRequests: number;
    notifications: number;
  };
  health: {
    environment: string;
    apiBaseUrl: string;
    supabaseConfigured: boolean;
    googleAiConfigured: boolean;
    adminEmailCount: number;
    timestamp: string;
  };
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    resident_city?: string;
    is_verified?: boolean;
    created_at?: string;
    last_login?: string;
  }>;
  recentPets: Array<{
    id: string;
    name: string;
    type?: string;
    gender?: string;
    created_at?: string;
    owner?: {
      id: string;
      username: string;
      avatar_url?: string;
    };
  }>;
  recentMessages: Array<{
    id: string;
    content: string;
    created_at?: string;
    sender?: {
      id: string;
      username: string;
    };
    receiver?: {
      id: string;
      username: string;
    };
  }>;
}

class ApiService {
  private baseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  private token: string | null = null;

  constructor() {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('pupy_token') : null;
    if (savedToken) {
      this.token = savedToken;
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  isConfigured() {
    return Boolean(this.baseUrl);
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pupy_token', token);
    }
  }

  getToken() {
    return this.token || (typeof window !== 'undefined' ? localStorage.getItem('pupy_token') : null);
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pupy_token');
    }
  }

  private getHeaders(extraHeaders?: HeadersInit) {
    const headers = new Headers(extraHeaders);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept-Language', getStoredLocale());
    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: this.getHeaders(options.headers),
    });

    const data = (await response.json().catch(() => ({ success: response.ok } as ApiResponse<T>))) as ApiResponse<T>;

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed: ${response.status}`);
    }

    return data;
  }

  async register(
    username: string,
    email: string,
    password: string,
    age: number,
    gender: '男' | '女' | '其他',
    residentCity: string,
  ) {
    const result = await this.request<AuthPayload>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        age,
        gender,
        resident_city: residentCity,
      }),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async login(email: string, password: string) {
    const result = await this.request<AuthPayload>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async bootstrapOnboarding(payload: OnboardingBootstrapInput) {
    const result = await this.request<AuthPayload & { pet: ApiPetRecord }>('/api/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async getCurrentUser() {
    return this.request<ApiUser>('/api/auth/me');
  }

  async updateCurrentUser(updates: Record<string, unknown>) {
    return this.request<ApiUser>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async logout() {
    this.clearToken();
  }

  async createPet(petData: Record<string, unknown>) {
    return this.request<ApiPetRecord>('/api/pets', {
      method: 'POST',
      body: JSON.stringify(petData),
    });
  }

  async getPets() {
    return this.request<ApiPetRecord[]>('/api/pets');
  }

  async getPetById(petId: string) {
    return this.request<ApiPetRecord>(`/api/pets/${petId}`);
  }

  async getDiscoverPets(type?: string, gender?: string, limit = 24) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (gender) params.set('gender', gender);
    params.set('limit', String(limit));
    return this.request<ApiDiscoveryPet[]>(`/api/pets/discover?${params.toString()}`);
  }

  async updatePet(petId: string, updates: Record<string, unknown>) {
    return this.request<ApiPetRecord>(`/api/pets/${petId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePet(petId: string) {
    return this.request<null>(`/api/pets/${petId}`, {
      method: 'DELETE',
    });
  }

  async createDigitalTwin(petId: string, modelUrl: string, aiPersonality: string) {
    return this.request<ApiPetRecord>(`/api/pets/${petId}/digital-twin`, {
      method: 'POST',
      body: JSON.stringify({ modelUrl, aiPersonality }),
    });
  }

  async createMatch(userBId: string, petAId: string, petBId: string) {
    return this.request<ApiMatchRecord>('/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        user_b_id: userBId,
        pet_a_id: petAId,
        pet_b_id: petBId,
      }),
    });
  }

  async getMatches(page = 1, limit = 20) {
    return this.request<ApiMatchRecord[]>(`/api/matches?page=${page}&limit=${limit}`);
  }

  async updateMatchStatus(matchId: string, status: 'matched' | 'rejected') {
    return this.request<ApiMatchRecord>(`/api/matches/${matchId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getChatRooms(page = 1, limit = 20) {
    return this.request<ApiChatRoom[]>(`/api/messages/rooms?page=${page}&limit=${limit}`);
  }

  async getOrCreateChatRoom(userBId: string) {
    return this.request<ApiChatRoom>('/api/messages/rooms', {
      method: 'POST',
      body: JSON.stringify({ user_b_id: userBId }),
    });
  }

  async sendMessage(chatRoomId: string, receiverId: string, content: string) {
    return this.request(`/api/messages/rooms/${chatRoomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        content,
      }),
    });
  }

  async getChatMessages(chatRoomId: string, page = 1, limit = 50) {
    return this.request(`/api/messages/rooms/${chatRoomId}/messages?page=${page}&limit=${limit}`);
  }

  async createDiary(
    petId: string,
    title: string,
    content: string,
    images?: string[],
    mood?: string,
    tags?: string[],
    isPublic = false,
  ) {
    return this.request<ApiDiaryRecord>('/api/diaries', {
      method: 'POST',
      body: JSON.stringify({
        pet_id: petId,
        title,
        content,
        images,
        mood,
        tags,
        is_public: isPublic,
      }),
    });
  }

  async getUserDiaries(page = 1, limit = 20) {
    return this.request<ApiDiaryRecord[]>(`/api/diaries?page=${page}&limit=${limit}`);
  }

  async getPublicDiaries(page = 1, limit = 20) {
    return this.request<ApiDiaryRecord[]>(`/api/diaries/public/feed?page=${page}&limit=${limit}`);
  }

  async getDiaryById(diaryId: string) {
    return this.request<ApiDiaryRecord>(`/api/diaries/${diaryId}`);
  }

  async updateDiary(diaryId: string, updates: Record<string, unknown>) {
    return this.request<ApiDiaryRecord>(`/api/diaries/${diaryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDiary(diaryId: string) {
    return this.request<null>(`/api/diaries/${diaryId}`, {
      method: 'DELETE',
    });
  }

  async likeDiary(diaryId: string) {
    return this.request<null>(`/api/diaries/${diaryId}/like`, {
      method: 'POST',
    });
  }

  async unlikeDiary(diaryId: string) {
    return this.request<null>(`/api/diaries/${diaryId}/like`, {
      method: 'DELETE',
    });
  }

  async addComment(diaryId: string, content: string) {
    return this.request<ApiComment>(`/api/diaries/${diaryId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getComments(diaryId: string, page = 1, limit = 20) {
    return this.request<ApiComment[]>(`/api/diaries/${diaryId}/comments?page=${page}&limit=${limit}`);
  }

  async createMarketProduct(productData: Record<string, unknown>) {
    return this.request<ApiMarketProduct>('/api/market', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async getMarketFeed(category?: string, type?: string, limit = 20) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    params.set('limit', String(limit));
    return this.request<ApiMarketProduct[]>(`/api/market/feed?${params.toString()}`);
  }

  async getMarketByCategory(category: string, page = 1, limit = 20) {
    return this.request<ApiMarketProduct[]>(`/api/market/category/${category}?page=${page}&limit=${limit}`);
  }

  async searchMarket(keyword: string, page = 1, limit = 20) {
    return this.request<ApiMarketProduct[]>(`/api/market/search?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`);
  }

  async getSellerProducts(sellerId: string) {
    return this.request<ApiMarketProduct[]>(`/api/market/seller/${sellerId}`);
  }

  async updateMarketProduct(productId: string, updates: Record<string, unknown>) {
    return this.request<ApiMarketProduct>(`/api/market/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMarketProduct(productId: string) {
    return this.request<null>(`/api/market/${productId}`, {
      method: 'DELETE',
    });
  }

  async getBreedingMarket(page = 1, limit = 20) {
    return this.request<ApiMarketProduct[]>(`/api/market/breeding/market?page=${page}&limit=${limit}`);
  }

  async createBreedingRequest(
    receiverId: string,
    senderPetId: string,
    receiverPetId: string,
    notes = '',
  ) {
    return this.request('/api/breeding', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        sender_pet_id: senderPetId,
        receiver_pet_id: receiverPetId,
        notes,
      }),
    });
  }

  async getBreedingRequests(page = 1, limit = 20) {
    return this.request(`/api/breeding?page=${page}&limit=${limit}`);
  }

  async updateBreedingStatus(requestId: string, status: 'accepted' | 'rejected' | 'completed') {
    return this.request(`/api/breeding/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async createPrayer(petId: string, prayerText: string) {
    return this.request<ApiPrayerRecord>('/api/ai/prayer', {
      method: 'POST',
      body: JSON.stringify({
        pet_id: petId,
        prayer_text: prayerText,
      }),
    });
  }

  async getPrayerRecords(page = 1, limit = 20) {
    return this.request<ApiPrayerRecord[]>(`/api/ai/prayer?page=${page}&limit=${limit}`);
  }

  async getNotifications() {
    return this.request<ApiNotification[]>('/api/ai/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/api/ai/notifications/${notificationId}`, {
      method: 'PATCH',
    });
  }

  async getAdminOverview() {
    return this.request<AdminOverview>('/api/admin/overview');
  }

  async healthCheck() {
    return this.request<{
      success: boolean;
      message: string;
      timestamp: string;
      environment: string;
    }>('/api/health');
  }

  async getApiVersion() {
    return this.request<{
      version: string;
      name: string;
      description: string;
    }>('/api/version');
  }
}

export const apiService = new ApiService();
export default apiService;





