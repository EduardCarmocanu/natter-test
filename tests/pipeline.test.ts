import type { Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import type { ProgressListener } from '../src/pipeline/progress.js';
import { runPipeline } from '../src/pipeline/pipeline.js';

describe('runPipeline', () => {
  it('chains discovery, extraction and output, reporting each stage', async () => {
    const page = {
      goto: () => Promise.resolve(null),
      $$eval: () => Promise.resolve([]),
    } as unknown as Page;
    const onProgress = vi.fn<ProgressListener>();

    const result = await runPipeline(page, 'https://example.com', onProgress);

    expect(result).toEqual({ result: [], total: 0 });
    expect(onProgress.mock.calls.map(([event]) => event)).toEqual([
      { type: 'stageStart', stage: 'discovery' },
      { type: 'page', stage: 'discovery', url: 'https://example.com/' },
      { type: 'page', stage: 'discovery', url: 'https://example.com/' },
      { type: 'stageEnd', stage: 'discovery', summary: '0 product pages' },
      { type: 'stageStart', stage: 'extraction' },
      { type: 'stageEnd', stage: 'extraction', summary: '0 products' },
      { type: 'stageStart', stage: 'output' },
      { type: 'stageEnd', stage: 'output', summary: '0 products assembled, total price 0' },
    ]);
  });
});
