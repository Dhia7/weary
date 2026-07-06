'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getProductTranslations } from '@/lib/i18n/product';

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity: number;
  onChange: (quantity: number) => void;
  id?: string;
  className?: string;
}

export default function QuantitySelector({
  quantity,
  maxQuantity,
  onChange,
  id = 'quantity',
  className = '',
}: QuantitySelectorProps) {
  const { isFrench } = useLanguage();
  const t = getProductTranslations(isFrench);
  const max = Math.max(1, maxQuantity);
  const value = Math.min(Math.max(1, quantity), max);

  const btnBase =
    'px-3 py-2 border border-swisse-gold/25 dark:border-border transition-colors';
  const btnEnabled =
    'bg-transparent text-swisse-ink hover:border-swisse-gold dark:text-foreground';
  const btnDisabled =
    'bg-swisse-mist/50 dark:bg-muted/30 text-swisse-ink/30 dark:text-muted-foreground cursor-not-allowed';

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span
        id={`${id}-label`}
        className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground"
      >
        {t.quantity}:
      </span>
      <div className="flex items-center">
        <button
          type="button"
          aria-label={t.decreaseQuantity}
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className={`${btnBase} border-r-0 ${value <= 1 ? btnDisabled : btnEnabled}`}
        >
          −
        </button>
        <input
          id={id}
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          readOnly
          className="w-12 text-center border-y border-swisse-gold/25 dark:border-border py-2 bg-transparent text-swisse-ink dark:text-foreground"
          aria-labelledby={`${id}-label`}
          aria-live="polite"
        />
        <button
          type="button"
          aria-label={t.increaseQuantity}
          onClick={() => onChange(Math.min(value + 1, max))}
          disabled={value >= max}
          className={`${btnBase} border-l-0 ${value >= max ? btnDisabled : btnEnabled}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
