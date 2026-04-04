import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ApiPrayerRecord, ApiUser } from '../services/api';
import apiService from '../services/api';
import type { Owner, Pet } from '../types';

interface ChatProps {
  owner: Owner | null;
  currentUser: ApiUser | null;
  userPet: Pet;
  chatRoomId?: string | null;
  onBack: () => void;
}

interface ChatMessageRecord {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read?: boolean;
  created_at?: string;
}

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

export default function Chat({ owner, currentUser, userPet, chatRoomId, onBack }: ChatProps) {
  const [chatMode, setChatMode] = useState<'owner' | 'pet'>('owner');
  const [message, setMessage] = useState('');
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(chatRoomId || null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [prayers, setPrayers] = useState<ApiPrayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setActiveRoomId(chatRoomId || null);
  }, [chatRoomId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let nextRoomId = chatRoomId || null;
        if (!nextRoomId && owner?.id && currentUser?.id) {
          const roomResult = await apiService.getOrCreateChatRoom(owner.id);
          nextRoomId = roomResult.data?.id || null;
          setActiveRoomId(nextRoomId);
        }

        const [messagesResult, prayersResult] = await Promise.all([
          nextRoomId ? apiService.getChatMessages(nextRoomId, 1, 50) : Promise.resolve({ success: true, data: [] }),
          currentUser?.id ? apiService.getPrayerRecords(1, 12) : Promise.resolve({ success: true, data: [] }),
        ]);

        setMessages((messagesResult.data || []) as ChatMessageRecord[]);
        setPrayers((prayersResult.data || []) as ApiPrayerRecord[]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [chatRoomId, owner?.id, currentUser?.id]);

  const gallery = useMemo(() => {
    if (owner?.photos?.length) {
      return owner.photos;
    }
    return owner?.avatar ? [owner.avatar] : [];
  }, [owner]);

  const handleSend = async () => {
    const value = message.trim();
    if (!value || sending) return;

    setSending(true);
    try {
      if (chatMode === 'pet') {
        const result = await apiService.createPrayer(userPet.id, value);
        if (result.data) {
          setPrayers((prev) => [result.data as ApiPrayerRecord, ...prev]);
        }
      } else {
        if (!activeRoomId || !owner?.id) return;
        const result = await apiService.sendMessage(activeRoomId, owner.id, value);
        if (result.data) {
          setMessages((prev) => [...prev, result.data as ChatMessageRecord]);
        }
      }
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  const ownerMessagesReady = Boolean(activeRoomId && owner?.id);

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col max-w-md mx-auto">
      <header className="p-6 flex flex-col gap-4 bg-white shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <button onClick={() => setShowOwnerProfile(true)} className="flex items-center gap-3 min-w-0 text-left">
            <div className="relative">
              <img
                src={owner?.avatar || userPet.owner.avatar}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                alt={owner?.name || '聊天对象'}
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div className="min-w-0">
              <h3 className="font-headline font-bold text-slate-900 truncate">{owner?.name || '等待会话接入'}</h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {owner?.residentCity || 'PUPY 会话'}
              </p>
            </div>
          </button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setChatMode('owner')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
              chatMode === 'owner' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-sm">person</span>
            主人对话
          </button>
          <button
            onClick={() => setChatMode('pet')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
              chatMode === 'pet' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-sm">pets</span>
            宠物心声
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">正在同步真实会话数据…</div>
        ) : chatMode === 'owner' ? (
          ownerMessagesReady ? (
            <>
              <div className="text-center">
                <span className="px-4 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
                  已连接真实聊天房间
                </span>
              </div>
              {messages.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 text-sm text-slate-400 text-center">
                  你们已经互相喜欢，发第一句招呼吧。
                </div>
              ) : (
                messages.map((msg) => {
                  const sent = msg.sender_id === currentUser?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${sent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${sent ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'}`}>
                        <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                        <p className={`mt-2 text-[10px] font-bold ${sent ? 'text-white/70' : 'text-slate-400'}`}>
                          {formatTimestamp(msg.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </>
          ) : (
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 text-sm text-slate-400 text-center">
              当前对象还没有可用的真实会话，返回消息页从已建立房间进入会更完整。
            </div>
          )
        ) : prayers.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 text-sm text-slate-400 text-center">
            宠物心声会显示真实祈愿记录和 AI 回应，先发一条看看。
          </div>
        ) : (
          prayers.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="space-y-3 bg-white rounded-[2rem] border border-slate-100 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{formatTimestamp(record.created_at)}</p>
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black">{record.sentiment || 'positive'}</span>
              </div>
              <p className="text-sm text-slate-500 italic">“{record.prayer_text}”</p>
              <div className="rounded-[1.6rem] bg-primary/5 border border-primary/10 p-4">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{record.ai_response || 'AI 正在整理更自然的宠语回应。'}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <footer className="p-6 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 rounded-full px-5 py-2 shadow-inner border border-slate-100">
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleSend();
              }
            }}
            placeholder={chatMode === 'owner' ? '输入消息…' : `给 ${userPet.name} 留一句悄悄话…`}
            className="flex-1 bg-transparent border-none py-3 text-sm font-medium focus:ring-0 placeholder:text-slate-300"
            disabled={chatMode === 'owner' && !ownerMessagesReady}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!message.trim() || sending || (chatMode === 'owner' && !ownerMessagesReady)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              message.trim() && !(chatMode === 'owner' && !ownerMessagesReady)
                ? 'bg-primary text-white scale-110 shadow-lg'
                : 'text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {showOwnerProfile && owner && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOwnerProfile(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[3rem] overflow-hidden shadow-2xl"
              style={{ maxHeight: '90vh' }}
            >
              <div className="overflow-y-auto h-full no-scrollbar pb-10">
                <div className="relative h-[45vh] bg-slate-100">
                  <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                    {gallery.map((photo, index) => (
                      <img key={index} src={photo} className="w-full h-full object-cover snap-center flex-shrink-0" alt="资料图" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                    <button onClick={() => setShowOwnerProfile(false)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <div className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                      {gallery.length} 张资料图
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">{owner.name}</h2>
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-md font-black">{owner.mbti}</span>
                    </div>
                    <p className="text-slate-400 font-medium text-sm">{owner.signature}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-3xl space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">基本信息</p>
                      <p className="font-bold text-slate-900">{owner.gender} · {owner.age} 岁</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-3xl space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">常驻城市</p>
                      <p className="font-bold text-slate-900">{owner.residentCity}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">常去城市</h4>
                    <div className="flex flex-wrap gap-2">
                      {owner.frequentCities.map((city) => (
                        <span key={city} className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-black rounded-2xl tracking-wide border border-slate-100">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">兴趣爱好</h4>
                    <div className="flex flex-wrap gap-2">
                      {owner.hobbies.map((hobby) => (
                        <span key={hobby} className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-black rounded-2xl tracking-wide border border-emerald-100">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setChatMode('owner');
                      setShowOwnerProfile(false);
                    }}
                    className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    继续当前对话
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
