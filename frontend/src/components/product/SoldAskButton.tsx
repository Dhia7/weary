'use client';

import Link from 'next/link';

export const soldAskButtonClass =
  'inline-flex w-full items-center justify-center gap-2 bg-swisse-gold hover:bg-swisse-ink text-white text-[11px] font-bold uppercase tracking-[0.16em] py-3.5 px-4 transition-colors duration-300 dark:hover:bg-primary';

interface SoldAskButtonProps {
  href: string;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function SoldAskButton({ href, label, onClick, className = '' }: SoldAskButtonProps) {
  const classes = `${soldAskButtonClass} ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {label}
      </button>
    );
  }
  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}
