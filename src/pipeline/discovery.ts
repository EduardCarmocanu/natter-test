import type { Page } from 'playwright';
import type { ProductPage } from './types.js';

/** Side navigation listing the product category pages, at any nesting depth. */
const MENU_LINK_SELECTOR = '#side-menu a[href]';

/** The part of a DOM anchor element read inside the browser (the DOM lib isn't loaded). */
interface MenuLink {
  getAttribute(name: string): string | null;
}

/**
 * Discovers and assembles the list of product pages reachable from `startUrl`.
 *
 * Crawls the side navigation breadth-first: visiting a category page reveals its
 * nested subcategory links, which are queued in turn. Each URL is visited once.
 */
export async function discoverProductPages(page: Page, startUrl: string): Promise<ProductPage[]> {
  const origin = new URL(startUrl).origin;
  const toVisit = [normalizeUrl(startUrl)];
  const visited = new Set<string>();

  while (toVisit.length > 0) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    await page.goto(url);
    const hrefs = await page.$$eval(MENU_LINK_SELECTOR, (links: MenuLink[]) =>
      links.map((link) => link.getAttribute('href') ?? ''),
    );

    for (const href of hrefs) {
      const link = normalizeUrl(new URL(href, url).toString());
      if (new URL(link).origin !== origin) continue;
      if (visited.has(link) || toVisit.includes(link)) continue;
      toVisit.push(link);
    }
  }

  const links = [...visited];
  console.log(links);
  return links.map((url) => ({ url }));
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
