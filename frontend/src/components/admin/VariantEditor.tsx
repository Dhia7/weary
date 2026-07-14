'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import type { ProductVariant } from '@/lib/types/product';
import { slugifyCode } from '@/lib/utils/variants';

export type VariantDraft = Omit<ProductVariant, 'id' | 'productId'> & {
  id?: number;
  /** Stable React key for new variants (do not use SKU — it changes while typing) */
  clientKey?: string;
};

function newVariantKey(): string {
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function variantRowKey(variant: VariantDraft, index: number): string {
  if (variant.id != null) return `id-${variant.id}`;
  if (variant.clientKey) return variant.clientKey;
  return `idx-${index}`;
}

const variantInputClass =
  'border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500';

interface VariantEditorProps {
  parentSku: string;
  basePrice: number | '';
  baseCompareAtPrice?: number | '';
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

const defaultColors = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Red', hex: '#c41e3a' },
];

function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

function pickerHex(hex: string): string {
  return normalizeHex(hex) || '#000000';
}

const quickPickColors = [
  '#000000',
  '#ffffff',
  '#1a1a1a',
  '#1e3a5f',
  '#c41e3a',
  '#2563eb',
  '#16a34a',
  '#ca8a04',
];

interface SwatchPickerProps {
  value: string;
  confirmed?: boolean;
  onConfirm: (hex: string) => void;
  size?: 'md' | 'sm';
}

function SwatchPicker({ value, confirmed = false, onConfirm, size = 'md' }: SwatchPickerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [localHex, setLocalHex] = useState(value);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const previewSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const displayHex = value.trim() ? pickerHex(value) : '#e5e7eb';
  const valid = Boolean(normalizeHex(localHex));

  useEffect(() => setMounted(true), []);

  const closePanel = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) {
      setLocalHex(value);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, value, closePanel]);

  const openPanel = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const panelWidth = 240;
      const left = Math.min(rect.left, window.innerWidth - panelWidth - 12);
      setPanelPos({ top: rect.bottom + 8, left: Math.max(12, left) });
    }
    setLocalHex(value.trim() ? pickerHex(value) : '#000000');
    setOpen(true);
  };

  const applyColor = () => {
    const normalized = normalizeHex(localHex);
    if (!normalized) return;
    onConfirm(normalized);
    closePanel();
  };

  const panel =
    open && mounted
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[200] bg-black/20"
              aria-hidden
              onPointerDown={(e) => {
                if (panelRef.current?.contains(e.target as Node)) return;
                closePanel();
              }}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Choose swatch color"
              className="fixed z-[201] w-[240px] rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow-xl [&_.react-colorful]:w-full [&_.react-colorful]:h-40"
              style={{ top: panelPos.top, left: panelPos.left }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <HexColorPicker color={pickerHex(localHex)} onChange={setLocalHex} />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {quickPickColors.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setLocalHex(hex)}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 hover:scale-110 transition-transform ${
                      pickerHex(localHex) === hex
                        ? 'border-indigo-500 ring-1 ring-indigo-300'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={hex}
                    aria-label={`Pick ${hex}`}
                  />
                ))}
              </div>
              <HexColorInput
                prefixed
                color={pickerHex(localHex)}
                onChange={setLocalHex}
                aria-label="Hex color code"
                className="mt-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm font-mono bg-white dark:bg-gray-700"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={applyColor}
                  disabled={!valid}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openPanel}
        className={`${previewSize} rounded-lg border-2 shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-shadow ${
          confirmed ? 'border-green-500' : 'border-dashed border-amber-400'
        }`}
        style={{ backgroundColor: displayHex }}
        title="Click to pick a color"
        aria-label="Pick swatch color"
        aria-expanded={open ? 'true' : 'false'}
        aria-haspopup="dialog"
      />
      {panel}
    </>
  );
}

