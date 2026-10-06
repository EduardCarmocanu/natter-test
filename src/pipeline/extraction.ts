import type { Page } from 'playwright';
import type { Product, ProductPage } from './types.js';

/**
 * Extracts product information from each of the given product pages.
 */
export function extractProducts(_page: Page, _productPages: ProductPage[]): Promise<Product[]> {
  // TODO: implement product extraction
  return Promise.resolve([]);
}
