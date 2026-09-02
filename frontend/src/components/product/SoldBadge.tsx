'use client';

interface SoldBadgeProps {
  label: string;
  /** Center the badge over a relatively positioned photo. */
  overlay?: boolean;
}

export default function SoldBadge({ label, overlay = false }: SoldBadgeProps) {
  const badge = (
    <span className="inline-flex items-center border-2 border-swisse-gold bg-swisse-ink px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-swisse-gold shadow-sm dark:bg-foreground dark:text-swisse-gold">
      {label}
    </span>
  );

  if (!overlay) return badge;

  return (
    <div className="pointer-events-none absolute inset-0 z-[9] flex items-center justify-center">
      {badge}
    </div>
  );
}
