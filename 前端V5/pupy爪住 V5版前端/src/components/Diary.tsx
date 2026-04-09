import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ApiDiaryRecord, AppDiarySummary } from '../services/api';
import apiService from '../services/api';
import BrandMark from './BrandMark';
import BrandEmptyState from './BrandEmptyState';

interface DiaryProps {
  onBack: () => void;
}

type DiaryFormState = {
  title: string;
  content: string;
  mood: string;
};

const EMPTY_IMAGE = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800';

function formatTimestamp(value?: string) {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStoredPetId() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('pupy_pet');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id || null;
  } catch {
    return null;
  }
}

export default function Diary({ onBack }: DiaryProps) {
  const [entries, setEntries] = useState<ApiDiaryRecord[]>([]);
  const [summary, setSummary] = useState<AppDiarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState<DiaryFormState>({ title: '', content: '', mood: '治愈' });
  const petId = getStoredPetId();

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, summaryResult] = await Promise.all([
        apiService.getUserDiaries(1, 12),
        apiService.getAppDiarySummary(),
      ]);
      setEntries(result.data || []);
      setSummary(summaryResult.data || null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载日记失败');
      setEntries([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const submitDiary = async () => {
    if (!petId || !form.title.trim() || !form.content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const result = await apiService.createDiary(petId, form.title.trim(), form.content.trim(), undefined, form.mood, ['日记'], false);
      if (result.data) {
        setEntries((prev) => [result.data as ApiDiaryRecord, ...prev]);
        setSummary((prev) => ({
          total: (prev?.total || 0) + 1,
          totalLikes: prev?.totalLikes || 0,
          totalComments: prev?.totalComments || 0,
          latest: {
            id: result.data.id,
            title: result.data.title,
            created_at: result.data.created_at,
            is_public: result.data.is_public,
            mood: result.data.mood,
          },
        }));
      }
      setForm({ title: '', content: '', mood: '治愈' });
      setShowComposer(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存日记失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] mx-auto flex max-w-md flex-col overflow-y-auto bg-surface no-scrollbar">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(175,251,216,0.82),transparent_68%)]" />
      <header className="sticky top-0 z-50 px-5 pt-4">
        <div className="glass flex items-center gap-4 rounded-[2rem] border border-white/60 px-5 py-4">
          <button aria-label="返回上一页" onClick={onBack} className="rounded-2xl bg-white/70 p-2 text-slate-500 transition hover:text-primary">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-2">
              <BrandMark mode="lockup" size="sm" subtitle="Diary · Daily Companion Archive" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">宠物日记</h2>
          </div>
          <button
            type="button"
            aria-label="写一篇新日记"
            onClick={() => setShowComposer(true)}
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-white shadow-lg shadow-primary/20"
          >
            新建
          </button>
        </div>
      </header>

      <div className="relative z-10 px-5 pb-12 pt-6 space-y-6">
        <section className="frost-card floating-highlight rounded-[2.6rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">生活记录</p>
              <h1 className="mt-2 text-3xl font-black italic tracking-tight text-slate-900">把每天的陪伴留住</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                这里会同步你的真实日记内容、互动数据与发布时间。适合记录散步、健康、训练和小情绪。
              </p>
            </div>
            <div className="rounded-[1.8rem] bg-white/70 px-4 py-3 text-right shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">记录总数</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{summary?.total ?? entries.length}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="frost-card rounded-[2.4rem] p-8 text-center text-sm text-slate-400">正在同步真实日记数据…</div>
        ) : entries.length === 0 ? (
          <BrandEmptyState
            icon="auto_stories"
            title="还没有新的日记"
            description="先写下今天散步、喂食、训练或社交的小片段，后续会在个人页和日记页一起展示。"
            actionLabel="写第一篇日记"
            onAction={() => setShowComposer(true)}
          />
        ) : (
          <div className="space-y-5">
            {entries.map((entry) => (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="frost-card overflow-hidden rounded-[2.6rem]"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <img
                    src={entry.images?.[0] || entry.pet?.images?.[0] || EMPTY_IMAGE}
                    alt={entry.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">{formatTimestamp(entry.created_at)}</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{entry.title}</h3>
                    </div>
                    {entry.mood && (
                      <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black text-white backdrop-blur-md">
                        {entry.mood}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <p className="text-sm leading-relaxed text-slate-600">{entry.content}</p>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">favorite</span>
                      {entry.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">chat_bubble</span>
                      {entry.comments_count || 0}
                    </span>
                    {entry.pet?.name && <span className="ml-auto rounded-full bg-slate-50 px-2.5 py-1 text-slate-500">{entry.pet.name}</span>}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowComposer(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="glass w-full max-w-md rounded-[2.8rem] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">New Diary</p>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">写一篇新的宠物日记</h3>
                <p className="text-sm text-slate-500">保存后会直接写入真实日记接口，并出现在个人页与日记页。</p>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">标题</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="例如：今天第一次在草地上打滚"
                    className="w-full rounded-[1.6rem] border-none bg-white/80 px-4 py-3 text-sm text-slate-700"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">心情</span>
                  <div className="flex flex-wrap gap-2">
                    {['治愈', '开心', '松弛', '黏人', '活力', '感动'].map((mood) => {
                      const active = form.mood === mood;
                      return (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, mood }))}
                          className={`rounded-full px-3 py-2 text-xs font-black transition ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/80 text-slate-500'}`}
                        >
                          {mood}
                        </button>
                      );
                    })}
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">内容</span>
                  <textarea
                    value={form.content}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="记录今天发生的一件小事、一个眼神，或者散步时的情绪变化。"
                    rows={5}
                    className="w-full resize-none rounded-[1.8rem] border-none bg-white/80 px-4 py-3 text-sm leading-relaxed text-slate-700"
                  />
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowComposer(false)} className="flex-1 rounded-[1.6rem] bg-white/80 py-4 font-black text-slate-500">
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void submitDiary()}
                  disabled={submitting || !petId || !form.title.trim() || !form.content.trim()}
                  className="flex-1 rounded-[1.6rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {submitting ? '保存中…' : '保存日记'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
