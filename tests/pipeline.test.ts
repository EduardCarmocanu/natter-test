import type { Page } from 'playwright';
import { describe, expect, it } from 'vitest';
import { runPipeline } from '../src/pipeline/pipeline.js';

describe('runPipeline', () => {
  it('chains discovery, extraction and output', async () => {
    const result = await runPipeline({} as Page, 'https://example.com');

    expect(result).toEqual({ products: [] });
  });
});
