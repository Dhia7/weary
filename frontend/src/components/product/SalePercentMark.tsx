'use client';

import { formatSalePercent } from '@/lib/salePrice';
import { cn } from '@/lib/utils';

interface SalePercentMarkProps {
  percent?: number | string | null;
  className?: string;
}

/** The percentage entered in Pricing, shown beside the price. */
export default function SalePercentMark({ percent, className }: SalePercentMarkProps) {
  if (percent == null || percent === '') return null;
  const value = Number(percent);
  if (!Number.isFinite(value) || value <= 0 || value > 99.99) return null;

  return (
    <span
      className={cn(
        'text-[10px] font-bold uppercase tracking-widest text-swisse-gold',
        className
      )}
    >
      −{formatSalePercent(value)}%
    </span>
  );
}
