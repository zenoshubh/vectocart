/**
 * Centralized logging utility for VectoCart
 * Logs are only shown in development mode
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const prefix = `[VectoCart][${level.toUpperCase()}]`;
    return context ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (isDev) {
      console.debug(this.formatMessage('debug', message), context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (isDev) {
      console.info(this.formatMessage('info', message), context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (isDev) {
      console.warn(this.formatMessage('warn', message), context || '');
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (isDev) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error(this.formatMessage('error', message), errorObj, context || '');
    }
  }
}

export const logger = new Logger();

