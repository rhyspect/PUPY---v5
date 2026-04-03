import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import type { ApiDiscoveryPet, ApiUser } from '../services/api';
import apiService from '../services/api';
import type { Owner, Pet } from '../types';
import { createOwnerFromApi } from '../utils/adapters';

interface HomeProps {
  onMatch: (owner?: Owner) => void;
  onViewOwner: (owner: Owner) => void;
  currentUser: ApiUser | null;
  userPet: Pet;
}

const EMPTY_IMAGE = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=800';

function normalizeCandidate(candidate: ApiDiscoveryPet): Pet & { ownerId?: string; raw: ApiDiscoveryPet } {
  const owner = createOwnerFromApi(candidate.owner || {});

  return {
    id: candidate.id,
    name: candidate.name,
    images: candidate.images?.length ? candidate.images : [EMPTY_IMAGE],
    type: candidate.type || candidate.breed || '宠物伙伴',
    gender: candidate.gender || '未知',
    personality: candidate.personality || '友好',
    hasPet: true,
    owner,
    ownerId: candidate.owner?.id,
    raw: candidate,
  };
}

export default function Home({ onMatch, onViewOwner, userPet }: HomeProps) {
  const [cards, setCards] = useState<Array<Pet & { ownerId?: string; raw: ApiDiscoveryPet }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'like' | 'dislike' | null>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-22, 22]);
  const opacity = useTransform(x, [-220, -160, 0, 160, 220], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [-160, -60], [1, 0]);
  const dislikeOpacity = useTransform(x, [60, 160], [0, 1]);

  const loadDiscovery = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getDiscoverPets(userPet.type, userPet.gender, 24);
      const nextCards = (result.data || []).map(normalizeCandidate);
      setCards(nextCards);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '发现页加载失败');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDiscovery();
  }, [userPet.id]);

  const moveToNextCard = (action: 'like' | 'dislike') => {
    setLastAction(action);
    window.setTimeout(() => {
      setCards((prev) => prev.slice(1));
      setLastAction(null);
      x.set(0);
    }, 220);
  };

  const swipe = async (action: 'like' | 'dislike') => {
    if (!cards.length || isSubmitting) return;

    const topCard = cards[0];
    if (!topCard) return;

    if (action === 'dislike') {
      moveToNextCard('dislike');
      return;
    }

    setShowHeart(true);
    window.setTimeout(() => setShowHeart(false), 900);

    if (!topCard.ownerId) {
      moveToNextCard('like');
      onMatch(topCard.owner);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createMatch(topCard.ownerId, userPet.id, topCard.id);
      moveToNextCard('like');
      window.setTimeout(() => onMatch(topCard.owner), 280);
    } catch {
      moveToNextCard('like');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 110) {
      void swipe('dislike');
    } else if (info.offset.x < -110) {
      void swipe('like');
    }
  };

  if (loading) {
    return (
      <div className="px-6 flex flex-col items-center justify-center min-h-[72vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-primary text-3xl">pets</span>
        </div>
        <h3 className="text-lg font-black text-slate-900">正在刷新附近的毛孩子</h3>
        <p className="text-sm text-slate-400">优先加载与你家宠物更匹配的真实资料。</p>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-10 text-center space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl text-slate-300">travel_explore</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800">暂时没有新的推荐</h3>
        <p className="text-sm text-slate-400">{error || '你附近暂时没有更适合的档案，稍后再来看看。'}</p>
        <button
          onClick={() => void loadDiscovery()}
          className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
        >
          重新探索
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 flex flex-col items-center min-h-[75vh]">
      <div className="relative w-full aspect-[3/4.2] mb-8">
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <span className="material-symbols-outlined text-9xl text-primary drop-shadow-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </motion.div>
          )}
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
                  x: lastAction === 'dislike' ? 480 : -480,
                  opacity: 0,
                  rotate: lastAction === 'dislike' ? 30 : -30,
                  transition: { duration: 0.25 },
                }}
                className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-slate-100 touch-none"
              >
                <img
                  src={pet.images[0] || EMPTY_IMAGE}
                  alt={pet.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                {isTop && (
                  <>
                    <motion.div
                      style={{ opacity: likeOpacity }}
                      className="absolute top-20 left-10 border-4 border-emerald-500 text-emerald-500 font-black text-4xl px-4 py-2 rounded-2xl -rotate-12 z-20 pointer-events-none"
                    >
                      喜欢
                    </motion.div>
                    <motion.div
                      style={{ opacity: dislikeOpacity }}
                      className="absolute top-20 right-10 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-2 rounded-2xl rotate-12 z-20 pointer-events-none"
                    >
                      略过
                    </motion.div>
                  </>
                )}

                <div className="absolute top-6 left-6 right-6 flex items-center gap-2 z-10">
                  <div
                    onClick={() => onViewOwner(pet.owner)}
                    className="flex items-center gap-3 bg-black/40 backdrop-blur-xl p-2 pr-4 rounded-[2rem] border border-white/20 self-start cursor-pointer group active:scale-95 transition-transform"
                  >
                    <img
                      src={pet.owner.avatar}
                      alt="主人"
                      className="w-10 h-10 rounded-2xl border-2 border-white/50 object-cover group-hover:scale-110 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-black tracking-tight group-hover:text-primary transition-colors truncate max-w-[110px]">{pet.owner.name}</span>
                        <span className="bg-primary/80 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold">{pet.owner.mbti}</span>
                      </div>
                      <p className="text-white/60 text-[10px] truncate max-w-[140px]">{pet.owner.signature}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onMatch(pet.owner)}
                    className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-outlined text-xl">chat</span>
                  </button>
                </div>

                <div className="absolute bottom-8 left-8 right-8 space-y-4">
                  <div className="flex items-end gap-3">
                    <h2 className="text-4xl font-black text-white font-headline tracking-tight truncate flex-1">{pet.name}</h2>
                    <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-xl text-[10px] font-black tracking-widest mb-1 border border-white/20">
                      {pet.type}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="bg-white/10 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 tracking-wide">
                      {pet.gender}
                    </span>
                    <span className="bg-white/10 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 tracking-wide">
                      {pet.owner.residentCity}
                    </span>
                    <span className="bg-white/10 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 tracking-wide">
                      {pet.personality}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-8 pb-6">
        <button
          onClick={() => void swipe('dislike')}
          className="w-16 h-16 rounded-[2rem] bg-white flex items-center justify-center text-red-400 shadow-xl hover:scale-110 hover:bg-red-50 active:scale-90 transition-all border border-slate-100"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
        <button
          onClick={() => void swipe('like')}
          disabled={isSubmitting}
          className="w-20 h-20 rounded-[2.2rem] bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-110 hover:shadow-primary/40 active:scale-90 transition-all shadow-primary/30 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </button>
      </div>

      <div className="fixed top-1/2 -right-12 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <span className="text-[20rem] font-black text-primary italic tracking-tighter">PUPY</span>
      </div>
    </div>
  );
}
