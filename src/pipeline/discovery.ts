import type { Page } from 'playwright';
import { noProgress, type ProgressListener } from './progress.js';
import type { ProductPage } from './types.js';

/** Side navigation listing the product category pages, at any nesting depth. */
const MENU_LINK_SELECTOR = '#side-menu a[href]';
/** Page links in a category's paginator; the current and disabled items are not links. */
const PAGINATION_LINK_SELECTOR = 'ul.pagination a.page-link[href]';
/** Link to the dedicated product page on each product card. */
const PRODUCT_LINK_SELECTOR = '.card.thumbnail a.title[href]';

/** The part of a DOM anchor element read inside the browser (the DOM lib isn't loaded). */
interface LinkElement {
  getAttribute(name: string): string | null;
  textContent: string | null;
}

/**
 * Discovers and assembles the list of product pages reachable from `startUrl`.
 *
 * Collects the category pages from the side navigation, then walks every listing
 * page of each category and collects the product page links from its product cards.
 * Reports every page it visits to `onProgress`.
 */
export async function discoverProductPages(
  page: Page,
  startUrl: string,
  onProgress: ProgressListener = noProgress,
): Promise<ProductPage[]> {
  const visit = (url: string) => {
    onProgress({ type: 'page', stage: 'discovery', url });
    return page.goto(url);
  };
  const categories = await collectCategoryPages(page, startUrl, visit);
  const productUrls = new Set<string>();

  for (const category of categories) {
    await visit(category);
    for (const listingUrl of await listingPageUrls(page, category)) {
      if (listingUrl !== category) await visit(listingUrl);
      for (const productUrl of await collectProductLinks(page, listingUrl)) {
        productUrls.add(productUrl);
      }
    }
  }

  return [...productUrls].map((url) => ({ url }));
}

/**
 * Crawls the side navigation breadth-first: visiting a category page reveals its
 * nested subcategory links, which are queued in turn. Each URL is visited once.
 */
async function collectCategoryPages(
  page: Page,
  startUrl: string,
  visit: (url: string) => Promise<unknown>,
): Promise<string[]> {
  const origin = new URL(startUrl).origin;
  const toVisit = [normalizeUrl(startUrl)];
  const visited = new Set<string>();

  while (toVisit.length > 0) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    await visit(url);
    const hrefs = await page.$$eval(MENU_LINK_SELECTOR, (links: LinkElement[]) =>
      links.map((link) => link.getAttribute('href') ?? ''),
    );

    for (const href of hrefs) {
      const link = normalizeUrl(new URL(href, url).toString());
      if (new URL(link).origin !== origin) continue;
      if (visited.has(link) || toVisit.includes(link)) continue;
      toVisit.push(link);
    }
  }

  return [...visited];
}

/**
 * Lists every page of the category `page` is currently on. The paginator only shows
 * some page numbers, so the pages are built from the highest one via the `page` param.
 */
async function listingPageUrls(page: Page, categoryUrl: string): Promise<string[]> {
  const pageNumbers = await page.$$eval(PAGINATION_LINK_SELECTOR, (links: LinkElement[]) =>
    links.map((link) => (link.textContent ?? '').trim()),
  );
  const lastPage = Math.max(1, ...pageNumbers.filter((text) => /^\d+$/.test(text)).map(Number));

  const urls = [categoryUrl];
  for (let n = 2; n <= lastPage; n++) {
    const url = new URL(categoryUrl);
    url.searchParams.set('page', String(n));
    urls.push(url.toString());
  }
  return urls;
}

/** Collects the product page links from the product cards on the current page. */
async function collectProductLinks(page: Page, url: string): Promise<string[]> {
  const hrefs = await page.$$eval(PRODUCT_LINK_SELECTOR, (links: LinkElement[]) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  );
  return hrefs.map((href) => normalizeUrl(new URL(href, url).toString()));
}

/** Drops the hash and trailing slash so equivalent URLs compare equal. */
function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  return parsed.toString();
}
