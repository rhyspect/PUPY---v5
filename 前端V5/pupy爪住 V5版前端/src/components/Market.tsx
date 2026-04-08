import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MARKET_CATEGORIES } from '../constants';
import type { ApiMarketProduct, ApiUser } from '../services/api';
import apiService from '../services/api';
import type { Owner, Pet } from '../types';
import { createOwnerFromApi } from '../utils/adapters';
import BrandMark from './BrandMark';
import {
  addMarketCartItem,
  createMarketOrder,
  formatAssetPrice,
  loadMarketCart,
  loadMarketOrders,
  removeMarketCartItem,
  saveMarketCart,
  upsertMarketCartItem,
  type MarketCartItem,
  type MarketOrder,
} from '../utils/marketAssets';

interface MarketProps {
  onChat: (owner: Owner) => void;
  currentUser: ApiUser | null;
  userPet: Pet;
}

type MarketKind = 'breeding' | 'service' | 'care' | 'product';

type MarketCard = {
  id: string;
  kind: MarketKind;
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

type ActionFeedback = {
  tone: 'success' | 'warning' | 'error';
  title: string;
  body: string;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=800';
const APPOINTMENT_SLOTS = ['今天 16:00', '明天 10:30', '周五 18:30', '周末 14:00'];

function getMarketKind(item: ApiMarketProduct): MarketKind {
  if (item.type === 'breeding') return 'breeding';
  if (item.type === 'service') return 'service';
  if (item.type === 'care_product') return 'care';
  return 'product';
}

function toMarketCard(item: ApiMarketProduct): MarketCard {
  const owner = createOwnerFromApi(item.seller || {});
  const image = item.images?.[0] || item.pet?.images?.[0] || FALLBACK_IMAGE;
  const tags = [item.category, item.type, item.pet?.type].filter((value): value is string => Boolean(value));

  return {
    id: item.id,
    kind: getMarketKind(item),
    title: item.title,
    subtitle: item.pet?.name ? `${item.pet.name} · ${item.pet.type || item.pet.breed || '宠物档案'}` : item.category || '市场发布',
    image,
    priceLabel: item.price ? `¥${item.price}` : '到店确认',
    description: item.description || item.requirements || '暂无更多描述',
    tags,
    owner,
    ownerId: item.seller?.id,
    petId: item.pet?.id || item.pet_id,
    raw: item,
  };
}

function titleByCategory(category: string) {
  if (category === 'love') return '配对繁育咨询';
  if (category === 'walk') return '同城陪伴服务';
  if (category === 'care') return '护理养护预约';
  return '主粮用品购物';
}

function descriptionByCategory(category: string) {
  if (category === 'love') return '先私讯沟通健康资料，再发送正式繁育申请。';
  if (category === 'walk') return '可先联系服务者确认时间、范围和宠物状态。';
  if (category === 'care') return '这里是预约商家页，重点是选择护理项目和到店时间。';
  return '这里是购物页，重点是选购数量、加入购物车和完成结算。';
}

function toneByKind(kind: MarketKind) {
  if (kind === 'breeding') return 'bg-rose-50 text-rose-600';
  if (kind === 'service') return 'bg-sky-50 text-sky-600';
  if (kind === 'care') return 'bg-amber-50 text-amber-600';
  return 'bg-emerald-50 text-emerald-600';
}

function labelByKind(kind: MarketKind) {
  if (kind === 'breeding') return '繁育';
  if (kind === 'service') return '服务';
  if (kind === 'care') return '预约';
  return '商品';
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
      price: null,
    },
    {
      id: 'local-service-1',
      kind: 'service' as const,
      title: `${userPet.name} 同款城市遛宠陪伴`,
      subtitle: '同城服务 · 2 小时',
      priceLabel: '¥99 起',
      description: '用于测试同城服务卡片、服务者联系和服务型发布排版。',
      tags: ['同城陪伴', '遛宠', '训练'],
      type: 'service' as const,
      category: 'walk',
      price: 99,
    },
    {
      id: 'local-care-1',
      kind: 'care' as const,
      title: '毛发护理与日常清洁预约',
      subtitle: '护理养护 · 商家预约',
      priceLabel: '¥128 起',
      description: '用于测试护理养护预约流程，用户选择到店时间后会进入会员资产的预约记录。',
      tags: ['护理养护', '清洁', '预约'],
      type: 'care_product' as const,
      category: 'care',
      price: 128,
    },
    {
      id: 'local-food-1',
      kind: 'product' as const,
      title: '高蛋白主粮与耐咬玩具组合',
      subtitle: '主粮用品 · 购物商品',
      priceLabel: '¥219',
      description: '用于测试主粮用品购物流程，支持选购数量、加入购物车和结算。',
      tags: ['主粮用品', '主粮', '玩具'],
      type: 'food' as const,
      category: 'supermarket',
      price: 219,
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
      price: item.price,
      images: [image],
      status: 'active',
      type: item.type,
    },
  }));
}

