
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  ApiDiaryRecord,
  ApiMarketProduct,
  ApiMatchRecord,
  ApiNotification,
  ApiPetRecord,
  ApiPrayerRecord,
  ApiUser,
} from '../services/api';
import apiService from '../services/api';
import type { Pet } from '../types';
import { createOwnerFromApi, createPetFromApi } from '../utils/adapters';
import BrandMark from './BrandMark';
import {
  MARKET_ASSET_EVENT,
  formatAssetPrice,
  loadMarketCart,
  loadMarketOrders,
  type MarketCartItem,
  type MarketOrder,
} from '../utils/marketAssets';
import { createMemberOrdersFromAssets } from '../utils/appDataAdapters';

interface ProfileProps {
  userPet: Pet;
  currentUser: ApiUser | null;
  isDigitalTwinCreated: boolean;
  onStartCreation: () => void;
  onTwinCreated: () => void;
  onProfileSync?: (payload: { user?: ApiUser | null; pet?: Pet | null; isDigitalTwinCreated?: boolean }) => void;
}

type ActiveTab = 'reality' | 'virtual' | 'member';

type EditFormState = {
  username: string;
  signature: string;
  residentCity: string;
  frequentCities: string;
  hobbies: string;
  mbti: string;
  petName: string;
  petPersonality: string;
  petBio: string;
  petWeight: string;
};

const EMPTY_IMAGE = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800';

