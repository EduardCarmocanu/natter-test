import type { PipelineResult, Product } from './types.js';

/**
 * Assembles the collected product information into the pipeline result,
 * with `total` being the sum of all product prices rounded to cents.
 */
export function assembleOutput(products: Product[]): PipelineResult {
  const total = products.reduce((sum, product) => sum + product.price, 0);
  return { result: products, total: Math.round(total * 100) / 100 };
}
