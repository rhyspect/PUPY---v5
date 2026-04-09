import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ApiPrayerRecord, ApiUser, AppRuntimeChatSession } from '../services/api';
import apiService from '../services/api';
import type { Owner, Pet } from '../types';
import { createOwnerFromRuntimeSession } from '../utils/appDataAdapters';
import { getStoredLocale, type AppLocale } from '../utils/locale';

interface ChatProps {
  owner: Owner | null;
  currentUser: ApiUser | null;
  userPet: Pet;
  chatRoomId?: string | null;
  runtimeSessionId?: string | null;
  runtimeSessionType?: 'owner' | 'pet' | null;
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

const copyByLocale = {
  'zh-CN': {
    justNow: '刚刚',
    loadFailed: '会话加载失败，请稍后重试。',
    sendFailed: '发送失败，请稍后重试。',
    roomUnavailable: '当前还没有可用的真实聊天房间。',
    back: '返回消息页',
    profileFallback: '聊天对象资料',
    waitingRoom: '等待会话接入',
    roomTag: 'PUPY 会话',
    tabsLabel: '聊天模式切换',
    ownerTab: '主人对话',
    petTab: '宠物心声',
    loading: '正在同步真实会话数据…',
    roomConnected: '已连接真实聊天房间',
    emptyOwner: '你们已经互相喜欢，发第一句招呼吧。',
    roomHint: '当前对象还没有可用的真实会话，从消息页进入已建立房间会更完整。',
    emptyPet: '宠物心声会显示真实祈愿记录和 AI 回应，先发一条看看。',
    aiFallback: 'AI 正在整理更自然的宠语回应。',
    ownerPlaceholder: '输入消息…',
    petPlaceholderPrefix: '给',
    petPlaceholderSuffix: '留一句悄悄话…',
    ownerInputAria: '输入聊天消息',
    petInputAria: '输入给宠物的悄悄话',
    send: '发送消息',
    openProfile: '查看资料',
    closeProfile: '关闭资料卡',
    photosCountSuffix: '张资料图',
    basicInfo: '基本信息',
    residentCity: '常驻城市',
    frequentCities: '常去城市',
    hobbies: '兴趣爱好',
    notFilled: '暂未填写',
    continueChat: '继续当前对话',
  },
  'en-US': {
    justNow: 'Just now',
    loadFailed: 'Failed to load the conversation. Please try again later.',
    sendFailed: 'Failed to send. Please try again later.',
    roomUnavailable: 'There is no available real chat room yet.',
    back: 'Back to messages',
    profileFallback: 'Chat profile',
    waitingRoom: 'Waiting for room access',
    roomTag: 'PUPY Room',
    tabsLabel: 'Switch chat mode',
    ownerTab: 'Owner Chat',
    petTab: 'Pet Voice',
    loading: 'Syncing real conversation data…',
    roomConnected: 'Connected to a real chat room',
    emptyOwner: 'You already like each other. Send the first hello.',
    roomHint: 'This person does not have an available room yet. Entering from the messages page is more reliable.',
    emptyPet: 'Pet voice will show real prayer records and AI replies. Send one to start.',
    aiFallback: 'AI is preparing a more natural pet response.',
    ownerPlaceholder: 'Type a message…',
    petPlaceholderPrefix: 'Leave',
    petPlaceholderSuffix: 'a whisper…',
    ownerInputAria: 'Type a chat message',
    petInputAria: 'Type a whisper for your pet',
    send: 'Send message',
    openProfile: 'Open profile',
    closeProfile: 'Close profile sheet',
    photosCountSuffix: 'photos',
    basicInfo: 'Basic info',
    residentCity: 'Resident city',
    frequentCities: 'Frequent cities',
    hobbies: 'Hobbies',
    notFilled: 'Not filled in yet',
    continueChat: 'Continue chatting',
  },
} satisfies Record<AppLocale, Record<string, string>>;

function formatTimestamp(value: string | undefined, locale: AppLocale, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toOwnerMessages(session: AppRuntimeChatSession, currentUser: ApiUser | null, userPet: Pet): ChatMessageRecord[] {
  const currentNames = [currentUser?.username, userPet.owner.name]
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(Boolean);

  return session.messages.map((message) => {
    const sentByCurrent = currentNames.includes(String(message.senderName || '').trim().toLowerCase());
    return {
      id: message.id,
      chat_id: session.id,
      sender_id: sentByCurrent ? currentUser?.id || 'current-user' : 'runtime-remote',
      receiver_id: sentByCurrent ? 'runtime-remote' : currentUser?.id || 'current-user',
      content: message.content,
      created_at: message.createdAt,
      is_read: true,
    };
  });
}

function toPetRecords(session: AppRuntimeChatSession): ApiPrayerRecord[] {
  return session.messages.map((message) => ({
    id: message.id,
    user_id: session.id,
    pet_id: session.id,
    prayer_text: `${message.senderName}：${message.content}`,
    ai_response: message.role === 'system' ? message.content : undefined,
    sentiment: message.moderationStatus,
    created_at: message.createdAt,
  }));
}

export default function Chat({ owner, currentUser, userPet, chatRoomId, runtimeSessionId, runtimeSessionType, onBack }: ChatProps) {
  const locale = getStoredLocale();
  const copy = useMemo(() => copyByLocale[locale], [locale]);
  const [chatMode, setChatMode] = useState<'owner' | 'pet'>(runtimeSessionType === 'pet' ? 'pet' : 'owner');
  const [message, setMessage] = useState('');
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(chatRoomId || null);
  const [activeRuntimeOwnerSession, setActiveRuntimeOwnerSession] = useState<AppRuntimeChatSession | null>(null);
  const [activePetSession, setActivePetSession] = useState<AppRuntimeChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [prayers, setPrayers] = useState<ApiPrayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveRoomId(chatRoomId || null);
  }, [chatRoomId]);

