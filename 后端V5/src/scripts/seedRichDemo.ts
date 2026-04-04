import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase.js';

const MAIN_EMAIL = 'rhyssvv@gmail.com';
const DEFAULT_PASSWORD = '123456';
const now = Date.now();

const dogImages = [
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=1200',
];

const catImages = [
  'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=1200',
];

const ownerAvatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
];

type DemoSeed = {
  username: string;
  email: string;
  age: number;
  gender: string;
  resident_city: string;
  frequent_cities: string[];
  hobbies: string[];
  mbti: string;
  signature: string;
  bio: string;
  avatar_url: string;
  is_verified: boolean;
  pet: {
    name: string;
    type: string;
    breed: string;
    gender: string;
    personality: string;
    age: number;
    weight: number;
    images: string[];
    bio: string;
    vaccinated: boolean;
    health_status: string;
    pedigree_info: string;
  };
};

const demoSeeds: DemoSeed[] = [
  {
    username: '苏栗', email: 'suli@pupy.app', age: 28, gender: 'female', resident_city: '上海', frequent_cities: ['上海', '杭州', '苏州'], hobbies: ['飞盘', '露营', '咖啡', '宠物社交'], mbti: 'ENFP', signature: '每周都会带奶油去滨江跑步。', bio: '重度活跃用户，日记、匹配、聊天和集市都高频使用。', avatar_url: ownerAvatars[0], is_verified: true,
    pet: { name: '奶油', type: 'Golden Retriever', breed: 'Golden Retriever', gender: 'female', personality: '热情亲人', age: 3, weight: 28.4, images: [dogImages[0], dogImages[3], dogImages[4]], bio: '飞盘一级选手，见人就摇尾巴。', vaccinated: true, health_status: 'healthy', pedigree_info: 'CKU 登记血统' },
  },
  {
    username: '沈雾', email: 'shenwu@pupy.app', age: 30, gender: 'female', resident_city: '上海', frequent_cities: ['上海', '宁波'], hobbies: ['骑行', '摄影', '狗狗训练'], mbti: 'INFJ', signature: '糯米是我们家的社交部长。', bio: '活跃在匹配、训练交流和日记分享板块。', avatar_url: ownerAvatars[1], is_verified: true,
    pet: { name: '糯米', type: 'Golden Retriever', breed: 'Golden Retriever', gender: 'female', personality: '安静温柔', age: 4, weight: 27.1, images: [dogImages[1], dogImages[5], dogImages[0]], bio: '在草地上跑一圈就会过来求摸头。', vaccinated: true, health_status: 'healthy', pedigree_info: '家庭繁育记录完整' },
  },
  {
    username: '乔晚', email: 'qiaowan@pupy.app', age: 27, gender: 'female', resident_city: '杭州', frequent_cities: ['杭州', '上海'], hobbies: ['徒步', '烘焙', '宠物穿搭'], mbti: 'ISFP', signature: '七喜超会拍照，也超会撒娇。', bio: '常在集市挂宠物手作，也会写高频日记。', avatar_url: ownerAvatars[2], is_verified: true,
    pet: { name: '七喜', type: 'Golden Retriever', breed: 'Golden Retriever', gender: 'female', personality: '镜头感强', age: 2, weight: 25.6, images: [dogImages[2], dogImages[0], dogImages[4]], bio: '看到相机就会自己找角度。', vaccinated: true, health_status: 'healthy', pedigree_info: '芯片备案已完成' },
  },
  {
    username: '林檬', email: 'linmeng@pupy.app', age: 31, gender: 'female', resident_city: '苏州', frequent_cities: ['苏州', '上海', '无锡'], hobbies: ['园艺', '露营', '宠物社群'], mbti: 'ESFJ', signature: '琥珀最爱在草地上和朋友打滚。', bio: '经常组织线下遛狗局，也活跃在繁育咨询区。', avatar_url: ownerAvatars[3], is_verified: true,
    pet: { name: '琥珀', type: 'Golden Retriever', breed: 'Golden Retriever', gender: 'female', personality: '社交达人', age: 5, weight: 29.3, images: [dogImages[3], dogImages[1], dogImages[2]], bio: '见到同类会先转圈再趴下示好。', vaccinated: true, health_status: 'healthy', pedigree_info: '年度体检齐全' },
  },
  {
    username: '唐梨', email: 'tangli@pupy.app', age: 26, gender: 'female', resident_city: '南京', frequent_cities: ['南京', '上海'], hobbies: ['游泳', '书店', '宠物食品研究'], mbti: 'INTJ', signature: '可颂很稳，熟了之后会超级黏人。', bio: '活跃在宠物营养和高端用品集市。', avatar_url: ownerAvatars[4], is_verified: true,
    pet: { name: '可颂', type: 'Golden Retriever', breed: 'Golden Retriever', gender: 'female', personality: '慢热靠谱', age: 3, weight: 26.8, images: [dogImages[4], dogImages[0], dogImages[5]], bio: '对球类玩具极度专一。', vaccinated: true, health_status: 'healthy', pedigree_info: '国际血统证书在档' },
  },
  {
    username: '许听', email: 'xuting@pupy.app', age: 29, gender: 'female', resident_city: '上海', frequent_cities: ['上海', '嘉兴'], hobbies: ['瑜伽', '咖啡探店', '宠物旅行'], mbti: 'ENFJ', signature: '暖暖每次出门都像在度假。', bio: '常发城市walk攻略，是高频内容创作者。', avatar_url: ownerAvatars[5], is_verified: true,
    pet: { name: '暖暖', type: 'Golden Retriever', breed: 'Golden Retriever', gender: 'female', personality: '情绪稳定', age: 4, weight: 30.1, images: [dogImages[5], dogImages[2], dogImages[1]], bio: '雨天也坚持要完成社交任务。', vaccinated: true, health_status: 'healthy', pedigree_info: '繁育评估优秀' },
  },
  {
    username: '顾晴', email: 'guqing@pupy.app', age: 33, gender: 'female', resident_city: '杭州', frequent_cities: ['杭州', '上海', '绍兴'], hobbies: ['跑步', '飞盘', '社群运营'], mbti: 'ENTP', signature: '栗子是群里的快乐发射器。', bio: '频繁发起群聊与线下活动，是资深老用户。', avatar_url: ownerAvatars[0], is_verified: true,
    pet: { name: '栗子', type: 'Golden Retriever', breed: 'Golden Retriever', gender: 'female', personality: '外向机灵', age: 2, weight: 24.9, images: [dogImages[0], dogImages[4], dogImages[3]], bio: '一听到零食袋声音就会冲过来。', vaccinated: true, health_status: 'healthy', pedigree_info: '疫苗与驱虫完整' },
  },
  {
    username: '孟枝', email: 'mengzhi@pupy.app', age: 27, gender: 'female', resident_city: '宁波', frequent_cities: ['宁波', '上海'], hobbies: ['海边散步', '美食', '宠物摄影'], mbti: 'INFP', signature: '布丁会在海风里自己找镜头。', bio: '以日记和公开动态维持高活跃。', avatar_url: ownerAvatars[1], is_verified: true,
    pet: { name: '布丁', type: 'Golden Retriever', breed: 'Golden Retriever', gender: 'female', personality: '甜妹型', age: 3, weight: 27.7, images: [dogImages[1], dogImages[3], dogImages[5]], bio: '看到沙滩就会进入撒欢模式。', vaccinated: true, health_status: 'healthy', pedigree_info: '犬展社群资料完备' },
  },
  {
    username: '袁澈', email: 'yuanche@pupy.app', age: 30, gender: 'male', resident_city: '北京', frequent_cities: ['北京', '上海'], hobbies: ['训练课程', '摄影', '宠物运动'], mbti: 'ESTP', signature: '拿铁训练配合度高，线下局也很稳。', bio: '重度使用消息和训练类服务下单。', avatar_url: ownerAvatars[4], is_verified: true,
    pet: { name: '拿铁', type: 'Labrador Retriever', breed: 'Labrador Retriever', gender: 'female', personality: '专注服从', age: 3, weight: 26.5, images: [dogImages[2], dogImages[5], dogImages[0]], bio: '最擅长捡回和召回。', vaccinated: true, health_status: 'healthy', pedigree_info: '训练认证记录齐全' },
  },
  {
    username: '周翎', email: 'zhouling@pupy.app', age: 29, gender: 'female', resident_city: '成都', frequent_cities: ['成都', '重庆', '上海'], hobbies: ['火锅', '露营', '宠物社群'], mbti: 'ESFP', signature: '蜜豆是川渝局里的社交王牌。', bio: '常用集市和繁育版块，互动频繁。', avatar_url: ownerAvatars[2], is_verified: true,
    pet: { name: '蜜豆', type: 'Welsh Corgi', breed: 'Welsh Corgi', gender: 'female', personality: '活力十足', age: 2, weight: 11.4, images: [dogImages[3], dogImages[4], dogImages[1]], bio: '腿短但跑得飞快。', vaccinated: true, health_status: 'healthy', pedigree_info: '犬舍合同可核验' },
  },
  {
    username: '白溪', email: 'baixi@pupy.app', age: 25, gender: 'female', resident_city: '上海', frequent_cities: ['上海', '杭州'], hobbies: ['撸猫', '插画', '居家布置'], mbti: 'ISFJ', signature: '云朵擅长让全屋都安静下来。', bio: '高频记录日记，养成内容很完整。', avatar_url: ownerAvatars[3], is_verified: true,
    pet: { name: '云朵', type: 'Ragdoll Cat', breed: 'Ragdoll Cat', gender: 'female', personality: '软糯亲人', age: 2, weight: 5.2, images: [catImages[0], catImages[1], catImages[2]], bio: '会主动把头贴过来求摸。', vaccinated: true, health_status: 'healthy', pedigree_info: '猫舍档案完整' },
  },
  {
    username: '叶澄', email: 'yecheng@pupy.app', age: 32, gender: 'male', resident_city: '广州', frequent_cities: ['广州', '深圳', '上海'], hobbies: ['冲浪', '跑步', '宠物营养'], mbti: 'ENTJ', signature: '泡芙会认真参加每一场训练。', bio: '高频下单服务，也会参与匹配和聊天。', avatar_url: ownerAvatars[5], is_verified: true,
    pet: { name: '泡芙', type: 'Labrador Retriever', breed: 'Labrador Retriever', gender: 'female', personality: '阳光外放', age: 4, weight: 27.9, images: [dogImages[5], dogImages[1], dogImages[2]], bio: '体能特别好，长距离散步不累。', vaccinated: true, health_status: 'healthy', pedigree_info: '营养档案长期维护' },
  },
];

