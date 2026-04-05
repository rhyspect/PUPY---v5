import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ApiMarketProduct } from '../services/api';
import apiService from '../services/api';

interface BreedingProps {
  onBack: () => void;
  onChat: (ownerName: string) => void;
}

type BreedingListing = {
  id: string;
  title: string;
  petName: string;
  petType: string;
  petGender: string;
  ownerName: string;
  ownerId?: string;
  petId?: string | null;
  image: string;
  description: string;
  priceLabel: string;
  requirements: string;
  status: string;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=800';

function getStoredPetId() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('pupy_pet');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id || null;
  } catch {
    return null;
  }
}

function toListing(item: ApiMarketProduct): BreedingListing {
  return {
    id: item.id,
    title: item.title,
    petName: item.pet?.name || '宠物档案',
    petType: item.pet?.type || item.pet?.breed || '未填写品种',
    petGender: item.pet?.gender || '未填写性别',
    ownerName: item.seller?.username || '发布者',
    ownerId: item.seller?.id,
    petId: item.pet?.id || item.pet_id,
    image: item.images?.[0] || item.pet?.images?.[0] || FALLBACK_IMAGE,
    description: item.description || '发布者还没有补充更详细的配对说明。',
    priceLabel: item.price ? `¥${item.price}` : '私聊协商',
    requirements: item.requirements || '优先沟通宠物健康、性格与相处习惯。',
    status: item.status || 'active',
  };
}

export default function Breeding({ onBack, onChat }: BreedingProps) {
  const [listings, setListings] = useState<BreedingListing[]>([]);
  const [selected, setSelected] = useState<BreedingListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const petId = getStoredPetId();

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getBreedingMarket(1, 20);
      setListings((result.data || []).map(toListing));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载繁育档案失败');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadListings();
  }, []);

  const submitRequest = async () => {
    if (!selected?.ownerId || !selected.petId || !petId || submitting) return;
    setSubmitting(true);
    try {
      await apiService.createBreedingRequest(selected.ownerId, petId, selected.petId, '来自繁育配对页的申请');
      setSelected(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '发送繁育申请失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] mx-auto flex max-w-md flex-col overflow-y-auto bg-surface no-scrollbar">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(255,230,236,0.92),transparent_70%)]" />
      <header className="sticky top-0 z-50 px-5 pt-4">
        <div className="glass flex items-center gap-4 rounded-[2rem] border border-white/60 px-5 py-4">
          <button aria-label="返回上一页" onClick={onBack} className="rounded-2xl bg-white/70 p-2 text-slate-500 transition hover:text-primary">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/70">Breeding Match</p>
            <h2 className="text-xl font-black tracking-tight text-slate-900">繁育配对</h2>
          </div>
          <button type="button" onClick={() => setShowGuide(true)} className="rounded-2xl bg-white/70 px-4 py-2 text-sm font-black text-slate-600 transition hover:text-primary">
            指南
          </button>
        </div>
      </header>

      <div className="relative z-10 px-5 pb-12 pt-6 space-y-6">
        <section className="frost-card floating-highlight rounded-[2.8rem] p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">真实繁育市场</p>
                <h1 className="mt-2 text-3xl font-black italic tracking-tight text-slate-900">为宠物寻找合适、健康、沟通顺畅的配对对象</h1>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.8rem] bg-white/70 text-primary shadow-sm">
                <span className="material-symbols-outlined text-3xl">favorite</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              这里读取的是真实繁育市场数据。你可以先查看对方要求和健康说明，再决定是否发送申请，避免把繁育配对做成纯装饰功能。
            </p>
          </div>
        </section>

        {error && (
          <div className="rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">可申请档案</h3>
          <button type="button" onClick={() => void loadListings()} className="text-xs font-black text-primary">刷新</button>
        </div>

        {loading ? (
          <div className="frost-card rounded-[2.4rem] p-8 text-center text-sm text-slate-400">正在同步繁育配对数据…</div>
        ) : listings.length === 0 ? (
          <div className="frost-card rounded-[2.4rem] p-8 text-center space-y-3">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-4xl">pet_supplies</span>
            </div>
            <h4 className="text-lg font-black text-slate-900">暂时没有新的配对档案</h4>
            <p className="text-sm leading-relaxed text-slate-500">稍后再刷新看看，或者先去集市发布你自己的繁育资料。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((item) => (
              <motion.article
                key={item.id}
                whileHover={{ y: -4 }}
                className="frost-card overflow-hidden rounded-[2.6rem]"
              >
                <div className="relative h-52">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">{item.ownerName}</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{item.petName}</h3>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black text-white backdrop-blur-md">
                      {item.priceLabel}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap gap-2 text-[10px] font-black">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{item.petType}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{item.petGender}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{item.status}</span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => onChat(item.ownerName)} className="flex-1 rounded-[1.6rem] bg-white/80 py-3 text-sm font-black text-slate-600">
                      私信沟通
                    </button>
                    <button type="button" onClick={() => setSelected(item)} className="flex-1 rounded-[1.6rem] bg-primary py-3 text-sm font-black text-white shadow-lg shadow-primary/20">
                      查看详情
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="glass w-full max-w-md rounded-[2.8rem] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-2xl font-black tracking-tight text-slate-900">繁育申请前建议确认</h3>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                <p>1. 双方是否已经完成疫苗、驱虫和基础健康检查。</p>
                <p>2. 是否提前沟通饲养环境、配对费用和后续照护责任。</p>
                <p>3. 是否尊重对方意愿，先私信沟通再发起正式申请。</p>
              </div>
              <button type="button" onClick={() => setShowGuide(false)} className="mt-6 w-full rounded-[1.6rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20">
                我知道了
              </button>
            </motion.div>
          </motion.div>
        )}

        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[230] flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="glass w-full max-w-md rounded-[2.8rem] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative h-64 overflow-hidden rounded-t-[2.8rem]">
                <img src={selected.image} alt={selected.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <button type="button" aria-label="关闭详情" onClick={() => setSelected(null)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 text-slate-500">
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">{selected.ownerName}</p>
                  <h3 className="mt-2 text-3xl font-black italic tracking-tight text-white">{selected.petName}</h3>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex flex-wrap gap-2 text-[10px] font-black">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{selected.petType}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{selected.petGender}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{selected.priceLabel}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">配对说明</p>
                  <p className="text-sm leading-relaxed text-slate-600">{selected.description}</p>
                </div>

                <div className="rounded-[1.8rem] bg-white/75 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">要求与备注</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{selected.requirements}</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => onChat(selected.ownerName)} className="flex-1 rounded-[1.6rem] bg-white/80 py-4 font-black text-slate-600">
                    先私信
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitRequest()}
                    disabled={submitting || !petId || !selected.ownerId || !selected.petId}
                    className="flex-1 rounded-[1.6rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20 disabled:opacity-60"
                  >
                    {submitting ? '发送中…' : '发送申请'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
