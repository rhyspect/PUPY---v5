import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ApiMatchRecord, ApiNotification, ApiPrayerRecord, ApiUser, AppRuntimeChatSession } from '../services/api';
import apiService from '../services/api';
import type { Owner, Pet } from '../types';
import { createOwnerFromApi } from '../utils/adapters';
import { createOwnerFromRuntimeSession } from '../utils/appDataAdapters';
import { getStoredLocale, type AppLocale } from '../utils/locale';
import BrandEmptyState from './BrandEmptyState';

interface MessagesProps {
  onSelectChat: (payload: {
    owner?: Owner;
    chatRoomId?: string;
    runtimeSessionId?: string;
    runtimeSessionType?: 'owner' | 'pet';
  }) => void;
  onViewOwner: (owner: Owner) => void;
  currentUser: ApiUser | null;
  userPet: Pet;
  optimisticMatches?: ApiMatchRecord[];
}

const copyByLocale = {
  'zh-CN': {
    justNow: '刚刚',
    loadFailed: '消息页同步失败，请稍后重试。',
    prayerFailed: '发送宠语失败，请稍后重试。',
    notificationFailed: '更新通知状态失败，请稍后重试。',
    centerTag: '消息中心',
    title: '主人对话与宠物心声',
    subtitle: '左滑进入待匹配，双向确认后才会出现真实聊天。这里会同步真实会话、系统通知和宠语记录。',
    refresh: '刷新',
    refreshAria: '刷新消息、匹配和通知数据',
    tabsLabel: '消息分区切换',
    ownerTab: '主人对话',
    petTab: '宠物心声',
    matchedCount: '已匹配',
    pendingCount: '待匹配',
    roomsCount: '会话中',
    pendingSection: '等待系统匹配',
    pendingHint: '你已经表达喜欢，等待对方也喜欢你。',
    compatibility: '匹配度',
    waitingStatus: '正在等待系统撮合',
    viewOwner: '查看主人资料',
    viewOwnerDetails: '查看详细资料',
    otherPetFallback: '对方宠物',
    otherPetTypeFallback: '宠物档案',
    roomsSection: '真实聊天',
    roomsSuffix: '个会话',
    loadingRooms: '正在同步真实聊天数据…',
    emptyRooms: '还没有新的聊天，先去首页左滑喜欢几位吧。',
    defaultLastMessage: '已经互相喜欢，去打个招呼吧。',
    whisperTitle: '给',
    whisperSuffix: '留一句悄悄话',
    whisperPlaceholder: '比如：今天散步时你最喜欢哪一段路？',
    sendWhisper: '发送宠物悄悄话',
    petFeedSection: '真实记录',
    emptyFeed: '这里会展示宠语翻译、AI 回应和系统动态。',
    prayerTitle: '宠语翻译',
    notificationTitle: '系统动态',
    unread: '未读',
    synced: '已同步',
    openNotification: '打开系统通知并标记已读',
  },
  'en-US': {
    justNow: 'Just now',
    loadFailed: 'Failed to sync messages. Please try again later.',
    prayerFailed: 'Failed to send the pet whisper. Please try again later.',
    notificationFailed: 'Failed to update the notification status.',
    centerTag: 'Message Center',
    title: 'Owner Chats and Pet Voice',
    subtitle: 'A left swipe enters pending matching first. Real chat appears only after a two-way match. This screen syncs real rooms, notifications, and pet whispers.',
    refresh: 'Refresh',
    refreshAria: 'Refresh messages, matches, and notifications',
    tabsLabel: 'Switch message sections',
    ownerTab: 'Owner Chats',
    petTab: 'Pet Voice',
    matchedCount: 'Matched',
    pendingCount: 'Pending',
    roomsCount: 'Rooms',
    pendingSection: 'Waiting for system confirmation',
    pendingHint: 'You already liked them. Waiting for the other side to like back.',
    compatibility: 'Match score',
    waitingStatus: 'Waiting for a two-way confirmation',
    viewOwner: 'View owner profile',
    viewOwnerDetails: 'View detailed profile',
    otherPetFallback: 'Other pet',
    otherPetTypeFallback: 'Pet profile',
    roomsSection: 'Real chats',
    roomsSuffix: 'rooms',
    loadingRooms: 'Syncing real chat data…',
    emptyRooms: 'No chat yet. Go back to discovery and swipe left on someone first.',
    defaultLastMessage: 'You both liked each other. Say hi first.',
    whisperTitle: 'Leave',
    whisperSuffix: 'a whisper for',
    whisperPlaceholder: 'For example: which part of the walk did you like most today?',
    sendWhisper: 'Send a whisper to your pet',
    petFeedSection: 'Real records',
    emptyFeed: 'Pet translations, AI replies, and system updates will appear here.',
    prayerTitle: 'Pet translation',
    notificationTitle: 'System update',
    unread: 'Unread',
    synced: 'Synced',
    openNotification: 'Open this notification and mark it as read',
  },
} satisfies Record<AppLocale, Record<string, string>>;