function isoHoursAgo(hoursAgo: number) { return new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(); }
function pick<T>(values: T[], index: number) { return values[index % values.length]; }

async function main() {
  const { data: currentUsers, error: currentUserError } = await supabaseAdmin.from('users').select('id, username, email').eq('email', MAIN_EMAIL).limit(1);
  if (currentUserError || !currentUsers?.length) throw currentUserError || new Error('未找到主账号，请先完成默认账号初始化。');
  const currentUser = currentUsers[0];

  const { data: currentPets, error: currentPetError } = await supabaseAdmin.from('pets').select('id, name, type, gender').eq('user_id', currentUser.id).limit(1);
  if (currentPetError || !currentPets?.length) throw currentPetError || new Error('主账号下没有宠物档案，无法生成匹配数据。');
  const currentPet = currentPets[0];

  const demoEmails = demoSeeds.map((item) => item.email);
  const { data: existingDemoUsers } = await supabaseAdmin.from('users').select('id, email').in('email', demoEmails);
  const existingDemoIds = (existingDemoUsers || []).map((item) => item.id);
  if (existingDemoIds.length > 0) {
    await supabaseAdmin.from('notifications').delete().in('user_id', existingDemoIds);
    await supabaseAdmin.from('notifications').delete().in('related_user_id', existingDemoIds);
    await supabaseAdmin.from('users').delete().in('id', existingDemoIds);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const demoUsers = demoSeeds.map((seed, index) => ({
    id: uuidv4(), username: seed.username, email: seed.email, password_hash: passwordHash, age: seed.age, gender: seed.gender,
    resident_city: seed.resident_city, frequent_cities: seed.frequent_cities, hobbies: seed.hobbies, mbti: seed.mbti,
    signature: seed.signature, avatar_url: seed.avatar_url, bio: seed.bio, is_verified: seed.is_verified,
    created_at: isoHoursAgo(520 - index * 9), updated_at: isoHoursAgo(12 - index), last_login: isoHoursAgo(index + 1),
  }));
  const insertUsers = await supabaseAdmin.from('users').insert(demoUsers);
  if (insertUsers.error) throw insertUsers.error;

  const petRows = demoSeeds.map((seed, index) => ({
    id: uuidv4(), user_id: demoUsers[index].id, name: seed.pet.name, type: seed.pet.type, breed: seed.pet.breed, gender: seed.pet.gender,
    personality: seed.pet.personality, age: seed.pet.age, weight: seed.pet.weight, images: seed.pet.images, bio: seed.pet.bio,
    vaccinated: seed.pet.vaccinated, health_status: seed.pet.health_status, pedigree_info: seed.pet.pedigree_info,
    created_at: isoHoursAgo(480 - index * 6), updated_at: isoHoursAgo(10 - Math.min(index, 8)),
  }));
  const insertPets = await supabaseAdmin.from('pets').insert(petRows);
  if (insertPets.error) throw insertPets.error;

  const diaryRows: any[] = [];
  for (let index = 0; index < demoUsers.length; index += 1) {
    const seed = demoSeeds[index];
    const user = demoUsers[index];
    const pet = petRows[index];
    diaryRows.push({
      id: uuidv4(), user_id: user.id, pet_id: pet.id, title: `${seed.pet.name} 的城市散步记录`,
      content: `今天带 ${seed.pet.name} 在${seed.resident_city}完成了 7 公里城市 walk，还在 PUPY 上和两位附近家长约到了同城遛宠局。回家后顺手把路线、照片和踩点心得写进日记，互动很快就涨起来了。`,
      images: [seed.pet.images[0], seed.pet.images[1]], mood: '开心', tags: ['城市散步', '线下社交', '重度用户'], is_public: true,
      likes_count: 0, comments_count: 0, created_at: isoHoursAgo(72 - index * 2), updated_at: isoHoursAgo(72 - index * 2),
    });
    diaryRows.push({
      id: uuidv4(), user_id: user.id, pet_id: pet.id, title: `${seed.pet.name} 的本周社交小结`,
      content: `${seed.pet.name} 这一周在 PUPY 里累计打卡了配对、集市、聊天和日记。今天还顺便把疫苗信息、体重变化和喜欢的玩具更新了，方便后续做繁育和训练匹配。`,
      images: [seed.pet.images[1], seed.pet.images[2]], mood: '满足', tags: ['成长记录', '社交复盘', '档案维护'], is_public: index % 2 === 0,
      likes_count: 0, comments_count: 0, created_at: isoHoursAgo(48 - index), updated_at: isoHoursAgo(48 - index),
    });
  }
  const insertDiaries = await supabaseAdmin.from('diaries').insert(diaryRows);
  if (insertDiaries.error) throw insertDiaries.error;

  const marketRows = demoUsers.slice(0, 10).map((user, index) => {
    const pet = petRows[index];
    const types = ['breeding', 'service', 'care_product', 'food', 'toy'];
    const categories = ['金毛配对', '训练陪跑', '营养护理', '主粮推荐', '互动玩具'];
    const titles = [`${pet.name} 可约线下相亲与配对沟通`, `${pet.name} 同城陪跑与社交训练`, `${pet.name} 同款毛发护理清单`, `${pet.name} 常吃主粮整箱转让`, `${pet.name} 常玩高耐咬互动玩具`];
    return {
      id: uuidv4(), seller_id: user.id, pet_id: pet.id, title: titles[index % titles.length],
      description: `${pet.name} 的主人是 PUPY 高活跃用户，这条发布长期维护，回复速度快，资料和线下时间都比较稳定。`,
      category: categories[index % categories.length], price: 99 + index * 38, images: [pet.images[0]], status: 'active', type: types[index % types.length],
      requirements: '希望先在站内沟通，再安排线下或发货。', created_at: isoHoursAgo(120 - index * 4), updated_at: isoHoursAgo(20 - Math.min(index, 8)),
    };
  });
  const insertProducts = await supabaseAdmin.from('market_products').insert(marketRows);
  if (insertProducts.error) throw insertProducts.error;

  const matchedPairIndexes = [8, 9, 10];
  const matchedRows = matchedPairIndexes.map((index, offset) => ({
    id: uuidv4(), user_a_id: currentUser.id, user_b_id: demoUsers[index].id, pet_a_id: currentPet.id, pet_b_id: petRows[index].id,
    compatibility_score: 0.78 + offset * 0.05, status: 'matched', created_at: isoHoursAgo(96 - offset * 8), updated_at: isoHoursAgo(24 - offset * 3),
  }));
  const pendingRows = [[0, 1], [2, 3], [4, 5], [6, 7], [1, 4], [2, 6]].map(([a, b], index) => ({
    id: uuidv4(), user_a_id: demoUsers[a].id, user_b_id: demoUsers[b].id, pet_a_id: petRows[a].id, pet_b_id: petRows[b].id,
    compatibility_score: 0.7 + index * 0.03, status: 'pending', created_at: isoHoursAgo(84 - index * 5), updated_at: isoHoursAgo(40 - index * 2),
  }));
  const insertMatches = await supabaseAdmin.from('matches').insert([...matchedRows, ...pendingRows]);
  if (insertMatches.error) throw insertMatches.error;

  const breedingRows = [
    { id: uuidv4(), sender_id: demoUsers[0].id, sender_pet_id: petRows[0].id, receiver_id: demoUsers[3].id, receiver_pet_id: petRows[3].id, status: 'pending', notes: '想先约一次线下适配，再决定是否继续。', created_at: isoHoursAgo(32), updated_at: isoHoursAgo(32) },
    { id: uuidv4(), sender_id: demoUsers[1].id, sender_pet_id: petRows[1].id, receiver_id: demoUsers[4].id, receiver_pet_id: petRows[4].id, status: 'completed', notes: '资料核验和线下见面都已经完成。', created_at: isoHoursAgo(140), updated_at: isoHoursAgo(50) },
    { id: uuidv4(), sender_id: demoUsers[6].id, sender_pet_id: petRows[6].id, receiver_id: demoUsers[7].id, receiver_pet_id: petRows[7].id, status: 'accepted', notes: '双方健康记录已互相确认。', created_at: isoHoursAgo(54), updated_at: isoHoursAgo(18) },
  ];
  const insertBreeding = await supabaseAdmin.from('breeding_requests').insert(breedingRows);
  if (insertBreeding.error) throw insertBreeding.error;

  const roomRows: any[] = [];
  const messageRows: any[] = [];
  for (let index = 0; index < matchedPairIndexes.length; index += 1) {
    const demoIndex = matchedPairIndexes[index];
    const roomId = uuidv4();
    const demoUser = demoUsers[demoIndex];
    const starterTime = 20 - index * 2;
    const texts = [
      `你好呀，我刚看完 ${petRows[demoIndex].name} 的档案，气质很稳。`,
      `最近在上海有线下遛狗局，我们可以先一起参加。`,
      `如果方便的话，也可以先在 PUPY 里继续聊聊日常和作息。`,
      `没问题，我这周三和周末都可以。`,
    ];
    roomRows.push({ id: roomId, user_a_id: currentUser.id, user_b_id: demoUser.id, last_message: texts[texts.length - 1], last_message_time: isoHoursAgo(starterTime - 1), created_at: isoHoursAgo(starterTime + 6), updated_at: isoHoursAgo(starterTime - 1) });
    texts.forEach((content, messageIndex) => {
      const fromCurrent = messageIndex % 2 === 0;
      messageRows.push({ id: uuidv4(), chat_id: roomId, sender_id: fromCurrent ? currentUser.id : demoUser.id, receiver_id: fromCurrent ? demoUser.id : currentUser.id, content, is_read: messageIndex !== texts.length - 1, created_at: isoHoursAgo(starterTime + (texts.length - messageIndex)), updated_at: isoHoursAgo(starterTime + (texts.length - messageIndex)) });
    });
  }
  [[0, 2], [3, 5], [6, 8]].forEach(([a, b], pairIndex) => {
    const roomId = uuidv4();
    const userA = demoUsers[a];
    const userB = demoUsers[b];
    const baseHour = 30 + pairIndex * 4;
    const texts = [`${petRows[a].name} 这周状态很稳定，你们周末方便线下见面吗？`, `可以，我们先在公园散步 30 分钟观察一下。`, `好，我把体检记录和最近的照片也补到档案里。`];
    roomRows.push({ id: roomId, user_a_id: userA.id, user_b_id: userB.id, last_message: texts[texts.length - 1], last_message_time: isoHoursAgo(baseHour - 1), created_at: isoHoursAgo(baseHour + 5), updated_at: isoHoursAgo(baseHour - 1) });
    texts.forEach((content, messageIndex) => {
      const fromA = messageIndex % 2 === 0;
      messageRows.push({ id: uuidv4(), chat_id: roomId, sender_id: fromA ? userA.id : userB.id, receiver_id: fromA ? userB.id : userA.id, content, is_read: true, created_at: isoHoursAgo(baseHour + (texts.length - messageIndex)), updated_at: isoHoursAgo(baseHour + (texts.length - messageIndex)) });
    });
  });
  const insertRooms = await supabaseAdmin.from('chat_rooms').insert(roomRows);
  if (insertRooms.error) throw insertRooms.error;
  const insertMessages = await supabaseAdmin.from('messages').insert(messageRows);
  if (insertMessages.error) throw insertMessages.error;

  const notificationRows: any[] = [];
  matchedPairIndexes.forEach((demoIndex, index) => {
    notificationRows.push({ id: uuidv4(), user_id: currentUser.id, message: `${demoSeeds[demoIndex].username} 刚更新了 ${petRows[demoIndex].name} 的档案，系统已为你保留本轮匹配。`, type: 'match', related_user_id: demoUsers[demoIndex].id, is_read: index === 0, created_at: isoHoursAgo(18 - index * 2) });
  });
  demoUsers.forEach((user, index) => {
    notificationRows.push({ id: uuidv4(), user_id: user.id, message: `${pick(['新的聊天回复', '你的日记收到新评论', '配对档案热度上升'], index)}，建议你尽快查看。`, type: pick(['message', 'system', 'match'], index), related_user_id: index < 3 ? currentUser.id : null, is_read: index % 3 === 0, created_at: isoHoursAgo(14 + index) });
  });
  const insertNotifications = await supabaseAdmin.from('notifications').insert(notificationRows);
  if (insertNotifications.error) throw insertNotifications.error;

  const prayerRows = demoUsers.slice(0, 6).map((user, index) => ({
    id: uuidv4(), user_id: user.id, pet_id: petRows[index].id,
    prayer_text: `希望 ${petRows[index].name} 下周的线下社交顺利，也继续保持好胃口和稳定情绪。`,
    ai_response: `${petRows[index].name} 目前的日常节奏很稳定，建议继续保持固定运动和正向互动。`, sentiment: 'positive', created_at: isoHoursAgo(26 + index),
  }));
  const insertPrayers = await supabaseAdmin.from('prayer_records').insert(prayerRows);
  if (insertPrayers.error) throw insertPrayers.error;

  const publicDiaries = diaryRows.filter((row) => row.is_public);
  const likeRows: any[] = [];
  const commentRows: any[] = [];
  const diaryStats = new Map<string, { likes: number; comments: number }>();
  publicDiaries.slice(0, 16).forEach((diary, index) => {
    const eligibleUsers = demoUsers.filter((user) => user.id !== diary.user_id);
    const firstLiker = eligibleUsers[index % eligibleUsers.length];
    const secondLiker = eligibleUsers[(index + 3) % eligibleUsers.length];
    likeRows.push({ id: uuidv4(), diary_id: diary.id, user_id: firstLiker.id, created_at: isoHoursAgo(12 + index) });
    likeRows.push({ id: uuidv4(), diary_id: diary.id, user_id: secondLiker.id, created_at: isoHoursAgo(11 + index) });
    commentRows.push({ id: uuidv4(), diary_id: diary.id, user_id: secondLiker.id, content: `${pick(['这条路线很适合周末去', '看得出状态真的很好', '这组照片也太出片了'], index)}。`, created_at: isoHoursAgo(10 + index), updated_at: isoHoursAgo(10 + index) });
    diaryStats.set(diary.id, { likes: 2, comments: 1 });
  });
  const insertLikes = await supabaseAdmin.from('likes').insert(likeRows);
  if (insertLikes.error) throw insertLikes.error;
  const insertComments = await supabaseAdmin.from('comments').insert(commentRows);
  if (insertComments.error) throw insertComments.error;
  for (const [diaryId, stats] of diaryStats.entries()) {
    const updateDiary = await supabaseAdmin.from('diaries').update({ likes_count: stats.likes, comments_count: stats.comments }).eq('id', diaryId);
    if (updateDiary.error) throw updateDiary.error;
  }

  const statRows = demoUsers.map((user, index) => ({
    id: uuidv4(), user_id: user.id, level: 8 + (index % 4), experience_points: 1800 + index * 220, achievements: ['活跃记录者', '社交达人', '资料维护完成'], total_matches: index < 9 ? 3 + (index % 4) : 2, total_likes: 20 + index * 3, diary_count: 2, updated_at: isoHoursAgo(index + 1),
  }));
  statRows.push({ id: uuidv4(), user_id: currentUser.id, level: 12, experience_points: 3680, achievements: ['主理人账号', '高频互动', '后台可用'], total_matches: matchedRows.length, total_likes: 26, diary_count: 1, updated_at: isoHoursAgo(1) });
  const upsertStats = await supabaseAdmin.from('user_stats').upsert(statRows, { onConflict: 'user_id' });
  if (upsertStats.error) throw upsertStats.error;

  console.log(JSON.stringify({ success: true, seededUsers: demoUsers.length, seededPets: petRows.length, seededDiaries: diaryRows.length, seededProducts: marketRows.length, seededMatches: matchedRows.length + pendingRows.length, seededChatRooms: roomRows.length, seededMessages: messageRows.length, seededNotifications: notificationRows.length, currentUser: { email: currentUser.email, pet: currentPet.name, type: currentPet.type, gender: currentPet.gender } }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });

