import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    title: item.pet?.name || item.title,
    subtitle: item.pet?.type || item.title,
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
  if (category === 'walk') return '附近遛宠与陪伴服务';
  if (category === 'care') return '专业宠物养护';
  return '精选好物';
}

export default function Market({ onChat, currentUser, userPet }: MarketProps) {
  const [activeCategory, setActiveCategory] = useState('care');
  const [selectedItem, setSelectedItem] = useState<MarketCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketCard[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadCategory = async (category: string) => {
    setLoading(true);
    try {
      let result;
      if (category === 'love') {
        result = await apiService.getBreedingMarket();
      } else if (category === 'walk') {
        result = await apiService.getMarketFeed('walk', 'service', 20);
      } else if (category === 'care') {
        result = await apiService.getMarketFeed('care', undefined, 20);
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

      setItems(nextItems);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategory(activeCategory);
  }, [activeCategory]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) =>
      [item.title, item.subtitle, item.description, item.tags.join(' ')].join(' ').toLowerCase().includes(query),
    );
  }, [items, searchTerm]);

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
      <section className="text-center space-y-2">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary italic">宠物养护</h1>
        <p className="text-slate-500 font-medium tracking-tight">基于真实 Supabase 数据的服务、配对和商品流</p>
      </section>

      <div className="grid grid-cols-4 gap-4">
        {MARKET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-primary text-white shadow-xl scale-110'
                : 'bg-white text-slate-400 border border-slate-100'
            }`}>
              <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
            </div>
            <span className={`text-[10px] font-black tracking-tight ${
              activeCategory === cat.id ? 'text-primary' : 'text-slate-400'
            }`}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">search</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="搜索心仪的宠物、服务或用品..."
          className="w-full pl-12 pr-6 py-4 bg-white border-none rounded-[2rem] shadow-sm focus:ring-2 focus:ring-primary/20 font-medium text-sm"
        />
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{titleByCategory(activeCategory)}</h3>
          <button onClick={() => void loadCategory(activeCategory)} className="text-xs font-bold text-primary">刷新</button>
        </div>

        {loading ? (
          <div className="bg-white rounded-[2.5rem] p-8 text-center text-sm text-slate-400 border border-slate-100">正在同步真实市场数据…</div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-8 text-center text-sm text-slate-400 border border-slate-100">当前分类还没有内容，可以先发布第一条。</div>
        ) : activeCategory === 'love' ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group"
              >
                <div className="relative aspect-square">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} referrerPolicy="no-referrer" />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-black text-primary shadow-sm">
                    {item.priceLabel}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-black text-slate-900 text-base truncate">{item.title}</h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">{item.raw.pet?.gender || '档案'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold truncate">{item.subtitle}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-bold rounded uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="w-full mt-3 py-2.5 bg-primary/5 hover:bg-primary hover:text-white text-primary text-[10px] font-black rounded-xl transition-all active:scale-95"
                  >
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
                whileHover={{ y: -5 }}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex gap-4 p-4 cursor-pointer"
              >
                <div className="w-28 h-28 rounded-[2rem] overflow-hidden bg-slate-50 flex-shrink-0">
                  <img src={item.image} className="w-full h-full object-cover" alt={item.title} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{item.title}</h4>
                      <span className="text-primary font-black text-sm whitespace-nowrap">{item.priceLabel}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.subtitle}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-1 rounded-full bg-slate-50 text-[9px] text-slate-500 font-bold">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onChat(item.owner);
                      }}
                      className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"
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
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="overflow-y-auto no-scrollbar">
                <div className="relative h-64">
                  <img src={selectedItem.image} className="w-full h-full object-cover" alt={selectedItem.title} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-8 right-8">
                    <h3 className="text-3xl font-black text-slate-900 italic tracking-tight">{selectedItem.title}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full">{selectedItem.priceLabel}</span>
                      {selectedItem.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 pt-0 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm overflow-hidden">
                      <img src={selectedItem.owner.avatar} className="w-full h-full object-cover rounded-2xl" alt={selectedItem.owner.name} referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">发布者</p>
                      <p className="text-sm font-black text-slate-900">{selectedItem.owner.name}</p>
                    </div>
                    <button
                      onClick={() => onChat(selectedItem.owner)}
                      className="ml-auto w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">详细介绍</h4>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">{selectedItem.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4 bg-white border-t border-slate-50 flex gap-3">
                <button
                  onClick={() => onChat(selectedItem.owner)}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black"
                >
                  私信咨询
                </button>
                <button
                  onClick={() => {
                    if (selectedItem.kind === 'breeding') {
                      void submitBreedingRequest();
                    } else if (currentUser) {
                      onChat(selectedItem.owner);
                    }
                  }}
                  disabled={submitting}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {selectedItem.kind === 'breeding' ? '发送申请' : '立即联系'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
