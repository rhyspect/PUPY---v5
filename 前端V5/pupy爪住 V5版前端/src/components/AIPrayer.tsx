import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { ApiPrayerRecord } from '../services/api';
import apiService from '../services/api';

interface AIPrayerProps {
  onBack: () => void;
}

const QUICK_PROMPTS = ['今天想对我说什么？', '你最喜欢我们一起去哪儿？', '最近最想做的一件小事是什么？', '如果你会说话，会怎么安慰我？'];

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

export default function AIPrayer({ onBack }: AIPrayerProps) {
  const [records, setRecords] = useState<ApiPrayerRecord[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const petId = getStoredPetId();

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getPrayerRecords(1, 12);
      setRecords(result.data || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载祈愿记录失败');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const submitPrayer = async () => {
    const value = input.trim();
    if (!petId || !value || submitting) return;

    setSubmitting(true);
    try {
      const result = await apiService.createPrayer(petId, value);
      if (result.data) {
        setRecords((prev) => [result.data as ApiPrayerRecord, ...prev]);
      }
      setInput('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '发送祈愿失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] mx-auto flex max-w-md flex-col overflow-y-auto bg-surface no-scrollbar">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(221,214,254,0.9),transparent_68%)]" />
      <header className="sticky top-0 z-50 px-5 pt-4">
        <div className="glass flex items-center gap-4 rounded-[2rem] border border-white/60 px-5 py-4">
          <button aria-label="返回上一页" onClick={onBack} className="rounded-2xl bg-white/70 p-2 text-slate-500 transition hover:text-primary">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/70">AI Wishes</p>
            <h2 className="text-xl font-black tracking-tight text-slate-900">AI 祈愿</h2>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-5 pb-12 pt-6 space-y-6">
        <section className="frost-card floating-highlight rounded-[2.8rem] p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Gentle AI Layer</p>
                <h1 className="mt-2 text-3xl font-black italic tracking-tight text-slate-900">把想问的话，交给宠物的语气说出来</h1>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.8rem] bg-white/70 text-primary shadow-sm">
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              这里直接接真实祈愿接口。你可以向宠物提问、表达想念，或者记录一段今天想对它说的话，系统会返回一条 AI 回应并保存在记录中。
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full bg-white/80 px-3 py-2 text-xs font-black text-slate-500 transition hover:text-primary"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="frost-card rounded-[2.6rem] p-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">新的祈愿</span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="例如：今天散步时，你为什么突然回头看了我好几次？"
              rows={4}
              className="w-full resize-none rounded-[1.8rem] border-none bg-white/80 px-4 py-3 text-sm leading-relaxed text-slate-700"
            />
          </label>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs leading-relaxed text-slate-500">默认中文为主语言，新的祈愿会立即写入真实记录。</p>
            <button
              type="button"
              onClick={() => void submitPrayer()}
              disabled={submitting || !petId || !input.trim()}
              className="rounded-[1.6rem] bg-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {submitting ? '发送中…' : '发送祈愿'}
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">真实祈愿记录</h3>
            <button type="button" onClick={() => void loadRecords()} className="text-xs font-black text-primary">
              刷新
            </button>
          </div>

          {loading ? (
            <div className="frost-card rounded-[2.4rem] p-8 text-center text-sm text-slate-400">正在同步 AI 祈愿数据…</div>
          ) : records.length === 0 ? (
            <div className="frost-card rounded-[2.4rem] p-8 text-center space-y-3">
              <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-4xl">neurology</span>
              </div>
              <h4 className="text-lg font-black text-slate-900">还没有新的祈愿记录</h4>
              <p className="text-sm leading-relaxed text-slate-500">从上面的输入框开始，给今天的陪伴留一句想说的话。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <motion.article
                  key={record.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="frost-card rounded-[2.4rem] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{formatTimestamp(record.created_at)}</p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black text-primary">
                      {record.sentiment || '温柔'}
                    </span>
                  </div>
                  <div className="mt-4 rounded-[1.8rem] bg-white/75 px-4 py-3">
                    <p className="text-sm italic leading-relaxed text-slate-500">“{record.prayer_text}”</p>
                  </div>
                  <div className="mt-4 rounded-[1.8rem] border border-primary/10 bg-primary/5 px-4 py-4">
                    <p className="text-sm font-medium leading-relaxed text-slate-700">
                      {record.ai_response || 'AI 正在整理更自然的回应。'}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
