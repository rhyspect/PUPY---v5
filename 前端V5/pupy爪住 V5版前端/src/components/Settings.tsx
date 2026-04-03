import { useMemo, useState } from 'react';
import FeatureModal from './FeatureModal';
import type { AppLocale } from '../utils/locale';
import { localeOptions } from '../utils/locale';

interface SettingsProps {
  onBack: () => void;
  onReset: () => void;
  onOpenAdmin: () => void;
  onLocaleChange: (locale: AppLocale) => void;
  locale: AppLocale;
  userPet: { name: string; image?: string; hasPet: boolean } | null;
  currentUserEmail?: string | null;
  backendStatus: {
    connected: boolean;
    environment?: string;
    baseUrl: string;
    message?: string;
  };
}

const DEFAULT_PET_IMAGE =
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400';

type GeneralFeature = 'notifications' | 'privacy' | 'language' | 'theme' | null;

export default function Settings({
  onBack,
  onReset,
  onOpenAdmin,
  onLocaleChange,
  locale,
  userPet,
  currentUserEmail,
  backendStatus,
}: SettingsProps) {
  const [activeFeature, setActiveFeature] = useState<GeneralFeature>(null);

  const rows = [
    { key: 'notifications', icon: 'notifications', label: '通知中心', tone: 'text-blue-500' },
    { key: 'privacy', icon: 'lock', label: '隐私与安全', tone: 'text-emerald-500' },
    { key: 'language', icon: 'language', label: '语言设置', tone: 'text-orange-500' },
    { key: 'theme', icon: 'palette', label: '主题样式', tone: 'text-pink-500' },
  ] as const;

  const featureContent = useMemo(() => {
    switch (activeFeature) {
      case 'notifications':
        return {
          title: '通知中心',
          description: '这里会统一接入配对提醒、聊天未读、繁育进度和系统消息。',
          items: ['未读消息聚合', '匹配成功提醒', '订单与繁育节点通知'],
        };
      case 'privacy':
        return {
          title: '隐私与安全',
          description: '下一步会在这里接入资料可见范围、拉黑名单、聊天风控和登录安全。',
          items: ['资料可见范围', '拉黑与举报', '登录与设备安全'],
        };
      case 'theme':
        return {
          title: '主题样式',
          description: '主题样式会在后续支持浅色、深色和品牌色板的切换。',
          items: ['品牌色变量预览', '卡片圆角与阴影配置', '夜间模式预留'],
        };
      default:
        return null;
    }
  }, [activeFeature]);

  return (
    <div className="fixed inset-0 z-[150] bg-surface flex flex-col max-w-md mx-auto">
      <header className="p-6 flex items-center gap-4 bg-white shadow-sm border-b border-slate-100">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <div>
          <h2 className="text-xl font-black font-headline text-slate-900 tracking-tight">设置中心</h2>
          <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">Session and controls</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">宠物档案</h3>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-primary/10">
              <img src={userPet?.image || DEFAULT_PET_IMAGE} alt={userPet?.name || 'Pet'} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-slate-900">{userPet?.name || '还没有宠物档案'}</h4>
              <p className="text-xs font-medium text-slate-500">
                {userPet?.hasPet ? '已连接真实宠物档案' : '当前为数字体验档案'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 break-all">{currentUserEmail || '当前未登录账号'}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">后端状态</h3>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-900">API 连接</p>
                <p className="text-xs text-slate-500 mt-1 break-all">{backendStatus.baseUrl}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] ${backendStatus.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {backendStatus.connected ? '在线' : '降级'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-[1.6rem] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">环境</p>
                <p className="text-sm font-black text-slate-900 mt-2">{backendStatus.environment || '未知'}</p>
              </div>
              <button onClick={onOpenAdmin} className="bg-slate-900 text-white rounded-[1.6rem] p-4 text-left shadow-lg">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">后台</p>
                <p className="text-sm font-black mt-2">打开后端面板</p>
              </button>
            </div>
            {backendStatus.message && <p className="text-xs text-slate-400">{backendStatus.message}</p>}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">通用设置</h3>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            {rows.map((row) => (
              <button
                key={row.key}
                onClick={() => setActiveFeature(row.key as GeneralFeature)}
                className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
              >
                <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${row.tone}`}>
                  <span className="material-symbols-outlined">{row.icon}</span>
                </div>
                <span className="flex-1 text-left font-medium text-slate-700">{row.label}</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">风险操作</h3>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <button onClick={onReset} className="w-full flex items-center gap-4 p-5 hover:bg-red-50 text-red-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined">restart_alt</span>
              </div>
              <span className="flex-1 text-left font-medium">重置应用与引导流程</span>
            </button>
          </div>
        </section>

        <div className="text-center py-8">
          <p className="text-[10px] font-bold text-slate-300 tracking-[0.2em]">PUPY V5 CONFIGURED SHELL</p>
        </div>
      </div>

      <FeatureModal
        open={activeFeature === 'language'}
        title="语言设置"
        description="前后端默认使用中文，同时保留英文作为第二语言。切换后新的请求会携带语言偏好。"
        items={localeOptions.map((option) => `${option.label}${locale === option.value ? ' · 当前' : ''}：${option.description}`)}
        confirmLabel={locale === 'zh-CN' ? '切换为 English' : '切换为中文'}
        cancelLabel="关闭"
        onClose={() => setActiveFeature(null)}
        onConfirm={() => onLocaleChange(locale === 'zh-CN' ? 'en-US' : 'zh-CN')}
      />

      <FeatureModal
        open={activeFeature !== null && activeFeature !== 'language' && Boolean(featureContent)}
        title={featureContent?.title || ''}
        description={featureContent?.description}
        items={featureContent?.items}
        onClose={() => setActiveFeature(null)}
      />
    </div>
  );
}
