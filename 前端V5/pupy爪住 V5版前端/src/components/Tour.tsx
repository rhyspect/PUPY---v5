import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PETS, REALMS } from '../constants';
import type { Pet } from '../types';

const CLOUD_LOADING_COPY = [
  '正在帮[狗狗名字]穿上云端漫步靴...',
  '[狗狗名字]正兴奋地跑向云端森林...',
  '正在同步[狗狗名字]的社交嗅觉...',
  '嗅到了！附近有 12 只熟悉的小伙伴...',
];

export default function Tour({ onSelectRealm, userPet }: { onSelectRealm: () => void; userPet?: Pet }) {
  const [view, setView] = useState<'map' | 'realms' | 'courtyards'>('map');
  const [showModal, setShowModal] = useState<'create' | 'join' | null>(null);
  const [modalData, setModalData] = useState({ name: '', id: '', password: '' });
  const [cloudEntry, setCloudEntry] = useState<{ phrase: string; target: string } | null>(null);
  const phraseTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const [courtyards, setCourtyards] = useState([
    {
      id: '1024',
      name: '金毛散步俱乐部',
      members: 156,
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400',
      description: '适合同城约散步、分享训犬经验和周末外出计划。',
    },
    {
      id: '2048',
      name: '柴犬表情研究所',
      members: 89,
      image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400',
      description: '晒图、吐槽、交流性格和社交训练技巧。',
    },
    {
      id: '3072',
      name: '上海遛狗小分队',
      members: 234,
      image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=400',
      description: '偏同城关系建立，适合周末线下见面和轻社交。',
    },
  ]);

  const handleJoin = () => {
    if (!modalData.id.trim() || !modalData.password.trim()) return;
    setShowModal(null);
    setModalData({ name: '', id: '', password: '' });
  };

  const handleCreate = () => {
    if (!modalData.name.trim() || !modalData.password.trim()) return;
    const newId = Math.floor(1000 + Math.random() * 9000).toString();
    setCourtyards((prev) => [
      {
        id: newId,
        name: modalData.name.trim(),
        members: 1,
        image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=400',
        description: '这是一个刚创建的小院，适合邀请熟悉的养宠人一起交流。',
      },
      ...prev,
    ]);
    setShowModal(null);
    setModalData({ name: '', id: '', password: '' });
  };

  const petName = userPet?.name || '小狗狗';

  const clearCloudTimers = () => {
    if (phraseTimerRef.current) {
      window.clearInterval(phraseTimerRef.current);
      phraseTimerRef.current = null;
    }
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  };

  useEffect(() => clearCloudTimers, []);

  const randomCloudCopy = () =>
    CLOUD_LOADING_COPY[Math.floor(Math.random() * CLOUD_LOADING_COPY.length)].replace('[狗狗名字]', petName);

  const startCloudEntry = (target: string) => {
    if (cloudEntry) return;
    clearCloudTimers();
    setCloudEntry({ phrase: randomCloudCopy(), target });
    phraseTimerRef.current = window.setInterval(() => {
      setCloudEntry((current) => (current ? { ...current, phrase: randomCloudCopy() } : current));
    }, 720);
    finishTimerRef.current = window.setTimeout(() => {
      clearCloudTimers();
      setCloudEntry(null);
      onSelectRealm();
    }, 3000);
  };

  return (
    <div className="px-6 space-y-8 pb-10">
      <section className="text-center space-y-2">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary italic">云游空间</h1>
        <p className="text-slate-500 font-medium tracking-tight">把地图、主题空间和小院社群做成更沉浸的轻社交入口</p>
      </section>

      <div className="mx-auto flex max-w-[320px] justify-center rounded-[2rem] bg-slate-100 p-1">
        {[
          { key: 'map', label: '云端地图' },
          { key: 'realms', label: '主题空间' },
          { key: 'courtyards', label: '小院社群' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key as 'map' | 'realms' | 'courtyards')}
            className={`flex-1 rounded-[1.8rem] py-3 text-[10px] font-black transition-all ${view === item.key ? 'bg-white text-primary shadow-lg' : 'text-slate-400'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative aspect-square overflow-hidden rounded-[3rem] border-4 border-white bg-emerald-50 shadow-2xl"
          >
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-emerald-200 blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-emerald-300 blur-3xl" />
              <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full border-[20px] border-emerald-100" />
            </div>

            {PETS.map((pet, index) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  x: [0, 10, -10, 0][index % 4],
                  y: [0, -10, 10, 0][index % 4],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
                className="absolute"
                style={{ top: `${20 + index * 25}%`, left: `${20 + (index % 2) * 40}%` }}
              >
                <button type="button" className="relative group" onClick={() => startCloudEntry(`${pet.name} 的云端空间`)} aria-label={`查看 ${pet.name} 的空间`}>
                  <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-xl ring-4 ring-emerald-500/20 transition-transform group-hover:scale-110">
                    <img src={pet.images?.[0]} alt={pet.name} className="h-full w-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-100 bg-white px-3 py-1 shadow-lg">
                    <span className="text-[10px] font-black text-slate-900">{pet.name}</span>
                  </div>
                  <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
                </button>
              </motion.div>
            ))}

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 animate-ping" />
              <div className="h-8 w-8 rounded-full border-4 border-white bg-primary shadow-2xl" />
            </div>

            <div className="absolute bottom-8 left-8 right-8 rounded-[2rem] border border-white/50 bg-white/80 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">near_me</span>
                  <span className="text-xs font-black tracking-tight text-slate-900">附近有 12 位宠物伙伴在线互动</span>
                </div>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary">
                  刷新地图
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'realms' && (
          <motion.div key="realms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 gap-6">
            {REALMS.map((realm) => (
              <motion.button
                key={realm.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startCloudEntry(realm.name)}
                className="group relative h-64 overflow-hidden rounded-[3rem] border-4 border-white shadow-2xl"
              >
                <img src={realm.image} alt={realm.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute right-6 top-6 rounded-2xl border border-white/20 bg-white/20 px-4 py-2 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest text-white">{realm.onlineCount} 在线</span>
                  </div>
                </div>
                <div className="absolute bottom-8 left-8 right-8 space-y-2 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/20 backdrop-blur-md">
                      <span className="material-symbols-outlined text-xl text-white">{realm.icon}</span>
                    </div>
                    <h3 className="font-headline text-2xl font-black tracking-tight text-white">{realm.name}</h3>
                  </div>
                  <p className="pr-10 text-xs leading-relaxed text-white/80 line-clamp-2">{realm.description}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {view === 'courtyards' && (
          <motion.div key="courtyards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowModal('create')} className="flex-1 rounded-[2.5rem] border-2 border-dashed border-primary/30 bg-primary/10 py-6 font-black text-primary transition hover:bg-primary/15">
                创建小院
              </button>
              <button type="button" onClick={() => setShowModal('join')} className="flex-1 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-100 py-6 font-black text-slate-500 transition hover:bg-slate-200">
                加入小院
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {courtyards.map((court) => (
                <div key={court.id} className="frost-card flex items-center gap-4 rounded-[2.5rem] p-4">
                  <img src={court.image} alt={court.name} className="h-20 w-20 rounded-3xl object-cover shadow-md" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-900">{court.name}</h3>
                    <p className="mt-1 text-[10px] font-medium text-slate-400 line-clamp-1">{court.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">{court.members} 位成员</span>
                      <span className="text-[9px] font-bold text-slate-300">ID: {court.id}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowModal('join')} className="rounded-full bg-slate-900 px-4 py-2 text-[10px] font-black text-white transition hover:bg-primary">
                    加入
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cloudEntry && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center bg-emerald-950/70 px-6 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative w-full max-w-md overflow-hidden rounded-[3.2rem] border border-white/15 bg-white/90 p-8 shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(175,251,216,0.75),transparent_68%)]" />
              <div className="relative space-y-8">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">Cloud leash release</p>
                  <h3 className="mt-3 text-3xl font-black italic tracking-tight text-slate-900">{petName} 正在进入{cloudEntry.target}</h3>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">牵引绳已松开，云端地图正在生成安全游玩轨迹。</p>
                </div>

                <div className="relative mx-auto h-52 overflow-hidden rounded-[2.6rem] bg-gradient-to-br from-emerald-100 via-sky-100 to-white">
                  <motion.div
                    initial={{ scaleX: 0.2 }}
                    animate={{ scaleX: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="absolute left-10 top-24 h-1 w-44 origin-left rounded-full bg-emerald-500/40"
                  />
                  <motion.div
                    initial={{ x: -10, y: 70, rotate: -12 }}
                    animate={{ x: 210, y: 30, rotate: 12 }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                    className="absolute left-6 top-14 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white text-primary shadow-2xl ring-8 ring-white/50"
                  >
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.4 }}
                    animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute right-10 top-16 h-20 w-20 rounded-full border-2 border-dashed border-primary/40"
                  />
                  <div className="absolute bottom-5 left-5 right-5 rounded-[1.8rem] bg-white/75 px-5 py-4 backdrop-blur-md">
                    <p className="text-sm font-black leading-relaxed text-primary">{cloudEntry.phrase}</p>
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: '8%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass relative w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900">{showModal === 'create' ? '创建我的小院' : '加入已有小院'}</h3>
                <p className="text-xs font-medium text-slate-400">{showModal === 'create' ? '适合熟人交流、长期养宠陪伴和主题小社群' : '输入小院编号和密码后即可加入'}</p>
              </div>

              <div className="mt-6 space-y-4">
                {showModal === 'create' ? (
                  <label className="block space-y-1">
                    <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">小院名称</span>
                    <input type="text" value={modalData.name} onChange={(event) => setModalData({ ...modalData, name: event.target.value })} placeholder="例如：金毛散步俱乐部" className="w-full rounded-2xl border-none bg-slate-50 px-6 py-4 font-bold" />
                  </label>
                ) : (
                  <label className="block space-y-1">
                    <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">小院编号</span>
                    <input type="text" value={modalData.id} onChange={(event) => setModalData({ ...modalData, id: event.target.value })} placeholder="例如：2048" className="w-full rounded-2xl border-none bg-slate-50 px-6 py-4 font-bold" />
                  </label>
                )}
                <label className="block space-y-1">
                  <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">进入密码</span>
                  <input type="password" value={modalData.password} onChange={(event) => setModalData({ ...modalData, password: event.target.value })} placeholder="请输入密码" className="w-full rounded-2xl border-none bg-slate-50 px-6 py-4 font-bold" />
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 rounded-2xl bg-slate-100 py-4 font-black text-slate-500">
                  取消
                </button>
                <button type="button" onClick={showModal === 'create' ? handleCreate : handleJoin} className="flex-1 rounded-2xl bg-primary py-4 font-black text-white shadow-lg shadow-primary/20">
                  确认{showModal === 'create' ? '创建' : '加入'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
