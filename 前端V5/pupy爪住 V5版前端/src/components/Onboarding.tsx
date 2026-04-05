import { useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Owner, Pet } from '../types';
import apiService, { type ApiUser } from '../services/api';
import { createOwnerFromApi, createPetFromApi } from '../utils/adapters';

type Step =
  | 'login'
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

const HOBBIES = ['咖啡巡店', '摄影', '旅行', '露营', '阅读', '健身', '骑行', '编程', '烘焙', '电影', '音乐', '徒步'];
const CITIES = ['上海', '北京', '深圳', '广州', '杭州', '成都', '南京', '武汉'];
const DEFAULT_OWNER_PHOTO = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400';
const DEFAULT_PET_PHOTO = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400';

const createSyntheticEmail = (seed: string) => `${seed.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `pupy${Date.now()}`}@pupy.local`;
const createBootstrapPassword = (seed: string) => `${seed.replace(/\s+/g, '').slice(0, 12) || 'PUPY'}#2026`;

function StepShell({ step, eyebrow, title, description, children }: { step: Step; eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 px-6 pb-10 pt-6">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-primary/70">{eyebrow}</p>
          <h1 className="text-[2.1rem] font-black tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-[1.6rem] border border-white/60 bg-white/75 px-4 py-4 text-sm text-slate-700 shadow-sm focus:border-primary/30 focus:bg-white focus:outline-none ${props.className || ''}`} />;
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full resize-none rounded-[1.6rem] border border-white/60 bg-white/75 px-4 py-4 text-sm text-slate-700 shadow-sm focus:border-primary/30 focus:bg-white focus:outline-none ${props.className || ''}`} />;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('login');
  const [isQuickLogin, setIsQuickLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ account: '', password: '' });
  const [registerData, setRegisterData] = useState({ phone: '', email: '', code: '', password: '' });
  const [ownerData, setOwnerData] = useState<Partial<Owner>>({
    name: 'PUPY 探索者',
    photos: [DEFAULT_OWNER_PHOTO],
    gender: '女',
    age: 25,
    residentCity: '上海',
    frequentCities: ['杭州', '苏州'],
    hobbies: ['咖啡巡店', '旅行', '摄影'],
    mbti: 'ENFP',
    signature: '希望在养宠生活里认识温柔又有趣的人。',
  });
  const [petData, setPetData] = useState<Partial<Pet>>({
    name: '小团子',
    images: [DEFAULT_PET_PHOTO, DEFAULT_PET_PHOTO, DEFAULT_PET_PHOTO, DEFAULT_PET_PHOTO],
    gender: '公',
    personality: 'E系活泼',
    type: '金毛',
  });

  const changeStep = (nextStep: Step) => {
    setSubmitError(null);
    setStep(nextStep);
  };

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
      name: ownerData.name || 'PUPY 用户',
      avatar: ownerData.photos?.[0] || DEFAULT_OWNER_PHOTO,
      photos: ownerData.photos || [DEFAULT_OWNER_PHOTO],
      gender: ownerData.gender || '其他',
      age: ownerData.age || 0,
      residentCity: ownerData.residentCity || '上海',
      frequentCities: ownerData.frequentCities || [],
      hobbies: ownerData.hobbies || [],
      mbti: ownerData.mbti || 'ENFP',
      signature: ownerData.signature || '你好，很高兴在 PUPY 认识你。',
    };

    const pet: Pet = {
      id: Date.now().toString(),
      name: petData.name || '宠物伙伴',
      images: petData.images || [DEFAULT_PET_PHOTO],
      type: petData.type || '宠物伙伴',
      gender: petData.gender || '其他',
      personality: petData.personality || '亲人温和',
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
      setSubmitError('请先填写邮箱和密码。');
      return;
    }
    if (!loginData.account.includes('@')) {
      setSubmitError('当前真实登录仅支持邮箱账号。');
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
        throw new Error('该账号还没有完成宠物建档。');
      }

      await onComplete({ owner: createOwnerFromApi(user), pet: createPetFromApi(primaryPet, user), mode: 'api', user, token });
    } catch (error) {
      apiService.clearToken();
      setSubmitError(error instanceof Error ? error.message : '登录失败，请稍后再试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    const { owner, pet } = buildLocalProfile();
    const email = registerData.email.trim() || createSyntheticEmail(registerData.phone);
    const rawName = owner.name?.trim();
    const username = !rawName || rawName === '\u0050\u0055\u0050\u0059 \u63a2\u7d22\u8005'
      ? email.split('@')[0] || registerData.phone || 'pupy-user'
      : rawName;
    const password = registerData.password.trim() || createBootstrapPassword(registerData.phone || registerData.email || username);

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
        throw new Error('建档已提交，但会话信息不完整。');
      }

      await onComplete({ owner: createOwnerFromApi(user), pet: createPetFromApi(apiPet, user), mode: 'api', user, token });
    } catch (error) {
      apiService.clearToken();
      setSubmitError(error instanceof Error ? error.message : '建档失败，请稍后再试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] mx-auto flex max-w-md flex-col overflow-y-auto bg-surface no-scrollbar">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(198,245,223,0.9),transparent_66%)]" />
      <div className="relative z-10 px-6 pt-6">
        <div className="frost-card rounded-[2.2rem] px-5 py-4 text-center floating-highlight">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary/70">PUPY</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">默认中文 · 真实建档链路</p>
        </div>
      </div>

      {submitError && <div className="relative z-10 px-6 pt-5"><div className="rounded-[1.6rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">{submitError}</div></div>}

      <AnimatePresence mode="wait">
        {step === 'login' && (
          <StepShell step="login" eyebrow="欢迎回来" title="先确认你的会话身份" description="支持真实邮箱登录，也支持体验模式快速试用。真实登录会优先恢复已建档的宠物与消息记录。">
            <div className="space-y-5 rounded-[2.2rem] frost-card p-6">
              <Field label="邮箱账号"><Input type="email" placeholder="例如：rhyssvv@gmail.com" value={loginData.account} onChange={(event) => setLoginData({ ...loginData, account: event.target.value })} /></Field>
              <Field label="登录密码"><Input type="password" placeholder="输入密码" value={loginData.password} onChange={(event) => setLoginData({ ...loginData, password: event.target.value })} /></Field>
              <button type="button" onClick={() => changeStep('forgot_password')} className="text-right text-xs font-black text-primary">忘记密码？</button>
            </div>
            <div className="space-y-4">
              <button type="button" onClick={handleLogin} disabled={isSubmitting} className="w-full rounded-[1.8rem] bg-primary py-4 text-white font-black shadow-lg shadow-primary/20 disabled:opacity-60">{isSubmitting ? '正在登录…' : '进入 PUPY'}</button>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setIsQuickLogin(false); changeStep('register_phone'); }} className="soft-panel rounded-[1.6rem] px-4 py-4 text-xs font-black text-slate-600">手机号注册</button>
                <button type="button" onClick={() => { setIsQuickLogin(false); changeStep('register_email'); }} className="soft-panel rounded-[1.6rem] px-4 py-4 text-xs font-black text-slate-600">邮箱注册</button>
              </div>
              <div className="flex items-center gap-4 py-1"><div className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">体验模式</span><div className="h-px flex-1 bg-slate-200" /></div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setIsQuickLogin(true); changeStep('register_phone'); }} className="rounded-[1.6rem] border border-white/60 bg-white/75 px-4 py-4 text-xs font-black text-slate-600">手机号体验</button>
                <button type="button" onClick={() => { setIsQuickLogin(true); changeStep('register_email'); }} className="rounded-[1.6rem] border border-white/60 bg-white/75 px-4 py-4 text-xs font-black text-slate-600">邮箱体验</button>
              </div>
            </div>
          </StepShell>
        )}

        {step === 'register_phone' && (
          <StepShell step="register_phone" eyebrow="手机号入口" title={isQuickLogin ? '手机号体验进入' : '手机号注册'} description={isQuickLogin ? '保留完整视觉流程，但最终进入本地体验模式。' : '完成这一页后继续建立主人与宠物档案。'}>
            <div className="space-y-5 rounded-[2.2rem] frost-card p-6">
              <Field label="手机号"><Input type="tel" placeholder="输入手机号" value={registerData.phone} onChange={(event) => setRegisterData({ ...registerData, phone: event.target.value })} /></Field>
              <Field label="验证码"><Input type="text" placeholder="输入验证码" value={registerData.code} onChange={(event) => setRegisterData({ ...registerData, code: event.target.value })} /></Field>
            </div>
            <div className="space-y-3">
              <button type="button" onClick={() => (isQuickLogin ? finishDemo() : changeStep('owner_basic'))} disabled={isSubmitting} className="w-full rounded-[1.8rem] bg-primary py-4 text-white font-black shadow-lg shadow-primary/20 disabled:opacity-60">{isSubmitting ? '处理中…' : isQuickLogin ? '进入体验模式' : '继续完善档案'}</button>
              <button type="button" onClick={() => changeStep('login')} className="w-full text-sm font-bold text-slate-400">返回登录</button>
            </div>
          </StepShell>
        )}

        {step === 'register_email' && (
          <StepShell step="register_email" eyebrow="邮箱入口" title={isQuickLogin ? '邮箱体验进入' : '邮箱注册'} description={isQuickLogin ? '如果你想先看完整界面，可先走体验链路。' : '邮箱注册更适合长期登录与后续权限管理。'}>
            <div className="space-y-5 rounded-[2.2rem] frost-card p-6">
              <Field label="邮箱地址"><Input type="email" placeholder="例如：hello@pupy.app" value={registerData.email} onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })} /></Field>
              <Field label={isQuickLogin ? '验证码' : '登录密码'}><Input type={isQuickLogin ? 'text' : 'password'} placeholder={isQuickLogin ? '输入验证码' : '设置密码'} value={isQuickLogin ? registerData.code : registerData.password} onChange={(event) => isQuickLogin ? setRegisterData({ ...registerData, code: event.target.value }) : setRegisterData({ ...registerData, password: event.target.value })} /></Field>
            </div>
            <div className="space-y-3">
              <button type="button" onClick={() => (isQuickLogin ? finishDemo() : changeStep('owner_basic'))} disabled={isSubmitting} className="w-full rounded-[1.8rem] bg-primary py-4 text-white font-black shadow-lg shadow-primary/20 disabled:opacity-60">{isSubmitting ? '处理中…' : isQuickLogin ? '进入体验模式' : '继续完善档案'}</button>
              <button type="button" onClick={() => changeStep('login')} className="w-full text-sm font-bold text-slate-400">返回登录</button>
            </div>
          </StepShell>
        )}

        {step === 'forgot_password' && (
          <StepShell step="forgot_password" eyebrow="找回密码" title="重置入口已预留" description="这个流程目前保留为可见入口，后续可接入真实短信或邮件找回。">
            <div className="space-y-5 rounded-[2.2rem] frost-card p-6">
              <Field label="邮箱或手机号"><Input type="text" placeholder="输入账号" /></Field>
              <Field label="验证码"><Input type="text" placeholder="输入验证码" /></Field>
              <Field label="新密码"><Input type="password" placeholder="设置新密码" /></Field>
            </div>
            <button type="button" onClick={() => changeStep('login')} className="w-full rounded-[1.8rem] bg-primary py-4 text-white font-black shadow-lg shadow-primary/20">返回登录</button>
          </StepShell>
        )}

        {step === 'owner_basic' && (
          <StepShell step="owner_basic" eyebrow="步骤 1" title="先建立主人的真实气质" description="这一步会影响发现页和匹配推荐，让用户不只看到宠物，也能感知主人气质。">
            <div className="space-y-5 rounded-[2.2rem] frost-card p-6">
              <div className="grid grid-cols-3 gap-3">
                {ownerData.photos?.map((photo, index) => <div key={photo + index} className="aspect-[3/4] overflow-hidden rounded-[1.4rem] bg-slate-100"><img src={photo} className="h-full w-full object-cover" alt="主人照片" /></div>)}
                {(ownerData.photos?.length || 0) < 6 && <button type="button" onClick={() => addPhoto('owner')} className="aspect-[3/4] rounded-[1.4rem] border border-dashed border-slate-300 bg-white/80 text-slate-400 text-2xl">+</button>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="昵称"><Input type="text" placeholder="输入展示昵称" value={ownerData.name} onChange={(event) => setOwnerData({ ...ownerData, name: event.target.value })} /></Field>
                <Field label="年龄"><Input type="number" placeholder="输入年龄" value={ownerData.age} onChange={(event) => setOwnerData({ ...ownerData, age: Number(event.target.value) })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="MBTI"><Input type="text" placeholder="例如 ENFP" value={ownerData.mbti} onChange={(event) => setOwnerData({ ...ownerData, mbti: event.target.value.toUpperCase() })} /></Field>
                <Field label="常驻城市"><select value={ownerData.residentCity} onChange={(event) => setOwnerData({ ...ownerData, residentCity: event.target.value })} className="w-full rounded-[1.6rem] border border-white/60 bg-white/75 px-4 py-4 text-sm text-slate-700 shadow-sm focus:border-primary/30 focus:bg-white focus:outline-none">{CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></Field>
              </div>
              <Field label="个人签名"><TextArea rows={3} placeholder="写一句让人记住你的介绍" value={ownerData.signature} onChange={(event) => setOwnerData({ ...ownerData, signature: event.target.value })} /></Field>
            </div>
            <button type="button" onClick={() => changeStep('owner_hobbies')} className="w-full rounded-[1.8rem] bg-slate-900 py-4 text-white font-black shadow-lg shadow-slate-900/15">继续下一步</button>
          </StepShell>
        )}

        {step === 'owner_hobbies' && (
          <StepShell step="owner_hobbies" eyebrow="步骤 2" title="补足生活方式标签" description="至少选择 3 个兴趣标签，让推荐结果不只停留在宠物类型层面。">
            <div className="rounded-[2.2rem] frost-card p-6"><div className="flex flex-wrap gap-3">{HOBBIES.map((hobby) => { const selected = ownerData.hobbies?.includes(hobby); return <button key={hobby} type="button" onClick={() => setOwnerData({ ...ownerData, hobbies: selected ? (ownerData.hobbies || []).filter((item) => item !== hobby) : [...(ownerData.hobbies || []), hobby] })} className={`rounded-[1.4rem] px-4 py-3 text-xs font-black transition ${selected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/80 text-slate-500 border border-white/60'}`}>{hobby}</button>; })}</div></div>
            <button type="button" onClick={() => changeStep('pet_basic')} disabled={(ownerData.hobbies?.length || 0) < 3} className={`w-full rounded-[1.8rem] py-4 font-black ${(ownerData.hobbies?.length || 0) >= 3 ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15' : 'bg-slate-100 text-slate-300'}`}>继续宠物建档</button>
          </StepShell>
        )}

        {step === 'pet_basic' && (
          <StepShell step="pet_basic" eyebrow="步骤 3" title="完成宠物身份卡" description="这一步决定发现页、消息页和后台审核里的核心展示信息。">
            <div className="space-y-5 rounded-[2.2rem] frost-card p-6">
              <div className="grid grid-cols-2 gap-4">{petData.images?.map((photo, index) => <div key={photo + index} className="aspect-square overflow-hidden rounded-[1.6rem] bg-slate-100"><img src={photo} className="h-full w-full object-cover" alt="宠物照片" /></div>)}</div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="宠物昵称"><Input type="text" placeholder="输入宠物名字" value={petData.name} onChange={(event) => setPetData({ ...petData, name: event.target.value })} /></Field>
                <Field label="品种 / 类型"><Input type="text" placeholder="例如金毛、布偶、柯基" value={petData.type} onChange={(event) => setPetData({ ...petData, type: event.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="宠物性别"><select value={petData.gender} onChange={(event) => setPetData({ ...petData, gender: event.target.value })} className="w-full rounded-[1.6rem] border border-white/60 bg-white/75 px-4 py-4 text-sm text-slate-700 shadow-sm focus:border-primary/30 focus:bg-white focus:outline-none"><option value="公">公</option><option value="母">母</option></select></Field>
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">性格倾向</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setPetData({ ...petData, personality: 'E系活泼' })} className={`rounded-[1.5rem] border p-4 text-left ${petData.personality === 'E系活泼' ? 'border-primary bg-primary/5 text-primary' : 'border-white/60 bg-white/75 text-slate-600'}`}><p className="font-black">E 系</p><p className="mt-1 text-[11px] leading-relaxed">热情、黏人、社交感强</p></button>
                    <button type="button" onClick={() => setPetData({ ...petData, personality: 'I系安静' })} className={`rounded-[1.5rem] border p-4 text-left ${petData.personality === 'I系安静' ? 'border-primary bg-primary/5 text-primary' : 'border-white/60 bg-white/75 text-slate-600'}`}><p className="font-black">I 系</p><p className="mt-1 text-[11px] leading-relaxed">安静、敏感、观察型</p></button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button type="button" onClick={handleRegister} disabled={isSubmitting || !petData.name || (petData.images?.length || 0) < 4} className={`w-full rounded-[1.8rem] py-4 font-black shadow-lg ${!isSubmitting && petData.name && (petData.images?.length || 0) >= 4 ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 text-slate-300'}`}>{isSubmitting ? '正在创建账号…' : '完成建档并进入 App'}</button>
              <button type="button" onClick={() => addPhoto('pet')} className="w-full text-sm font-bold text-slate-400">补一张宠物照片</button>
            </div>
          </StepShell>
        )}
      </AnimatePresence>
    </div>
  );
}
