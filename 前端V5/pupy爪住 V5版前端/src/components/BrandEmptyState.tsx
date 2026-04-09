import BrandMark from './BrandMark';

interface BrandEmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  compact?: boolean;
  className?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function BrandEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  compact = false,
  className,
}: BrandEmptyStateProps) {
  const hasAction = Boolean(actionLabel && onAction);

  return (
    <div
      className={cx(
        'brand-empty-state ambient-card relative overflow-hidden border text-center shadow-sm',
        compact ? 'rounded-[2.2rem] px-5 py-6' : 'rounded-[2.6rem] px-6 py-8',
        className,
      )}
    >
      <div className="relative z-10 flex flex-col items-center">
        <div className={cx('inline-flex items-center rounded-full brand-pill', compact ? 'gap-2 px-3 py-2' : 'gap-2.5 px-4 py-2.5')}>
          <BrandMark mode="icon" size="sm" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/75">PUPY · 爪住</span>
        </div>

        {icon && (
          <div className={cx('mt-4 flex items-center justify-center rounded-[1.7rem] bg-white/82 text-primary shadow-sm', compact ? 'h-11 w-11' : 'h-14 w-14')}>
            <span className={cx('material-symbols-outlined', compact ? 'text-[22px]' : 'text-3xl')}>{icon}</span>
          </div>
        )}

        <div className={cx('space-y-2', compact ? 'mt-4' : 'mt-5')}>
          <h3 className={cx('font-black tracking-tight text-slate-900', compact ? 'text-base' : 'text-lg')}>{title}</h3>
          {description && (
            <p className={cx('max-w-sm leading-relaxed text-slate-500', compact ? 'text-xs' : 'text-sm')}>
              {description}
            </p>
          )}
        </div>

        {hasAction && (
          <button
            type="button"
            onClick={onAction}
            className={cx(
              'mt-5 rounded-[1.8rem] bg-primary font-black text-white shadow-lg shadow-primary/20',
              compact ? 'px-4 py-2.5 text-xs' : 'px-5 py-3 text-sm',
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
