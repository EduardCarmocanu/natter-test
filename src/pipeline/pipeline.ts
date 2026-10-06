import type { Page } from 'playwright';
import { discoverProductPages } from './discovery.js';
import { extractProducts } from './extraction.js';
import { assembleOutput } from './output.js';
import type { PipelineResult } from './types.js';

/**
 * Runs the scraping pipeline: discovery → extraction → output.
 */
export async function runPipeline(page: Page, startUrl: string): Promise<PipelineResult> {
  const productPages = await discoverProductPages(page, startUrl);
  const products = await extractProducts(page, productPages);
  return assembleOutput(products);
}