export default function VariantEditor({
  parentSku,
  basePrice,
  baseCompareAtPrice = '',
  variants,
  onChange,
}: VariantEditorProps) {
  const [colorInput, setColorInput] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [swatchDraft, setSwatchDraft] = useState('#000000');
  const [swatchConfirmed, setSwatchConfirmed] = useState(false);
  const [sizeInput, setSizeInput] = useState('');
  const [hasSizes, setHasSizes] = useState(false);

  const confirmSwatch = (hex: string) => {
    setSwatchDraft(hex);
    setColorHex(hex);
    setSwatchConfirmed(true);
  };

  const selectPresetColor = (name: string, hex: string) => {
    setColorInput(name);
    setSwatchDraft(hex);
    setColorHex(hex);
    setSwatchConfirmed(true);
  };

  const uniqueColors = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.color));
    return Array.from(set);
  }, [variants]);

  const addColorOnlyVariants = () => {
    const name = colorInput.trim();
    if (!name || !swatchConfirmed) return;
    const code = slugifyCode(name);
    const sku = parentSku ? `${slugifyCode(parentSku)}-${code}` : code;
    if (variants.some((v) => v.color.toLowerCase() === name.toLowerCase() && !v.size)) return;
    onChange([
      ...variants,
      {
        clientKey: newVariantKey(),
        SKU: sku,
        color: name,
        colorCode: code,
        colorHex: colorHex || null,
        size: null,
        quantity: 0,
        price: basePrice === '' ? null : Number(basePrice),
        compareAtPrice:
          baseCompareAtPrice === '' ? null : Number(baseCompareAtPrice),
        imageUrl: null,
        images: [],
        isActive: true,
        sortOrder: variants.length,
      },
    ]);
    setColorInput('');
    setSwatchConfirmed(false);
  };

  const generateMatrix = () => {
    const colors = colorInput.split(',').map((c) => c.trim()).filter(Boolean);
    const sizes = hasSizes
      ? sizeInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [null];
    if (colors.length === 0) return;
    const next: VariantDraft[] = [...variants];
    colors.forEach((colorName, colorIndex) => {
      const code = slugifyCode(colorName);
      sizes.forEach((size, sizeIndex) => {
        const exists = next.some(
          (v) => v.color.toLowerCase() === colorName.toLowerCase() && (v.size || null) === (size || null)
        );
        if (exists) return;
        const skuSuffix = size ? `${code}-${slugifyCode(size)}` : code;
        const sku = parentSku ? `${slugifyCode(parentSku)}-${skuSuffix}` : skuSuffix;
        next.push({
          clientKey: newVariantKey(),
          SKU: sku,
          color: colorName,
          colorCode: code,
          colorHex: null,
          size,
          quantity: 0,
          price: basePrice === '' ? null : Number(basePrice),
          compareAtPrice:
            baseCompareAtPrice === '' ? null : Number(baseCompareAtPrice),
          imageUrl: null,
          images: [],
          isActive: true,
          sortOrder: next.length + colorIndex + sizeIndex,
        });
      });
    });
    onChange(next);
    setColorInput('');
    setSizeInput('');
  };

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Color variants</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          One style, one slug. Each color (and size for shoes) gets its own SKU, stock, and optional price.
          Leave price empty to use the product&apos;s base price, or set a different price per row (e.g. premium colors).
          Compare-at works the same way per color — useful when a special color costs more than black or white.
        </p>
        {variants.length > 0 && (basePrice !== '' || baseCompareAtPrice !== '') && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {basePrice !== '' && (
              <button
                type="button"
                onClick={() =>
                  onChange(
                    variants.map((v) => ({
                      ...v,
                      price: Number(basePrice),
                    }))
                  )
                }
                className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline"
              >
                Apply base price ({Number(basePrice).toFixed(2)} TND) to all variants
              </button>
            )}
            {baseCompareAtPrice !== '' && (
              <button
                type="button"
                onClick={() =>
                  onChange(
                    variants.map((v) => ({
                      ...v,
                      compareAtPrice: Number(baseCompareAtPrice),
                    }))
                  )
                }
                className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline"
              >
                Apply compare-at ({Number(baseCompareAtPrice).toFixed(2)} TND) to all variants
              </button>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {defaultColors.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => selectPresetColor(preset.name, preset.hex)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                swatchConfirmed && colorHex === preset.hex && colorInput === preset.name
                  ? 'border-indigo-500 ring-2 ring-indigo-300'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              style={{ backgroundColor: preset.hex }}
              title={preset.name}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Color name</label>
            <input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="Red or Red, Navy, Black"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Swatch</label>
            <div className="flex items-center gap-3">
              <SwatchPicker
                value={swatchDraft}
                confirmed={swatchConfirmed}
                onConfirm={confirmSwatch}
              />
              {swatchConfirmed && (
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{colorHex}</span>
              )}
            </div>
            {!swatchConfirmed && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Click the swatch, pick a color, then press Confirm in the panel.
              </p>
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={hasSizes} onChange={(e) => setHasSizes(e.target.checked)} className="rounded" />
          Include sizes (shoes, apparel)
        </label>
        {hasSizes && (
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Sizes</label>
            <input
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="38, 39, 40"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {!hasSizes && (
            <button
              type="button"
              onClick={addColorOnlyVariants}
              disabled={!colorInput.trim() || !swatchConfirmed}
              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add color
            </button>
          )}
          {hasSizes && (
            <button type="button" onClick={generateMatrix} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Generate variants
            </button>
          )}
        </div>
        {uniqueColors.length > 0 && (
          <p className="text-xs text-gray-500">Colors: {uniqueColors.join(', ')} · {variants.length} variant(s)</p>
        )}
      </div>
      {variants.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left">Color</th>
                <th className="px-3 py-2 text-left">Size</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">Qty</th>
                <th className="px-3 py-2 text-left">Price (optional)</th>
                <th className="px-3 py-2 text-left">Compare-at (optional)</th>
                <th className="px-3 py-2 text-left">Hex</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={variantRowKey(variant, index)} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-2">{variant.color}</td>
                  <td className="px-3 py-2">{variant.size || '—'}</td>
                  <td className="px-3 py-2">
                    <input
                      value={variant.SKU}
                      onChange={(e) => updateVariant(index, { SKU: e.target.value })}
                      className={`w-full min-w-[140px] ${variantInputClass}`}
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={variant.quantity} onChange={(e) => updateVariant(index, { quantity: parseInt(e.target.value, 10) || 0 })} className={`w-20 ${variantInputClass}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} step="0.01" value={variant.price ?? ''} onChange={(e) => updateVariant(index, { price: e.target.value === '' ? null : parseFloat(e.target.value) })} placeholder={basePrice === '' ? 'Base' : String(basePrice)} className={`w-24 ${variantInputClass}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={variant.compareAtPrice ?? ''}
                      onChange={(e) =>
                        updateVariant(index, {
                          compareAtPrice: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                      placeholder={baseCompareAtPrice === '' ? 'Base' : String(baseCompareAtPrice)}
                      className={`w-24 ${variantInputClass}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SwatchPicker
                      size="sm"
                      value={variant.colorHex || ''}
                      confirmed={Boolean(normalizeHex(variant.colorHex || ''))}
                      onConfirm={(hex) => updateVariant(index, { colorHex: hex })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => removeVariant(index)} className="text-red-600 text-xs hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
