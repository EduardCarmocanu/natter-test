import { afterEach, describe, expect, it, vi } from 'vitest';
import { showProgress } from '../src/commands/scrapeProducts.js';
import { Spinner } from '../src/ui/spinner.js';

function fakeStream(isTTY: boolean, columns = 80) {
  const chunks: string[] = [];
  return { stream: { isTTY, columns, write: (text: string) => chunks.push(text) }, chunks };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Spinner', () => {
  it('writes only start and finish lines when not on a TTY', () => {
    const { stream, chunks } = fakeStream(false);
    const spinner = new Spinner(stream);

    spinner.start('Working…');
    spinner.update('Working… page 1');
    spinner.succeed('Done');

    expect(chunks).toEqual(['Working…\n', '✔ Done\n']);
  });

  it('redraws the updated text in place on a TTY and restores the cursor when done', () => {
    vi.useFakeTimers();
    const { stream, chunks } = fakeStream(true);
    const spinner = new Spinner(stream);

    spinner.start('Working…');
    spinner.update('Working… page 1');
    vi.advanceTimersByTime(80);
    spinner.fail('Broken');

    const output = chunks.join('');
    expect(output).toContain('\x1b[?25l');
    expect(output).toContain('\r\x1b[K⠙ Working… page 1');
    expect(output.endsWith('\x1b[?25h✖ Broken\n')).toBe(true);
  });

  it('cuts lines that would wrap', () => {
    vi.useFakeTimers();
    const { stream, chunks } = fakeStream(true, 10);
    const spinner = new Spinner(stream);

    spinner.start('a very long line of text');
    spinner.succeed('ok');

    expect(chunks).toContain('\r\x1b[K⠋ a very…');
  });
});

describe('showProgress', () => {
  it('shows each stage and the page being processed', () => {
    vi.useFakeTimers();
    const { stream, chunks } = fakeStream(true);
    const onProgress = showProgress(new Spinner(stream));

    onProgress({ type: 'stageStart', stage: 'extraction' });
    onProgress({ type: 'page', stage: 'extraction', url: 'https://a.com/p/1', index: 3, total: 9 });
    vi.advanceTimersByTime(80);
    onProgress({ type: 'stageEnd', stage: 'extraction', summary: '9 products' });

    const output = chunks.join('');
    expect(output).toContain('Extracting products… [3/9] https://a.com/p/1');
    expect(output).toContain('✔ Extraction: 9 products\n');
  });
});
