export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  age: number | null;
  gender: string | null;
  resident_city: string | null;
  frequent_cities: string[];
  hobbies: string[];
  mbti: string | null;
  signature: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  verification_token?: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  gender: string | null;
  personality: string | null;
  breed: string | null;
  age: number | null;
  weight: number | null;
  images: string[];
  bio: string | null;
  is_digital_twin: boolean;
  digital_twin_data?: DigitalTwinData | null;
  health_status: string | null;
  vaccinated: boolean;
  pedigree_info: string | null;
  created_at: string;
  updated_at: string;
}

export interface DigitalTwinData {
  model_url: string;
  generated_at: string;
  ai_personality: string;
  voice_sample?: string;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  pet_a_id: string;
  pet_b_id: string;
  compatibility_score: number | null;
  status: 'pending' | 'matched' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  user_a_id: string;
  user_b_id: string;
  last_message?: string | null;
  last_message_time?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Diary {
  id: string;
  user_id: string;
  pet_id: string;
  title: string;
  content: string;
  images: string[];
  mood: string | null;
  tags: string[];
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface MarketProduct {
  id: string;
  seller_id: string;
  pet_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  price?: number | null;
  images: string[];
  status: 'active' | 'sold' | 'inactive';
  type: 'breeding' | 'service' | 'care_product' | 'toy' | 'food';
  requirements?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BreedingRequest {
  id: string;
  sender_id: string;
  sender_pet_id: string;
  receiver_id: string;
  receiver_pet_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'match' | 'message' | 'breeding' | 'like' | 'system';
  related_user_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PrayerRecord {
  id: string;
  user_id: string;
  pet_id: string;
  prayer_text: string;
  ai_response: string | null;
  sentiment: string | null;
  created_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  level: number;
  experience_points: number;
  achievements: string[];
  total_matches: number;
  total_likes: number;
  diary_count: number;
  updated_at: string;
}

export interface Comment {
  id: string;
  diary_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  diary_id: string;
  user_id: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  message?: string;
  error?: string;
}

export interface JWTPayload {
  user_id: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  resident_city: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePetRequest {
  name: string;
  type: string;
  gender: string;
  personality: string;
  breed?: string | null;
  age?: number | null;
  weight?: number | null;
  images: string[];
  bio?: string | null;
}

export interface UpdateUserRequest {
  username?: string;
  age?: number;
  gender?: string;
  resident_city?: string;
  frequent_cities?: string[];
  hobbies?: string[];
  mbti?: string;
  signature?: string;
  avatar_url?: string;
  bio?: string;
}

export interface BootstrapOnboardingRequest {
  owner: {
    name?: string;
    avatar?: string;
    photos?: string[];
    gender?: string;
    age?: number;
    residentCity?: string;
    frequentCities?: string[];
    hobbies?: string[];
    mbti?: string;
    signature?: string;
  };
  pet: {
    name?: string;
    images?: string[];
    type?: string;
    gender?: string;
    personality?: string;
  };
  auth: {
    username?: string;
    email?: string;
    password?: string;
    phone?: string;
    mode: 'email' | 'phone' | 'demo';
    quickAccess?: boolean;
  };
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
  recentUsers: Array<Pick<SafeUser, 'id' | 'username' | 'email' | 'resident_city' | 'is_verified' | 'created_at' | 'last_login'>>;
  recentPets: Array<{
    id: string;
    name: string;
    type: string | null;
    gender: string | null;
    created_at: string;
    owner?: {
      id: string;
      username: string;
      avatar_url: string | null;
    };
  }>;
  recentMessages: Array<{
    id: string;
    content: string;
    created_at: string;
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
