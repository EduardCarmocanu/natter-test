import type { Command } from 'commander';
import { withPage } from '../browser/browser.js';
import { runPipeline } from '../pipeline/pipeline.js';
import type { PipelineStage, ProgressListener } from '../pipeline/progress.js';
import { Spinner } from '../ui/spinner.js';

interface ScrapeProductsOptions {
  url: string;
  headed: boolean;
}

/** What each stage is shown as while running and once done. */
const STAGE_LABELS: Record<PipelineStage, { running: string; done: string }> = {
  discovery: { running: 'Discovering product pages…', done: 'Discovery' },
  extraction: { running: 'Extracting products…', done: 'Extraction' },
  output: { running: 'Assembling output…', done: 'Output' },
};

export function registerScrapeProductsCommand(program: Command): void {
  program
    .command('scrapeProducts')
    .description('Scrape products from the given URL')
    .requiredOption('-u, --url <url>', 'URL of the page to scrape')
    .option('--headed', 'run the browser with a visible window', false)
    .action(async (options: ScrapeProductsOptions) => {
      const spinner = new Spinner();
      try {
        const result = await withPage((page) => runPipeline(page, options.url, showProgress(spinner)), {
          headless: !options.headed,
        });
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        spinner.fail('Scraping failed');
        throw error;
      }
    });
}

/** Shows the running stage and the page being processed on the spinner. */
export function showProgress(spinner: Spinner): ProgressListener {
  return (event) => {
    const labels = STAGE_LABELS[event.stage];
    switch (event.type) {
      case 'stageStart':
        spinner.start(labels.running);
        break;
      case 'page': {
        const counter = event.index !== undefined ? ` [${event.index}/${event.total}]` : '';
        spinner.update(`${labels.running}${counter} ${event.url}`);
        break;
      }
      case 'stageEnd':
        spinner.succeed(`${labels.done}: ${event.summary}`);
        break;
    }
  };
}
