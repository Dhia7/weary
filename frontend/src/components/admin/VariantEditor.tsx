'use client';

import { useMemo, useState } from 'react';
import type { ProductVariant } from '@/lib/types/product';
import { slugifyCode } from '@/lib/utils/variants';

export type VariantDraft = Omit<ProductVariant, 'id' | 'productId'> & { id?: number };

interface VariantEditorProps {
  parentSku: string;
  basePrice: number | '';
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

const defaultColors = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Red', hex: '#c41e3a' },
];

export default function VariantEditor({ parentSku, basePrice, variants, onChange }: VariantEditorProps) {
  const [colorInput, setColorInput] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [sizeInput, setSizeInput] = useState('');
  const [hasSizes, setHasSizes] = useState(false);

  const uniqueColors = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.color));
    return Array.from(set);
  }, [variants]);

  const addColorOnlyVariants = () => {
    const name = colorInput.trim();
    if (!name) return;
    const code = slugifyCode(name);
    const sku = parentSku ? `${slugifyCode(parentSku)}-${code}` : code;
    if (variants.some((v) => v.color.toLowerCase() === name.toLowerCase() && !v.size)) return;
    onChange([
      ...variants,
      {
        SKU: sku,
        color: name,
        colorCode: code,
        colorHex: colorHex || null,
        size: null,
        quantity: 0,
        price: basePrice === '' ? null : Number(basePrice),
        compareAtPrice: null,
        imageUrl: null,
        images: [],
        isActive: true,
        sortOrder: variants.length,
      },
    ]);
    setColorInput('');
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
          SKU: sku,
          color: colorName,
          colorCode: code,
          colorHex: null,
          size,
          quantity: 0,
          price: basePrice === '' ? null : Number(basePrice),
          compareAtPrice: null,
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
        </p>
        {basePrice !== '' && variants.length > 0 && (
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
        <div className="flex flex-wrap gap-2">
          {defaultColors.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setColorInput(preset.name);
                setColorHex(preset.hex);
              }}
              className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
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
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
            />
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
            <button type="button" onClick={addColorOnlyVariants} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
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
                <th className="px-3 py-2 text-left">Hex</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={`${variant.SKU}-${index}`} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-2">{variant.color}</td>
                  <td className="px-3 py-2">{variant.size || '—'}</td>
                  <td className="px-3 py-2">
                    <input value={variant.SKU} onChange={(e) => updateVariant(index, { SKU: e.target.value })} className="w-full min-w-[120px] border rounded px-2 py-1 text-xs dark:bg-gray-700" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={variant.quantity} onChange={(e) => updateVariant(index, { quantity: parseInt(e.target.value, 10) || 0 })} className="w-20 border rounded px-2 py-1 text-xs dark:bg-gray-700" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} step="0.01" value={variant.price ?? ''} onChange={(e) => updateVariant(index, { price: e.target.value === '' ? null : parseFloat(e.target.value) })} placeholder={String(basePrice)} className="w-24 border rounded px-2 py-1 text-xs dark:bg-gray-700" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="color" value={variant.colorHex || '#000000'} onChange={(e) => updateVariant(index, { colorHex: e.target.value })} className="w-10 h-8" />
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
