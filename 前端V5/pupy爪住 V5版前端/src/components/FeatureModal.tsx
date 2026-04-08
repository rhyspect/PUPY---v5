import { useEffect, useId } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import BrandMark from './BrandMark';

interface FeatureModalProps {
  open: boolean;
  title: string;
  description?: string;
  items?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function FeatureModal({
  open,
  title,
  description,
  items = [],
  confirmLabel = '我知道了',
  cancelLabel,
  onClose,
  onConfirm,
}: FeatureModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    document.body.classList.add('modal-open');
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.92, opacity: 0, y: 16 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="ambient-card brand-surface relative w-full max-w-sm rounded-[2.8rem] p-8 shadow-2xl"
          >
            <button
              type="button"
              aria-label="关闭弹窗"
              onClick={onClose}
              className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 text-slate-500 transition hover:text-primary"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="relative z-10 space-y-6">
              <div className="space-y-3 pr-10">
                <BrandMark mode="lockup" size="sm" subtitle="爪住 · Product Controls" />
                <h3 id={titleId} className="text-[1.75rem] leading-tight font-black text-slate-900 tracking-tight">
                  {title}
                </h3>
                {description && (
                  <p id={descriptionId} className="text-sm leading-relaxed text-slate-600">
                    {description}
                  </p>
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.6rem] border border-white/60 bg-white/70 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                {cancelLabel && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-[1.6rem] border border-white/70 bg-white/80 py-4 font-black text-slate-500"
                  >
                    {cancelLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  className="flex-1 rounded-[1.6rem] bg-primary py-4 font-black text-white shadow-lg shadow-primary/20"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
