/** Admin sale math. Percent is always off the regular price, in cents, so 490 at 15% is 416.50. */

export type AmountInput = number | '';

export function parseAmountInput(raw: string): AmountInput {
  if (raw.trim() === '') return '';
  const n = Number(raw);
  return Number.isFinite(n) ? n : '';
}

export function toAmount(
  value: number | string | null | undefined
): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

/** Customer price from a regular price and an off-percent. */
export function soldForFromPercent(price: number, percent: number): number {
  const priceCents = toCents(price);
  const basisPoints = Math.round(percent * 100);
  const soldCents = Math.round((priceCents * (10000 - basisPoints)) / 10000);
  return soldCents / 100;
}

/** Off-percent of the regular price, rounded to 2 decimals. Not a markup on the sold-for amount. */
export function percentFromSoldFor(price: number, soldFor: number): number {
  const priceCents = toCents(price);
  if (priceCents <= 0) return 0;
  const soldCents = toCents(soldFor);
  const hundredths = Math.round(((priceCents - soldCents) * 10000) / priceCents);
  return hundredths / 100;
}

export function formatSalePercent(percent: number): string {
  const rounded = Math.round(percent * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function isActiveSale(
  price: AmountInput,
  soldFor: AmountInput,
  salePercent: AmountInput
): boolean {
  if (price === '' || soldFor === '') return false;
  if (!(price > 0)) return false;
  if (salePercent !== '' && (salePercent < 0 || salePercent > 99.99)) return false;
  if (soldFor < 0 || soldFor >= price) return false;
  return true;
}

export function syncSaleOnPriceChange(
  nextPrice: AmountInput,
  salePercent: AmountInput,
  soldFor: AmountInput
): { soldFor: AmountInput; salePercent: AmountInput } {
  if (nextPrice === '' || !(nextPrice > 0)) {
    return { soldFor, salePercent };
  }
  if (salePercent !== '') {
    if (salePercent < 0 || salePercent > 99.99) return { soldFor, salePercent };
    return { soldFor: soldForFromPercent(nextPrice, salePercent), salePercent };
  }
  if (soldFor !== '') {
    return { soldFor, salePercent: percentFromSoldFor(nextPrice, soldFor) };
  }
  return { soldFor, salePercent };
}

export function syncSaleOnPercentChange(
  price: AmountInput,
  percent: AmountInput
): { soldFor: AmountInput; salePercent: AmountInput } {
  if (percent === '') return { soldFor: '', salePercent: '' };
  if (price === '' || !(price > 0) || percent < 0 || percent > 99.99) {
    return { soldFor: '', salePercent: percent };
  }
  return { soldFor: soldForFromPercent(price, percent), salePercent: percent };
}

export function syncSaleOnSoldForChange(
  price: AmountInput,
  soldFor: AmountInput
): { soldFor: AmountInput; salePercent: AmountInput } {
  if (soldFor === '') return { soldFor: '', salePercent: '' };
  if (price === '' || !(price > 0)) return { soldFor, salePercent: '' };
  return { soldFor, salePercent: percentFromSoldFor(price, soldFor) };
}

export function saleWarning(
  price: AmountInput,
  soldFor: AmountInput,
  salePercent: AmountInput
): string | null {
  const hasPercent = salePercent !== '';
  const hasSoldFor = soldFor !== '';
  if (!hasPercent && !hasSoldFor) return null;

  if (hasPercent && (salePercent < 0 || salePercent > 99.99)) {
    return 'Off percent must be between 0 and 99.99.';
  }
  if (price === '' || !(price > 0)) {
    return 'Enter a price before setting a sale.';
  }
  if (hasSoldFor && soldFor < 0) return 'Sold for cannot be negative.';
  if (hasSoldFor && soldFor >= price) return 'Sold for must be lower than Price.';
  return null;
}

/** Map stored price / compare-at into the form. A live sale shows the regular price in Price and the customer price in Sold for. */
export function saleFormFromStored(
  storedPrice: number | string | null | undefined,
  storedCompareAt: number | string | null | undefined
): {
  price: AmountInput;
  soldFor: AmountInput;
  salePercent: AmountInput;
  compareAtPrice: AmountInput;
} {
  const price = toAmount(storedPrice);
  const compareAt = toAmount(storedCompareAt);
  if (price == null) {
    return {
      price: '',
      soldFor: '',
      salePercent: '',
      compareAtPrice: compareAt ?? '',
    };
  }
  if (compareAt != null && compareAt > price && price >= 0) {
    const gap = percentFromSoldFor(compareAt, price);
    if (gap > 0 && gap <= 99.99) {
      return {
        price: compareAt,
        soldFor: price,
        salePercent: '',
        compareAtPrice: '',
      };
    }
  }
  return {
    price,
    soldFor: '',
    salePercent: '',
    compareAtPrice: compareAt ?? '',
  };
}

/** Values written to price and compareAtPrice. An empty Sold for leaves compare-at as entered. */
export function storedPricesFromSale(
  price: AmountInput,
  soldFor: AmountInput,
  salePercent: AmountInput,
  compareAtPrice: AmountInput
): { price: number; compareAtPrice: number | null } {
  if (isActiveSale(price, soldFor, salePercent)) {
    return { price: soldFor, compareAtPrice: price };
  }
  return {
    price: price === '' ? 0 : price,
    compareAtPrice: compareAtPrice === '' ? null : compareAtPrice,
  };
}

type SaleVariant = {
  price?: number | null;
  compareAtPrice?: number | null;
};

function regularPriceOf(variant: SaleVariant, productPrice: number): number | null {
  const storedPrice = toAmount(variant.price);
  const storedCompare = toAmount(variant.compareAtPrice);
  if (
    storedCompare != null &&
    storedPrice != null &&
    storedCompare > storedPrice &&
    storedPrice >= 0
  ) {
    const existing = percentFromSoldFor(storedCompare, storedPrice);
    if (existing > 0 && existing <= 99.99) return storedCompare;
  }
  if (storedPrice != null) return storedPrice;
  if (Number.isFinite(productPrice) && productPrice > 0) return productPrice;
  return null;
}

/** Write this color's own regular price into compare-at, and the percent off that price into price. */
export function applySaleToVariant<T extends SaleVariant>(
  variant: T,
  productPrice: number,
  percent: number
): T {
  const base = regularPriceOf(variant, productPrice);
  if (base == null || !(base > 0) || percent < 0 || percent > 99.99) return variant;
  const sold = soldForFromPercent(base, percent);
  if (!(sold >= 0) || sold >= base) return variant;
  return { ...variant, price: sold, compareAtPrice: base };
}

export function clearVariantSale<T extends SaleVariant>(variant: T): T {
  const storedPrice = toAmount(variant.price);
  const storedCompare = toAmount(variant.compareAtPrice);
  if (
    storedCompare == null ||
    storedPrice == null ||
    !(storedCompare > storedPrice)
  ) {
    return variant;
  }
  return { ...variant, price: storedCompare, compareAtPrice: null };
}

export function prepareVariantsForSave<T extends SaleVariant>(
  variants: T[],
  input: {
    price: AmountInput;
    soldFor: AmountInput;
    salePercent: AmountInput;
    endSale: boolean;
  }
): T[] {
  if (input.endSale) return variants.map((variant) => clearVariantSale(variant));
  return variants;
}

/** Off-percent shoppers see. Compare-at is the regular price; price is what the customer pays. */
export function saleOffPercent(
  compareAt: number | string | null | undefined,
  price: number | string | null | undefined
): number | null {
  const base = toAmount(compareAt);
  const sold = toAmount(price);
  if (base == null || sold == null || !(base > sold) || !(base > 0)) return null;
  const percent = percentFromSoldFor(base, sold);
  if (!(percent > 0) || percent > 99.99) return null;
  return percent;
}

/** List label. Compare-at is the regular price; price is what the customer pays. */
export function listSaleOffLabel(
  compareAt: number | string | null | undefined,
  price: number | string | null | undefined
): string | null {
  const percent = saleOffPercent(compareAt, price);
  if (percent == null) return null;
  return `${formatSalePercent(percent)}% off`;
}
