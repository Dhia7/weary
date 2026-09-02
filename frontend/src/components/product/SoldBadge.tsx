'use client';

interface SoldBadgeProps {
  label: string;
}

export default function SoldBadge({ label }: SoldBadgeProps) {
  return (
    <span className="inline-flex items-center border-2 border-swisse-gold bg-swisse-ink px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-swisse-gold shadow-sm dark:bg-foreground dark:text-swisse-gold">
      {label}
    </span>
  );
}
