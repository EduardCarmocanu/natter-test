import { describe, expect, it } from 'vitest';
import { assembleOutput } from '../src/pipeline/output.js';
import type { Product } from '../src/pipeline/types.js';

describe('assembleOutput', () => {
  it('returns an empty result when there are no products', () => {
    expect(assembleOutput([])).toEqual({ result: [], total: 0 });
  });

  it('returns the products with the sum of their prices as total', () => {
    const products: Product[] = [
      { name: 'Laptop', description: '15" screen', price: 416.99 },
      { name: 'Phone', description: 'Dual SIM', price: 199.5, colors: ['Black', 'White'] },
    ];

    expect(assembleOutput(products)).toEqual({ result: products, total: 616.49 });
  });

  it('rounds the total to cents', () => {
    const products: Product[] = [
      { name: 'A', description: '', price: 0.1 },
      { name: 'B', description: '', price: 0.2 },
    ];

    expect(assembleOutput(products).total).toBe(0.3);
  });
});
