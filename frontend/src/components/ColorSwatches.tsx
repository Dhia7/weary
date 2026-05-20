'use client';

import type { ColorOption } from '@/lib/types/product';

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
  if (!colors.length) return null;

  const visible = colors.slice(0, maxVisible);
  const extra = colors.length - visible.length;
  const dim = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.preventDefault()}>
      {visible.map((c) => {
        const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase();
        const swatchStyle = c.hex
          ? { backgroundColor: c.hex }
          : c.imageUrl
            ? { backgroundImage: `url(${c.imageUrl})`, backgroundSize: 'cover' }
            : { backgroundColor: '#d1d5db' };

        return (
          <button
            key={c.name}
            type="button"
            title={
              c.price != null
                ? `${c.name} — ${Number(c.price).toFixed(2)} TND`
                : c.name
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(c.name);
            }}
            className={`${dim} rounded-full border-2 shrink-0 transition-transform ${
              isSelected ? 'border-swisse-gold scale-110 ring-1 ring-swisse-gold/50' : 'border-gray-300 dark:border-gray-600'
            } ${onSelect ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            style={swatchStyle}
            aria-label={c.name}
          />
        );
      })}
      {extra > 0 && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">+{extra}</span>
      )}
    </div>
  );
}
