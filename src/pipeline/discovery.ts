import type { Page } from 'playwright';
import type { ProductPage } from './types.js';

/**
 * Discovers and assembles the list of product pages reachable from `startUrl`.
 */
export function discoverProductPages(_page: Page, _startUrl: string): Promise<ProductPage[]> {
  // TODO: implement product page discovery
  return Promise.resolve([]);
}
