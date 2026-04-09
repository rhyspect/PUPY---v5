import { useEffect, useMemo, useState, startTransition, lazy, Suspense } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Owner, Pet, NavItem, Screen } from './types';
import type { ApiMatchRecord, ApiNotification, ApiUser } from './services/api';
import apiService from './services/api';
import { createPetFromApi } from './utils/adapters';
import FeatureModal from './components/FeatureModal';
import BrandMark from './components/BrandMark';
import type { AppLocale } from './utils/locale';
import { getStoredLocale, setStoredLocale } from './utils/locale';
import { getAppCopy } from './utils/copy';

import Home from './components/Home';
import Onboarding, { type OnboardingCompletePayload } from './components/Onboarding';

const Tour = lazy(() => import('./components/Tour'));
const Market = lazy(() => import('./components/Market'));
const Messages = lazy(() => import('./components/Messages'));
const Profile = lazy(() => import('./components/Profile'));
const Creation = lazy(() => import('./components/Creation'));
const Chat = lazy(() => import('./components/Chat'));
const Settings = lazy(() => import('./components/Settings'));
const Breeding = lazy(() => import('./components/Breeding'));
const Diary = lazy(() => import('./components/Diary'));
const Filters = lazy(() => import('./components/Filters'));
const AIPrayer = lazy(() => import('./components/AIPrayer'));
const OwnerProfile = lazy(() => import('./components/OwnerProfile'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

type AppScreen = Screen | 'settings' | 'breeding' | 'diary' | 'prayer' | 'admin';

const STORAGE = {
  onboarded: 'pupy_onboarded',
  pet: 'pupy_pet',
  user: 'pupy_user',
};

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? 'rhyssvv@gmail.com')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const DEFAULT_OWNER_AVATAR =
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400';

function ScreenFallback({ label }: { label: string }) {
  return (
    <div className="px-6 py-10">
      <div className="brand-surface brand-aura ambient-card flex items-center gap-4 rounded-[2.4rem] px-5 py-5 shadow-sm">
        <BrandMark mode="icon" size="sm" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">PUPY · 爪住</p>
          <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [locale, setLocale] = useState<AppLocale>(() => getStoredLocale());
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userPet, setUserPet] = useState<Pet | null>(null);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [activeChatOwner, setActiveChatOwner] = useState<Owner | null>(null);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [activeRuntimeChatSessionId, setActiveRuntimeChatSessionId] = useState<string | null>(null);
  const [activeRuntimeChatMode, setActiveRuntimeChatMode] = useState<'owner' | 'pet' | null>(null);
  const [isDigitalTwinCreated, setIsDigitalTwinCreated] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [optimisticMatches, setOptimisticMatches] = useState<ApiMatchRecord[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const copy = getAppCopy(locale);
  const canAccessAdmin = currentUser?.email ? ADMIN_EMAILS.includes(currentUser.email.toLowerCase()) : false;
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    environment: '',
    baseUrl: apiService.getBaseUrl(),
    message: copy.backend.waiting,
  });

  useEffect(() => {
    setStoredLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    setBackendStatus((previous) => ({
      ...previous,
      message: previous.connected ? previous.message : copy.backend.waiting,
    }));
  }, [copy.backend.waiting]);

  useEffect(() => {
    void bootstrapSession();
  }, []);

  const bootstrapSession = async () => {
    setIsHydrating(true);

    try {
      const health = await apiService.healthCheck();
      setBackendStatus({
        connected: true,
        environment: health.data?.environment || 'development',
        baseUrl: apiService.getBaseUrl(),
        message: health.data?.message || copy.backend.apiReady,
      });
    } catch (error) {
      setBackendStatus({
        connected: false,
        environment: '',
        baseUrl: apiService.getBaseUrl(),
        message: error instanceof Error ? error.message : copy.backend.healthFailed,
      });
    }

    const token = apiService.getToken();
    if (token) {
      try {
        const [userResult, petsResult, notificationsResult] = await Promise.all([
          apiService.getCurrentUser(),
          apiService.getPets(),
          apiService.getNotifications(),
        ]);

        const user = userResult.data;
        const primaryPet = petsResult.data?.[0];

        if (user && primaryPet) {
          const nextPet = createPetFromApi(primaryPet, user);
          persistSession(nextPet, user);
          startTransition(() => {
            setCurrentUser(user);
            setUserPet(nextPet);
            setNotifications(notificationsResult.data || []);
            setIsDigitalTwinCreated(Boolean(primaryPet.is_digital_twin));
            setIsOnboarded(true);
          });
          setIsHydrating(false);
          return;
        }
      } catch {
        apiService.clearToken();
      }
    }

    const savedPet = typeof window !== 'undefined' ? localStorage.getItem(STORAGE.pet) : null;
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem(STORAGE.user) : null;
    const onboardedFlag = typeof window !== 'undefined' ? localStorage.getItem(STORAGE.onboarded) : null;

    try {
      if (savedPet && onboardedFlag === 'true') {
        startTransition(() => {
          setUserPet(JSON.parse(savedPet) as Pet);
          setCurrentUser(savedUser ? (JSON.parse(savedUser) as ApiUser) : null);
          setIsOnboarded(true);
        });
      }
    } catch {
      clearLocalSession();
    } finally {
      setIsHydrating(false);
    }
  };

  const persistSession = (pet: Pet, user: ApiUser | null) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE.onboarded, 'true');
    localStorage.setItem(STORAGE.pet, JSON.stringify(pet));
    if (user) {
      localStorage.setItem(STORAGE.user, JSON.stringify(user));
    }
  };

  const clearLocalSession = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE.onboarded);
    localStorage.removeItem(STORAGE.pet);
    localStorage.removeItem(STORAGE.user);
  };

  const showToast = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 4000);
  };

  const openScreen = (screen: AppScreen) => {
    startTransition(() => setCurrentScreen(screen));
  };

  const openAdminScreen = () => {
    if (!canAccessAdmin) {
      showToast('\u5f53\u524d\u8d26\u53f7\u6ca1\u6709\u540e\u53f0\u6743\u9650\u3002');
      startTransition(() => setCurrentScreen('settings'));
      return;
    }

    openScreen('admin');
  };

  const handleOnboardingComplete = async (payload: OnboardingCompletePayload) => {
    persistSession(payload.pet, payload.user || null);

    startTransition(() => {
      setCurrentUser(payload.user || null);
      setUserPet(payload.pet);
      setOptimisticMatches([]);
      setIsOnboarded(true);
      setCurrentScreen('home');
    });

    showToast(payload.mode === 'api' ? copy.toast.synced : copy.toast.localMode);
  };

  const handleMatch = (payload?: { owner?: Owner; match?: ApiMatchRecord }) => {
    if (payload?.match) {
      setOptimisticMatches((previous) => {
        const withoutCurrent = previous.filter((item) => item.id !== payload.match?.id);
        return [payload.match, ...withoutCurrent];
      });
    }

    showToast(copy.toast.matched);
  };

  const handleReset = () => {
    apiService.clearToken();
    clearLocalSession();
    startTransition(() => {
      setCurrentUser(null);
      setUserPet(null);
      setNotifications([]);
      setOptimisticMatches([]);
      setSelectedOwner(null);
      setActiveChatOwner(null);
      setActiveChatRoomId(null);
      setActiveRuntimeChatSessionId(null);
      setActiveRuntimeChatMode(null);
      setIsDigitalTwinCreated(false);
      setIsOnboarded(false);
      setCurrentScreen('home');
    });
  };

  const handleProfileSync = (payload: { user?: ApiUser | null; pet?: Pet | null; isDigitalTwinCreated?: boolean }) => {
    const nextUser = payload.user === undefined ? currentUser : payload.user ?? null;
    const nextPet = payload.pet === undefined ? userPet : payload.pet;

    if (nextPet) {
      persistSession(nextPet, nextUser);
    }

    startTransition(() => {
      if (payload.user !== undefined) setCurrentUser(payload.user ?? null);
      if (payload.pet !== undefined && payload.pet) setUserPet(payload.pet);
      if (payload.isDigitalTwinCreated !== undefined) setIsDigitalTwinCreated(payload.isDigitalTwinCreated);
    });
  };

  const handleLocaleChange = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    showToast(nextLocale === 'zh-CN' ? copy.toast.switchedZh : copy.toast.switchedEn);
  };

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

  if (isHydrating) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-5 px-6">
          <div className="mx-auto flex justify-center">
            <BrandMark mode="full" size="lg" />
          </div>
          <div className="space-y-2">
            <p className="inline-flex items-center justify-center rounded-full brand-pill px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em]">
              PUPY · 爪住
            </p>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">{copy.shell.hydrating}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOnboarded || !userPet) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: copy.nav.home, icon: 'pets' },
    { id: 'tour', label: copy.nav.tour, icon: 'cloud' },
    { id: 'messages', label: copy.nav.messages, icon: 'chat_bubble' },
    { id: 'market', label: copy.nav.market, icon: 'shopping_bag' },
    { id: 'profile', label: copy.nav.profile, icon: 'person' },
  ];

  return (
    <div className="ambient-shell relative min-h-screen max-w-md mx-auto overflow-x-hidden bg-surface">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(175,251,216,0.48),transparent_60%),radial-gradient(circle_at_18%_12%,rgba(242,141,45,0.18),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(238,155,177,0.18),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_bottom,rgba(191,219,254,0.3),transparent_60%)]" />
      <header className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto flex justify-between items-center px-6 py-4 glass border-b border-white/40">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDrawerOpen(true)} className="w-10 h-10 rounded-2xl bg-primary-container overflow-hidden ring-4 ring-primary/5 cursor-pointer transition-transform active:scale-90">
            <img src={userPet.images?.[0] || DEFAULT_OWNER_AVATAR} alt={userPet.name} className="w-full h-full object-cover" />
          </button>
          <div>
            <BrandMark mode="word" size="sm" subtitle="爪住 · Pet Cloud" />
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${backendStatus.connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                {backendStatus.connected ? copy.shell.apiOnline : copy.shell.localFallback}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label={copy.shell.notificationCenter} onClick={() => setShowNotificationCenter(true)} className="relative rounded-2xl bg-white/60 p-2.5 text-slate-500 transition hover:text-primary">
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="absolute top-2 right-2 min-w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
          </button>
          <button
            aria-label={copy.shell.settings}
            onClick={() => openScreen('settings')}
            className={`flex items-center gap-2 rounded-full px-3.5 py-2 transition-all ${currentScreen === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/70 text-slate-500 hover:bg-white'}`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-xs font-bold">{copy.shell.settings}</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-32">
        <Suspense fallback={<ScreenFallback label={copy.shell.hydrating} />}>
          <AnimatePresence mode="wait">
          <motion.div key={currentScreen} initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }} animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }} exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {currentScreen === 'home' && <Home onMatch={handleMatch} onViewOwner={setSelectedOwner} currentUser={currentUser} userPet={userPet} />}
            {currentScreen === 'tour' && <Tour userPet={userPet} onSelectRealm={() => openScreen('messages')} />}
            {currentScreen === 'messages' && <Messages currentUser={currentUser} userPet={userPet} optimisticMatches={optimisticMatches} onSelectChat={({ owner, chatRoomId, runtimeSessionId, runtimeSessionType }) => { setActiveChatOwner(owner || null); setActiveChatRoomId(chatRoomId || null); setActiveRuntimeChatSessionId(runtimeSessionId || null); setActiveRuntimeChatMode(runtimeSessionType || null); openScreen('chat'); }} onViewOwner={setSelectedOwner} />}
            {currentScreen === 'market' && <Market currentUser={currentUser} userPet={userPet} onChat={(owner) => { setActiveChatOwner(owner); setActiveChatRoomId(null); setActiveRuntimeChatSessionId(null); setActiveRuntimeChatMode('owner'); openScreen('chat'); }} />}
            {currentScreen === 'profile' && <Profile userPet={userPet} currentUser={currentUser} isDigitalTwinCreated={isDigitalTwinCreated} onStartCreation={() => openScreen('creation')} onTwinCreated={() => setIsDigitalTwinCreated(true)} onProfileSync={handleProfileSync} />}
            {currentScreen === 'creation' && <Creation onComplete={() => { setIsDigitalTwinCreated(true); openScreen('profile'); }} />}
            {currentScreen === 'chat' && <Chat owner={activeChatOwner} currentUser={currentUser} userPet={userPet} chatRoomId={activeChatRoomId} runtimeSessionId={activeRuntimeChatSessionId} runtimeSessionType={activeRuntimeChatMode} onBack={() => openScreen('messages')} />}
            {currentScreen === 'breeding' && <Breeding onBack={() => openScreen('home')} onChat={(owner) => { setActiveChatOwner(owner); setActiveChatRoomId(null); setActiveRuntimeChatSessionId(null); setActiveRuntimeChatMode('owner'); openScreen('chat'); }} />}
            {currentScreen === 'diary' && <Diary onBack={() => openScreen('home')} />}
            {currentScreen === 'prayer' && <AIPrayer onBack={() => openScreen('home')} />}
            {currentScreen === 'settings' && <Settings userPet={{ name: userPet.name, image: userPet.images?.[0], hasPet: userPet.hasPet }} currentUserEmail={currentUser?.email || null} onBack={() => openScreen('home')} onReset={handleReset} onOpenAdmin={openAdminScreen} onLocaleChange={handleLocaleChange} locale={locale} backendStatus={backendStatus} canOpenAdmin={canAccessAdmin} />}
            {currentScreen === 'admin' && <AdminDashboard onBack={() => openScreen('settings')} currentUserEmail={currentUser?.email || null} canAccess={canAccessAdmin} />}
          </motion.div>
        </AnimatePresence>
          <AnimatePresence>{isFiltersOpen && <Filters onClose={() => setIsFiltersOpen(false)} />}</AnimatePresence>
        </Suspense>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto p-4 flex justify-center">
        <div className="glass w-full rounded-[2.7rem] border border-white/45 px-4 py-2 flex items-center justify-around">
          {navItems.map((item) => (
            <button key={item.id} aria-label={item.label} onClick={() => openScreen(item.id)} className={`flex flex-col items-center justify-center rounded-3xl p-3 transition-all duration-300 ${currentScreen === item.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-white/70'}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: currentScreen === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span className="text-[8px] font-bold mt-1 tracking-tight leading-none">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-80 z-[70] glass rounded-r-[3rem] p-8 flex flex-col">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center overflow-hidden ring-4 ring-primary/5">
                  <img src={userPet.images?.[0] || DEFAULT_OWNER_AVATAR} className="w-full h-full object-cover" alt={userPet.name} />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold font-headline text-lg leading-tight">{userPet.name}</h3>
                  <p className="text-xs font-medium text-slate-500">{currentUser?.email || copy.shell.localSession}</p>
                </div>
              </div>

              <div className="brand-surface brand-aura rounded-[2.3rem] px-5 py-4 mb-6">
                <BrandMark mode="lockup" size="sm" subtitle="爪住 · Pet Social Product" />
              </div>

              <nav className="space-y-4">
                <button onClick={() => { setIsFiltersOpen(true); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all">
                  <span className="material-symbols-outlined">filter_list</span>
                  <span className="font-medium">{copy.shell.filters}</span>
                </button>
                <button onClick={() => { openScreen('breeding'); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all">
                  <span className="material-symbols-outlined">fertile</span>
                  <span className="font-medium">{copy.shell.breeding}</span>
                </button>
                <button onClick={() => { openScreen('diary'); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all">
                  <span className="material-symbols-outlined">history</span>
                  <span className="font-medium">{copy.shell.diary}</span>
                </button>
                <button onClick={() => { openScreen('prayer'); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="font-medium">{copy.shell.prayer}</span>
                </button>
                {canAccessAdmin && (
                  <button onClick={() => { openAdminScreen(); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all">
                    <span className="material-symbols-outlined">monitoring</span>
                    <span className="font-medium">{copy.shell.adminPanel}</span>
                  </button>
                )}
                <button onClick={() => { openScreen('settings'); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all">
                  <span className="material-symbols-outlined">settings</span>
                  <span className="font-medium">{copy.shell.systemSettings}</span>
                </button>
              </nav>

              <div className="mt-auto glass p-6 rounded-[2.5rem] border border-white/45 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{copy.shell.runtime}</span>
                  <span className={`text-xs font-bold ${backendStatus.connected ? 'text-emerald-600' : 'text-amber-500'}`}>{backendStatus.connected ? copy.shell.healthy : copy.shell.fallback}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{backendStatus.message}</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div initial={prefersReducedMotion ? { opacity: 0 } : { y: -100, opacity: 0 }} animate={prefersReducedMotion ? { opacity: 1 } : { y: 80, opacity: 1 }} exit={prefersReducedMotion ? { opacity: 0 } : { y: -100, opacity: 0 }} className="fixed top-0 left-6 right-6 z-[100] rounded-[1.8rem] border border-white/15 bg-slate-900/90 p-4 text-white shadow-2xl backdrop-blur-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white">check</span>
            </div>
            <p className="text-xs font-bold leading-tight">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AnimatePresence>
          {selectedOwner && <OwnerProfile owner={selectedOwner} onClose={() => setSelectedOwner(null)} onStartChat={() => { setActiveChatOwner(selectedOwner); setActiveChatRoomId(null); setActiveRuntimeChatSessionId(null); setActiveRuntimeChatMode('owner'); setSelectedOwner(null); openScreen('chat'); }} />}
        </AnimatePresence>
      </Suspense>

      <FeatureModal
        open={showNotificationCenter}
        title={copy.shell.notificationCenter}
        description={notifications.length ? copy.shell.notificationDescription : copy.shell.notificationEmpty}
        items={(notifications.length ? notifications : [{ id: 'empty', message: copy.shell.notificationEmpty } as ApiNotification]).slice(0, 6).map((item) => item.message)}
        onClose={() => setShowNotificationCenter(false)}
      />
    </div>
  );
}
