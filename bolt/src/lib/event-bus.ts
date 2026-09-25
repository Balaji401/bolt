import { useEffect } from 'react';
import { logger } from './logger';

export type TraderOSEvent =
  | 'trade:created' | 'trade:updated' | 'trade:closed' | 'trade:deleted' | 'trades:imported'
  | 'account:connected' | 'account:disconnected' | 'account:synced'
  | 'strategy:created' | 'strategy:updated'
  | 'goal:created' | 'goal:updated' | 'goal:completed'
  | 'plan:created' | 'plan:updated'
  | 'review:completed' | 'insight:generated' | 'psychology:logged' | 'psychology:updated'
  | 'rule:violated' | 'screenshot:uploaded' | 'ai:analysis_finished'
  | 'notification:sent' | 'subscription:updated'
  | 'theme:changed' | 'module:changed' | 'search:executed' | 'config:updated'
  | 'journal:add-trade' | 'journal:prefill-trade' | 'trade:archived';

export type EventMetadata = {
  timestamp: string;
  correlationId: string;
  source: string;
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

export function emit(event: TraderOSEvent, payload?: unknown, source = 'unknown'): void {
  const metadata: EventMetadata = {
    timestamp: new Date().toISOString(),
    correlationId: generateId(),
    source,
    retryCount: 0,
  };
  const record: EventRecord = { id: generateId(), event, payload, metadata };
  auditTrail.push(record);
  if (auditTrail.length > MAX_AUDIT_TRAIL) auditTrail.shift();
  logger.audit('EventBus', `Event: ${event}`, { source, correlationId: metadata.correlationId });
  eventLogListeners.forEach((fn) => { try { fn(record); } catch { /* ignore */ } });
  const set = listeners.get(event);
  if (!set) return;
  set.forEach((fn) => {
    try { fn(payload, metadata); }
    catch (err) { logger.error('EventBus', `Listener error: ${event}`, { error: err instanceof Error ? err.message : String(err) }); }
  });
}

export function on(event: TraderOSEvent, listener: Listener): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(listener);
  return () => { listeners.get(event)?.delete(listener); };
}

export function off(event: TraderOSEvent, listener: Listener): void {
  listeners.get(event)?.delete(listener);
}

export function clear(event?: TraderOSEvent): void {
  if (event) listeners.delete(event);
  else listeners.clear();
}

export function getAuditTrail(): EventRecord[] { return [...auditTrail]; }
export function subscribeEventLog(listener: (record: EventRecord) => void): () => void {
  eventLogListeners.add(listener);
  return () => eventLogListeners.delete(listener);
}

export function useEvent(event: TraderOSEvent, handler: (payload: unknown, metadata: EventMetadata) => void): void {
  useEffect(() => on(event, handler), [event, handler]);
}

export function useEventLog(handler: (record: EventRecord) => void): void {
  useEffect(() => subscribeEventLog(handler), [handler]);
}
