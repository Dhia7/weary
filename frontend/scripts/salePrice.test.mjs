import assert from 'node:assert/strict';
import test from 'node:test';
import { customerPriceFromSale, storedPricesFromSale } from '../src/lib/salePrice.ts';

test('a sale copies the customer price onto a new color, not the struck-through price', () => {
  assert.equal(customerPriceFromSale(2231, 1499), 1499);
  assert.equal(customerPriceFromSale(640, 370), 370);
  assert.equal(customerPriceFromSale(640, ''), 640);
  assert.equal(customerPriceFromSale(370, 370), 370);
});

test('blank variant prices persist what the customer pays', () => {
  const stored = storedPricesFromSale(2231, 1499, '', '');
  const variantPrices = [];
  const written = variantPrices.length > 0 ? Math.min(...variantPrices) : stored.price;
  assert.equal(stored.compareAtPrice, 2231);
  assert.equal(written, 1499);
});
