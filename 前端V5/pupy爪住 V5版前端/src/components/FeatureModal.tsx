import { AnimatePresence, motion } from 'motion/react';

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
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
              {description && <p className="text-sm text-slate-500 leading-relaxed">{description}</p>}
            </div>

            {items.length > 0 && (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {cancelLabel && (
                <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black">
                  {cancelLabel}
                </button>
              )}
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
                className="flex-1 py-4 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
