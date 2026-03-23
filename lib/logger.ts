/**
 * Simple structured logger for observability.
 * Can be easily extended to integrate with Sentry or Axilog.
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatLog(level: LogLevel, message: string, context?: unknown) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] ${level.toUpperCase().padEnd(5)}: ${message}${contextStr}`;
}

export const logger = {
  info: (msg: string, ctx?: unknown) => console.log(formatLog('info', msg, ctx)),
  warn: (msg: string, ctx?: unknown) => console.warn(formatLog('warn', msg, ctx)),
  error: (msg: string, ctx?: unknown) => console.error(formatLog('error', msg, ctx)),
  debug: (msg: string, ctx?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('debug', msg, ctx));
    }
  },
};
