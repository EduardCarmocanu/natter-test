import type { Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import { discoverProductPages } from '../src/pipeline/discovery.js';

const BASE = 'https://example.com/shop';

/** Menu links shown on each page; category pages expand their subcategories. */
const SITE: Record<string, string[]> = {
  [BASE]: [BASE, `${BASE}/computers`, `${BASE}/phones`],
  [`${BASE}/computers`]: [
    `${BASE}/`,
    `${BASE}/computers`,
    `${BASE}/computers/laptops`,
    `${BASE}/computers/tablets#top`,
    `${BASE}/phones`,
    'https://other.com/elsewhere',
  ],
  [`${BASE}/phones`]: [BASE, `${BASE}/computers`, `${BASE}/phones`, `${BASE}/phones/touch`],
  [`${BASE}/computers/laptops`]: [BASE, `${BASE}/computers`, `${BASE}/computers/laptops`],
  [`${BASE}/computers/tablets`]: [BASE, `${BASE}/computers`, `${BASE}/computers/tablets`],
  [`${BASE}/phones/touch`]: [BASE, `${BASE}/phones`, `${BASE}/phones/touch`],
};

function fakePage(site: Record<string, string[]>) {
  let current = '';
  const goto = vi.fn((url: string) => {
    current = url;
    return Promise.resolve(null);
  });
  const $$eval = vi.fn(() => Promise.resolve(site[current] ?? []));
  return { page: { goto, $$eval } as unknown as Page, goto };
}

describe('discoverProductPages', () => {
  it('follows nested menu links, visiting each page once', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { page, goto } = fakePage(SITE);

    const pages = await discoverProductPages(page, BASE);

    expect(pages.map((p) => p.url)).toEqual([
      BASE,
      `${BASE}/computers`,
      `${BASE}/phones`,
      `${BASE}/computers/laptops`,
      `${BASE}/computers/tablets`,
      `${BASE}/phones/touch`,
    ]);
    expect(goto).toHaveBeenCalledTimes(6);
  });
});
