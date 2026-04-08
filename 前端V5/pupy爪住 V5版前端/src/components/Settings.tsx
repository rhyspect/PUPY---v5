import { useMemo, useState } from 'react';
import FeatureModal from './FeatureModal';
import BrandMark from './BrandMark';
import type { AppLocale } from '../utils/locale';
import { localeOptions } from '../utils/locale';
import { getAppCopy } from '../utils/copy';

interface SettingsProps {
  onBack: () => void;
  onReset: () => void;
  onOpenAdmin: () => void;
  onLocaleChange: (locale: AppLocale) => void;
  locale: AppLocale;
  canOpenAdmin: boolean;
  userPet: { name: string; image?: string; hasPet: boolean } | null;
  currentUserEmail?: string | null;
  backendStatus: {
    connected: boolean;
    environment?: string;
    baseUrl: string;
    message?: string;
  };
}

const DEFAULT_PET_IMAGE = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400';

type GeneralFeature = 'notifications' | 'privacy' | 'language' | 'theme' | null;

export default function Settings({
  onBack,
  onReset,
  onOpenAdmin,
  onLocaleChange,
  locale,
  canOpenAdmin,
  userPet,
  currentUserEmail,
  backendStatus,
}: SettingsProps) {
  const [activeFeature, setActiveFeature] = useState<GeneralFeature>(null);
  const copy = getAppCopy(locale);

  const rows = [
    { key: 'notifications', icon: 'notifications', label: copy.settings.notifications, tone: 'text-blue-500' },
    { key: 'privacy', icon: 'lock', label: copy.settings.privacy, tone: 'text-emerald-500' },
    { key: 'language', icon: 'language', label: copy.settings.language, tone: 'text-orange-500' },
    { key: 'theme', icon: 'palette', label: copy.settings.theme, tone: 'text-pink-500' },
  ] as const;

  const featureContent = useMemo(() => {
    switch (activeFeature) {
      case 'notifications':
        return {
          title: copy.settings.notifications,
          description: copy.settings.notificationsDescription,
          items: copy.settings.notificationsItems,
        };
      case 'privacy':
        return {
          title: copy.settings.privacy,
          description: copy.settings.privacyDescription,
          items: copy.settings.privacyItems,
        };
      case 'theme':
        return {
          title: copy.settings.theme,
          description: copy.settings.themeDescription,
          items: copy.settings.themeItems,
        };
      default:
        return null;
    }
  }, [activeFeature, copy]);

  return (
    <div className="fixed inset-0 z-[150] mx-auto flex max-w-md flex-col bg-surface">
      <header className="glass border-b border-white/50 p-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-slate-400 transition hover:text-primary" aria-label="返回首页">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 font-headline">{copy.settings.title}</h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{copy.shell.sessionAndControls}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        <section className="space-y-4">
          <div className="px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">宠物与账号</h3>
          </div>
          <div className="frost-card floating-highlight rounded-[2.6rem] px-6 py-6">
            <div className="mb-5">
              <BrandMark mode="lockup" size="sm" subtitle="爪住 · Account & Companion Controls" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-18 w-18 overflow-hidden rounded-[1.6rem] ring-4 ring-primary/10">
                <img src={userPet?.image || DEFAULT_PET_IMAGE} alt={userPet?.name || 'Pet'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="truncate text-lg font-black text-slate-900">{userPet?.name || copy.settings.noPetProfile}</h4>
                <p className="mt-1 text-xs font-medium text-slate-500">{userPet?.hasPet ? copy.settings.realPetProfile : copy.settings.digitalProfile}</p>
                <p className="mt-2 break-all text-[11px] text-slate-400">{currentUserEmail || copy.settings.notLoggedIn}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">后端状态</h3>
          </div>
          <div className="brand-surface rounded-[2.6rem] p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-900">{copy.settings.apiConnection}</p>
                <p className="mt-1 break-all text-xs text-slate-500">{backendStatus.baseUrl}</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${backendStatus.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {backendStatus.connected ? copy.settings.online : copy.settings.degraded}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="soft-panel rounded-[1.5rem] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{copy.settings.environment}</p>
                <p className="mt-2 text-sm font-black text-slate-900">{backendStatus.environment || copy.settings.unknown}</p>
              </div>
              {canOpenAdmin ? (
                <button type="button" onClick={onOpenAdmin} className="rounded-[1.5rem] bg-slate-900 p-4 text-left text-white shadow-lg" aria-label={copy.settings.openAdminPanel}>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">{copy.settings.admin}</p>
                  <p className="mt-2 text-sm font-black">{copy.settings.openAdminPanel}</p>
                </button>
              ) : (
                <div className="soft-panel rounded-[1.5rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{copy.settings.admin}</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{'当前账号暂无后台权限'}</p>
                </div>
              )}
            </div>
            {backendStatus.message && <p className="text-xs leading-relaxed text-slate-400">{backendStatus.message}</p>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">通用设置</h3>
          </div>
          <div className="glass overflow-hidden rounded-[2.6rem] border border-white/50 shadow-sm">
            {rows.map((row) => (
              <button
                type="button"
                key={row.key}
                onClick={() => setActiveFeature(row.key as GeneralFeature)}
                className="flex w-full items-center gap-4 border-b border-white/55 px-5 py-5 text-left transition-colors last:border-none hover:bg-white/50"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 ${row.tone}`}>
                  <span className="material-symbols-outlined">{row.icon}</span>
                </div>
                <span className="flex-1 font-medium text-slate-700">{row.label}</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">风险操作</h3>
          </div>
          <div className="glass overflow-hidden rounded-[2.6rem] border border-white/50 shadow-sm">
            <button type="button" onClick={onReset} className="flex w-full items-center gap-4 px-5 py-5 text-red-500 transition-colors hover:bg-red-50/80" aria-label="重置应用与引导流程">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                <span className="material-symbols-outlined">restart_alt</span>
              </div>
              <span className="flex-1 text-left font-medium">{copy.settings.reset}</span>
            </button>
          </div>
        </section>

        <div className="py-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">{copy.settings.configuredShell}</p>
        </div>
      </div>

      <FeatureModal
        open={activeFeature === 'language'}
        title={copy.settings.languageTitle}
        description={copy.settings.languageDescription}
        items={localeOptions.map((option) => `${option.label}${locale === option.value ? ` · ${copy.settings.currentSuffix}` : ''}：${option.description}`)}
        confirmLabel={locale === 'zh-CN' ? copy.settings.switchToEnglish : copy.settings.switchToChinese}
        cancelLabel={copy.settings.close}
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
