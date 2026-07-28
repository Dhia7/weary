'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import type { ProductVariant } from '@/lib/types/product';
import { getImageUrl } from '@/lib/utils';
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
  /** Product / per-color images used to sample swatch colors */
  sampleImages?: string[];
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
  sampleImages?: string[];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

function sampleColorFromImage(
  img: HTMLImageElement,
  clientX: number,
  clientY: number
): string | null {
  const rect = img.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const x = Math.min(
    Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * img.naturalWidth)),
    Math.max(0, img.naturalWidth - 1)
  );
  const y = Math.min(
    Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * img.naturalHeight)),
    Math.max(0, img.naturalHeight - 1)
  );

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(img, 0, 0);
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    return rgbToHex(r, g, b);
  } catch {
    // Cross-origin images without CORS cannot be sampled
    return null;
  }
}

function SwatchPicker({
  value,
  confirmed = false,
  onConfirm,
  size = 'md',
  sampleImages = [],
}: SwatchPickerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [localHex, setLocalHex] = useState(value);
  const [mounted, setMounted] = useState(false);
  const [samplingUrl, setSamplingUrl] = useState<string | null>(null);
  const [sampleHint, setSampleHint] = useState<string | null>(null);
  const previewSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const displayHex = value.trim() ? pickerHex(value) : '#e5e7eb';
  const valid = Boolean(normalizeHex(localHex));
  const resolvedSamples = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of sampleImages) {
      const trimmed = raw?.trim();
      if (!trimmed) continue;
      const url =
        /^(blob:|data:|https?:\/\/)/i.test(trimmed)
          ? trimmed
          : getImageUrl(trimmed) || trimmed;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
    return out.slice(0, 8);
  }, [sampleImages]);

  useEffect(() => setMounted(true), []);

  const closePanel = useCallback(() => {
    setOpen(false);
    setSamplingUrl(null);
    setSampleHint(null);
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

    // Prevent background scroll while the picker is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, value, closePanel]);

  const openPanel = () => {
    setLocalHex(value.trim() ? pickerHex(value) : '#000000');
    setSamplingUrl(resolvedSamples[0] || null);
    setSampleHint(
      resolvedSamples.length
        ? 'Click a spot on an image below to sample its color.'
        : null
    );
    setOpen(true);
  };

  const applyColor = () => {
    const normalized = normalizeHex(localHex);
    if (!normalized) return;
    onConfirm(normalized);
    closePanel();
  };

  const handleSampleClick = (
    e: MouseEvent<HTMLImageElement>,
    url: string
  ) => {
    const hex = sampleColorFromImage(e.currentTarget, e.clientX, e.clientY);
    if (!hex) {
      setSampleHint('Could not sample this image (try another or use the picker).');
      return;
    }
    setSamplingUrl(url);
    setLocalHex(hex);
    setSampleHint(`Sampled ${hex}`);
  };

  const panel =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              aria-hidden
              onClick={closePanel}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Choose swatch color"
              className="relative z-[301] w-full max-w-[300px] max-h-[min(90vh,640px)] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 shrink-0 shadow-inner"
                  style={{ backgroundColor: pickerHex(localHex) }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Color picker
                  </p>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                    {pickerHex(localHex)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none px-1"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="swatch-color-picker w-full">
                <HexColorPicker
                  color={pickerHex(localHex)}
                  onChange={setLocalHex}
                  style={{ width: '100%', height: 168 }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {quickPickColors.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setLocalHex(hex)}
                    className={`w-7 h-7 rounded-full border-2 shrink-0 hover:scale-110 transition-transform ${
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
                className="mt-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />

              {resolvedSamples.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Pick from product images
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {resolvedSamples.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => {
                          setSamplingUrl(url);
                          setSampleHint('Click a spot on the image to sample its color.');
                        }}
                        className={`w-10 h-10 rounded-md overflow-hidden border-2 shrink-0 ${
                          samplingUrl === url
                            ? 'border-indigo-500 ring-1 ring-indigo-300'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        title="Use this image"
                        aria-label="Select image to sample color from"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  {samplingUrl && (
                    <div className="rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 overflow-hidden bg-gray-50 dark:bg-gray-900/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={samplingUrl}
                        alt="Click to sample color"
                        crossOrigin="anonymous"
                        onClick={(e) => handleSampleClick(e, samplingUrl)}
                        className="w-full h-32 object-cover cursor-crosshair"
                        title="Click anywhere to sample a color"
                      />
                    </div>
                  )}
                  {sampleHint && (
                    <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {sampleHint}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2 sticky bottom-0 bg-white dark:bg-gray-800 pt-2">
                <button
                  type="button"
                  onClick={applyColor}
                  disabled={!valid}
                  className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  className="px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-flex shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={openPanel}
        className={`${previewSize} rounded-lg border-2 shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-shadow ${
          confirmed ? 'border-green-500' : 'border-dashed border-amber-400'
        }`}
        style={{ backgroundColor: displayHex }}
        title="Click to open color picker"
        aria-label="Pick swatch color"
        aria-expanded={open ? 'true' : 'false'}
        aria-haspopup="dialog"
      />
      {panel}
    </div>
  );
}

export default function VariantEditor({
  parentSku,
  basePrice,
  baseCompareAtPrice = '',
  variants,
  onChange,
  sampleImages = [],
}: VariantEditorProps) {
  const [colorInput, setColorInput] = useState('');
  const [colorFrInput, setColorFrInput] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [swatchDraft, setSwatchDraft] = useState('#000000');
  const [swatchConfirmed, setSwatchConfirmed] = useState(false);
  const [sizeInput, setSizeInput] = useState('');
  const [hasSizes, setHasSizes] = useState(false);

  const pickerSampleImages = useMemo(() => {
    const fromVariants: string[] = [];
    for (const v of variants) {
      if (v.imageUrl) fromVariants.push(v.imageUrl);
      if (Array.isArray(v.images)) fromVariants.push(...v.images);
    }
    return [...sampleImages, ...fromVariants];
  }, [sampleImages, variants]);

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

  const syncColorFrForName = (colorName: string, colorFr: string | null) => {
    const normalized = colorName.trim().toLowerCase();
    const nextFr = colorFr?.trim() || null;
    onChange(
      variants.map((v) =>
        v.color.trim().toLowerCase() === normalized ? { ...v, colorFr: nextFr } : v
      )
    );
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
    const colorFr = colorFrInput.trim() || null;
    onChange([
      ...variants,
      {
        clientKey: newVariantKey(),
        SKU: sku,
        color: name,
        colorFr,
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
    setColorFrInput('');
    setSwatchConfirmed(false);
  };

  const generateMatrix = () => {
    const colors = colorInput.split(',').map((c) => c.trim()).filter(Boolean);
    const sizes = hasSizes
      ? sizeInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [null];
    if (colors.length === 0) return;
    const colorFr = colorFrInput.trim() || null;
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
          colorFr: colors.length === 1 ? colorFr : null,
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
    setColorFrInput('');
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Color name (EN)</label>
            <input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="Red or Red, Navy, Black"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Color name (FR)</label>
            <input
              value={colorFrInput}
              onChange={(e) => setColorFrInput(e.target.value)}
              placeholder="Rouge"
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
                sampleImages={pickerSampleImages}
              />
              {swatchConfirmed && (
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{colorHex}</span>
              )}
            </div>
            {!swatchConfirmed && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Click the swatch to open the color picker, then press Confirm in the panel.
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
                <th className="px-3 py-2 text-left">Color (EN)</th>
                <th className="px-3 py-2 text-left">Color (FR)</th>
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
                  <td className="px-3 py-2">
                    <input
                      value={variant.colorFr ?? ''}
                      onChange={(e) => syncColorFrForName(variant.color, e.target.value)}
                      placeholder="FR name"
                      className={`w-28 ${variantInputClass}`}
                    />
                  </td>
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
                      sampleImages={pickerSampleImages}
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
