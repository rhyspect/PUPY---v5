const BRAND_LOGO_SRC = '/brand/pupy-logo-768.jpg';

type BrandMarkMode = 'full' | 'icon' | 'lockup';
type BrandMarkSize = 'sm' | 'md' | 'lg';

interface BrandMarkProps {
  mode?: BrandMarkMode;
  size?: BrandMarkSize;
  title?: string;
  subtitle?: string;
  className?: string;
}

const sizeMap = {
  sm: {
    icon: 'h-10 w-10 rounded-[1rem]',
    full: 'h-16 w-16 rounded-[1.6rem]',
    gap: 'gap-2.5',
    title: 'text-sm',
    subtitle: 'text-[9px]',
  },
  md: {
    icon: 'h-12 w-12 rounded-[1.2rem]',
    full: 'h-20 w-20 rounded-[2rem]',
    gap: 'gap-3',
    title: 'text-lg',
    subtitle: 'text-[10px]',
  },
  lg: {
    icon: 'h-14 w-14 rounded-[1.4rem]',
    full: 'h-24 w-24 rounded-[2.4rem]',
    gap: 'gap-4',
    title: 'text-xl',
    subtitle: 'text-[11px]',
  },
} as const;

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

function BrandIcon({ size = 'md' }: { size?: BrandMarkSize }) {
  return (
    <div className={cx('brand-logo-frame relative overflow-hidden shadow-lg', sizeMap[size].icon)}>
      <img
        src={BRAND_LOGO_SRC}
        alt="PUPY 爪住品牌图标"
        className="h-full w-full scale-[1.55] object-cover object-[center_18%] select-none"
        draggable={false}
      />
      <div className="brand-logo-sheen absolute inset-0" />
    </div>
  );
}

export default function BrandMark({
  mode = 'lockup',
  size = 'md',
  title = 'PUPY',
  subtitle = '爪住 · Pet Social Cloud',
  className,
}: BrandMarkProps) {
  if (mode === 'full') {
    return (
      <div className={cx('brand-fullmark relative overflow-hidden shadow-xl', sizeMap[size].full, className)}>
        <img
          src={BRAND_LOGO_SRC}
          alt="PUPY 爪住 Logo"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
    );
  }

  if (mode === 'icon') {
    return <BrandIcon size={size} />;
  }

  return (
    <div className={cx('flex min-w-0 items-center', sizeMap[size].gap, className)}>
      <BrandIcon size={size} />
      <div className="min-w-0">
        <p className={cx('brand-wordmark truncate-1 font-headline font-black leading-none tracking-tight', sizeMap[size].title)}>
          {title}
        </p>
        <p className={cx('truncate-1 mt-1 font-black uppercase tracking-[0.18em] text-slate-400', sizeMap[size].subtitle)}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
