import { useEffect, useState, startTransition } from 'react';
import { motion } from 'motion/react';
import apiService, { type AdminOverview } from '../services/api';
import BrandMark from './BrandMark';
import BrandEmptyState from './BrandEmptyState';

interface AdminDashboardProps {
  onBack: () => void;
  currentUserEmail?: string | null;
  canAccess: boolean;
}

function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <BrandEmptyState compact icon="monitoring" title={title} description={description} className="rounded-[1.7rem]" />
  );
}

export default function AdminDashboard({ onBack, currentUserEmail, canAccess }: AdminDashboardProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const adminPanelUrl = `${apiService.getBaseUrl()}/api/admin/panel`;

  const openOpsConsole = () => {
    if (typeof window === 'undefined') return;
    window.open(adminPanelUrl, '_blank', 'noopener,noreferrer');
  };

  const loadOverview = async () => {
    if (!canAccess) {
      setIsLoading(false);
      setOverview(null);
      setError('\u5f53\u524d\u8d26\u53f7\u6682\u65e0\u540e\u53f0\u6743\u9650\u3002');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getAdminOverview();
      startTransition(() => {
        setOverview(response.data || null);
        setError(null);
      });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '后台总览加载失败。';
      startTransition(() => {
        setError(message);
        setOverview(null);
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      if (!canAccess) {
        setOverview(null);
        setError('\u5f53\u524d\u8d26\u53f7\u6682\u65e0\u540e\u53f0\u6743\u9650\u3002');
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiService.getAdminOverview();
        if (!alive) return;
        startTransition(() => {
          setOverview(response.data || null);
          setError(null);
        });
      } catch (loadError) {
        if (!alive) return;
        const message = loadError instanceof Error ? loadError.message : '后台总览加载失败。';
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

    void bootstrap();
    return () => {
      alive = false;
    };
  }, [canAccess]);

  const stats = overview?.stats
    ? [
        { label: '用户', value: overview.stats.users, icon: 'group' },
        { label: '宠物', value: overview.stats.pets, icon: 'pets' },
        { label: '匹配', value: overview.stats.matches, icon: 'favorite' },
        { label: '消息', value: overview.stats.messages, icon: 'chat' },
        { label: '日记', value: overview.stats.diaries, icon: 'menu_book' },
        { label: '商品', value: overview.stats.products, icon: 'shopping_bag' },
      ]
    : [];

  const operationStats = overview?.operations
    ? [
        { label: '商城订单', value: overview.operations.marketOrders, icon: 'shopping_cart' },
        { label: '遛遛订单', value: overview.operations.walkOrders, icon: 'directions_walk' },
        { label: '护理预约', value: overview.operations.careBookings, icon: 'content_cut' },
        { label: '宠物恋爱', value: overview.operations.petLoveRecords, icon: 'favorite' },
        { label: '聊天会话', value: overview.operations.chatSessions, icon: 'forum' },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[180] mx-auto flex max-w-md flex-col bg-surface">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(198,245,223,0.7),transparent_66%),radial-gradient(circle_at_18%_10%,rgba(242,141,45,0.16),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(238,155,177,0.16),transparent_24%)]" />
      <header className="relative z-10 px-5 pt-4">
        <div className="brand-surface flex items-center gap-4 rounded-[2rem] px-5 py-4">
          <button onClick={onBack} className="rounded-2xl bg-white/70 p-2 text-slate-500 transition hover:text-primary" aria-label="返回设置">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div>
            <div className="mb-2">
              <BrandMark mode="lockup" size="sm" subtitle="Admin · Ops Console" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/70">{'\u540e\u53f0'}</p>
            <h2 className="text-xl font-black tracking-tight text-slate-900">平台运营总览</h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">后台管理入口</p>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 space-y-5 overflow-y-auto p-5 pb-10 no-scrollbar">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[2.4rem] bg-slate-900 p-6 text-white shadow-2xl shadow-slate-900/15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.24),transparent_55%)]" />
          <div className="relative space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">当前管理员</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight">{'\u5e73\u53f0\u63a7\u5236\u5854'}</h3>
                <p className="mt-1 text-sm text-white/70">{currentUserEmail || '尚未识别登录账号'}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-white/10 text-emerald-300 backdrop-blur">
                <span className="material-symbols-outlined text-3xl">monitoring</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={openOpsConsole}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-emerald-50"
              >
                打开完整管理台
              </button>
              <span className="rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                {adminPanelUrl}
              </span>
            </div>
          </div>
        </motion.section>

        {isLoading && (
          <div className="frost-card space-y-3 rounded-[2rem] p-6">
            <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
            <div className="h-20 rounded-[1.8rem] bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-[1.8rem] bg-slate-100 animate-pulse" />
          </div>
        )}

        {!isLoading && error && (
          <div className="frost-card space-y-4 rounded-[2rem] border border-red-100 p-6">
            <div className="flex items-center gap-3 text-red-500">
              <span className="material-symbols-outlined">shield_lock</span>
              <h3 className="font-black text-slate-900">后台访问暂未就绪</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => void loadOverview()}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
              >
                重试加载
              </button>
              <button
                onClick={onBack}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:border-slate-300"
              >
                返回设置
              </button>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">请确认当前账号已获得后台权限，并稍后再次尝试。</p>
          </div>
        )}

        {!isLoading && overview && (
          <>
            <section className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="frost-card space-y-3 rounded-[1.9rem] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </section>

            <section className="frost-card space-y-5 rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900">基础设施状态</h3>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">API 与基础配置</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="soft-panel rounded-[1.6rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">环境</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{overview.health.environment}</p>
                </div>
                <div className="soft-panel rounded-[1.6rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">管理员</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{overview.health.adminEmailCount} 个已授权账号</p>
                </div>
                <div className="soft-panel col-span-2 rounded-[1.6rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">API Base</p>
                  <p className="mt-2 break-all text-sm font-black text-slate-900">{overview.health.apiBaseUrl}</p>
                </div>
                <div className="soft-panel rounded-[1.6rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Supabase</p>
                  <p className={`mt-2 text-sm font-black ${overview.health.supabaseConfigured ? 'text-emerald-600' : 'text-red-500'}`}>
                    {overview.health.supabaseConfigured ? '连接正常' : '连接异常'}
                  </p>
                </div>
                <div className="soft-panel rounded-[1.6rem] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Google AI</p>
                  <p className={`mt-2 text-sm font-black ${overview.health.googleAiConfigured ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {overview.health.googleAiConfigured ? '已启用' : '降级模式'}
                  </p>
                </div>
              </div>
            </section>

            <section className="frost-card space-y-4 rounded-[2rem] p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900">最近注册用户</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{overview.recentUsers.length} 条</p>
              </div>
              <div className="space-y-3">
                {overview.recentUsers.length > 0 ? (
                  overview.recentUsers.map((user) => (
                    <div key={user.id} className="soft-panel rounded-[1.7rem] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{user.username}</p>
                          <p className="mt-1 break-all text-xs text-slate-500">{user.email}</p>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${user.is_verified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {user.is_verified ? '已审核' : '待审核'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyCard title="暂无注册动态" description="最近还没有新的注册用户。" />
                )}
              </div>
            </section>

            <section className="frost-card space-y-4 rounded-[2rem] p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900">最近消息</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{overview.recentMessages.length} 条</p>
              </div>
              <div className="space-y-3">
                {overview.recentMessages.length > 0 ? (
                  overview.recentMessages.map((message) => (
                    <div key={message.id} className="soft-panel space-y-2 rounded-[1.7rem] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                          {message.sender?.username || '未知'} → {message.receiver?.username || '未知'}
                        </p>
                        <span className="text-[11px] font-medium text-slate-400">{message.created_at?.slice(0, 10) || '--'}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{message.content || '空消息'}</p>
                    </div>
                  ))
                ) : (
                  <EmptyCard title="暂无消息动态" description="最近还没有新的消息记录。" />
                )}
              </div>
            </section>

            {overview.operations && (
              <section className="frost-card space-y-5 rounded-[2rem] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">deployed_code</span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">运营工单概况</h3>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Supabase 实时运营数据</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {operationStats.map((stat) => (
                    <div key={stat.label} className="soft-panel space-y-2 rounded-[1.6rem] p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                      </div>
                      <p className="text-xl font-black text-slate-900">{stat.value}</p>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {overview.operations.latestChatSessions.length > 0 ? (
                    overview.operations.latestChatSessions.map((session) => (
                      <div key={session.id} className="soft-panel rounded-[1.7rem] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-900">{session.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {(session.participants || []).join(' · ') || '暂无参与者'} · {(session.relatedPets || []).join(' / ') || '未关联宠物'}
                            </p>
                          </div>
                          <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">
                            {session.status}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{session.latestSnippet || '暂无最新内容'}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyCard title="暂无运营工单" description="订单、预约、恋爱和聊天会话会在这里显示最新动态。" />
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
