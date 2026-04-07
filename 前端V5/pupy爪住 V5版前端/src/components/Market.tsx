import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MARKET_CATEGORIES } from '../constants';
import type { ApiMarketProduct, ApiUser } from '../services/api';
import apiService from '../services/api';
import type { Owner, Pet } from '../types';
import { createOwnerFromApi } from '../utils/adapters';

interface MarketProps {
  onChat: (owner: Owner) => void;
  currentUser: ApiUser | null;
  userPet: Pet;
}

type MarketCard = {
  id: string;
  kind: 'breeding' | 'service' | 'product';
  title: string;
  subtitle: string;
  image: string;
  priceLabel: string;
  description: string;
  tags: string[];
  owner: Owner;
  ownerId?: string;
  petId?: string | null;
  raw: ApiMarketProduct;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=800';

function toMarketCard(item: ApiMarketProduct): MarketCard {
  const owner = createOwnerFromApi(item.seller || {});
  const image = item.images?.[0] || item.pet?.images?.[0] || FALLBACK_IMAGE;
  const tags = [item.category, item.type, item.pet?.type].filter((value): value is string => Boolean(value));

  return {
    id: item.id,
    kind: item.type === 'breeding' ? 'breeding' : item.type === 'service' ? 'service' : 'product',
    title: item.title,
    subtitle: item.pet?.name ? `${item.pet.name} · ${item.pet.type || item.pet.breed || '宠物档案'}` : item.category || '市场发布',
    image,
    priceLabel: item.price ? `¥${item.price}` : '私聊报价',
    description: item.description || item.requirements || '暂无更多描述',
    tags,
    owner,
    ownerId: item.seller?.id,
    petId: item.pet?.id || item.pet_id,
    raw: item,
  };
}

function titleByCategory(category: string) {
  if (category === 'love') return '真实配对档案';
  if (category === 'walk') return '同城服务与陪伴';
  if (category === 'care') return '护理与养护推荐';
  return '全站精选好物';
}

function toneByKind(kind: MarketCard['kind']) {
  if (kind === 'breeding') return 'bg-rose-50 text-rose-600';
  if (kind === 'service') return 'bg-sky-50 text-sky-600';
  return 'bg-emerald-50 text-emerald-600';
}

function createLocalMarketCards(userPet: Pet): MarketCard[] {
  const owner = userPet.owner;
  const image = userPet.images?.[0] || FALLBACK_IMAGE;
  const products = [
    {
      id: 'local-breeding-1',
      kind: 'breeding' as const,
      title: `${userPet.type} 同城配对资料审核`,
      subtitle: `${userPet.name} · ${userPet.type}`,
      priceLabel: '资料互验',
      description: '适合测试繁育/配对咨询流程，包含健康记录、性格匹配和线下见面前沟通。',
      tags: ['配对繁育', userPet.type, userPet.personality],
      type: 'breeding' as const,
      category: 'love',
    },
    {
      id: 'local-service-1',
      kind: 'service' as const,
      title: `${userPet.name} 同款城市遛宠陪伴`,
      subtitle: '同城服务 · 2 小时',
      priceLabel: '¥99 起',
      description: '用于测试同城服务卡片、私信咨询和服务型发布排版。',
      tags: ['同城陪伴', '遛宠', '训练'],
      type: 'service' as const,
      category: 'walk',
    },
    {
      id: 'local-care-1',
      kind: 'product' as const,
      title: '毛发护理与日常清洁套装',
      subtitle: '护理养护 · 新用户推荐',
      priceLabel: '¥128',
      description: '用于测试护理分类、详情弹窗和商品型发布样式。',
      tags: ['护理养护', '清洁', '毛发'],
      type: 'care_product' as const,
      category: 'care',
    },
    {
      id: 'local-food-1',
      kind: 'product' as const,
      title: '高蛋白主粮与耐咬玩具组合',
      subtitle: '主粮用品 · 测试商品',
      priceLabel: '¥219',
      description: '用于测试主粮用品分类和商品列表的长标题排版。',
      tags: ['主粮用品', '主粮', '玩具'],
      type: 'food' as const,
      category: 'supermarket',
    },
  ];

  return products.map((item) => ({
    ...item,
    image,
    owner,
    ownerId: undefined,
    petId: userPet.id,
    raw: {
      id: item.id,
      seller_id: 'local-demo-seller',
      pet_id: userPet.id,
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.priceLabel.startsWith('¥') ? Number(item.priceLabel.replace(/[^\d]/g, '')) : null,
      images: [image],
      status: 'active',
      type: item.type,
    },
  }));
}

function filterLocalMarketCards(category: string, userPet: Pet) {
  const localCards = createLocalMarketCards(userPet);
  if (category === 'all') return localCards;
  return localCards.filter((item) => {
    if (category === 'supermarket') return item.raw.type === 'food' || item.raw.type === 'toy' || item.raw.type === 'care_product';
    return item.raw.category === category;
  });
}

export default function Market({ onChat, currentUser, userPet }: MarketProps) {
  const [activeCategory, setActiveCategory] = useState('care');
  const [selectedItem, setSelectedItem] = useState<MarketCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketCard[]>([]);
  const [myListings, setMyListings] = useState<MarketCard[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadCategory = async (category: string) => {
    setLoading(true);
    try {
      let result;
      if (searchTerm.trim()) {
        result = await apiService.searchMarket(searchTerm.trim(), 1, 24);
      } else if (category === 'love') {
        result = await apiService.getBreedingMarket();
      } else if (category === 'walk') {
        result = await apiService.getMarketFeed(undefined, 'service', 24);
      } else if (category === 'care') {
        result = await apiService.getMarketFeed(undefined, 'care_product', 24);
      } else {
        result = await apiService.getMarketFeed(undefined, undefined, 24);
      }

      const nextItems = (result.data || [])
        .filter((item) => {
          if (category === 'supermarket') {
            return item.type === 'food' || item.type === 'toy' || item.type === 'care_product';
          }
          return true;
        })
        .map(toMarketCard);

      setItems(nextItems.length ? nextItems : filterLocalMarketCards(category, userPet));
    } catch {
      setItems(filterLocalMarketCards(category, userPet));
    } finally {
      setLoading(false);
    }
  };

  const loadMyListings = async () => {
    if (!currentUser?.id) {
      setMyListings([]);
      return;
    }

    try {
      const result = await apiService.getSellerProducts(currentUser.id);
      setMyListings((result.data || []).map(toMarketCard));
    } catch {
      setMyListings([]);
    }
  };

  useEffect(() => {
    void loadCategory(activeCategory);
  }, [activeCategory, searchTerm, userPet.id]);

  useEffect(() => {
    void loadMyListings();
  }, [currentUser?.id]);

  const filteredItems = useMemo(() => items, [items]);

  const submitBreedingRequest = async () => {
    if (!selectedItem || !selectedItem.ownerId || !selectedItem.petId || submitting) return;
    setSubmitting(true);
    try {
      await apiService.createBreedingRequest(selectedItem.ownerId, userPet.id, selectedItem.petId, '来自市场页的匹配申请');
      setSelectedItem(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-6 space-y-8 pb-10">
      <section className="glass ambient-card overflow-hidden rounded-[3rem] border border-white/50 px-6 py-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/70">爪住集市</p>
            <h1 className="font-headline text-4xl font-black italic tracking-tight text-slate-900">配对、服务与好物</h1>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              爪住集市统一承接真实市场数据、同城服务与繁育申请。你可以筛选、搜索、查看自己的发布，也可以直接发起咨询。
            </p>
          </div>
          <div className="soft-panel rounded-[2rem] border border-white/50 px-4 py-4 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">当前身份</p>
            <p className="mt-2 text-sm font-black text-slate-900">{currentUser?.username || userPet.owner.name}</p>
            <p className="mt-1 text-xs text-slate-400">{userPet.name} · {userPet.type}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass ambient-card rounded-[2rem] border border-white/50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">当前结果</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{filteredItems.length}</p>
        </div>
        <div className="glass ambient-card rounded-[2rem] border border-white/50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">我的发布</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{myListings.length}</p>
        </div>
        <div className="glass ambient-card rounded-[2rem] border border-white/50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">当前分区</p>
          <p className="mt-2 text-sm font-black leading-relaxed text-slate-900">{titleByCategory(activeCategory)}</p>
        </div>
      </div>

      <section className="glass ambient-card rounded-[2.6rem] border border-white/50 p-4 shadow-sm">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {MARKET_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-3 rounded-[1.8rem] px-4 py-3 transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/75 text-slate-500'}`}
              >
                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                <span className="text-xs font-black tracking-wide">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">search</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="搜索服务、配对、主粮、玩具或发布者..."
          className="w-full rounded-[2rem] border border-white/50 bg-white/80 py-4 pl-12 pr-6 text-sm font-medium text-slate-700 shadow-sm outline-none placeholder:text-slate-300 focus:border-primary/30"
        />
      </div>

      {myListings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">我的真实发布</h3>
            <span className="text-[10px] font-bold text-slate-400">最近 3 条</span>
          </div>
          <div className="space-y-3">
            {myListings.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="glass ambient-card flex w-full items-center gap-4 rounded-[2.2rem] border border-white/50 p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
              >
                <img src={item.image} className="h-14 w-14 rounded-2xl object-cover" alt={item.title} referrerPolicy="no-referrer" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.description}</p>
                </div>
                <span className="whitespace-nowrap text-xs font-black text-primary">{item.priceLabel}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{titleByCategory(activeCategory)}</h3>
            <p className="mt-1 text-xs text-slate-400">真实市场数据与当前分区结果会同步显示在这里。</p>
          </div>
          <button type="button" onClick={() => void loadCategory(activeCategory)} className="rounded-full bg-white/75 px-4 py-2 text-xs font-black text-primary shadow-sm">
            刷新
          </button>
        </div>

        {loading ? (
          <div className="glass ambient-card rounded-[2.6rem] border border-white/50 p-8 text-center text-sm text-slate-400 shadow-sm">正在同步真实市场数据…</div>
        ) : filteredItems.length === 0 ? (
          <div className="glass ambient-card rounded-[2.6rem] border border-white/50 p-8 text-center text-sm text-slate-400 shadow-sm">当前筛选下还没有内容，可以先换个分类看看。</div>
        ) : activeCategory === 'love' ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <motion.div key={item.id} whileHover={{ y: -4 }} className="group glass ambient-card overflow-hidden rounded-[2.6rem] border border-white/50 shadow-sm">
                <div className="relative aspect-square">
                  <img src={item.image} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-primary shadow-sm">
                    {item.priceLabel}
                  </div>
                  <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-black ${toneByKind(item.kind)}`}>
                    {item.kind === 'breeding' ? '繁育' : item.kind === 'service' ? '服务' : '商品'}
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="space-y-1">
                    <h4 className="line-clamp-2 text-sm font-black text-slate-900">{item.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{item.subtitle}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-white/75 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => setSelectedItem(item)} className="w-full rounded-[1.2rem] bg-primary/6 py-3 text-[11px] font-black text-primary transition-all active:scale-95 hover:bg-primary hover:text-white">
                    查看详情
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedItem(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedItem(item);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={item.title}
                className="glass ambient-card flex w-full gap-4 rounded-[2.7rem] border border-white/50 p-4 text-left shadow-sm"
              >
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-[2rem] bg-slate-50">
                  <img src={item.image} className="h-full w-full object-cover" alt={item.title} referrerPolicy="no-referrer" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="line-clamp-2 text-sm font-black text-slate-900">{item.title}</h4>
                      <span className="whitespace-nowrap text-sm font-black text-primary">{item.priceLabel}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">{item.subtitle}</p>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-white/75 px-2 py-1 text-[9px] font-bold text-slate-500">{tag}</span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onChat(item.owner);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            key="market-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="glass ambient-card relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[3rem] border border-white/50 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-400 shadow-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="overflow-y-auto no-scrollbar">
                <div className="relative h-64">
                  <img src={selectedItem.image} className="h-full w-full object-cover" alt={selectedItem.title} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-8 right-8">
                    <h3 className="text-3xl font-black italic tracking-tight text-slate-900">{selectedItem.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black text-white">{selectedItem.priceLabel}</span>
                      {selectedItem.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-black text-slate-500">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-8 pt-0">
                  <div className="soft-panel flex items-center gap-4 rounded-[2rem] border border-white/50 p-5">
                    <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white shadow-sm">
                      <img src={selectedItem.owner.avatar} className="h-full w-full rounded-2xl object-cover" alt={selectedItem.owner.name} referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">发布者</p>
                      <p className="truncate text-sm font-black text-slate-900">{selectedItem.owner.name}</p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">{selectedItem.owner.signature}</p>
                    </div>
                    <button type="button" onClick={() => onChat(selectedItem.owner)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">详细介绍</h4>
                    <p className="text-sm font-medium leading-relaxed text-slate-600">{selectedItem.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-[2rem] bg-white/70 p-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">宠物信息</p>
                      <p className="mt-2 text-sm font-black text-slate-900">{selectedItem.subtitle}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">状态</p>
                      <p className="mt-2 text-sm font-black text-slate-900">{selectedItem.raw.status || 'active'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-white/40 bg-white/60 p-8 pt-4">
                <button type="button" onClick={() => onChat(selectedItem.owner)} className="flex-1 rounded-[2rem] bg-slate-100 py-4 font-black text-slate-700">
                  私信咨询
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem.kind === 'breeding') {
                      void submitBreedingRequest();
                    } else if (currentUser) {
                      onChat(selectedItem.owner);
                    }
                  }}
                  disabled={submitting}
                  className="flex-1 rounded-[2rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {selectedItem.kind === 'breeding' ? (submitting ? '提交中…' : '发送申请') : '立即联系'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
