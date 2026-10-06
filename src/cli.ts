import { Command } from 'commander';
import { registerScrapeProductsCommand } from './commands/scrapeProducts.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('natter')
    .description('Command-line tool for scraping websites')
    .version('0.1.0');

  registerScrapeProductsCommand(program);

  return program;
}
