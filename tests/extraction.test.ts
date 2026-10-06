import type { Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import type { ProgressListener } from '../src/pipeline/progress.js';
import { extractProducts } from '../src/pipeline/extraction.js';

const BASE = 'https://example.com/shop/product';

interface FakeSwatch {
  value: string;
  price: string;
  disabled?: boolean;
}

/** What each fake product page shows. */
interface FakeProductPage {
  name: string;
  description: string;
  price: string;
  swatches?: FakeSwatch[];
  colors?: string[];
}

const LAPTOP: FakeProductPage = {
  name: 'Packard 255 G2',
  description: '15.6", AMD E2-3800 1.3GHz, 4GB, 500GB, Windows 8.1',
  price: '$416.99',
  swatches: [
    { value: '128', price: '$416.99' },
    { value: '256', price: '$436.99' },
    { value: '512', price: '$456.99' },
    { value: '1024', price: '$476.99', disabled: true },
  ],
};

const PHONE: FakeProductPage = {
  name: 'Nokia 123',
  description: '7 day battery',
  price: '$24.99',
  colors: ['Gold', 'White', 'Black'],
};

const TABLET: FakeProductPage = {
  name: 'Lenovo IdeaTab',
  description: '7" screen, Android',
  price: '$69.99',
};

function fakeElement(attributes: Record<string, string>, text: string) {
  return {
    getAttribute: (name: string) => attributes[name] ?? null,
    textContent: text,
  };
}

function fakePage(site: Record<string, FakeProductPage>) {
  let current: FakeProductPage | undefined;
  let selectedSwatch: FakeSwatch | undefined;

  const goto = vi.fn((url: string) => {
    current = site[url];
    selectedSwatch = undefined;
    return Promise.resolve(null);
  });
  const click = vi.fn((selector: string) => {
    const value = /\[value="([^"]*)"\]$/.exec(selector)?.[1];
    selectedSwatch = current?.swatches?.find((swatch) => swatch.value === value && !swatch.disabled);
    if (!selectedSwatch) return Promise.reject(new Error(`No element for ${selector}`));
    return Promise.resolve();
  });
  const $eval = vi.fn((selector: string, fn: (element: unknown) => unknown) => {
    if (!current) return Promise.reject(new Error('No page'));
    const text = selector.includes('"name"')
      ? current.name
      : selector.includes('"description"')
        ? current.description
        : (selectedSwatch?.price ?? current.price);
    return Promise.resolve(fn(fakeElement({}, `\n\t${text}\n`)));
  });
  const $$eval = vi.fn((selector: string, fn: (elements: unknown[]) => unknown) => {
    if (selector.includes('swatch')) {
      const enabled = (current?.swatches ?? []).filter((swatch) => !swatch.disabled);
      return Promise.resolve(fn(enabled.map(({ value }) => fakeElement({ value }, value))));
    }
    const colors = current?.colors;
    const options = colors
      ? [fakeElement({ value: '' }, 'Select color'), ...colors.map((c) => fakeElement({ value: c }, ` ${c} `))]
      : [];
    return Promise.resolve(fn(options));
  });

  return { page: { goto, click, $eval, $$eval } as unknown as Page, goto, click };
}

describe('extractProducts', () => {
  it('extracts one product per enabled swatch, reading the price after each click', async () => {
    const { page, click } = fakePage({ [`${BASE}/1`]: LAPTOP });

    const products = await extractProducts(page, [{ url: `${BASE}/1` }]);

    expect(products).toEqual(
      [416.99, 436.99, 456.99].map((price) => ({
        name: LAPTOP.name,
        description: LAPTOP.description,
        price,
      })),
    );
    expect(click.mock.calls.map(([selector]) => /value="(\d+)"/.exec(selector)?.[1])).toEqual([
      '128',
      '256',
      '512',
    ]);
  });

  it('extracts the color options without the placeholder', async () => {
    const { page, click } = fakePage({ [`${BASE}/2`]: PHONE });

    const products = await extractProducts(page, [{ url: `${BASE}/2` }]);

    expect(products).toEqual([
      { name: 'Nokia 123', description: '7 day battery', price: 24.99, colors: ['Gold', 'White', 'Black'] },
    ]);
    expect(click).not.toHaveBeenCalled();
  });

  it('omits colors when the page has no color select', async () => {
    const { page } = fakePage({ [`${BASE}/3`]: TABLET });

    const [product] = await extractProducts(page, [{ url: `${BASE}/3` }]);

    expect(product).toEqual({ name: 'Lenovo IdeaTab', description: '7" screen, Android', price: 69.99 });
    expect(product).not.toHaveProperty('colors');
  });

  it('visits every product page and concatenates the products in order', async () => {
    const { page, goto } = fakePage({
      [`${BASE}/1`]: LAPTOP,
      [`${BASE}/2`]: PHONE,
      [`${BASE}/3`]: TABLET,
    });

    const products = await extractProducts(page, [1, 2, 3].map((n) => ({ url: `${BASE}/${n}` })));

    expect(goto.mock.calls.map(([url]) => url)).toEqual([1, 2, 3].map((n) => `${BASE}/${n}`));
    expect(products.map((p) => p.name)).toEqual([
      ...Array<string>(3).fill(LAPTOP.name),
      PHONE.name,
      TABLET.name,
    ]);
  });

  it('reports each product page with its position', async () => {
    const { page } = fakePage({ [`${BASE}/2`]: PHONE, [`${BASE}/3`]: TABLET });
    const onProgress = vi.fn<ProgressListener>();

    await extractProducts(page, [{ url: `${BASE}/2` }, { url: `${BASE}/3` }], onProgress);

    expect(onProgress.mock.calls.map(([event]) => event)).toEqual([
      { type: 'page', stage: 'extraction', url: `${BASE}/2`, index: 1, total: 2 },
      { type: 'page', stage: 'extraction', url: `${BASE}/3`, index: 2, total: 2 },
    ]);
  });
});
