import type { Page } from 'playwright';
import { discoverProductPages } from './discovery.js';
import { extractProducts } from './extraction.js';
import { assembleOutput } from './output.js';
import { noProgress, type ProgressListener } from './progress.js';
import type { PipelineResult } from './types.js';

/**
 * Runs the scraping pipeline: discovery → extraction → output.
 * Reports each stage and every visited page to `onProgress`.
 */
export async function runPipeline(
  page: Page,
  startUrl: string,
  onProgress: ProgressListener = noProgress,
): Promise<PipelineResult> {
  onProgress({ type: 'stageStart', stage: 'discovery' });
  const productPages = await discoverProductPages(page, startUrl, onProgress);
  onProgress({ type: 'stageEnd', stage: 'discovery', summary: `${productPages.length} product pages` });

  onProgress({ type: 'stageStart', stage: 'extraction' });
  const products = await extractProducts(page, productPages, onProgress);
  onProgress({ type: 'stageEnd', stage: 'extraction', summary: `${products.length} products` });

  onProgress({ type: 'stageStart', stage: 'output' });
  const result = assembleOutput(products);
  onProgress({ type: 'stageEnd', stage: 'output', summary: `${result.result.length} products assembled, total price ${result.total}` });
  return result;
}
