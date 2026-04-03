import { useEffect, useState, startTransition } from 'react';
import { motion } from 'motion/react';
import apiService, { type AdminOverview } from '../services/api';

interface AdminDashboardProps {
  onBack: () => void;
  currentUserEmail?: string | null;
}

export default function AdminDashboard({ onBack, currentUserEmail }: AdminDashboardProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadOverview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.getAdminOverview();
        if (!alive) return;

        startTransition(() => {
          setOverview(response.data || null);
          setError(null);
        });
      } catch (loadError) {
        if (!alive) return;
        const message = loadError instanceof Error ? loadError.message : 'Failed to load admin overview.';
        startTransition(() => {
          setError(message);
          setOverview(null);
        });
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      alive = false;
    };
  }, []);

  const stats = overview?.stats
    ? [
        { label: 'Users', value: overview.stats.users, icon: 'group' },
        { label: 'Pets', value: overview.stats.pets, icon: 'pets' },
        { label: 'Matches', value: overview.stats.matches, icon: 'favorite' },
        { label: 'Messages', value: overview.stats.messages, icon: 'chat' },
        { label: 'Diaries', value: overview.stats.diaries, icon: 'menu_book' },
        { label: 'Products', value: overview.stats.products, icon: 'shopping_bag' },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[180] bg-surface flex flex-col max-w-md mx-auto">
      <header className="p-6 flex items-center gap-4 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <div>
          <h2 className="text-xl font-black font-headline text-slate-900 tracking-tight">Platform Overview</h2>
          <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">Backend panel</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-10 space-y-6 no-scrollbar">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.24),transparent_55%)]" />
          <div className="relative space-y-3">
            <p className="text-[11px] font-black tracking-[0.18em] uppercase text-white/50">Signed in as</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black italic tracking-tight">Control Tower</h3>
                <p className="text-sm text-white/70 mt-1">{currentUserEmail || 'No active account'}</p>
              </div>
              <div className="w-14 h-14 rounded-[1.4rem] bg-white/10 backdrop-blur flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-emerald-300">monitoring</span>
              </div>
            </div>
          </div>
        </motion.section>

        {isLoading && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-3">
            <div className="h-5 w-40 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-[1.8rem] bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-[1.8rem] bg-slate-100 animate-pulse" />
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-white rounded-[2.5rem] border border-red-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-3 text-red-500">
              <span className="material-symbols-outlined">shield_lock</span>
              <h3 className="font-black text-slate-900">Admin access not ready</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-slate-400">
              Add the current email to `ADMIN_EMAILS` in backend `.env` to enable this panel.
            </p>
          </div>
        )}

        {!isLoading && overview && (
          <>
            <section className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 space-y-3"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-[11px] font-black tracking-[0.16em] uppercase text-slate-400">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Integration health</h3>
                  <p className="text-xs text-slate-400 font-bold tracking-[0.14em] uppercase">API and infrastructure</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-[1.8rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Environment</p>
                  <p className="text-sm font-black text-slate-900 mt-2">{overview.health.environment}</p>
                </div>
                <div className="bg-slate-50 rounded-[1.8rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">API base</p>
                  <p className="text-sm font-black text-slate-900 mt-2 break-all">{overview.health.apiBaseUrl}</p>
                </div>
                <div className="bg-slate-50 rounded-[1.8rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Supabase</p>
                  <p className={`text-sm font-black mt-2 ${overview.health.supabaseConfigured ? 'text-emerald-600' : 'text-red-500'}`}>
                    {overview.health.supabaseConfigured ? 'Configured' : 'Missing config'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-[1.8rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Google AI</p>
                  <p className={`text-sm font-black mt-2 ${overview.health.googleAiConfigured ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {overview.health.googleAiConfigured ? 'Configured' : 'Fallback mode'}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900">Recent users</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{overview.recentUsers.length} records</p>
              </div>
              <div className="space-y-3">
                {overview.recentUsers.map((user) => (
                  <div key={user.id} className="bg-slate-50 rounded-[1.8rem] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{user.username}</p>
                        <p className="text-xs text-slate-500 mt-1 break-all">{user.email}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] ${user.is_verified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {user.is_verified ? 'Verified' : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900">Recent messages</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{overview.recentMessages.length} records</p>
              </div>
              <div className="space-y-3">
                {overview.recentMessages.map((message) => (
                  <div key={message.id} className="bg-slate-50 rounded-[1.8rem] p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black tracking-[0.14em] uppercase text-slate-400">
                        {message.sender?.username || 'Unknown'} to {message.receiver?.username || 'Unknown'}
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium">{message.created_at?.slice(0, 10) || '--'}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{message.content}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
