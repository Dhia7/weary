'use client';

import {
  formatSalePercent,
  parseAmountInput,
  saleWarning,
  type AmountInput,
} from '@/lib/salePrice';

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400';

interface SalePriceFieldsProps {
  idPrefix?: string;
  price: AmountInput;
  soldFor: AmountInput;
  salePercent: AmountInput;
  onSoldForChange: (value: AmountInput) => void;
  onPercentChange: (value: AmountInput) => void;
}

export default function SalePriceFields({
  idPrefix = '',
  price,
  soldFor,
  salePercent,
  onSoldForChange,
  onPercentChange,
}: SalePriceFieldsProps) {
  const soldForId = `${idPrefix}soldFor`;
  const percentId = `${idPrefix}salePercent`;
  const warning = saleWarning(price, soldFor, salePercent);

  return (
    <>
      <div>
        <label
          htmlFor={soldForId}
          className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
        >
          Sold for
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">TND</span>
          </div>
          <input
            id={soldForId}
            placeholder="0.00"
            type="number"
            step="0.01"
            min="0"
            value={soldFor}
            onChange={(e) => onSoldForChange(parseAmountInput(e.target.value))}
            className={`pl-14 ${inputClass}`}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          What the customer pays. Leave empty for no sale. The regular price is shown struck through.
        </p>
      </div>

      <div>
        <label
          htmlFor={percentId}
          className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
        >
          Percentage off
        </label>
        <div className="relative">
          <input
            id={percentId}
            placeholder="0"
            type="number"
            step="0.01"
            min="0"
            max="99.99"
            value={salePercent}
            onChange={(e) => onPercentChange(parseAmountInput(e.target.value))}
            className={`pr-10 ${inputClass}`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Shown on the product. Does not change Sold for.
          {salePercent !== '' && salePercent > 0 && salePercent <= 99.99
            ? ` Shoppers see −${formatSalePercent(Number(salePercent))}%.`
            : ''}
        </p>
        {warning && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{warning}</p>
        )}
      </div>
    </>
  );
}
