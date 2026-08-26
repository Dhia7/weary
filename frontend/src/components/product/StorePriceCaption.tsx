'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getProductTranslations } from '@/lib/i18n/product';
import { formatPriceTnd, shouldShowCompareAtPrice } from '@/lib/types/product';
import { cn } from '@/lib/utils';

interface StorePriceCaptionProps {
  compareAtPrice?: number | string | null;
  sellPrice: number | string;
  className?: string;
  align?: 'left' | 'right';
}

export default function StorePriceCaption({
  compareAtPrice,
  sellPrice,
  className,
  align = 'left',
}: StorePriceCaptionProps) {
  const { isFrench } = useLanguage();
  const t = getProductTranslations(isFrench);

  if (!shouldShowCompareAtPrice(compareAtPrice, sellPrice)) return null;

  return (
    <p
      className={cn(
        'flex flex-wrap items-baseline gap-x-1.5 text-xs text-swisse-ink/40 dark:text-muted-foreground',
        align === 'right' && 'justify-end',
        className
      )}
    >
      <span>{t.storePrice}</span>
      <span className="line-through">{formatPriceTnd(compareAtPrice!)}</span>
    </p>
  );
}
