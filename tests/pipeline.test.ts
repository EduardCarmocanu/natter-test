import type { Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import { runPipeline } from '../src/pipeline/pipeline.js';

describe('runPipeline', () => {
  it('chains discovery, extraction and output', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'dir').mockImplementation(() => {});
    const page = {
      goto: () => Promise.resolve(null),
      $$eval: () => Promise.resolve([]),
    } as unknown as Page;

    const result = await runPipeline(page, 'https://example.com');

    expect(result).toEqual({ products: [] });
  });
});
