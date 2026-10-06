const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const INTERVAL_MS = 80;

const CLEAR_LINE = '\r\x1b[K';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';

/** The part of a writable stream the spinner needs, e.g. `process.stderr`. */
export interface SpinnerStream {
  write(text: string): unknown;
  isTTY?: boolean;
  columns?: number;
}

/**
 * A single-line terminal spinner. On a TTY it animates and redraws its line in place;
 * otherwise it only writes a line when a task starts and when it finishes.
 */
export class Spinner {
  private text = '';
  private frame = 0;
  private timer: NodeJS.Timeout | undefined;

  constructor(private readonly stream: SpinnerStream = process.stderr) {}

  /** Starts spinning with `text`, replacing any task already in progress. */
  start(text: string): void {
    this.text = text;
    if (!this.stream.isTTY) {
      this.stream.write(`${text}\n`);
      return;
    }
    if (!this.timer) {
      this.stream.write(HIDE_CURSOR);
      this.timer = setInterval(() => this.render(), INTERVAL_MS);
    }
    this.render();
  }

  /** Changes the text of the task in progress; ignored when not on a TTY. */
  update(text: string): void {
    this.text = text;
  }

  succeed(text: string): void {
    this.stop(`✔ ${text}`);
  }

  fail(text: string): void {
    this.stop(`✖ ${text}`);
  }

  private stop(line: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
      this.stream.write(`${CLEAR_LINE}${SHOW_CURSOR}`);
    }
    this.stream.write(`${line}\n`);
  }

  private render(): void {
    const frame = FRAMES[this.frame++ % FRAMES.length];
    this.stream.write(`${CLEAR_LINE}${truncate(`${frame} ${this.text}`, this.stream.columns)}`);
  }
}

/** Cuts `text` to fit in `columns` so the line never wraps, which would break the in-place redraw. */
function truncate(text: string, columns = 80): string {
  return text.length < columns ? text : `${text.slice(0, Math.max(0, columns - 2))}…`;
}
