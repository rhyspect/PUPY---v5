import { Pet, Realm } from './types';

export const PETS: Pet[] = [
  {
    id: 'demo-1',
    name: '库珀',
    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400'],
    type: '金毛寻回犬',
    gender: '公',
    personality: '热情外向',
    hasPet: true,
    owner: {
      name: '想喝咖啡吗',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100',
      photos: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400'],
      gender: '男',
      age: 25,
      residentCity: '上海',
      frequentCities: ['上海', '北京', '深圳'],
      hobbies: ['咖啡', '摄影', '徒步'],
      mbti: 'ENTP',
      signature: '带上牵引绳，一起探索新的城市角落。',
    },
  },
  {
    id: 'demo-2',
    name: '雪球',
    images: ['https://images.unsplash.com/photo-1529429617329-8a737053918e?auto=format&fit=crop&q=80&w=400'],
    type: '萨摩耶',
    gender: '母',
    personality: '黏人治愈',
    hasPet: true,
    owner: {
      name: '小雅',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100',
      photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400'],
      gender: '女',
      age: 22,
      residentCity: '成都',
      frequentCities: ['成都', '重庆', '西安'],
      hobbies: ['旅行', '美食', '露营'],
      mbti: 'ENFP',
      signature: '想带着雪球去看更多风景。',
    },
  },
];

export const REALMS: Realm[] = [
  {
    id: 'misty-forest',
    name: '雾雨深林',
    description: '轻雾、溪流和低饱和的安静氛围。',
    story: '适合慢节奏交流和情绪稳定的毛孩子，在这里更容易建立深层连接。',
    function: '适配安静型宠物与偏沉浸式的主人社交。',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
    onlineCount: 120,
    icon: 'umbrella',
    active: true,
  },
  {
    id: 'afternoon-peninsula',
    name: '半岛午后',
    description: '阳光、海风和慵懒的陪伴感。',
    story: '适合约散步、聊日常，也适合开启更轻松的第一次交流。',
    function: '适配同城见面、轻社交和日常陪伴服务。',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    onlineCount: 85,
    icon: 'sunny',
    active: true,
  },
  {
    id: 'neon-city',
    name: '霓虹幻境',
    description: '速度感、都市感和高互动密度。',
    story: '适合表达欲更强的宠物和主人，在这里更容易快速破冰。',
    function: '适配高频聊天、活动邀约和内容分享。',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    onlineCount: 340,
    icon: 'bolt',
    active: true,
  },
];

export const MARKET_CATEGORIES = [
  { id: 'care', label: '护理养护', icon: 'health_and_safety' },
  { id: 'walk', label: '同城陪伴', icon: 'directions_walk' },
  { id: 'love', label: '配对繁育', icon: 'favorite' },
  { id: 'supermarket', label: '主粮用品', icon: 'shopping_basket' },
];
