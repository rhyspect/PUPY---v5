import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react';
import type { ApiDiscoveryPet, ApiMatchRecord, ApiPetRecord, ApiUser } from '../services/api';
import apiService from '../services/api';
import type { Owner, Pet } from '../types';
import { createOwnerFromApi } from '../utils/adapters';
import { getStoredLocale, type AppLocale } from '../utils/locale';
import { PETS } from '../constants';

interface HomeProps {
  onMatch: (payload?: { owner?: Owner; match?: ApiMatchRecord }) => void;
  onViewOwner: (owner: Owner) => void;
  currentUser: ApiUser | null;
  userPet: Pet;
}

const EMPTY_IMAGE = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=800';

const copyByLocale = {
  'zh-CN': {
    loadingTitle: '正在刷新推荐',
    loadingDescription: '正在同步真实推荐。',
    emptyTitle: '暂无新推荐',
    emptyDescription: '当前附近还没有更合适的档案。',
    retry: '重新探索',
    rulesTitle: '发现规则',
    rulesBody: '左滑喜欢，右滑略过。',
    identityTitle: '当前身份',
    filters: '筛选偏好',
    likeBadge: '待匹配',
    dislikeBadge: '略过',
    ownerProfile: '查看主人资料',
    detailProfile: '查看详细资料',
    pendingHint: '等待系统双向确认',
    likeAria: '喜欢当前卡片',
    dislikeAria: '跳过当前卡片',
    sendLikeFailed: '发送喜欢失败，请稍后重试。',
    discoverFailed: '发现页加载失败。',
    typeFallback: '宠物伙伴',
    genderFallback: '未知',
    personalityFallback: '友好亲人',
  },
  'en-US': {
    loadingTitle: 'Refreshing nearby pets',
    loadingDescription: 'Loading real profiles that fit your current pet. Swipe left to like and enter pending matching. Swipe right to skip.',
    emptyTitle: 'No new recommendations right now',
    emptyDescription: 'There are no stronger candidates nearby at the moment. Check back later.',
    retry: 'Refresh discovery',
    rulesTitle: 'Discovery rules',
    rulesBody: 'Swipe left to like and enter pending matching. The system will not show a direct match instantly. Swipe right to skip with no heart or match.',
    identityTitle: 'Current identity',
    filters: 'Filters',
    likeBadge: 'Pending',
    dislikeBadge: 'Skip',
    ownerProfile: 'View owner profile',
    detailProfile: 'View full profile',
    pendingHint: 'Real profile waiting for two-way system confirmation',
    likeAria: 'Like current card',
    dislikeAria: 'Skip current card',
    sendLikeFailed: 'Failed to send like. Please try again.',
    discoverFailed: 'Failed to load discovery.',
    typeFallback: 'Pet companion',
    genderFallback: 'Unknown',
    personalityFallback: 'Friendly',
  },
} satisfies Record<AppLocale, Record<string, string>>;

type DiscoveryCard = Pet & { ownerId?: string; raw: ApiDiscoveryPet };

function normalizeCandidate(candidate: ApiDiscoveryPet, locale: AppLocale): DiscoveryCard {
  const copy = copyByLocale[locale];
  const owner = createOwnerFromApi(candidate.owner || {});

  return {
    id: candidate.id,
    name: candidate.name,
    images: candidate.images?.length ? candidate.images : [EMPTY_IMAGE],
    type: candidate.type || candidate.breed || copy.typeFallback,
    gender: candidate.gender || copy.genderFallback,
    personality: candidate.personality || copy.personalityFallback,
    hasPet: true,
    owner,
    ownerId: candidate.owner?.id,
    raw: candidate,
  };
}

function createDemoUser(owner: Owner, index: number): ApiUser {
  return {
    id: owner.id || `demo-owner-${index + 1}`,
    username: owner.name,
    email: owner.email || `demo-owner-${index + 1}@pupy.local`,
    age: owner.age,
    gender: owner.gender,
    resident_city: owner.residentCity,
    frequent_cities: owner.frequentCities,
    hobbies: owner.hobbies,
    mbti: owner.mbti,
    signature: owner.signature,
    avatar_url: owner.avatar,
    photos: owner.photos,
    is_verified: true,
  };
}

function createDemoDiscoveryCard(pet: Pet, index: number): DiscoveryCard {
  const owner = createDemoUser(pet.owner, index);
  return {
    ...pet,
    ownerId: undefined,
    raw: {
      id: pet.id,
      user_id: owner.id,
      name: pet.name,
      type: pet.type,
      gender: pet.gender,
      personality: pet.personality,
      breed: pet.type,
      images: pet.images,
      owner,
    },
  };
}

