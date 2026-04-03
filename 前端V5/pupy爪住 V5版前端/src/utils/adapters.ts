import type { Owner, Pet } from '../types';
import type { ApiDiscoveryPet, ApiMarketProduct, ApiPetRecord, ApiUser } from '../services/api';

const DEFAULT_OWNER_AVATAR =
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400';

const DEFAULT_PET_IMAGE =
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400';

const pickString = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value : fallback;

const pickStringArray = (value: unknown, fallback: string[] = []) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : fallback;

export function createOwnerFromApi(user: Partial<ApiUser> = {}): Owner {
  const avatar = pickString(user.avatar_url, DEFAULT_OWNER_AVATAR);
  const photos = pickStringArray((user as { photos?: string[] }).photos, [avatar]);

  return {
    name: pickString(user.username, 'PUPY 用户'),
    avatar,
    photos,
    gender: pickString(user.gender, '其他'),
    age: typeof user.age === 'number' ? user.age : 0,
    residentCity: pickString(user.resident_city, '上海'),
    frequentCities: pickStringArray(user.frequent_cities),
    hobbies: pickStringArray(user.hobbies),
    mbti: pickString(user.mbti, 'ENFP'),
    signature: pickString(user.signature || user.bio, '欢迎来到 PUPY 世界。'),
  };
}

export function createPetFromApi(pet: ApiPetRecord, user: ApiUser): Pet {
  const owner = createOwnerFromApi(user);
  const images = pickStringArray(pet.images, [DEFAULT_PET_IMAGE]);

  return {
    id: pet.id,
    name: pickString(pet.name, '毛孩子'),
    images,
    type: pickString(pet.type || pet.breed, '宠物伙伴'),
    gender: pickString(pet.gender, '未知'),
    personality: pickString(pet.personality, '友好'),
    hasPet: true,
    owner,
  };
}

export function createPetCardFromDiscovery(pet: ApiDiscoveryPet): Pet {
  const owner = createOwnerFromApi(pet.owner || {});

  return {
    id: pet.id,
    name: pickString(pet.name, '毛孩子'),
    images: pickStringArray(pet.images, [DEFAULT_PET_IMAGE]),
    type: pickString(pet.type || pet.breed, '宠物伙伴'),
    gender: pickString(pet.gender, '未知'),
    personality: pickString(pet.personality, '友好'),
    hasPet: true,
    owner,
  };
}

export function createOwnerFromMarketProduct(product: Partial<ApiMarketProduct>): Owner {
  return createOwnerFromApi(product.seller || {});
}

export function withOwnerMeta(owner: Owner, meta?: { residentCity?: string; signature?: string; mbti?: string }) {
  return {
    ...owner,
    residentCity: pickString(meta?.residentCity, owner.residentCity),
    signature: pickString(meta?.signature, owner.signature),
    mbti: pickString(meta?.mbti, owner.mbti),
  };
}
