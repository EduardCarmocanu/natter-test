# natter

Command-line tool for scraping websites, built with Node.js, TypeScript, Playwright and Commander.

## Requirements

- Node.js 24+
- pnpm 9+

## Setup

```sh
pnpm install
pnpm exec playwright install chromium
```

## Usage

```sh
pnpm dev --help
pnpm dev scrapeProducts --url https://example.com
pnpm dev scrapeProducts --url https://example.com --headed
```

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Run the CLI from source with tsx     |
| `pnpm build`      | Compile TypeScript to `dist/`        |
| `pnpm start`      | Run the compiled CLI                 |
| `pnpm typecheck`  | Type-check without emitting          |
| `pnpm test`       | Run unit tests once with Vitest      |
| `pnpm test:watch` | Run unit tests in watch mode         |
| `pnpm lint`       | Lint with ESLint                     |
| `pnpm lint:fix`   | Lint and auto-fix                    |

## Project structure

```
src/
  index.ts                  CLI entry point
  cli.ts                    Commander program setup
  commands/                 One file per CLI command
  browser/                  Playwright helpers
  pipeline/                 Scraping pipeline
    pipeline.ts             Runs the stages in order
    discovery.ts            Discovers and assembles product pages
    extraction.ts           Extracts product info from product pages
    output.ts               Assembles and returns the collected products
    types.ts                Data passed between stages
tests/                      Vitest unit tests
```