function createOptimisticMatchRecord(
  createdMatch: ApiMatchRecord | undefined,
  currentUser: ApiUser | null,
  userPet: Pet,
  candidate: DiscoveryCard,
): ApiMatchRecord | undefined {
  if (!createdMatch) return undefined;

  const optimisticPetA: ApiPetRecord = {
    id: createdMatch.pet_a_id,
    user_id: currentUser?.id,
    name: userPet.name,
    type: userPet.type,
    gender: userPet.gender,
    personality: userPet.personality,
    images: userPet.images,
  };

  return {
    ...createdMatch,
    user_a: currentUser || undefined,
    user_b: candidate.raw.owner,
    pet_a: optimisticPetA,
    pet_b: candidate.raw,
  };
}

export default function Home({ onMatch, onViewOwner, currentUser, userPet }: HomeProps) {
  const locale = getStoredLocale();
  const copy = useMemo(() => copyByLocale[locale], [locale]);
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'like' | 'dislike' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const opacity = useTransform(x, [-240, -180, 0, 180, 240], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [-180, -70], [1, 0]);
  const dislikeOpacity = useTransform(x, [70, 180], [0, 1]);

  const loadDiscovery = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getDiscoverPets(userPet.type, userPet.gender, 24);
      const apiCards = (result.data || []).map((candidate) => normalizeCandidate(candidate, locale));
      setCards(apiCards.length ? apiCards : PETS.map(createDemoDiscoveryCard));
      if (!apiCards.length) {
        setError('当前 Supabase 推荐池为空，已切换到本地样本卡片供测试左滑右滑。');
      }
    } catch (requestError) {
      setCards(PETS.map(createDemoDiscoveryCard));
      setError(
        requestError instanceof Error
          ? `${requestError.message}。已加载本地样本卡片供测试。`
          : `${copy.discoverFailed} 已加载本地样本卡片供测试。`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDiscovery();
  }, [userPet.id, userPet.type, userPet.gender, locale]);

  const moveToNextCard = (action: 'like' | 'dislike') => {
    setLastAction(action);
    window.setTimeout(() => {
      setCards((previous) => previous.slice(1));
      setLastAction(null);
      x.set(0);
    }, 220);
  };

  const swipe = async (action: 'like' | 'dislike') => {
    const topCard = cards[0];
    if (!topCard || isSubmitting) return;

    if (action === 'dislike') {
      moveToNextCard('dislike');
      return;
    }

    setIsSubmitting(true);
    try {
      let optimisticMatch: ApiMatchRecord | undefined;
      if (topCard.ownerId) {
        const result = await apiService.createMatch(topCard.ownerId, userPet.id, topCard.id);
        optimisticMatch = createOptimisticMatchRecord(result.data, currentUser, userPet, topCard);
      }
      moveToNextCard('like');
      onMatch({ owner: topCard.owner, match: optimisticMatch });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.sendLikeFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 110) {
      void swipe('dislike');
      return;
    }
    if (info.offset.x < -110) {
      void swipe('like');
    }
  };

  const topCard = cards[0];

  if (loading) {
    return (
      <div className="flex min-h-[72vh] flex-col items-center justify-center space-y-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-primary/10 animate-pulse">
          <span className="material-symbols-outlined text-3xl text-primary">pets</span>
        </div>
        <h3 className="text-lg font-black text-slate-900">{copy.loadingTitle}</h3>
        <p className="max-w-xs text-sm leading-relaxed text-slate-400">{copy.loadingDescription}</p>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 px-10 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <span className="material-symbols-outlined text-4xl text-slate-300">travel_explore</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800">{copy.emptyTitle}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{error || copy.emptyDescription}</p>
        <button type="button" onClick={() => void loadDiscovery()} className="rounded-2xl bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95">
          {copy.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[76vh] flex-col items-center px-6">
      <div className="mb-5 grid w-full grid-cols-2 gap-3" aria-live="polite">
        <div className="glass rounded-[2rem] border border-white/50 px-4 py-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{copy.rulesTitle}</p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">{copy.rulesBody}</p>
        </div>
        <div className="glass rounded-[2rem] border border-white/50 px-4 py-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{copy.identityTitle}</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{currentUser?.username || userPet.owner.name} · {userPet.name}</p>
          <p className="mt-1 text-xs text-slate-400">{copy.filters}: {userPet.type} / {userPet.gender}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 w-full rounded-[1.6rem] border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-700">
          {error}
        </div>
      )}

      <div className="relative mb-8 w-full aspect-[3/4.25]">
        <AnimatePresence>
          {cards.map((pet, index) => {
            const isTop = index === 0;
            return (
              <motion.div
                key={pet.id}
                style={isTop ? { x, rotate, opacity } : {}}
                drag={isTop ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{
                  scale: isTop ? 1 : 0.96 - index * 0.04,
                  opacity: 1,
                  y: isTop ? 0 : index * 10,
                  zIndex: cards.length - index,
                }}
                exit={{
                  x: lastAction === 'dislike' ? 460 : -460,
                  opacity: 0,
                  rotate: lastAction === 'dislike' ? 26 : -26,
                  transition: { duration: 0.24 },
                }}
                className="absolute inset-0 overflow-hidden rounded-[3rem] border border-white/30 bg-white shadow-2xl touch-none"
                aria-label={`${pet.name} discovery card`}
              >
                <img src={pet.images[0] || EMPTY_IMAGE} alt={pet.name} className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {isTop && (
                  <>
                    <motion.div style={{ opacity: likeOpacity }} className="pointer-events-none absolute left-10 top-20 z-20 -rotate-12 rounded-2xl border-4 border-emerald-500 px-4 py-2 text-3xl font-black text-emerald-500">
                      {copy.likeBadge}
                    </motion.div>
                    <motion.div style={{ opacity: dislikeOpacity }} className="pointer-events-none absolute right-10 top-20 z-20 rotate-12 rounded-2xl border-4 border-red-500 px-4 py-2 text-3xl font-black text-red-500">
                      {copy.dislikeBadge}
                    </motion.div>
                  </>
                )}

                <div className="absolute left-6 right-6 top-6 z-10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewOwner(pet.owner)}
                    className="flex min-w-0 flex-1 items-center gap-3 self-start rounded-[2rem] border border-white/20 bg-black/40 p-2 pr-4 text-left backdrop-blur-xl transition-transform active:scale-95"
                    aria-label={`${copy.ownerProfile}: ${pet.owner.name}`}
                  >
                    <img src={pet.owner.avatar} alt={pet.owner.name} className="h-10 w-10 rounded-2xl border-2 border-white/50 object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-black tracking-tight text-white">{pet.owner.name}</span>
                        <span className="rounded-md bg-primary/80 px-1.5 py-0.5 text-[8px] font-bold text-white">{pet.owner.mbti}</span>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-white/65">{pet.owner.signature}</p>
                    </div>
                  </button>

                  <button type="button" onClick={() => onViewOwner(pet.owner)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-transform active:scale-90" aria-label={`${copy.detailProfile}: ${pet.owner.name}`}>
                    <span className="material-symbols-outlined text-xl">visibility</span>
                  </button>
                </div>

                <div className="absolute bottom-8 left-8 right-8 space-y-4">
                  <div className="flex items-end gap-3">
                    <h2 className="flex-1 truncate font-headline text-4xl font-black tracking-tight text-white">{pet.name}</h2>
                    <div className="mb-1 rounded-xl border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-black tracking-widest text-white backdrop-blur-md">
                      {pet.type}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wide text-white/90 backdrop-blur-md">{pet.gender}</span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wide text-white/90 backdrop-blur-md">{pet.owner.residentCity}</span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wide text-white/90 backdrop-blur-md">{pet.personality}</span>
                  </div>
                  <p className="text-xs font-semibold text-white/70">{copy.pendingHint}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-8 pb-6">
        <button
          type="button"
          onClick={() => void swipe('like')}
          disabled={isSubmitting || !topCard}
          aria-label={topCard ? `${copy.likeAria}: ${topCard.name}` : copy.likeAria}
          className="flex h-20 w-20 items-center justify-center rounded-[2.2rem] bg-primary text-white shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/40 active:scale-90 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </button>
        <button
          type="button"
          onClick={() => void swipe('dislike')}
          disabled={!topCard}
          aria-label={topCard ? `${copy.dislikeAria}: ${topCard.name}` : copy.dislikeAria}
          className="flex h-16 w-16 items-center justify-center rounded-[2rem] border border-slate-100 bg-white text-red-400 shadow-xl transition-all hover:scale-105 hover:bg-red-50 active:scale-90 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>
    </div>
  );
}
