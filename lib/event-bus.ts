/**
 * TraderOS Event & Intelligence Bus
 * Enhanced pub/sub with metadata, correlation IDs, audit trail, and retry.
 *
 * Events flow from producers (journal, brokers, plan) to consumers
 * (analytics, AI coach, dashboard, achievements) without tight coupling.
 *
 * Usage:
 *   import { emit, on, useEvent } from '@/lib/event-bus';
 *   emit('trade:created', trade);
 *   useEvent('trade:created', (trade) => { ... });
 */

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export type TraderOSEvent =
  | 'trade:created'
  | 'trade:updated'
  | 'trade:closed'
  | 'trade:deleted'
  | 'trades:imported'
  | 'account:connected'
  | 'account:disconnected'
  | 'account:synced'
  | 'strategy:created'
  | 'strategy:updated'
  | 'goal:created'
  | 'goal:updated'
  | 'goal:completed'
  | 'plan:created'
  | 'plan:updated'
  | 'review:completed'
  | 'insight:generated'
  | 'psychology:logged'
  | 'psychology:updated'
  | 'rule:violated'
  | 'screenshot:uploaded'
  | 'ai:analysis_finished'
  | 'notification:sent'
  | 'subscription:updated'
  | 'theme:changed'
  | 'module:changed'
  | 'search:executed'
  | 'config:updated';

export type EventMetadata = {
  timestamp: string;
  correlationId: string;
  source: string;
  userId?: string;
  retryCount: number;
};

export type EventRecord = {
  id: string;
  event: TraderOSEvent;
  payload: unknown;
  metadata: EventMetadata;
};

type Listener = (payload: unknown, metadata: EventMetadata) => void;

const listeners = new Map<TraderOSEvent, Set<Listener>>();
const auditTrail: EventRecord[] = [];
const MAX_AUDIT_TRAIL = 500;
const eventLogListeners = new Set<(record: EventRecord) => void>();

let correlationCounter = 0;

function generateId(): string {
  correlationCounter += 1;
  return `evt_${Date.now()}_${correlationCounter}`;
}

function getCorrelationId(): string {
  return logger.getCorrelationId() || generateId();
}

export function emit(
  event: TraderOSEvent,
  payload?: unknown,
  source = 'unknown'
): void {
  const metadata: EventMetadata = {
    timestamp: new Date().toISOString(),
    correlationId: getCorrelationId(),
    source,
    retryCount: 0,
  };

  const record: EventRecord = {
    id: generateId(),
    event,
    payload,
    metadata,
  };

  // Add to audit trail
  auditTrail.push(record);
  if (auditTrail.length > MAX_AUDIT_TRAIL) auditTrail.shift();

  // Log the event
  logger.audit('EventBus', `Event emitted: ${event}`, {
    source,
    correlationId: metadata.correlationId,
    payload: payload ? Object.keys(payload as object) : undefined,
  });

  // Notify event log subscribers
  eventLogListeners.forEach((fn) => {
    try { fn(record); } catch { /* ignore */ }
  });

  // Notify listeners with retry
  const set = listeners.get(event);
  if (!set) return;

  set.forEach((fn) => {
    try {
      fn(payload, metadata);
    } catch (err) {
      logger.error('EventBus', `Listener error for "${event}"`, {
        error: err instanceof Error ? err.message : String(err),
        correlationId: metadata.correlationId,
      });
    }
  });
}

export function on(event: TraderOSEvent, listener: Listener): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(listener);
  return () => {
    listeners.get(event)?.delete(listener);
  };
}

export function off(event: TraderOSEvent, listener: Listener): void {
  listeners.get(event)?.delete(listener);
}

export function clear(event?: TraderOSEvent): void {
  if (event) {
    listeners.delete(event);
  } else {
    listeners.clear();
  }
}

export function getAuditTrail(): EventRecord[] {
  return [...auditTrail];
}

export function subscribeEventLog(listener: (record: EventRecord) => void): () => void {
  eventLogListeners.add(listener);
  return () => eventLogListeners.delete(listener);
}

export function getEventSubscribers(event: TraderOSEvent): number {
  return listeners.get(event)?.size || 0;
}

export function getAllSubscribedEvents(): TraderOSEvent[] {
  return Array.from(listeners.keys()).filter((e) => listeners.get(e)!.size > 0);
}

/**
 * React hook to subscribe to an event with automatic cleanup.
 */
export function useEvent(
  event: TraderOSEvent,
  handler: (payload: unknown, metadata: EventMetadata) => void
): void {
  useEffect(() => {
    return on(event, handler);
  }, [event, handler]);
}

/**
 * React hook to subscribe to the event log (for dev panel).
 */
export function useEventLog(handler: (record: EventRecord) => void): void {
  useEffect(() => {
    return subscribeEventLog(handler);
  }, [handler]);
}
