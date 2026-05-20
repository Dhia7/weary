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

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <span id={`${id}-label`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t.quantity}:
      </span>
      <div className="flex items-center">
        <button
          type="button"
          aria-label={t.decreaseQuantity}
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className={`px-3 py-2 rounded-l-md border border-r-0 ${
            value <= 1
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
          }`}
        >
          −
        </button>
        <input
          id={id}
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          readOnly
          className="w-12 text-center border border-gray-300 dark:border-gray-600 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          aria-labelledby={`${id}-label`}
          aria-live="polite"
        />
        <button
          type="button"
          aria-label={t.increaseQuantity}
          onClick={() => onChange(Math.min(value + 1, max))}
          disabled={value >= max}
          className={`px-3 py-2 rounded-r-md border border-l-0 ${
            value >= max
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
}