  useEffect(() => {
    if (runtimeSessionType === 'pet') {
      setChatMode('pet');
    }
  }, [runtimeSessionType]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        let ownerSession: AppRuntimeChatSession | null = null;
        if (runtimeSessionId) {
          const runtimeSessionResult = await apiService.getAppChatSession(runtimeSessionId);
          ownerSession = runtimeSessionResult.data || null;
        } else if (owner?.name && currentUser?.id) {
          const ensuredResult = await apiService.ensureOwnerChatSession({
            counterpartName: owner.name,
            counterpartCity: owner.residentCity,
          });
          ownerSession = ensuredResult.data || null;
        }

        let nextRoomId = chatRoomId || null;
        if (!ownerSession && !nextRoomId && owner?.id && currentUser?.id) {
          const roomResult = await apiService.getOrCreateChatRoom(owner.id);
          nextRoomId = roomResult.data?.id || null;
          setActiveRoomId(nextRoomId);
        }

        const [petSessionsResult, ownerMessagesResult, prayersResult] = await Promise.all([
          currentUser?.id ? apiService.getAppChatSessions('pet') : Promise.resolve({ success: true, data: [] }),
          ownerSession
            ? Promise.resolve({ success: true, data: toOwnerMessages(ownerSession, currentUser, userPet) })
            : nextRoomId
              ? apiService.getChatMessages(nextRoomId, 1, 50)
              : Promise.resolve({ success: true, data: [] }),
          currentUser?.id ? apiService.getPrayerRecords(1, 12) : Promise.resolve({ success: true, data: [] }),
        ]);

        const nextPetSession = runtimeSessionType === 'pet'
          ? (runtimeSessionId && ownerSession?.type === 'pet' ? ownerSession : petSessionsResult.data?.find((item) => item.id === runtimeSessionId) || petSessionsResult.data?.[0] || null)
          : petSessionsResult.data?.[0] || null;

        setActiveRuntimeOwnerSession(ownerSession && ownerSession.type === 'owner' ? ownerSession : null);
        setMessages((ownerMessagesResult.data || []) as ChatMessageRecord[]);
        setActivePetSession(nextPetSession || null);
        setPrayers(nextPetSession ? toPetRecords(nextPetSession) : ((prayersResult.data || []) as ApiPrayerRecord[]));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : copy.loadFailed);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [chatRoomId, copy.loadFailed, currentUser?.id, owner?.id, owner?.name, owner?.residentCity, runtimeSessionId, runtimeSessionType, userPet]);

  const galleryOwner = useMemo(() => {
    if (chatMode === 'pet' && activePetSession) {
      return createOwnerFromRuntimeSession(activePetSession);
    }
    if (activeRuntimeOwnerSession) {
      return createOwnerFromRuntimeSession(activeRuntimeOwnerSession);
    }
    return owner;
  }, [activePetSession, activeRuntimeOwnerSession, chatMode, owner]);

  const gallery = useMemo(() => {
    if (galleryOwner?.photos?.length) {
      return galleryOwner.photos;
    }
    return galleryOwner?.avatar ? [galleryOwner.avatar] : [];
  }, [galleryOwner]);

  const handleSend = async () => {
    const value = message.trim();
    if (!value || sending) return;

    setSending(true);
    setError(null);
    try {
      if (chatMode === 'pet') {
        if (activePetSession) {
          const result = await apiService.sendAppChatMessage(activePetSession.id, {
            content: value,
            role: 'pet',
            senderName: userPet.name,
          });
          if (result.data) {
            setActivePetSession(result.data);
            setPrayers(toPetRecords(result.data));
          }
        } else {
          const result = await apiService.createPrayer(userPet.id, value);
          if (result.data) {
            setPrayers((prev) => [result.data as ApiPrayerRecord, ...prev]);
          }
        }
      } else {
        if (activeRuntimeOwnerSession) {
          const result = await apiService.sendAppChatMessage(activeRuntimeOwnerSession.id, {
            content: value,
            role: 'owner',
            senderName: currentUser?.username || userPet.owner.name,
          });
          if (result.data) {
            setActiveRuntimeOwnerSession(result.data);
            setMessages(toOwnerMessages(result.data, currentUser, userPet));
          }
        } else {
          if (!activeRoomId || !owner?.id) {
            setError(copy.roomUnavailable);
            return;
          }

          const result = await apiService.sendMessage(activeRoomId, owner.id, value);
          if (result.data) {
            setMessages((prev) => [...prev, result.data as ChatMessageRecord]);
          }
        }
      }
      setMessage('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.sendFailed);
    } finally {
      setSending(false);
    }
  };

  const ownerMessagesReady = Boolean(activeRuntimeOwnerSession || (activeRoomId && owner?.id));
  const companionAvatar = galleryOwner?.avatar || userPet.owner.avatar;
  const companionName = galleryOwner?.name || copy.waitingRoom;
  const companionCity = galleryOwner?.residentCity || copy.roomTag;
  const petPlaceholder =
    locale === 'zh-CN'
      ? `${copy.petPlaceholderPrefix}${userPet.name}${copy.petPlaceholderSuffix}`
      : `${copy.petPlaceholderPrefix} ${copy.petPlaceholderSuffix} ${userPet.name}`;

  return (
    <div className="fixed inset-0 z-[100] mx-auto flex max-w-md flex-col bg-surface">
      <header className="glass border-b border-white/50 p-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-slate-400 transition hover:text-primary"
            aria-label={copy.back}
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <button
            type="button"
            onClick={() => galleryOwner && setShowOwnerProfile(true)}
            disabled={!galleryOwner}
            className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-75"
            aria-label={galleryOwner ? `${copy.openProfile}: ${galleryOwner.name}` : copy.profileFallback}
          >
            <div className="relative shrink-0">
              <img src={companionAvatar} className="h-12 w-12 rounded-full border-2 border-primary/20 object-cover shadow-sm" alt={companionName} referrerPolicy="no-referrer" />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-headline text-base font-bold text-slate-900">{companionName}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{companionCity}</p>
            </div>
          </button>
        </div>

        <div className="mt-4 flex rounded-2xl border border-white/50 bg-white/55 p-1" role="tablist" aria-label={copy.tabsLabel}>
          <button
            type="button"
            role="tab"
            aria-selected={chatMode === 'owner'}
            aria-controls="chat-owner-panel"
            id="chat-owner-tab"
            onClick={() => setChatMode('owner')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-[10px] font-black transition-all ${chatMode === 'owner' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
          >
            <span className="material-symbols-outlined text-sm">person</span>
            {copy.ownerTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chatMode === 'pet'}
            aria-controls="chat-pet-panel"
            id="chat-pet-tab"
            onClick={() => setChatMode('pet')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-[10px] font-black transition-all ${chatMode === 'pet' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
          >
            <span className="material-symbols-outlined text-sm">pets</span>
            {copy.petTab}
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-6 no-scrollbar">
        {error && (
          <div className="rounded-[1.6rem] border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-700" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400" role="status">{copy.loading}</div>
        ) : chatMode === 'owner' ? (
          <div id="chat-owner-panel" role="tabpanel" aria-labelledby="chat-owner-tab" className="space-y-4">
            {ownerMessagesReady ? (
              <>
                <div className="text-center">
                  <span className="rounded-full bg-slate-100 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{copy.roomConnected}</span>
                </div>
                {messages.length === 0 ? (
                  <div className="glass rounded-[2rem] border border-white/50 p-6 text-center text-sm text-slate-400">{copy.emptyOwner}</div>
                ) : (
                  messages.map((msg) => {
                    const sent = msg.sender_id === currentUser?.id;
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${sent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-3xl p-4 shadow-sm ${sent ? 'rounded-tr-none bg-primary text-white' : 'rounded-tl-none border border-white/50 glass text-slate-900'}`}>
                          <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                          <p className={`mt-2 text-[10px] font-bold ${sent ? 'text-white/70' : 'text-slate-400'}`}>
                            {formatTimestamp(msg.created_at, locale, copy.justNow)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </>
            ) : (
              <div className="glass rounded-[2rem] border border-white/50 p-6 text-center text-sm text-slate-400">{copy.roomHint}</div>
            )}
          </div>
        ) : (
          <div id="chat-pet-panel" role="tabpanel" aria-labelledby="chat-pet-tab" className="space-y-4">
            {prayers.length === 0 ? (
              <div className="glass rounded-[2rem] border border-white/50 p-6 text-center text-sm text-slate-400">{copy.emptyPet}</div>
            ) : (
              prayers.map((record) => (
                <motion.div key={record.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass space-y-3 rounded-[2rem] border border-white/50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{formatTimestamp(record.created_at, locale, copy.justNow)}</p>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">{record.sentiment || 'positive'}</span>
                  </div>
                  <p className="text-sm italic text-slate-500">“{record.prayer_text}”</p>
                  <div className="rounded-[1.6rem] border border-primary/10 bg-primary/5 p-4">
                    <p className="text-sm font-medium leading-relaxed text-slate-700">{record.ai_response || copy.aiFallback}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <footer className="glass border-t border-white/50 p-6">
        <div className="flex items-center gap-3 rounded-full border border-white/60 bg-white/75 px-5 py-2 shadow-inner">
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleSend();
              }
            }}
            placeholder={chatMode === 'owner' ? copy.ownerPlaceholder : petPlaceholder}
            className="flex-1 border-none bg-transparent py-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300"
            disabled={chatMode === 'owner' && !ownerMessagesReady}
            aria-label={chatMode === 'owner' ? copy.ownerInputAria : copy.petInputAria}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!message.trim() || sending || (chatMode === 'owner' && !ownerMessagesReady)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${message.trim() && !(chatMode === 'owner' && !ownerMessagesReady) ? 'scale-105 bg-primary text-white shadow-lg' : 'text-slate-300'}`}
            aria-label={copy.send}
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {showOwnerProfile && galleryOwner && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOwnerProfile(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md overflow-hidden rounded-t-[3rem] bg-white shadow-2xl" style={{ maxHeight: '90vh' }}>
              <div className="h-full overflow-y-auto pb-10 no-scrollbar">
                <div className="relative h-[45vh] bg-slate-100">
                  <div className="flex h-full snap-x snap-mandatory overflow-x-auto no-scrollbar">
                    {gallery.map((photo, index) => (
                      <img key={index} src={photo} className="h-full w-full shrink-0 snap-center object-cover" alt={`${galleryOwner.name} ${copy.openProfile} ${index + 1}`} referrerPolicy="no-referrer" />
                    ))}
                  </div>
                  <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
                    <button type="button" onClick={() => setShowOwnerProfile(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md" aria-label={copy.closeProfile}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <div className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                      {gallery.length} {copy.photosCountSuffix}
                    </div>
                  </div>
                </div>

                <div className="space-y-8 p-8">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-black italic tracking-tight text-slate-900">{galleryOwner.name}</h2>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">{galleryOwner.mbti}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-400">{galleryOwner.signature}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 rounded-3xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy.basicInfo}</p>
                      <p className="font-bold text-slate-900">{galleryOwner.gender} · {galleryOwner.age}</p>
                    </div>
                    <div className="space-y-1 rounded-3xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy.residentCity}</p>
                      <p className="font-bold text-slate-900">{galleryOwner.residentCity}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{copy.frequentCities}</h4>
                    <div className="flex flex-wrap gap-2">
                      {galleryOwner.frequentCities.length ? galleryOwner.frequentCities.map((city) => (
                        <span key={city} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-black tracking-wide text-slate-600">{city}</span>
                      )) : <span className="text-sm text-slate-400">{copy.notFilled}</span>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{copy.hobbies}</h4>
                    <div className="flex flex-wrap gap-2">
                      {galleryOwner.hobbies.length ? galleryOwner.hobbies.map((hobby) => (
                        <span key={hobby} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black tracking-wide text-emerald-600">{hobby}</span>
                      )) : <span className="text-sm text-slate-400">{copy.notFilled}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setChatMode('owner');
                      setShowOwnerProfile(false);
                    }}
                    className="w-full rounded-3xl bg-primary py-5 font-black text-white shadow-xl shadow-primary/20 transition-all active:scale-95"
                  >
                    {copy.continueChat}
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
