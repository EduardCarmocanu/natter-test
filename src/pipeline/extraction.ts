import type { Page } from 'playwright';
import { noProgress, type ProgressListener } from './progress.js';
import type { Product, ProductPage } from './types.js';

/** Product name in the product details block. */
const NAME_SELECTOR = '.product-wrapper [itemprop="name"]';
/** Product description in the product details block. */
const DESCRIPTION_SELECTOR = '.product-wrapper [itemprop="description"]';
/** Displayed price, e.g. `$416.99`. Selecting a swatch replaces its contents with the bare price text. */
const PRICE_SELECTOR = '.product-wrapper [itemprop="offers"]';
/** Options of the color dropdown, including the empty-value "Select color" placeholder. */
const COLOR_OPTION_SELECTOR = '.product-wrapper select[aria-label="color"] option';
/** Swatch buttons (e.g. HDD sizes) that can be selected; unavailable ones carry a `disabled` attribute or class. */
const SWATCH_SELECTOR = '.product-wrapper .swatches button.swatch:not([disabled]):not(.disabled)';

/** The part of a DOM element read inside the browser (the DOM lib isn't loaded). */
interface ProductElement {
  getAttribute(name: string): string | null;
  textContent: string | null;
}

/**
 * Extracts product information from each of the given product pages,
 * reporting every page it visits to `onProgress`.
 */
export async function extractProducts(
  page: Page,
  productPages: ProductPage[],
  onProgress: ProgressListener = noProgress,
): Promise<Product[]> {
  const products: Product[] = [];
  for (const [i, { url }] of productPages.entries()) {
    onProgress({ type: 'page', stage: 'extraction', url, index: i + 1, total: productPages.length });
    await page.goto(url);
    products.push(...(await extractPageProducts(page)));
  }
  return products;
}

/**
 * Reads the products on the current page: one per selectable swatch, since selecting
 * a swatch changes the price, or a single product when the page has no swatches.
 */
async function extractPageProducts(page: Page): Promise<Product[]> {
  const swatches = await page.$$eval(SWATCH_SELECTOR, (buttons: ProductElement[]) =>
    buttons.map((button) => button.getAttribute('value') ?? ''),
  );
  if (swatches.length === 0) return [await readProduct(page)];

  const products: Product[] = [];
  for (const value of swatches) {
    await page.click(`${SWATCH_SELECTOR}[value="${value}"]`);
    products.push(await readProduct(page));
  }
  return products;
}

/** Reads the product as currently displayed on the page. */
async function readProduct(page: Page): Promise<Product> {
  const product: Product = {
    name: await extractName(page),
    description: await extractDescription(page),
    price: await extractPrice(page),
  };
  const colors = await extractColors(page);
  if (colors.length > 0) product.colors = colors;
  return product;
}

async function extractName(page: Page): Promise<string> {
  return readText(page, NAME_SELECTOR);
}

async function extractDescription(page: Page): Promise<string> {
  return readText(page, DESCRIPTION_SELECTOR);
}

/** Parses the displayed price, e.g. `$416.99` → `416.99`. */
async function extractPrice(page: Page): Promise<number> {
  const text = await readText(page, PRICE_SELECTOR);
  return Number(text.replace(/[^\d.]/g, ''));
}

/** Lists the color dropdown options, skipping the placeholder; empty when there is no dropdown. */
async function extractColors(page: Page): Promise<string[]> {
  const options = await page.$$eval(COLOR_OPTION_SELECTOR, (elements: ProductElement[]) =>
    elements.map((option) => ({
      value: option.getAttribute('value') ?? '',
      text: option.textContent ?? '',
    })),
  );
  return options.filter((option) => option.value !== '').map((option) => option.text.trim());
}

async function readText(page: Page, selector: string): Promise<string> {
  const text = await page.$eval(selector, (element: ProductElement) => element.textContent);
  return (text ?? '').trim();
}
