import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Owner, Pet } from '../types';
import apiService, { type ApiUser } from '../services/api';
import { createOwnerFromApi, createPetFromApi } from '../utils/adapters';

type Step =
  | 'login'
  | 'register_choice'
  | 'register_phone'
  | 'register_email'
  | 'forgot_password'
  | 'owner_basic'
  | 'owner_hobbies'
  | 'pet_basic';

interface OnboardingProps {
  onComplete: (payload: OnboardingCompletePayload) => Promise<void> | void;
}

export interface OnboardingCompletePayload {
  owner: Owner;
  pet: Pet;
  mode: 'api' | 'demo';
  user?: ApiUser | null;
  token?: string | null;
}

const HOBBIES = [
  'Coffee',
  'Photography',
  'Travel',
  'Camping',
  'Reading',
  'Fitness',
  'Cycling',
  'Coding',
  'Baking',
  'Movies',
  'Music',
  'Hiking',
];

const CITIES = ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Hangzhou', 'Chengdu', 'Nanjing', 'Wuhan'];

const DEFAULT_OWNER_PHOTO =
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400';

const DEFAULT_PET_PHOTO =
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400';

const createSyntheticEmail = (seed: string) =>
  `${seed.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `pupy${Date.now()}`}@pupy.local`;

const createBootstrapPassword = (seed: string) =>
  `${seed.replace(/\s+/g, '').slice(0, 12) || 'PUPY'}#2026`;

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('login');
  const [isQuickLogin, setIsQuickLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ account: '', password: '' });
  const [registerData, setRegisterData] = useState({ phone: '', email: '', code: '', password: '' });
  const [ownerData, setOwnerData] = useState<Partial<Owner>>({
    name: 'PUPY Explorer',
    photos: [DEFAULT_OWNER_PHOTO],
    gender: '女',
    age: 25,
    residentCity: 'Shanghai',
    frequentCities: [],
    hobbies: ['Coffee', 'Travel', 'Photography'],
    mbti: 'ENFP',
    signature: 'Ready to build a warm pet-powered social profile.',
  });
  const [petData, setPetData] = useState<Partial<Pet>>({
    name: 'Little Bean',
    images: [DEFAULT_PET_PHOTO, DEFAULT_PET_PHOTO, DEFAULT_PET_PHOTO, DEFAULT_PET_PHOTO],
    gender: '公',
    personality: 'E系浓宠',
    type: 'Golden Retriever',
  });

  const changeStep = (nextStep: Step) => {
    setSubmitError(null);
    setStep(nextStep);
  };

  const shell = (key: Step, children: ReactNode) => (
    <motion.div
      key={key}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 p-8 flex flex-col justify-center space-y-10"
    >
      {children}
    </motion.div>
  );

  const addPhoto = (kind: 'owner' | 'pet') => {
    const mockPhoto = `https://picsum.photos/seed/${Date.now()}/${kind === 'owner' ? '400/600' : '600/600'}`;
    if (kind === 'owner') {
      setOwnerData((prev) => ({ ...prev, photos: [...(prev.photos || []), mockPhoto].slice(0, 6) }));
      return;
    }

    setPetData((prev) => ({ ...prev, images: [...(prev.images || []), mockPhoto].slice(0, 4) }));
  };

  const buildLocalProfile = () => {
    const owner: Owner = {
      name: ownerData.name || 'PUPY User',
      avatar: ownerData.photos?.[0] || DEFAULT_OWNER_PHOTO,
      photos: ownerData.photos || [DEFAULT_OWNER_PHOTO],
      gender: (ownerData.gender || '其他') as Owner['gender'],
      age: ownerData.age || 0,
      residentCity: ownerData.residentCity || 'Shanghai',
      frequentCities: ownerData.frequentCities || [],
      hobbies: ownerData.hobbies || [],
      mbti: ownerData.mbti || 'ENFP',
      signature: ownerData.signature || 'Hello from PUPY.',
    };

    const pet: Pet = {
      id: Date.now().toString(),
      name: petData.name || 'Pet Friend',
      images: petData.images || [DEFAULT_PET_PHOTO],
      type: petData.type || 'Pet Companion',
      gender: (petData.gender || '公') as Pet['gender'],
      personality: (petData.personality || 'E系浓宠') as Pet['personality'],
      hasPet: true,
      owner,
    };

    return { owner, pet };
  };

  const finishDemo = async () => {
    const { owner, pet } = buildLocalProfile();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onComplete({ owner, pet, mode: 'demo', user: null, token: null });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!loginData.account.trim() || !loginData.password.trim()) {
      setSubmitError('Enter email and password before login.');
      return;
    }
    if (!loginData.account.includes('@')) {
      setSubmitError('Live auth currently supports email login only.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const loginResult = await apiService.login(loginData.account.trim(), loginData.password.trim());
      const user = loginResult.data?.user;
      const token = loginResult.data?.token || null;
      const petsResult = await apiService.getPets();
      const primaryPet = petsResult.data?.[0];

      if (!user || !token || !primaryPet) {
        throw new Error('This account does not have a completed pet profile yet.');
      }

      await onComplete({
        owner: createOwnerFromApi(user),
        pet: createPetFromApi(primaryPet, user),
        mode: 'api',
        user,
        token,
      });
    } catch (error) {
      apiService.clearToken();
      setSubmitError(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    const { owner, pet } = buildLocalProfile();
    const username = owner.name || registerData.email.split('@')[0] || registerData.phone || 'pupy-user';
    const email = registerData.email.trim() || createSyntheticEmail(registerData.phone);
    const password =
      registerData.password.trim() || createBootstrapPassword(registerData.phone || registerData.email || username);

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const bootstrapResult = await apiService.bootstrapOnboarding({
        owner,
        pet,
        auth: {
          username,
          email,
          password,
          phone: registerData.phone.trim(),
          mode: registerData.email ? 'email' : 'phone',
          quickAccess: isQuickLogin,
        },
      });

      const user = bootstrapResult.data?.user;
      const apiPet = bootstrapResult.data?.pet;
      const token = bootstrapResult.data?.token || null;

      if (!user || !apiPet || !token) {
        throw new Error('Onboarding succeeded but session data is incomplete.');
      }

      await onComplete({
        owner: createOwnerFromApi(user),
        pet: createPetFromApi(apiPet, user),
        mode: 'api',
        user,
        token,
      });
    } catch (error) {
      apiService.clearToken();
      setSubmitError(error instanceof Error ? error.message : 'Onboarding failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-white flex flex-col max-w-md mx-auto overflow-y-auto no-scrollbar">
      {submitError && (
        <div className="px-6 pt-6">
          <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {submitError}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'login' &&
          shell(
            'login',
            <>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-primary/5">
                  <span className="material-symbols-outlined text-5xl text-primary">pets</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">PUPY</h1>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Pet-first social onboarding</p>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Email account" className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" value={loginData.account} onChange={(event) => setLoginData({ ...loginData, account: event.target.value })} />
                <input type="password" placeholder="Password" className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" value={loginData.password} onChange={(event) => setLoginData({ ...loginData, password: event.target.value })} />
                <button onClick={() => changeStep('forgot_password')} className="text-xs font-black text-primary text-right block w-full pr-2">Forgot password?</button>
              </div>
              <div className="space-y-4">
                <button onClick={handleLogin} disabled={isSubmitting} className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 italic disabled:opacity-70">
                  {isSubmitting ? 'Signing in...' : 'Enter PUPY'}
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsQuickLogin(false); changeStep('register_phone'); }} className="p-4 bg-slate-50 rounded-3xl text-xs font-black text-slate-500">Phone register</button>
                  <button onClick={() => { setIsQuickLogin(false); changeStep('register_email'); }} className="p-4 bg-slate-50 rounded-3xl text-xs font-black text-slate-500">Email register</button>
                </div>
                <div className="flex items-center gap-4 py-2"><div className="flex-1 h-px bg-slate-100" /><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Demo mode</span><div className="flex-1 h-px bg-slate-100" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsQuickLogin(true); changeStep('register_phone'); }} className="p-4 bg-white border border-slate-100 rounded-3xl text-xs font-black text-slate-500">Phone demo</button>
                  <button onClick={() => { setIsQuickLogin(true); changeStep('register_email'); }} className="p-4 bg-white border border-slate-100 rounded-3xl text-xs font-black text-slate-500">Email demo</button>
                </div>
              </div>
            </>,
          )}

        {step === 'register_choice' &&
          shell(
            'register_choice',
            <>
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">Choose your signup path</h2>
                <p className="text-sm text-slate-400 font-medium">Both paths keep the same visual flow. Email is best for real login.</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => { setIsQuickLogin(false); changeStep('register_phone'); }} className="w-full p-6 bg-slate-50 rounded-[2.5rem] text-left">
                  <p className="font-black text-slate-900">Phone flow</p>
                  <p className="text-xs text-slate-400 mt-1">Good for lightweight onboarding and demo-to-live migration.</p>
                </button>
                <button onClick={() => { setIsQuickLogin(false); changeStep('register_email'); }} className="w-full p-6 bg-slate-50 rounded-[2.5rem] text-left">
                  <p className="font-black text-slate-900">Email flow</p>
                  <p className="text-xs text-slate-400 mt-1">Best choice for real auth and ongoing account login.</p>
                </button>
              </div>
              <button onClick={() => changeStep('login')} className="text-sm font-bold text-slate-400">Back to login</button>
            </>,
          )}

        {(step === 'register_phone' || step === 'register_email') &&
          shell(
            step,
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">
                  {step === 'register_phone' ? (isQuickLogin ? 'Phone demo access' : 'Phone registration') : isQuickLogin ? 'Email demo access' : 'Email registration'}
                </h2>
                <p className="text-sm text-slate-400 font-medium">
                  {isQuickLogin ? 'This keeps the UI flow but finishes in local demo mode.' : 'Complete this first, then we will build owner and pet profiles.'}
                </p>
              </div>
              <div className="space-y-4">
                {step === 'register_phone' ? (
                  <>
                    <input type="tel" placeholder="Phone number" className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" value={registerData.phone} onChange={(event) => setRegisterData({ ...registerData, phone: event.target.value })} />
                    <input type="text" placeholder="Verification code" className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" value={registerData.code} onChange={(event) => setRegisterData({ ...registerData, code: event.target.value })} />
                  </>
                ) : (
                  <>
                    <input type="email" placeholder="Email address" className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" value={registerData.email} onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })} />
                    <input type={isQuickLogin ? 'text' : 'password'} placeholder={isQuickLogin ? 'Verification code' : 'Password'} className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" value={isQuickLogin ? registerData.code : registerData.password} onChange={(event) => isQuickLogin ? setRegisterData({ ...registerData, code: event.target.value }) : setRegisterData({ ...registerData, password: event.target.value })} />
                  </>
                )}
              </div>
              <button onClick={() => (isQuickLogin ? finishDemo() : changeStep('owner_basic'))} disabled={isSubmitting} className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 italic disabled:opacity-70">
                {isSubmitting ? 'Processing...' : isQuickLogin ? 'Continue in demo' : 'Next step'}
              </button>
              <button onClick={() => changeStep('login')} className="text-sm font-bold text-slate-400">Back to login</button>
            </>,
          )}

        {step === 'forgot_password' &&
          shell(
            'forgot_password',
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">Password reset</h2>
                <p className="text-sm text-slate-400 font-medium">This screen is preserved as UI for now. Live recovery can be wired later.</p>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Email or phone" className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" />
                <input type="text" placeholder="Verification code" className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" />
                <input type="password" placeholder="New password" className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-bold text-sm" />
              </div>
              <button onClick={() => changeStep('login')} className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 italic">Back to login</button>
            </>,
          )}

        {step === 'owner_basic' &&
          shell(
            'owner_basic',
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">Build owner profile</h2>
                <p className="text-sm text-slate-400 font-medium">Keep the same premium look, but now the data can sync to the backend.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {ownerData.photos?.map((photo, index) => (
                  <div key={photo + index} className="aspect-[3/4] rounded-2xl overflow-hidden relative">
                    <img src={photo} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
                {(ownerData.photos?.length || 0) < 6 && (
                  <button onClick={() => addPhoto('owner')} className="aspect-[3/4] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">+</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Display name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm" value={ownerData.name} onChange={(event) => setOwnerData({ ...ownerData, name: event.target.value })} />
                <input type="number" placeholder="Age" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm" value={ownerData.age} onChange={(event) => setOwnerData({ ...ownerData, age: Number(event.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="MBTI" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm" value={ownerData.mbti} onChange={(event) => setOwnerData({ ...ownerData, mbti: event.target.value.toUpperCase() })} />
                <select value={ownerData.residentCity} onChange={(event) => setOwnerData({ ...ownerData, residentCity: event.target.value })} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm appearance-none">
                  {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <textarea placeholder="Write one short signature" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm h-24 resize-none" value={ownerData.signature} onChange={(event) => setOwnerData({ ...ownerData, signature: event.target.value })} />
              <button onClick={() => changeStep('owner_hobbies')} className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl italic">Next step</button>
            </>,
          )}

        {step === 'owner_hobbies' &&
          shell(
            'owner_hobbies',
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">Choose your vibe</h2>
                <p className="text-sm text-slate-400 font-medium">Pick at least three interests so matching feels less generic.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {HOBBIES.map((hobby) => {
                  const selected = ownerData.hobbies?.includes(hobby);
                  return (
                    <button key={hobby} onClick={() => setOwnerData({ ...ownerData, hobbies: selected ? (ownerData.hobbies || []).filter((item) => item !== hobby) : [...(ownerData.hobbies || []), hobby] })} className={`px-5 py-3 rounded-2xl text-xs font-black ${selected ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      {hobby}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => changeStep('pet_basic')} disabled={(ownerData.hobbies?.length || 0) < 3} className={`w-full py-5 font-black rounded-3xl shadow-xl italic ${(ownerData.hobbies?.length || 0) >= 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                Continue to pet profile
              </button>
            </>,
          )}

        {step === 'pet_basic' &&
          shell(
            'pet_basic',
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">Create pet identity</h2>
                <p className="text-sm text-slate-400 font-medium">This keeps the existing showcase flow, but now ends in a real backend session.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {petData.images?.map((photo, index) => (
                  <div key={photo + index} className="aspect-square rounded-3xl overflow-hidden"><img src={photo} className="w-full h-full object-cover" alt="" /></div>
                ))}
                {(petData.images?.length || 0) < 4 && (
                  <button onClick={() => addPhoto('pet')} className="aspect-square rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">+</button>
                )}
              </div>
              <input type="text" placeholder="Pet name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm" value={petData.name} onChange={(event) => setPetData({ ...petData, name: event.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Breed or type" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm" value={petData.type} onChange={(event) => setPetData({ ...petData, type: event.target.value })} />
                <select value={petData.gender} onChange={(event) => setPetData({ ...petData, gender: event.target.value as Pet['gender'] })} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm appearance-none">
                  <option value="公">Male</option>
                  <option value="母">Female</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPetData({ ...petData, personality: 'E系浓宠' })} className={`p-5 rounded-[2rem] border-2 text-left ${petData.personality === 'E系浓宠' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white'}`}>
                  <p className="font-black text-slate-900">E-type</p>
                  <p className="text-xs text-slate-400 mt-1">Open, playful, and social.</p>
                </button>
                <button onClick={() => setPetData({ ...petData, personality: 'I系淡宠' })} className={`p-5 rounded-[2rem] border-2 text-left ${petData.personality === 'I系淡宠' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white'}`}>
                  <p className="font-black text-slate-900">I-type</p>
                  <p className="text-xs text-slate-400 mt-1">Calm, observant, and gentle.</p>
                </button>
              </div>
              <button onClick={handleRegister} disabled={isSubmitting || !petData.name || (petData.images?.length || 0) < 4} className={`w-full py-5 font-black rounded-3xl shadow-2xl italic ${!isSubmitting && petData.name && (petData.images?.length || 0) >= 4 ? 'bg-primary text-white shadow-primary/30' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                {isSubmitting ? 'Creating account...' : 'Launch PUPY profile'}
              </button>
            </>,
          )}
      </AnimatePresence>
    </div>
  );
}
