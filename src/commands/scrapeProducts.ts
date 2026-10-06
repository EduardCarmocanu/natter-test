import type { Command } from 'commander';
import { withPage } from '../browser/browser.js';
import { runPipeline } from '../pipeline/pipeline.js';

interface ScrapeProductsOptions {
  url: string;
  headed: boolean;
}

export function registerScrapeProductsCommand(program: Command): void {
  program
    .command('scrapeProducts')
    .description('Scrape products from the given URL')
    .requiredOption('-u, --url <url>', 'URL of the page to scrape')
    .option('--headed', 'run the browser with a visible window', false)
    .action(async (options: ScrapeProductsOptions) => {
      const result = await withPage((page) => runPipeline(page, options.url), {
        headless: !options.headed,
      });
      console.log(JSON.stringify(result, null, 2));
    });
}
