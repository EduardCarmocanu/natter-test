import { describe, expect, it } from 'vitest';
import { createCli } from '../src/cli.js';

describe('createCli', () => {
  it('configures the program name and version', () => {
    const program = createCli();

    expect(program.name()).toBe('natter');
    expect(program.version()).toBe('0.1.0');
  });

  it('registers the scrapeProducts command', () => {
    const program = createCli();
    const command = program.commands.find((c) => c.name() === 'scrapeProducts');

    expect(command).toBeDefined();
    const urlOption = command?.options.find((o) => o.long === '--url');
    expect(urlOption?.mandatory).toBe(true);
  });
});
