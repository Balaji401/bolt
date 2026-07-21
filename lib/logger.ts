/**
 * TraderOS Centralized Logger
 * Structured logging with levels, categories, and optional remote transport.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'audit';

export type LogEntry = {
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  correlationId?: string;
};

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  audit: 4,
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  debug: 'DBG',
  info: 'INF',
  warn: 'WRN',
  error: 'ERR',
  audit: 'AUD',
};

const LEVEL_STYLE: Record<LogLevel, string> = {
  debug: 'color: #888',
  info: 'color: #4af',
  warn: 'color: #fa0',
  error: 'color: #f44',
  audit: 'color: #a0f',
};

class Logger {
  private minLevel: LogLevel = 'debug';
  private auditTrail: LogEntry[] = [];
  private maxAuditTrail = 200;
  private listeners: Set<(entry: LogEntry) => void> = new Set();
  private correlationId: string | null = null;

  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  setCorrelationId(id: string | null) {
    this.correlationId = id;
  }

  getCorrelationId() {
    return this.correlationId;
  }

  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  log(level: LogLevel, category: string, message: string, data?: Record<string, unknown>) {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      category,
      message,
      data,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId || undefined,
    };

    // Console output with styling
    const style = LEVEL_STYLE[level];
    const prefix = `%c[${LEVEL_LABEL[level]}] [${category}]`;
    if (level === 'error') {
      console.error(prefix, style, message, data || '');
    } else if (level === 'warn') {
      console.warn(prefix, style, message, data || '');
    } else {
      console.log(prefix, style, message, data || '');
    }

    // Audit trail
    if (level === 'audit') {
      this.auditTrail.push(entry);
      if (this.auditTrail.length > this.maxAuditTrail) this.auditTrail.shift();
    }

    // Notify subscribers
    this.listeners.forEach((fn) => {
      try { fn(entry); } catch { /* ignore */ }
    });
  }

  info(category: string, message: string, data?: Record<string, unknown>) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: Record<string, unknown>) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: Record<string, unknown>) {
    this.log('error', category, message, data);
  }

  debug(category: string, message: string, data?: Record<string, unknown>) {
    this.log('debug', category, message, data);
  }

  audit(category: string, message: string, data?: Record<string, unknown>) {
    this.log('audit', category, message, data);
  }

  getAuditTrail(): LogEntry[] {
    return [...this.auditTrail];
  }

  clearAuditTrail() {
    this.auditTrail = [];
  }
}

export const logger = new Logger();

// Set default level based on env
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  logger.setMinLevel('info');
}
