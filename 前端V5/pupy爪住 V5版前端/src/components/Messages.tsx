import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ApiChatRoom, ApiNotification, ApiPrayerRecord, ApiUser } from '../services/api';
import apiService from '../services/api';
import type { Owner, Pet } from '../types';
import { createOwnerFromApi } from '../utils/adapters';

interface MessagesProps {
  onSelectChat: (owner?: Owner) => void;
  onViewOwner: (owner: Owner) => void;
  currentUser: ApiUser | null;
  userPet: Pet;
}

function formatTimestamp(value?: string) {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function Messages({ onSelectChat, onViewOwner, userPet }: MessagesProps) {
  const [activeTab, setActiveTab] = useState<'owner' | 'pet'>('owner');
  const [chatRooms, setChatRooms] = useState<ApiChatRoom[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [prayers, setPrayers] = useState<ApiPrayerRecord[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsResult, notificationsResult, prayersResult] = await Promise.all([
        apiService.getChatRooms(),
        apiService.getNotifications(),
        apiService.getPrayerRecords(),
      ]);

      setChatRooms(roomsResult.data || []);
      setNotifications(notificationsResult.data || []);
      setPrayers(prayersResult.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const petFeed = useMemo(() => {
    const prayerCards = prayers.map((record) => ({
      id: `prayer-${record.id}`,
      type: 'prayer' as const,
      title: '宠语翻译',
      body: record.ai_response || record.prayer_text,
      raw: record.prayer_text,
      time: record.created_at,
      tone: record.sentiment || 'positive',
    }));

    const notificationCards = notifications.map((item) => ({
      id: `notification-${item.id}`,
      type: 'notification' as const,
      title: '系统动态',
      body: item.message,
      raw: item.type,
      time: item.created_at,
      tone: item.type,
    }));

    return [...prayerCards, ...notificationCards]
      .sort((a, b) => new Date(b.time || '').getTime() - new Date(a.time || '').getTime())
      .slice(0, 10);
  }, [notifications, prayers]);

  const submitWhisper = async () => {
    const value = input.trim();
    if (!value || submitting) return;

    setSubmitting(true);
    try {
      const result = await apiService.createPrayer(userPet.id, value);
      if (result.data) {
        setPrayers((prev) => [result.data as ApiPrayerRecord, ...prev]);
      }
      setInput('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex px-6 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full">
          <button
            onClick={() => setActiveTab('owner')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'owner' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
            }`}
          >
            主人对话
          </button>
          <button
            onClick={() => setActiveTab('pet')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pet' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
            }`}
          >
            宠物心声
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 no-scrollbar pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'owner' ? (
            <motion.div
              key="owner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {loading ? (
                <div className="bg-white rounded-[2rem] p-6 text-center text-sm text-slate-400 border border-slate-100">正在同步真实聊天数据…</div>
              ) : chatRooms.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-6 text-center text-sm text-slate-400 border border-slate-100">还没有新的聊天，去首页多认识几位吧。</div>
              ) : (
                chatRooms.map((room) => {
                  const owner = createOwnerFromApi(room.other_user || {});
                  return (
                    <div
                      key={room.id}
                      onClick={() => onSelectChat(owner)}
                      className="flex items-center gap-4 p-4 bg-white rounded-[2rem] shadow-sm border border-slate-50 active:scale-95 transition-transform cursor-pointer"
                    >
                      <div className="relative">
                        <img
                          src={owner.avatar}
                          className="w-14 h-14 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                          alt={owner.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewOwner(owner);
                          }}
                        />
                        {!!room.unread_count && (
                          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-slate-900 truncate text-sm">{owner.name}</h4>
                          <span className="text-[9px] text-slate-400 font-medium">{formatTimestamp(room.last_message_time || room.updated_at)}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{room.last_message || '已经互相喜欢，去打个招呼吧。'}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          ) : (
            <motion.div
              key="pet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">record_voice_over</span>
                  <h4 className="font-bold text-primary text-xs">给 {userPet.name} 留一句悄悄话</h4>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void submitWhisper();
                      }
                    }}
                    placeholder="比如：今天散步时你最喜欢哪一段路？"
                    className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-300"
                  />
                  <button
                    onClick={() => void submitWhisper()}
                    disabled={submitting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">真实记录</h3>
                {petFeed.length === 0 ? (
                  <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-50 text-sm text-slate-400 text-center">
                    这里会展示宠语翻译、AI回应和系统动态。
                  </div>
                ) : (
                  petFeed.map((item) => (
                    <div key={item.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{formatTimestamp(item.time)}</p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">neurology</span>
                          已同步
                        </div>
                      </div>

                      {item.raw && item.type === 'prayer' && (
                        <div className="bg-slate-50 rounded-2xl p-3">
                          <p className="text-xs text-slate-400 italic">“{item.raw}”</p>
                        </div>
                      )}

                      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/5">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{item.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