function formatTimestamp(value?: string) {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toCsv(values?: string[]) {
  return (values || []).join('、');
}

function fromCsv(value: string) {
  return value
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Profile({
  userPet,
  currentUser,
  isDigitalTwinCreated,
  onStartCreation,
  onTwinCreated,
  onProfileSync,
}: ProfileProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reality');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingTwin, setCreatingTwin] = useState(false);
  const [twinFeedback, setTwinFeedback] = useState<string | null>(null);
  const [sendingPrayer, setSendingPrayer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [petRecord, setPetRecord] = useState<ApiPetRecord | null>(null);
  const [profileUser, setProfileUser] = useState<ApiUser | null>(currentUser);
  const [diaries, setDiaries] = useState<ApiDiaryRecord[]>([]);
  const [matches, setMatches] = useState<ApiMatchRecord[]>([]);
  const [sellerProducts, setSellerProducts] = useState<ApiMarketProduct[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [prayers, setPrayers] = useState<ApiPrayerRecord[]>([]);
  const [cartItems, setCartItems] = useState<MarketCartItem[]>(() => loadMarketCart());
  const [marketOrders, setMarketOrders] = useState<MarketOrder[]>(() => loadMarketOrders());
  const [prayerInput, setPrayerInput] = useState('');
  const [editForm, setEditForm] = useState<EditFormState>({
    username: currentUser?.username || userPet.owner.name,
    signature: currentUser?.signature || userPet.owner.signature,
    residentCity: currentUser?.resident_city || userPet.owner.residentCity,
    frequentCities: toCsv(currentUser?.frequent_cities || userPet.owner.frequentCities),
    hobbies: toCsv(currentUser?.hobbies || userPet.owner.hobbies),
    mbti: currentUser?.mbti || userPet.owner.mbti,
    petName: userPet.name,
    petPersonality: userPet.personality,
    petBio: '',
    petWeight: '',
  });

  const loadData = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [userResult, petResult, diariesResult, matchesResult, productsResult, notificationsResult, prayersResult, memberAssetsResult] =
        await Promise.all([
          apiService.getCurrentUser(),
          apiService.getPetById(userPet.id),
          apiService.getUserDiaries(1, 8),
          apiService.getMatches(1, 20),
          apiService.getSellerProducts(currentUser.id),
          apiService.getNotifications(),
          apiService.getPrayerRecords(1, 8),
          apiService.getMemberAssets(),
        ]);

      const nextUser = userResult.data || currentUser;
      const nextPetRecord = petResult.data || null;
      setProfileUser(nextUser);
      setPetRecord(nextPetRecord);
      setDiaries(diariesResult.data || []);
      setMatches(matchesResult.data || []);
      setSellerProducts(productsResult.data || []);
      setNotifications(notificationsResult.data || []);
      setPrayers(prayersResult.data || []);
      setMarketOrders(createMemberOrdersFromAssets(memberAssetsResult.data));
      setEditForm({
        username: nextUser?.username || userPet.owner.name,
        signature: nextUser?.signature || userPet.owner.signature,
        residentCity: nextUser?.resident_city || userPet.owner.residentCity,
        frequentCities: toCsv(nextUser?.frequent_cities || userPet.owner.frequentCities),
        hobbies: toCsv(nextUser?.hobbies || userPet.owner.hobbies),
        mbti: nextUser?.mbti || userPet.owner.mbti,
        petName: nextPetRecord?.name || userPet.name,
        petPersonality: nextPetRecord?.personality || userPet.personality,
        petBio: nextPetRecord?.bio || '',
        petWeight: nextPetRecord?.weight ? String(nextPetRecord.weight) : '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [currentUser?.id, userPet.id]);

  useEffect(() => {
    const refreshMarketAssets = async () => {
      setCartItems(loadMarketCart());
      if (currentUser?.id) {
        try {
          const result = await apiService.getMemberAssets();
          setMarketOrders(createMemberOrdersFromAssets(result.data));
          return;
        } catch {
          // Fall back to local asset cache when backend sync is unavailable.
        }
      }
      setMarketOrders(loadMarketOrders());
    };

    void refreshMarketAssets();
    const handleRefresh = () => {
      void refreshMarketAssets();
    };
    window.addEventListener('storage', handleRefresh);
    window.addEventListener(MARKET_ASSET_EVENT, handleRefresh);
    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener(MARKET_ASSET_EVENT, handleRefresh);
    };
  }, [currentUser?.id]);

  const owner = useMemo(() => createOwnerFromApi(profileUser || currentUser || {}), [profileUser, currentUser]);
  const sourceUser = profileUser || currentUser;
  const profilePet = useMemo(() => {
    if (!petRecord || !sourceUser) {
      return userPet;
    }
    return createPetFromApi(petRecord, sourceUser);
  }, [petRecord, sourceUser, userPet]);

  const matchedCount = matches.filter((item) => item.status === 'matched').length;
  const pendingCount = matches.filter((item) => item.status === 'pending').length;
  const diaryInteractionCount = diaries.reduce(
    (sum, item) => sum + (item.likes_count || 0) + (item.comments_count || 0),
    0,
  );
  const unreadNotifications = notifications.filter((item) => !item.is_read).length;
  const twinReady = Boolean(petRecord?.is_digital_twin || isDigitalTwinCreated);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const saveProfile = async () => {
    if (!currentUser?.id || !petRecord?.id || saving) return;

    setSaving(true);
    try {
      const [userResult, petResult] = await Promise.all([
        apiService.updateCurrentUser({
          username: editForm.username,
          signature: editForm.signature,
          bio: editForm.signature,
          resident_city: editForm.residentCity,
          frequent_cities: fromCsv(editForm.frequentCities),
          hobbies: fromCsv(editForm.hobbies),
          mbti: editForm.mbti,
        }),
        apiService.updatePet(petRecord.id, {
          name: editForm.petName,
          personality: editForm.petPersonality,
          bio: editForm.petBio,
          weight: editForm.petWeight ? Number(editForm.petWeight) : null,
        }),
      ]);

      const nextUser = userResult.data || profileUser;
      const nextPetRecord = petResult.data || petRecord;
      setProfileUser(nextUser || null);
      setPetRecord(nextPetRecord || null);
      if (nextUser && nextPetRecord) {
        onProfileSync?.({
          user: nextUser,
          pet: createPetFromApi(nextPetRecord, nextUser),
          isDigitalTwinCreated: Boolean(nextPetRecord.is_digital_twin),
        });
      }
      setShowEditModal(false);
    } finally {
      setSaving(false);
    }
  };

  const createTwin = async () => {
    const petId = petRecord?.id || userPet.id;
    const modelUrl = petRecord?.images?.[0] || userPet.images?.[0] || EMPTY_IMAGE;
    if (!petId || creatingTwin) return;

    setCreatingTwin(true);
    setTwinFeedback(null);
    try {
      const result = await apiService.createDigitalTwin(
        petId,
        modelUrl,
        `${profilePet.name} 的数字分身，继承它的 ${profilePet.personality} 气质与主人 ${owner.name} 的互动偏好。`,
      );
      if (result.data) {
        setPetRecord(result.data);
        if (sourceUser) {
          onProfileSync?.({
            user: sourceUser,
            pet: createPetFromApi(result.data, sourceUser),
            isDigitalTwinCreated: true,
          });
        }
        onTwinCreated();
      }
      onStartCreation();
      setActiveTab('virtual');
    } catch (error) {
      setTwinFeedback(
        error instanceof Error
          ? `${error.message}。已切换到本地生成体验，配置 Supabase 后会同步真实数字分身。`
          : '数字分身接口暂不可用，已切换到本地生成体验。',
      );
      onProfileSync?.({ isDigitalTwinCreated: true });
      onTwinCreated();
      setActiveTab('virtual');
      onStartCreation();
    } finally {
      setCreatingTwin(false);
    }
  };

  const submitPrayer = async () => {
    const value = prayerInput.trim();
    const petId = petRecord?.id || userPet.id;
    if (!value || !petId || sendingPrayer) return;

    setSendingPrayer(true);
    try {
      const result = await apiService.createPrayer(petId, value);
      if (result.data) {
        setPrayers((prev) => [result.data as ApiPrayerRecord, ...prev]);
      }
      setPrayerInput('');
    } finally {
      setSendingPrayer(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)),
      );
    } catch {
      // Keep the current UI state if the request fails.
    }
  };

  const updateField = (field: keyof EditFormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="px-6 py-12"><div className="glass ambient-card rounded-[2.6rem] border border-white/50 p-8 text-center text-sm text-slate-400 shadow-sm">正在同步真实档案数据…</div></div>;
  }

  return (
    <div className="px-6 space-y-8 pb-10">
      <section className="brand-surface brand-aura ambient-card overflow-hidden rounded-[3rem] px-6 py-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/70">{'\u4e2a\u4eba\u7a7a\u95f4'}</p>
            <h1 className="font-headline text-4xl font-black italic tracking-tight text-slate-900">个人空间与数字分身</h1>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">这里统一承接真实档案、宠物分身、通知、匹配进度和你的市场资产，确保主人视角和后台数据完全一致。</p>
          </div>
          <div className="soft-panel rounded-[2rem] border border-white/50 px-4 py-4 text-right">
            <div className="mb-3 flex justify-end">
              <BrandMark mode="icon" size="sm" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">欢迎回来</p>
            <p className="mt-2 text-sm font-black text-slate-900">{owner.name}</p>
            <p className="mt-1 text-xs text-slate-400">{profilePet.name} · {profilePet.type}</p>
          </div>
        </div>
      </section>

      <div className="flex justify-center">
        <div className="glass ambient-card relative flex h-14 w-full max-w-sm rounded-[2rem] border border-white/50 p-1 shadow-sm">
          <motion.div
            className="absolute bottom-1 top-1 z-0 rounded-[1.8rem] bg-white shadow-md"
            initial={false}
            animate={{
              left: activeTab === 'reality' ? '4px' : activeTab === 'virtual' ? '33.33%' : '66.66%',
              width: 'calc(33.33% - 4px)',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          {[
            { key: 'reality', label: '现实档案', icon: 'visibility' },
            { key: 'virtual', label: '数字分身', icon: 'auto_awesome' },
            { key: 'member', label: '会员资产', icon: 'card_membership' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`relative z-10 flex flex-1 items-center justify-center gap-1 text-[10px] font-black transition-colors ${
                activeTab === tab.key ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'reality' ? (
          <motion.div
            key="reality"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-8"
          >
            <div className="glass ambient-card overflow-hidden rounded-[3rem] border border-white/50 shadow-sm p-8 space-y-6 relative">
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-400 shadow-sm transition-colors hover:text-primary"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden shadow-xl ring-4 ring-primary/5">
                  <img src={owner.avatar} className="w-full h-full object-cover" alt={owner.name} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-headline text-2xl font-black text-slate-900 truncate tracking-tight">{owner.name}</h2>
                    {owner.isVerified && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">已认证</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-primary font-bold italic text-sm">
                      {owner.gender || '未填写'} · {owner.age || '年龄待补充'}
                    </span>
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-black">{owner.mbti}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] rounded-full font-black tracking-widest">
                      常驻: {owner.residentCity}
                    </span>
                    {owner.frequentCities.slice(0, 2).map((city) => (
                      <span key={city} className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-full font-black tracking-widest">
                        常去: {city}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-sm font-medium text-slate-500 italic leading-relaxed">“{owner.signature}”</p>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">兴趣偏好</h4>
                <div className="flex flex-wrap gap-2">
                  {owner.hobbies.slice(0, 8).map((hobby) => (
                    <span
                      key={hobby}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-black rounded-2xl tracking-wide border border-emerald-100"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '已匹配', value: matchedCount, icon: 'favorite', tone: 'text-pink-500' },
                { label: '待匹配', value: pendingCount, icon: 'schedule', tone: 'text-amber-500' },
                { label: '档案互动', value: diaryInteractionCount, icon: 'chat_bubble', tone: 'text-blue-500' },
                { label: '我的发布', value: sellerProducts.length, icon: 'storefront', tone: 'text-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="glass ambient-card flex items-center gap-4 rounded-[2.5rem] border border-white/50 p-6 shadow-sm">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 ${item.tone}`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 leading-none">{item.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass ambient-card overflow-hidden rounded-[3rem] border border-white/50 shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden shadow-xl ring-4 ring-primary/5">
                  <img
                    src={profilePet.images?.[0] || EMPTY_IMAGE}
                    className="w-full h-full object-cover"
                    alt={profilePet.name}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-headline text-2xl font-black text-slate-900 truncate tracking-tight">{profilePet.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-primary font-bold italic text-sm">
                      {profilePet.gender} · {profilePet.type}
                    </span>
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-black">{profilePet.personality}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-full font-black">
                      疫苗 {petRecord?.vaccinated ? '已完成' : '待补充'}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-full font-black">
                      健康 {petRecord?.health_status || '\u7a33\u5b9a'}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-full font-black">
                      数字分身 {twinReady ? '已生成' : '未生成'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="soft-panel rounded-[2rem] border border-white/50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">体重</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{petRecord?.weight ? `${petRecord.weight} kg` : '未填写'}</p>
                </div>
                <div className="soft-panel rounded-[2rem] border border-white/50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">谱系</p>
                  <p className="mt-2 text-lg font-black text-slate-900 line-clamp-2">{petRecord?.pedigree_info || '暂无'}</p>
                </div>
              </div>
              <div className="soft-panel rounded-[2.5rem] border border-white/50 p-6 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">宠物备注</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{petRecord?.bio || '这只毛孩子还没有补充更完整的档案介绍。'}</p>
              </div>
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">真实日记</h3>
                <span className="text-[10px] font-bold text-slate-400">最近 8 条</span>
              </div>
              {diaries.length === 0 ? (
                <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-6 shadow-sm text-sm text-slate-400 text-center">
                  还没有新的日记内容，后续发布后会同步显示在这里。
                </div>
              ) : (
                <div className="space-y-4">
                  {diaries.map((diary) => (
                    <div key={diary.id} className="glass ambient-card rounded-[2.5rem] border border-white/50 shadow-sm overflow-hidden">
                      {diary.images?.[0] && (
                        <img
                          src={diary.images[0]}
                          alt={diary.title}
                          className="w-full h-48 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="text-lg font-black text-slate-900 line-clamp-1">{diary.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                            {formatTimestamp(diary.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{diary.content}</p>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">favorite</span>
                            {diary.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">chat_bubble</span>
                            {diary.comments_count || 0}
                          </span>
                          {diary.mood && (
                            <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-500">{diary.mood}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </motion.div>
        ) : activeTab === 'virtual' ? (
          <motion.div
            key="virtual"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-8"
          >
            <div className="glass ambient-card rounded-[3rem] border border-white/50 shadow-sm p-8 space-y-6 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary/15 via-emerald-100/50 to-sky-100/50" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">{'\u6570\u5b57\u5206\u8eab'}</p>
                  <h2 className="font-headline text-3xl font-black italic tracking-tight text-slate-900">
                    {twinReady ? `${profilePet.name} 已在线` : '创建宠物数字分身'}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                    {twinReady
                      ? '宠物心声、祈愿回应和互动偏好已经接入真实数据链路。'
                      : '生成后会保留宠物档案、互动偏好和祈愿记录，用于后续心声与召回能力。'}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-[1.8rem] bg-white shadow-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 relative">
                <div className="soft-panel rounded-[2rem] border border-white/50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">状态</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{twinReady ? '已激活' : '未生成'}</p>
                </div>
                <div className="soft-panel rounded-[2rem] border border-white/50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">最后同步</p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {formatTimestamp(petRecord?.digital_twin_data?.generated_at || petRecord?.updated_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => void createTwin()}
                disabled={creatingTwin}
                className="relative w-full py-4 rounded-[2rem] bg-primary text-white font-black shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {twinReady ? '重新同步数字分身' : creatingTwin ? '正在生成中…' : '立即生成数字分身'}
              </button>
              {twinFeedback && (
                <div className="rounded-[1.8rem] border border-amber-100 bg-amber-50/90 px-5 py-4 text-sm font-semibold leading-relaxed text-amber-700">
                  {twinFeedback}
                </div>
              )}
            </div>

            <div className="glass ambient-card rounded-[3rem] border border-white/50 shadow-sm p-8 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">AI 祈愿与宠语记录</h3>
                  <p className="text-sm text-slate-500 mt-1">用真实接口给 {profilePet.name} 留下新的问题或愿望。</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                  {prayers.length} 条记录
                </span>
              </div>
              <div className="flex items-center gap-3 soft-panel rounded-[2rem] border border-white/50 px-4 py-3">
                <input
                  type="text"
                  value={prayerInput}
                  onChange={(event) => setPrayerInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void submitPrayer();
                    }
                  }}
                  placeholder="例如：今天散步时你最想告诉我什么？"
                  className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-300"
                />
                <button
                  onClick={() => void submitPrayer()}
                  disabled={sendingPrayer}
                  className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
              {prayers.length === 0 ? (
                <div className="soft-panel rounded-[2rem] border border-white/50 p-6 text-center text-sm text-slate-400">
                  还没有祈愿记录，发一条试试看。
                </div>
              ) : (
                <div className="space-y-4">
                  {prayers.map((record) => (
                    <div key={record.id} className="soft-panel rounded-[2.5rem] border border-white/50 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{formatTimestamp(record.created_at)}</p>
                        <span className="px-2 py-1 rounded-full bg-white text-[10px] font-black text-emerald-600">
                          {record.sentiment || '\u79ef\u6781'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 italic">“{record.prayer_text}”</p>
                      <div className="rounded-[2rem] border border-white/50 bg-white/75 p-4">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {record.ai_response || 'AI 正在整理更贴近宠物语境的回应。'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="member"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">未读通知</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{unreadNotifications}</p>
              </div>
              <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">购物车商品</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{cartItemCount}</p>
              </div>
              <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">订单记录</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{marketOrders.length}</p>
              </div>
              <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">发布资产</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{sellerProducts.length}</p>
              </div>
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">我的加购商品</h3>
                <span className="text-[10px] font-bold text-slate-400">合计 {formatAssetPrice(cartTotal)}</span>
              </div>
              {cartItems.length === 0 ? (
                <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-6 shadow-sm text-sm text-slate-400 text-center">
                  还没有加购商品。去爪住集市的主粮用品页选择数量并加入购物车后，会同步显示在这里。
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="glass ambient-card rounded-[2.5rem] border border-white/50 shadow-sm p-5 flex items-center gap-4">
                      <img
                        src={item.image || EMPTY_IMAGE}
                        alt={item.title}
                        className="w-16 h-16 rounded-2xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-1">{item.sellerName} · {formatAssetPrice(item.unitPrice)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">已加购 {item.quantity} 件</p>
                      </div>
                      <span className="text-sm font-black text-primary whitespace-nowrap">
                        {formatAssetPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">订单与预约记录</h3>
                <span className="text-[10px] font-bold text-slate-400">购物结算 / 商家预约</span>
              </div>
              {marketOrders.length === 0 ? (
                <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-6 shadow-sm text-sm text-slate-400 text-center">
                  还没有订单记录。主粮用品结算和护理养护预约会沉淀到这里。
                </div>
              ) : (
                <div className="space-y-3">
                  {marketOrders.map((order) => (
                    <div key={order.id} className="glass ambient-card rounded-[2.5rem] border border-white/50 shadow-sm p-5 flex items-center gap-4">
                      <img
                        src={order.image || EMPTY_IMAGE}
                        alt={order.title}
                        className="w-16 h-16 rounded-2xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[9px] font-black ${order.kind === 'booking' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {order.kind === 'booking' ? '预约' : '订单'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{formatTimestamp(order.createdAt)}</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 truncate mt-2">{order.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {order.kind === 'booking' ? `${order.appointmentSlot || '待确认时间'} · ${order.sellerName}` : `${order.quantity} 件 · ${order.status}`}
                        </p>
                      </div>
                      <span className="text-sm font-black text-primary whitespace-nowrap">
                        {formatAssetPrice(order.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">我的发布</h3>
                <span className="text-[10px] font-bold text-slate-400">真实市场数据</span>
              </div>
              {sellerProducts.length === 0 ? (
                <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-6 shadow-sm text-sm text-slate-400 text-center">
                  你还没有新的市场发布。
                </div>
              ) : (
                <div className="space-y-3">
                  {sellerProducts.map((item) => (
                    <div key={item.id} className="glass ambient-card rounded-[2.5rem] border border-white/50 shadow-sm p-5 flex items-center gap-4">
                      <img
                        src={item.images?.[0] || item.pet?.images?.[0] || EMPTY_IMAGE}
                        alt={item.title}
                        className="w-16 h-16 rounded-2xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-1">{item.description || item.requirements || '暂无更多说明'}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400">
                          <span>{item.type || 'listing'}</span>
                          <span>·</span>
                          <span>{item.status || 'active'}</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-primary whitespace-nowrap">
                        {item.price ? `¥${item.price}` : '私聊'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">通知中心</h3>
                <span className="text-[10px] font-bold text-slate-400">点击后标记已读</span>
              </div>
              {notifications.length === 0 ? (
                <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-6 shadow-sm text-sm text-slate-400 text-center">
                  暂时没有新的系统通知。
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => void markNotificationAsRead(item.id)}
                      className="w-full text-left glass ambient-card rounded-[2.5rem] border border-white/50 shadow-sm p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.is_read ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>
                            <span className="material-symbols-outlined">notifications</span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{item.message}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{formatTimestamp(item.created_at)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black ${item.is_read ? 'bg-slate-50 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>
                          {item.is_read ? '已读' : '未读'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">匹配进度</h3>
                <span className="text-[10px] font-bold text-slate-400">最近 6 条</span>
              </div>
              {matches.length === 0 ? (
                <div className="glass ambient-card rounded-[2.5rem] border border-white/50 p-6 shadow-sm text-sm text-slate-400 text-center">
                  还没有新的匹配记录。
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 6).map((match) => {
                    const otherPet = match.user_a_id === currentUser?.id ? match.pet_b : match.pet_a;
                    const statusTone =
                      match.status === 'matched'
                        ? 'bg-emerald-50 text-emerald-600'
                        : match.status === 'pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-500';
                    return (
                      <div key={match.id} className="glass ambient-card rounded-[2.5rem] border border-white/50 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined">pets</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">
                            {otherPet?.name || '对方宠物'} · {otherPet?.type || '宠物档案'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">匹配度 {(Number(match.compatibility_score || 0) * 100).toFixed(0)}%</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${statusTone}`}>
                          {match.status === 'matched' ? '已匹配' : match.status === 'pending' ? '待回应' : '已跳过'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="glass ambient-card flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[3rem] border border-white/50 shadow-2xl"
            >
              <div className="p-8 pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight">编辑档案</h3>
                  <p className="text-sm text-slate-500 mt-1">保存后会同步到前端状态与后端数据。</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-400 shadow-sm"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar p-8 space-y-5">
                {[
                  { label: '主人昵称', field: 'username', placeholder: '输入你的昵称' },
                  { label: '签名', field: 'signature', placeholder: '写一句对外展示的话' },
                  { label: '常驻城市', field: 'residentCity', placeholder: '例如：上海' },
                  { label: '常去城市', field: 'frequentCities', placeholder: '用 、 分隔多个城市' },
                  { label: '兴趣爱好', field: 'hobbies', placeholder: '用 、 分隔多个爱好' },
                  { label: 'MBTI', field: 'mbti', placeholder: '例如：ENFP' },
                  { label: '宠物昵称', field: 'petName', placeholder: '输入宠物名字' },
                  { label: '宠物性格', field: 'petPersonality', placeholder: '例如：活泼、黏人' },
                  { label: '宠物介绍', field: 'petBio', placeholder: '补充宠物档案描述' },
                  { label: '宠物体重', field: 'petWeight', placeholder: 'kg，数字即可' },
                ].map((item) => (
                  <label key={item.field} className="block space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</span>
                    {item.field === 'signature' || item.field === 'petBio' ? (
                      <textarea
                        value={editForm[item.field as keyof EditFormState]}
                        onChange={(event) => updateField(item.field as keyof EditFormState, event.target.value)}
                        placeholder={item.placeholder}
                        rows={3}
                        className="w-full resize-none rounded-[1.8rem] border border-white/50 bg-white/75 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary/30"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editForm[item.field as keyof EditFormState]}
                        onChange={(event) => updateField(item.field as keyof EditFormState, event.target.value)}
                        placeholder={item.placeholder}
                        className="w-full rounded-[1.8rem] border border-white/50 bg-white/75 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary/30"
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="p-8 pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 rounded-[2rem] bg-slate-100 text-slate-700 font-black"
                >
                  取消
                </button>
                <button
                  onClick={() => void saveProfile()}
                  disabled={saving}
                  className="flex-1 py-4 rounded-[2rem] bg-primary text-white font-black shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {saving ? '保存中…' : '保存修改'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