function matchesCategory(item: ApiMarketProduct, category: string) {
  if (category === 'love') return item.type === 'breeding' || item.category === 'love';
  if (category === 'walk') return item.type === 'service' || item.category === 'walk';
  if (category === 'care') return item.type === 'care_product' || item.category === 'care';
  return item.type === 'food' || item.type === 'toy' || item.category === 'supermarket';
}

function filterLocalMarketCards(category: string, userPet: Pet) {
  return createLocalMarketCards(userPet).filter((item) => matchesCategory(item.raw, category));
}

function getItemPrice(item: MarketCard) {
  if (typeof item.raw.price === 'number' && Number.isFinite(item.raw.price)) return item.raw.price;
  const parsed = Number(item.priceLabel.match(/\d+/)?.[0] || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function Market({ onChat, currentUser, userPet }: MarketProps) {
  const [activeCategory, setActiveCategory] = useState('care');
  const [selectedItem, setSelectedItem] = useState<MarketCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketCard[]>([]);
  const [myListings, setMyListings] = useState<MarketCard[]>([]);
  const [cartItems, setCartItems] = useState<MarketCartItem[]>(() => loadMarketCart());
  const [orders, setOrders] = useState<MarketOrder[]>(() => loadMarketOrders());
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(APPOINTMENT_SLOTS[0]);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

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
        .filter((item) => matchesCategory(item, category))
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

  const refreshAssets = () => {
    setCartItems(loadMarketCart());
    setOrders(loadMarketOrders());
  };

  useEffect(() => {
    void loadCategory(activeCategory);
  }, [activeCategory, searchTerm, userPet.id]);

  useEffect(() => {
    void loadMyListings();
  }, [currentUser?.id]);

  useEffect(() => {
    refreshAssets();
    window.addEventListener('storage', refreshAssets);
    window.addEventListener('pupy-market-assets-updated', refreshAssets);
    return () => {
      window.removeEventListener('storage', refreshAssets);
      window.removeEventListener('pupy-market-assets-updated', refreshAssets);
    };
  }, []);

  useEffect(() => {
    setSelectedQuantity(1);
    setSelectedSlot(APPOINTMENT_SLOTS[0]);
    setActionFeedback(null);
  }, [selectedItem?.id]);

  const filteredItems = useMemo(() => items, [items]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const selectedPrice = selectedItem ? getItemPrice(selectedItem) : 0;
  const selectedTotal = selectedPrice * selectedQuantity;

  const showFeedback = (feedback: ActionFeedback) => {
    setActionFeedback(feedback);
  };

  const buildCartItem = (item: MarketCard, quantity: number): MarketCartItem => ({
    productId: item.id,
    title: item.title,
    image: item.image,
    unitPrice: getItemPrice(item),
    quantity,
    sellerName: item.owner.name,
    category: item.raw.category,
    type: item.raw.type,
    addedAt: new Date().toISOString(),
  });

  const handleAddToCart = (item: MarketCard, quantity = selectedQuantity) => {
    const nextCart = addMarketCartItem(buildCartItem(item, quantity));
    setCartItems(nextCart);
    showFeedback({
      tone: 'success',
      title: '已加入购物车',
      body: `${item.title} × ${quantity} 已进入会员资产，可继续选购或结算。`,
    });
  };

  const handleCheckoutSelected = (item: MarketCard) => {
    const order = createMarketOrder({
      kind: 'shopping',
      title: item.title,
      image: item.image,
      sellerName: item.owner.name,
      status: '已结算',
      total: selectedTotal,
      quantity: selectedQuantity,
      note: '主粮用品直接购买',
      items: [{
        productId: item.id,
        title: item.title,
        image: item.image,
        unitPrice: selectedPrice,
        quantity: selectedQuantity,
      }],
    });
    setOrders(loadMarketOrders());
    showFeedback({
      tone: 'success',
      title: '结算完成',
      body: `${order.title} 已生成订单，可在个人空间的会员资产中查看。`,
    });
  };

  const handleCheckoutCart = () => {
    if (!cartItems.length) return;
    const order = createMarketOrder({
      kind: 'shopping',
      title: `购物车结算 ${cartItems.length} 款商品`,
      image: cartItems[0].image,
      sellerName: '爪住集市',
      status: '已结算',
      total: cartTotal,
      quantity: cartCount,
      note: '购物车合并结算',
      items: cartItems.map((item) => ({
        productId: item.productId,
        title: item.title,
        image: item.image,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    });
    saveMarketCart([]);
    setCartItems([]);
    setOrders(loadMarketOrders());
    showFeedback({
      tone: 'success',
      title: '购物车已结算',
      body: `${order.quantity} 件商品已生成订单，可在会员资产中查看订单记录。`,
    });
  };

  const handleBookCare = (item: MarketCard) => {
    const order = createMarketOrder({
      kind: 'booking',
      title: item.title,
      image: item.image,
      sellerName: item.owner.name,
      status: '待商家确认',
      total: getItemPrice(item),
      quantity: 1,
      appointmentSlot: selectedSlot,
      note: `${userPet.name} 的护理养护预约`,
      items: [{
        productId: item.id,
        title: item.title,
        image: item.image,
        unitPrice: getItemPrice(item),
        quantity: 1,
      }],
    });
    setOrders(loadMarketOrders());
    showFeedback({
      tone: 'success',
      title: '预约已提交',
      body: `${order.appointmentSlot} 的护理预约已进入会员资产，等待商家确认。`,
    });
  };

  const submitBreedingRequest = async () => {
    if (!selectedItem || submitting) return;
    if (!selectedItem.ownerId || !selectedItem.petId || !userPet.id) {
      showFeedback({
        tone: 'warning',
        title: '资料暂不完整',
        body: '这条档案缺少真实主人或宠物 ID，请先用私讯咨询建立沟通。',
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createBreedingRequest(selectedItem.ownerId, userPet.id, selectedItem.petId, '来自爪住集市的繁育申请');
      showFeedback({
        tone: 'success',
        title: '繁育申请已发送',
        body: '申请已经进入对方待处理列表，你也可以继续通过私讯沟通健康记录和见面时间。',
      });
    } catch (error) {
      showFeedback({
        tone: 'error',
        title: '申请发送失败',
        body: error instanceof Error ? error.message : '当前网络或后端暂不可用，请稍后重试。',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const feedbackToneClass = actionFeedback?.tone === 'error'
    ? 'border-red-100 bg-red-50 text-red-600'
    : actionFeedback?.tone === 'warning'
      ? 'border-amber-100 bg-amber-50 text-amber-700'
      : 'border-emerald-100 bg-emerald-50 text-emerald-700';

  return (
    <div className="px-6 space-y-8 pb-10">
      <section className="brand-surface brand-aura ambient-card overflow-hidden rounded-[3rem] px-6 py-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/70">爪住集市</p>
            <h1 className="font-headline text-4xl font-black italic tracking-tight text-slate-900">预约、繁育与购物</h1>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              护理养护用于预约商家，配对繁育用于私讯和申请，主粮用品用于加购、结算与订单记录。
            </p>
          </div>
          <div className="shrink-0">
            <BrandMark mode="icon" size="lg" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass ambient-card rounded-[2rem] border border-white/50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">当前结果</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{filteredItems.length}</p>
        </div>
        <div className="glass ambient-card rounded-[2rem] border border-white/50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">购物车</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{cartCount}</p>
        </div>
        <div className="glass ambient-card rounded-[2rem] border border-white/50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">订单记录</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{orders.length}</p>
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
          placeholder="搜索预约商家、配对档案、主粮或玩具..."
          className="w-full rounded-[2rem] border border-white/50 bg-white/80 py-4 pl-12 pr-6 text-sm font-medium text-slate-700 shadow-sm outline-none placeholder:text-slate-300 focus:border-primary/30"
        />
      </div>

      {actionFeedback && (
        <div className={`rounded-[2rem] border px-5 py-4 text-sm font-semibold leading-relaxed ${feedbackToneClass}`} role="status">
          <p className="font-black">{actionFeedback.title}</p>
          <p className="mt-1">{actionFeedback.body}</p>
        </div>
      )}

      {activeCategory === 'supermarket' && cartItems.length > 0 && (
        <section className="glass ambient-card space-y-4 rounded-[2.8rem] border border-white/50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">购物车待结算</h3>
              <p className="mt-1 text-xs text-slate-400">加购商品会同步到个人空间的会员资产。</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{formatAssetPrice(cartTotal)}</span>
          </div>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 rounded-[2rem] bg-white/70 p-3">
                <img src={item.image} alt={item.title} className="h-14 w-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatAssetPrice(item.unitPrice)} · {item.sellerName}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
                  <button type="button" onClick={() => setCartItems(upsertMarketCartItem(item.productId, item.quantity - 1))} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400" aria-label="减少数量">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="w-5 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                  <button type="button" onClick={() => setCartItems(upsertMarketCartItem(item.productId, item.quantity + 1))} className="flex h-7 w-7 items-center justify-center rounded-full text-primary" aria-label="增加数量">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <button type="button" onClick={() => setCartItems(removeMarketCartItem(item.productId))} className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-400" aria-label="移出购物车">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleCheckoutCart} className="w-full rounded-[2rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20">
            结算购物车 · {formatAssetPrice(cartTotal)}
          </button>
        </section>
      )}

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
            <p className="mt-1 text-xs text-slate-400">{descriptionByCategory(activeCategory)}</p>
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
                    {labelByKind(item.kind)}
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
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => onChat(item.owner)} className="rounded-[1.2rem] bg-white/75 py-3 text-[11px] font-black text-slate-600 transition-all active:scale-95">
                      私讯咨询
                    </button>
                    <button type="button" onClick={() => setSelectedItem(item)} className="rounded-[1.2rem] bg-primary/10 py-3 text-[11px] font-black text-primary transition-all active:scale-95 hover:bg-primary hover:text-white">
                      申请详情
                    </button>
                  </div>
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
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-white/75 px-2 py-1 text-[9px] font-bold text-slate-500">{tag}</span>
                      ))}
                    </div>
                    {activeCategory === 'supermarket' ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAddToCart(item, 1);
                        }}
                        className="rounded-2xl bg-primary px-4 py-3 text-[11px] font-black text-white shadow-lg shadow-primary/20"
                      >
                        加购物车
                      </button>
                    ) : activeCategory === 'care' ? (
                      <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedItem(item); }} className="rounded-2xl bg-amber-50 px-4 py-3 text-[11px] font-black text-amber-600">
                        预约商家
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onChat(item.owner);
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                        aria-label="联系服务者"
                      >
                        <span className="material-symbols-outlined text-lg">chat</span>
                      </button>
                    )}
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
                aria-label="关闭详情"
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
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{selectedItem.kind === 'care' ? '预约商家' : selectedItem.kind === 'product' ? '商品商家' : '发布者'}</p>
                      <p className="truncate text-sm font-black text-slate-900">{selectedItem.owner.name}</p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">{selectedItem.owner.signature}</p>
                    </div>
                    {selectedItem.kind !== 'care' && (
                      <button type="button" onClick={() => onChat(selectedItem.owner)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-label="私讯咨询">
                        <span className="material-symbols-outlined text-lg">chat</span>
                      </button>
                    )}
                  </div>

                  {actionFeedback && (
                    <div className={`rounded-[1.8rem] border px-5 py-4 text-sm font-semibold leading-relaxed ${feedbackToneClass}`} role="status">
                      <p className="font-black">{actionFeedback.title}</p>
                      <p className="mt-1">{actionFeedback.body}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">详细介绍</h4>
                    <p className="text-sm font-medium leading-relaxed text-slate-600">{selectedItem.description}</p>
                  </div>

                  {selectedItem.kind === 'care' && (
                    <div className="space-y-4 rounded-[2rem] bg-amber-50/70 p-5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">选择预约时间</p>
                        <p className="mt-1 text-xs font-semibold text-amber-700">预约提交后会进入个人空间的会员资产。</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {APPOINTMENT_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-[1.4rem] px-3 py-3 text-xs font-black transition-all ${selectedSlot === slot ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white/80 text-amber-700'}`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.kind === 'product' && (
                    <div className="space-y-4 rounded-[2rem] bg-emerald-50/70 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">选购数量</p>
                          <p className="mt-1 text-xs font-semibold text-emerald-700">结算后会生成订单记录。</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-emerald-700">{formatAssetPrice(selectedTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-[1.8rem] bg-white/80 px-4 py-3">
                        <button type="button" onClick={() => setSelectedQuantity((value) => Math.max(1, value - 1))} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500" aria-label="减少选购数量">
                          <span className="material-symbols-outlined">remove</span>
                        </button>
                        <span className="text-2xl font-black text-slate-900">{selectedQuantity}</span>
                        <button type="button" onClick={() => setSelectedQuantity((value) => value + 1)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white" aria-label="增加选购数量">
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>
                    </div>
                  )}

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

              <div className="grid grid-cols-2 gap-3 border-t border-white/40 bg-white/60 p-8 pt-4">
                {selectedItem.kind === 'breeding' ? (
                  <>
                    <button type="button" onClick={() => onChat(selectedItem.owner)} className="rounded-[2rem] bg-slate-100 py-4 font-black text-slate-700">
                      私讯咨询
                    </button>
                    <button type="button" onClick={() => void submitBreedingRequest()} disabled={submitting} className="rounded-[2rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20 disabled:opacity-60">
                      {submitting ? '提交中…' : '发送申请'}
                    </button>
                  </>
                ) : selectedItem.kind === 'care' ? (
                  <>
                    <button type="button" onClick={() => onChat(selectedItem.owner)} className="rounded-[2rem] bg-slate-100 py-4 font-black text-slate-700">
                      联系客服
                    </button>
                    <button type="button" onClick={() => handleBookCare(selectedItem)} className="rounded-[2rem] bg-amber-500 py-4 font-black text-white shadow-lg shadow-amber-200">
                      确认预约
                    </button>
                  </>
                ) : selectedItem.kind === 'product' ? (
                  <>
                    <button type="button" onClick={() => handleAddToCart(selectedItem)} className="rounded-[2rem] bg-slate-100 py-4 font-black text-slate-700">
                      加入购物车
                    </button>
                    <button type="button" onClick={() => handleCheckoutSelected(selectedItem)} className="rounded-[2rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20">
                      立即结算
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => onChat(selectedItem.owner)} className="rounded-[2rem] bg-slate-100 py-4 font-black text-slate-700">
                      私讯咨询
                    </button>
                    <button type="button" onClick={() => onChat(selectedItem.owner)} className="rounded-[2rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20">
                      确认服务
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
