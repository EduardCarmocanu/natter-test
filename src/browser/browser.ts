import { chromium, type Browser, type Page } from 'playwright';

export interface BrowserOptions {
  headless?: boolean;
}

export async function launchBrowser({ headless = true }: BrowserOptions = {}): Promise<Browser> {
  return chromium.launch({ headless });
}

export async function withPage<T>(
  fn: (page: Page) => Promise<T>,
  options: BrowserOptions = {},
): Promise<T> {
  const browser = await launchBrowser(options);
  try {
    const page = await browser.newPage();
    return await fn(page);
  } finally {
    await browser.close();
  }
}
