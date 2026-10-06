import type { PipelineResult, Product } from './types.js';

/**
 * Assembles the collected product information into the pipeline result.
 */
export function assembleOutput(products: Product[]): PipelineResult {
  // TODO: implement output assembly (deduplication, formatting, etc.)
  return { products };
}
