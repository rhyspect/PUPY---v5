import { useEffect, useMemo, useState, startTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Owner, Pet, NavItem, Screen } from './types';
import type { ApiNotification, ApiUser } from './services/api';
import apiService from './services/api';
import { createPetFromApi } from './utils/adapters';
import FeatureModal from './components/FeatureModal';
import type { AppLocale } from './utils/locale';
import { getStoredLocale, setStoredLocale } from './utils/locale';
import { getAppCopy } from './utils/copy';

import Home from './components/Home';
import Tour from './components/Tour';
import Market from './components/Market';
import Messages from './components/Messages';
import Profile from './components/Profile';
import Creation from './components/Creation';
import Chat from './components/Chat';
import Onboarding, { type OnboardingCompletePayload } from './components/Onboarding';
import Settings from './components/Settings';
import Breeding from './components/Breeding';
import Diary from './components/Diary';
import Filters from './components/Filters';
import AIPrayer from './components/AIPrayer';
import OwnerProfile from './components/OwnerProfile';
import AdminDashboard from './components/AdminDashboard';

type AppScreen = Screen | 'settings' | 'breeding' | 'diary' | 'prayer' | 'admin';

const STORAGE = {
  onboarded: 'pupy_onboarded',
  pet: 'pupy_pet',
  user: 'pupy_user',
};

const DEFAULT_OWNER_AVATAR =
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400';

