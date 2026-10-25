import { env } from '../config/env';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const current: Level = (env.logLevel as Level) in LEVELS ? (env.logLevel as Level) : 'info';

function log(level: Level, message: string, ...args: unknown[]): void {
  if (LEVELS[level] < LEVELS[current]) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[${ts}] [${level.toUpperCase()}] ${message}`, ...args);
}

export const logger = {
  debug: (m: string, ...a: unknown[]) => log('debug', m, ...a),
  info: (m: string, ...a: unknown[]) => log('info', m, ...a),
  warn: (m: string, ...a: unknown[]) => log('warn', m, ...a),
  error: (m: string, ...a: unknown[]) => log('error', m, ...a),
};
