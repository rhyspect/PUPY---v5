const BRAND_LOGO_FULL_SRC = '/brand/pupy-logo-768.png';
const BRAND_LOGO_ICON_SRC = '/brand/pupy-logo-icon-512.png';

type BrandMarkMode = 'full' | 'icon' | 'lockup' | 'word';
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
    full: 'h-16 w-[5.75rem] rounded-[1.6rem]',
    gap: 'gap-2.5',
    title: 'text-sm',
    subtitle: 'text-[9px]',
  },
  md: {
    icon: 'h-12 w-12 rounded-[1.2rem]',
    full: 'h-20 w-[7rem] rounded-[2rem]',
    gap: 'gap-3',
    title: 'text-lg',
    subtitle: 'text-[10px]',
  },
  lg: {
    icon: 'h-14 w-14 rounded-[1.4rem]',
    full: 'h-24 w-[8.25rem] rounded-[2.4rem]',
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
        src={BRAND_LOGO_ICON_SRC}
        alt="PUPY 爪住品牌图标"
        className="brand-logo-image h-full w-full object-contain p-[8%] select-none"
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
          src={BRAND_LOGO_FULL_SRC}
          alt="PUPY 爪住 Logo"
          className="brand-logo-image h-full w-full object-contain p-[8%]"
          draggable={false}
        />
      </div>
    );
  }

  if (mode === 'icon') {
    return <BrandIcon size={size} />;
  }

  if (mode === 'word') {
    return (
      <div className={cx('min-w-0', className)}>
        <p className={cx('brand-wordmark truncate-1 font-headline font-black leading-none tracking-tight', sizeMap[size].title)}>
          {title}
        </p>
        <p className={cx('truncate-1 mt-1 font-black uppercase tracking-[0.18em] text-slate-400', sizeMap[size].subtitle)}>
          {subtitle}
        </p>
      </div>
    );
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