function createFallbackOwner(ownerName: string): Owner {
  return {
    name: ownerName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(ownerName)}`,
    photos: [`https://picsum.photos/seed/${encodeURIComponent(ownerName)}/400/600`],
    gender: '其他',
    age: 25,
    residentCity: '上海',
    frequentCities: ['上海'],
    hobbies: ['宠物', '社交'],
    mbti: 'INTJ',
    signature: '期待认识更多养宠人。',
  };
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
  const [isDigitalTwinCreated, setIsDigitalTwinCreated] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const copy = getAppCopy(locale);
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

  const handleOnboardingComplete = async (payload: OnboardingCompletePayload) => {
    persistSession(payload.pet, payload.user || null);

    startTransition(() => {
      setCurrentUser(payload.user || null);
      setUserPet(payload.pet);
      setIsOnboarded(true);
      setCurrentScreen('home');
    });

    showToast(payload.mode === 'api' ? copy.toast.synced : copy.toast.localMode);
  };

  const handleMatch = (_owner?: Owner) => {
    showToast(copy.toast.matched);
  };

  const handleReset = () => {
    apiService.clearToken();
    clearLocalSession();
    startTransition(() => {
      setCurrentUser(null);
      setUserPet(null);
      setNotifications([]);
      setSelectedOwner(null);
      setActiveChatOwner(null);
      setActiveChatRoomId(null);
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
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl text-primary">pets</span>
          </div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">{copy.shell.hydrating}</p>
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
    <div className="relative min-h-screen max-w-md mx-auto bg-surface overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDrawerOpen(true)} className="w-10 h-10 rounded-2xl bg-primary-container overflow-hidden ring-4 ring-primary/5 cursor-pointer transition-transform active:scale-90">
            <img src={userPet.images?.[0] || DEFAULT_OWNER_AVATAR} alt={userPet.name} className="w-full h-full object-cover" />
          </button>
          <div>
            <span className="text-2xl font-black text-primary italic tracking-tight font-headline">PUPY</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${backendStatus.connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                {backendStatus.connected ? copy.shell.apiOnline : copy.shell.localFallback}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotificationCenter(true)} className="p-2 text-slate-400 hover:text-primary transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="absolute top-2 right-2 min-w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
          </button>
          <button
            onClick={() => openScreen('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${currentScreen === 'settings' ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-xs font-bold">{copy.shell.settings}</span>
          </button>
        </div>
      </header>

      <main className="pt-20 pb-28">
        <AnimatePresence mode="wait">
          <motion.div key={currentScreen} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {currentScreen === 'home' && <Home onMatch={handleMatch} onViewOwner={setSelectedOwner} currentUser={currentUser} userPet={userPet} />}
            {currentScreen === 'tour' && <Tour onSelectRealm={() => openScreen('messages')} />}
            {currentScreen === 'messages' && <Messages currentUser={currentUser} userPet={userPet} onSelectChat={(owner, roomId) => { setActiveChatOwner(owner || null); setActiveChatRoomId(roomId || null); openScreen('chat'); }} onViewOwner={setSelectedOwner} />}
            {currentScreen === 'market' && <Market currentUser={currentUser} userPet={userPet} onChat={(owner) => { setActiveChatOwner(owner); setActiveChatRoomId(null); openScreen('chat'); }} />}
            {currentScreen === 'profile' && <Profile userPet={userPet} currentUser={currentUser} isDigitalTwinCreated={isDigitalTwinCreated} onStartCreation={() => openScreen('creation')} onTwinCreated={() => setIsDigitalTwinCreated(true)} onProfileSync={handleProfileSync} />}
            {currentScreen === 'creation' && <Creation onComplete={() => { setIsDigitalTwinCreated(true); openScreen('profile'); }} />}
            {currentScreen === 'chat' && <Chat owner={activeChatOwner} currentUser={currentUser} userPet={userPet} chatRoomId={activeChatRoomId} onBack={() => openScreen('messages')} />}
            {currentScreen === 'breeding' && <Breeding onBack={() => openScreen('home')} onChat={(ownerName) => { setActiveChatOwner(createFallbackOwner(ownerName)); setActiveChatRoomId(null); openScreen('chat'); }} />}
            {currentScreen === 'diary' && <Diary onBack={() => openScreen('home')} />}
            {currentScreen === 'prayer' && <AIPrayer onBack={() => openScreen('home')} />}
            {currentScreen === 'settings' && <Settings userPet={{ name: userPet.name, image: userPet.images?.[0], hasPet: userPet.hasPet }} currentUserEmail={currentUser?.email || null} onBack={() => openScreen('home')} onReset={handleReset} onOpenAdmin={() => openScreen('admin')} onLocaleChange={handleLocaleChange} locale={locale} backendStatus={backendStatus} />}
            {currentScreen === 'admin' && <AdminDashboard onBack={() => openScreen('settings')} currentUserEmail={currentUser?.email || null} />}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>{isFiltersOpen && <Filters onClose={() => setIsFiltersOpen(false)} />}</AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto p-4 flex justify-center">
        <div className="w-full bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 py-2 border border-slate-100">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => openScreen(item.id)} className={`flex flex-col items-center justify-center p-3 rounded-3xl transition-all duration-300 ${currentScreen === item.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}`}>
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
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-80 z-[70] bg-white rounded-r-[3rem] shadow-2xl p-8 flex flex-col">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center overflow-hidden ring-4 ring-primary/5">
                  <img src={userPet.images?.[0] || DEFAULT_OWNER_AVATAR} className="w-full h-full object-cover" alt={userPet.name} />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold font-headline text-lg leading-tight">{userPet.name}</h3>
                  <p className="text-xs font-medium text-slate-500">{currentUser?.email || copy.shell.localSession}</p>
                </div>
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
                <button onClick={() => { openScreen('admin'); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all">
                  <span className="material-symbols-outlined">monitoring</span>
                  <span className="font-medium">{copy.shell.adminPanel}</span>
                </button>
                <button onClick={() => { openScreen('settings'); setIsDrawerOpen(false); }} className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all">
                  <span className="material-symbols-outlined">settings</span>
                  <span className="font-medium">{copy.shell.systemSettings}</span>
                </button>
              </nav>

              <div className="mt-auto bg-slate-50 p-6 rounded-[2.5rem] shadow-inner border border-slate-100 space-y-3">
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
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 80, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-0 left-6 right-6 z-[100] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white">check</span>
            </div>
            <p className="text-xs font-bold leading-tight">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOwner && <OwnerProfile owner={selectedOwner} onClose={() => setSelectedOwner(null)} onStartChat={() => { setActiveChatOwner(selectedOwner); setActiveChatRoomId(null); setSelectedOwner(null); openScreen('chat'); }} />}
      </AnimatePresence>

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



