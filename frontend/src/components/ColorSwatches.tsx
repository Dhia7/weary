'use client';

import type { ColorOption } from '@/lib/types/product';
import { orderColorsSelectedFirst } from '@/lib/types/product';
import { getImageUrl } from '@/lib/utils';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getColorDisplayName } from '@/lib/i18n/product';

interface ColorSwatchesProps {
  colors: ColorOption[];
  selectedColor?: string;
  onSelect?: (color: string) => void;
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export default function ColorSwatches({
  colors,
  selectedColor,
  onSelect,
  maxVisible = 5,
  size = 'sm',
}: ColorSwatchesProps) {
  const { isFrench } = useLanguage();

  if (!colors.length) return null;

  const ordered = orderColorsSelectedFirst(colors, selectedColor);
  const visible = maxVisible == null ? ordered : ordered.slice(0, maxVisible);
  const extra = Math.max(0, ordered.length - visible.length);
  const dim = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.preventDefault()}>
      {visible.map((c) => {
        const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase();
        const isSold = c.isInStock === false;
        const label = getColorDisplayName(c, isFrench);
        const soldLabel = isFrench ? 'Vendu' : 'Sold';
        const title =
          isSold
            ? `${label} — ${soldLabel}`
            : c.price != null
              ? `${label} — ${Number(c.price).toFixed(2)} TND`
              : label;
        const imageSrc = c.imageUrl ? getImageUrl(c.imageUrl) || c.imageUrl : null;
        const swatchStyle = c.hex
          ? { backgroundColor: c.hex }
          : imageSrc
            ? {
                backgroundImage: `url(${imageSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { backgroundColor: '#d1d5db' };

        return (
          <button
            key={c.name}
            type="button"
            title={title}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(c.name);
            }}
            className={`relative ${dim} rounded-full border-2 shrink-0 transition-transform overflow-hidden ${
              isSelected ? 'border-swisse-gold scale-110 ring-1 ring-swisse-gold/50' : 'border-gray-300 dark:border-gray-600'
            } ${isSold ? 'grayscale opacity-50' : ''} ${onSelect ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            style={swatchStyle}
            aria-label={isSold ? `${label}, ${soldLabel}` : label}
          >
            {isSold ? (
              <span
                aria-hidden
                className="pointer-events-none absolute left-[-25%] top-1/2 h-[1.5px] w-[150%] -rotate-45 bg-gray-800 dark:bg-gray-200"
              />
            ) : null}
          </button>
        );
      })}
      {extra > 0 && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">+{extra}</span>
      )}
    </div>
  );
}