type PetFeedItem =
  | {
      id: string;
      kind: 'prayer';
      title: string;
      body: string;
      raw?: string;
      time?: string;
      isRead: true;
    }
  | {
      id: string;
      kind: 'notification';
      title: string;
      body: string;
      raw?: string;
      time?: string;
      notificationId: string;
      isRead: boolean;
    }
  | {
      id: string;
      kind: 'session';
      title: string;
      body: string;
      raw?: string;
      time?: string;
      isRead: boolean;
      sessionId: string;
      owner: Owner;
    };

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

function getCounterpartOwner(match: ApiMatchRecord, currentUserId?: string) {
  if (!currentUserId) return null;
  const otherUser = match.user_a_id === currentUserId ? match.user_b : match.user_a;
  return otherUser ? createOwnerFromApi(otherUser) : null;
}

export default function Messages({ onSelectChat, onViewOwner, currentUser, userPet, optimisticMatches = [] }: MessagesProps) {
  const locale = getStoredLocale();
  const copy = useMemo(() => copyByLocale[locale], [locale]);
  const [activeTab, setActiveTab] = useState<'owner' | 'pet'>('owner');
  const [ownerSessions, setOwnerSessions] = useState<AppRuntimeChatSession[]>([]);
  const [petSessions, setPetSessions] = useState<AppRuntimeChatSession[]>([]);
  const [matches, setMatches] = useState<ApiMatchRecord[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [prayers, setPrayers] = useState<ApiPrayerRecord[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ownerSessionsResult, petSessionsResult, matchesResult, notificationsResult, prayersResult] = await Promise.all([
        apiService.getAppChatSessions('owner'),
        apiService.getAppChatSessions('pet'),
        apiService.getMatches(),
        apiService.getNotifications(),
        apiService.getPrayerRecords(),
      ]);

      setOwnerSessions(ownerSessionsResult.data || []);
      setPetSessions(petSessionsResult.data || []);
      setMatches(matchesResult.data || []);
      setNotifications(notificationsResult.data || []);
      setPrayers(prayersResult.data || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const retryTimer = window.setTimeout(() => {
      void loadData();
    }, 1200);

    return () => window.clearTimeout(retryTimer);
  }, [locale, currentUser?.id]);

  const mergedMatches = useMemo(() => {
    const byId = new Map<string, ApiMatchRecord>();

    for (const match of optimisticMatches) {
      byId.set(match.id, match);
    }

    for (const match of matches) {
      byId.set(match.id, match);
    }

    return Array.from(byId.values()).sort(
      (left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime(),
    );
  }, [matches, optimisticMatches]);

  const pendingMatches = useMemo(() => mergedMatches.filter((item) => item.status === 'pending'), [mergedMatches]);
  const matchedOnly = useMemo(() => mergedMatches.filter((item) => item.status === 'matched'), [mergedMatches]);

  const petFeed = useMemo<PetFeedItem[]>(() => {
    const sessionCards: PetFeedItem[] = petSessions.map((session) => ({
      id: `session-${session.id}`,
      kind: 'session',
      title: session.title,
      body: session.latestSnippet || session.counterpart?.signature || copy.emptyFeed,
      raw: session.relatedPets.join(' · '),
      time: session.updatedAt || session.createdAt,
      isRead: session.unreadCount === 0,
      sessionId: session.id,
      owner: createOwnerFromRuntimeSession(session),
    }));

    const prayerCards: PetFeedItem[] = prayers.map((record) => ({
      id: `prayer-${record.id}`,
      kind: 'prayer',
      title: copy.prayerTitle,
      body: record.ai_response || record.prayer_text,
      raw: record.prayer_text,
      time: record.created_at,
      isRead: true,
    }));

    const notificationCards: PetFeedItem[] = notifications.map((item) => ({
      id: `notification-${item.id}`,
      kind: 'notification',
      title: copy.notificationTitle,
      body: item.message,
      raw: item.type,
      time: item.created_at,
      notificationId: item.id,
      isRead: item.is_read,
    }));

    return [...sessionCards, ...prayerCards, ...notificationCards]
      .sort((a, b) => new Date(b.time || '').getTime() - new Date(a.time || '').getTime())
      .slice(0, 10);
  }, [copy.emptyFeed, copy.notificationTitle, copy.prayerTitle, notifications, petSessions, prayers]);

  const submitWhisper = async () => {
    const value = input.trim();
    if (!value || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const latestPetSession = petSessions[0];
      if (latestPetSession) {
        const result = await apiService.sendAppChatMessage(latestPetSession.id, {
          content: value,
          role: 'pet',
          senderName: userPet.name,
        });
        if (result.data) {
          setPetSessions((prev) => {
            const next = prev.filter((item) => item.id !== result.data?.id);
            return [result.data as AppRuntimeChatSession, ...next];
          });
        }
      } else {
        const result = await apiService.createPrayer(userPet.id, value);
        if (result.data) {
          setPrayers((prev) => [result.data as ApiPrayerRecord, ...prev]);
        }
      }
      setInput('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.prayerFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.notificationFailed);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-6">
        <div className="glass rounded-[2.3rem] border border-white/50 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">{copy.centerTag}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{copy.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-2xl bg-white/80 px-4 py-3 text-xs font-black text-primary shadow-sm"
              aria-label={copy.refreshAria}
            >
              {copy.refresh}
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{copy.subtitle}</p>
        </div>
      </div>

      <div className="mb-6 flex px-6">
        <div className="glass flex w-full rounded-2xl border border-white/50 p-1" role="tablist" aria-label={copy.tabsLabel}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'owner'}
            aria-controls="messages-owner-panel"
            id="messages-owner-tab"
            onClick={() => setActiveTab('owner')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${activeTab === 'owner' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
          >
            {copy.ownerTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pet'}
            aria-controls="messages-pet-panel"
            id="messages-pet-tab"
            onClick={() => setActiveTab('pet')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${activeTab === 'pet' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
          >
            {copy.petTab}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar">
        {error && (
          <div className="mb-4 rounded-[1.6rem] border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-700" role="alert">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'owner' ? (
            <motion.div
              key="owner"
              id="messages-owner-panel"
              role="tabpanel"
              aria-labelledby="messages-owner-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: copy.matchedCount, value: matchedOnly.length },
                  { label: copy.pendingCount, value: pendingMatches.length },
                  { label: copy.roomsCount, value: ownerSessions.length },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-[2rem] border border-white/50 p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {pendingMatches.length > 0 && (
                <section data-testid="pending-matches-section" className="space-y-3">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{copy.pendingSection}</h3>
                    <span className="text-right text-[10px] font-bold text-amber-500">{copy.pendingHint}</span>
                  </div>
                  <div className="space-y-3">
                    {pendingMatches.slice(0, 4).map((match) => {
                      const owner = getCounterpartOwner(match, currentUser?.id);
                      if (!owner) return null;
                      const otherPet = match.user_a_id === currentUser?.id ? match.pet_b : match.pet_a;
                      const compatibility = Number(match.compatibility_score || 0);

                      return (
                        <div key={match.id} className="flex items-center gap-4 rounded-[2rem] border border-amber-100 bg-amber-50/95 p-4">
                          <button
                            type="button"
                            onClick={() => onViewOwner(owner)}
                            className="shrink-0"
                            aria-label={`${copy.viewOwner}: ${owner.name}`}
                          >
                            <img src={owner.avatar} alt={owner.name} className="h-14 w-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="truncate text-sm font-bold text-slate-900">{owner.name}</h4>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-amber-600">
                                {copy.compatibility} {`${(compatibility * 100).toFixed(0)}%`}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {otherPet?.name || copy.otherPetFallback} · {otherPet?.type || copy.otherPetTypeFallback} · {copy.waitingStatus}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onViewOwner(owner)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm"
                            aria-label={`${copy.viewOwnerDetails}: ${owner.name}`}
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section data-testid="chat-rooms-section" className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{copy.roomsSection}</h3>
                  <span className="text-[10px] font-bold text-slate-400">{ownerSessions.length} {copy.roomsSuffix}</span>
                </div>
                {loading ? (
                  <div className="glass rounded-[2rem] border border-white/50 p-6 text-center text-sm text-slate-400" role="status">
                    {copy.loadingRooms}
                  </div>
                ) : ownerSessions.length === 0 ? (
                  <BrandEmptyState compact icon="chat_bubble" title={copy.emptyRooms} />
                ) : (
                  ownerSessions.map((session) => {
                    const owner = createOwnerFromRuntimeSession(session);
                    return (
                      <button
                        type="button"
                        key={session.id}
                        onClick={() => onSelectChat({ owner, runtimeSessionId: session.id, runtimeSessionType: 'owner' })}
                        className="glass flex w-full items-center gap-4 rounded-[2rem] border border-white/50 p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
                        aria-label={`${copy.ownerTab}: ${owner.name}`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={owner.avatar}
                            className="h-14 w-14 rounded-2xl object-cover"
                            alt={owner.name}
                            referrerPolicy="no-referrer"
                          />
                          {!!session.unreadCount && (
                            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                              {session.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <h4 className="truncate text-sm font-bold text-slate-900">{owner.name}</h4>
                            <span className="whitespace-nowrap text-[9px] font-medium text-slate-400">
                              {formatTimestamp(session.updatedAt || session.createdAt, locale, copy.justNow)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-slate-500">{session.latestSnippet || copy.defaultLastMessage}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="pet"
              id="messages-pet-panel"
              role="tabpanel"
              aria-labelledby="messages-pet-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="glass rounded-[2.5rem] border border-white/50 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-primary">record_voice_over</span>
                  <h4 className="text-xs font-bold text-primary">
                    {locale === 'zh-CN' ? `${copy.whisperTitle}${userPet.name}${copy.whisperSuffix}` : `${copy.whisperTitle} ${copy.whisperSuffix} ${userPet.name}`}
                  </h4>
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
                    placeholder={copy.whisperPlaceholder}
                    className="w-full rounded-2xl border border-white/70 bg-white/85 py-3 pl-4 pr-14 text-sm text-slate-700 outline-none placeholder:text-slate-300"
                    aria-label={copy.sendWhisper}
                  />
                  <button
                    type="button"
                    onClick={() => void submitWhisper()}
                    disabled={submitting || !input.trim()}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 disabled:opacity-60"
                    aria-label={copy.sendWhisper}
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </div>

              <section className="space-y-4">
                <h3 className="px-2 text-xs font-black uppercase tracking-widest text-slate-400">{copy.petFeedSection}</h3>
                {petFeed.length === 0 ? (
                  <BrandEmptyState compact icon="pets" title={copy.emptyFeed} />
                ) : (
                  petFeed.map((item) => {
                    const isNotification = item.kind === 'notification';
                    const isSession = item.kind === 'session';
                    const CardTag = isNotification || isSession ? 'button' : 'article';
                    const cardProps = isSession
                      ? {
                          type: 'button' as const,
                          onClick: () => onSelectChat({ owner: item.owner, runtimeSessionId: item.sessionId, runtimeSessionType: 'pet' }),
                          'aria-label': `${copy.petTab}: ${item.title}`,
                        }
                      : isNotification
                        ? {
                            type: 'button' as const,
                            onClick: () => void handleNotificationClick(item.notificationId),
                            'aria-label': copy.openNotification,
                          }
                        : {};

                    return (
                      <CardTag
                        key={item.id}
                        {...cardProps}
                        className="glass w-full space-y-4 rounded-[2.5rem] border border-white/50 p-6 text-left shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                            <p className="text-[10px] font-medium text-slate-400">{formatTimestamp(item.time, locale, copy.justNow)}</p>
                          </div>
                          <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold ${!item.isRead ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <span className="material-symbols-outlined text-xs">neurology</span>
                            {!item.isRead ? copy.unread : copy.synced}
                          </div>
                        </div>

                        {item.raw && item.kind === 'prayer' && (
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs italic text-slate-400">“{item.raw}”</p>
                          </div>
                        )}
                        {item.raw && item.kind === 'session' && (
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs italic text-slate-400">{item.raw}</p>
                          </div>
                        )}

                        <p className="text-sm font-medium leading-relaxed text-slate-600">{item.body}</p>
                      </CardTag>
                    );
                  })
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
