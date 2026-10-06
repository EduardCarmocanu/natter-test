import type { Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import type { ProgressListener } from '../src/pipeline/progress.js';
import { discoverProductPages } from '../src/pipeline/discovery.js';

const BASE = 'https://example.com/shop';

interface FakeLink {
  href: string;
  text?: string;
}

/** What each fake page shows: menu links, paginator links and product card links. */
interface FakePageContent {
  menu?: string[];
  pagination?: FakeLink[];
  products?: string[];
}

const MENU = [BASE, `${BASE}/computers`, `${BASE}/phones`];

const SITE: Record<string, FakePageContent> = {
  [BASE]: { menu: MENU, products: [`${BASE}/product/1`] },
  [`${BASE}/computers`]: {
    menu: [...MENU, `${BASE}/computers/laptops`, 'https://other.com/elsewhere'],
    products: [`${BASE}/product/1`],
  },
  [`${BASE}/phones`]: { menu: MENU },
  [`${BASE}/computers/laptops`]: {
    menu: [...MENU, `${BASE}/computers/laptops`],
    // Truncated paginator: page 4 is not linked.
    pagination: [
      { href: '?page=2', text: '2' },
      { href: '?page=3', text: '3' },
      { href: '?page=5', text: '5' },
      { href: '?page=2', text: '›' },
    ],
    products: [`${BASE}/product/1`, `${BASE}/product/2`],
  },
  [`${BASE}/computers/laptops?page=2`]: { products: [`${BASE}/product/3`] },
  [`${BASE}/computers/laptops?page=3`]: { products: [`${BASE}/product/4`] },
  [`${BASE}/computers/laptops?page=4`]: { products: [`${BASE}/product/5`] },
  [`${BASE}/computers/laptops?page=5`]: { products: [`/shop/product/6`] },
};

function fakeLinks(links: FakeLink[]) {
  return links.map(({ href, text }) => ({
    getAttribute: (name: string) => (name === 'href' ? href : null),
    textContent: text ?? null,
  }));
}

function fakePage(site: Record<string, FakePageContent>) {
  let current = '';
  const goto = vi.fn((url: string) => {
    current = url;
    return Promise.resolve(null);
  });
  const $$eval = vi.fn((selector: string, fn: (links: unknown[]) => unknown) => {
    const content = site[current] ?? {};
    const toLinks = (hrefs: string[] = []) => hrefs.map((href) => ({ href }));
    if (selector.includes('side-menu')) return Promise.resolve(fn(fakeLinks(toLinks(content.menu))));
    if (selector.includes('pagination')) return Promise.resolve(fn(fakeLinks(content.pagination ?? [])));
    return Promise.resolve(fn(fakeLinks(toLinks(content.products))));
  });
  return { page: { goto, $$eval } as unknown as Page, goto };
}

describe('discoverProductPages', () => {
  it('walks every listing page of each category and collects unique product links', async () => {
    const { page, goto } = fakePage(SITE);

    const pages = await discoverProductPages(page, BASE);

    expect(pages.map((p) => p.url)).toEqual([1, 2, 3, 4, 5, 6].map((n) => `${BASE}/product/${n}`));
    expect(goto.mock.calls.map(([url]) => url)).toEqual([
      // Menu crawl
      BASE,
      `${BASE}/computers`,
      `${BASE}/phones`,
      `${BASE}/computers/laptops`,
      // Listing pages per category
      BASE,
      `${BASE}/computers`,
      `${BASE}/phones`,
      `${BASE}/computers/laptops`,
      `${BASE}/computers/laptops?page=2`,
      `${BASE}/computers/laptops?page=3`,
      `${BASE}/computers/laptops?page=4`,
      `${BASE}/computers/laptops?page=5`,
    ]);
  });

  it('reports every visited page before visiting it', async () => {
    const { page, goto } = fakePage(SITE);
    const onProgress = vi.fn<ProgressListener>();

    await discoverProductPages(page, BASE, onProgress);

    expect(onProgress.mock.calls.map(([event]) => event)).toEqual(
      goto.mock.calls.map(([url]) => ({ type: 'page', stage: 'discovery', url })),
    );
  });
});
