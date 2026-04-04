export type Screen = 'home' | 'tour' | 'market' | 'messages' | 'profile' | 'creation' | 'chat';

export interface NavItem {
  id: Screen;
  label: string;
  icon: string;
}

export interface Owner {
  id?: string;
  email?: string;
  isVerified?: boolean;
  name: string;
  avatar: string;
  photos: string[];
  gender: string;
  age: number;
  residentCity: string;
  frequentCities: string[];
  hobbies: string[];
  mbti: string;
  signature: string;
}

export interface Pet {
  id: string;
  name: string;
  images: string[];
  type: string;
  gender: string;
  personality: string;
  hasPet: boolean;
  owner: Owner;
}

export interface Realm {
  id: string;
  name: string;
  description: string;
  story: string;
  function: string;
  image: string;
  onlineCount: number;
  icon: string;
  active?: boolean;
}
