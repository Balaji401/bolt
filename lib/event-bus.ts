/**
 * TraderOS Event & Intelligence Bus
 * Lightweight pub/sub for decoupled module communication.
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

export type TraderOSEvent =
  | 'trade:created'
  | 'trade:updated'
  | 'trade:deleted'
  | 'trades:imported'
  | 'account:synced'
  | 'account:connected'
  | 'account:disconnected'
  | 'review:completed'
  | 'goal:created'
  | 'goal:updated'
  | 'goal:completed'
  | 'plan:created'
  | 'plan:updated'
  | 'insight:generated'
  | 'psychology:logged'
  | 'theme:changed'
  | 'module:changed';

export type EventPayload = Record<string, unknown>;

type Listener = (payload: unknown) => void;

const listeners = new Map<TraderOSEvent, Set<Listener>>();

export function emit(event: TraderOSEvent, payload?: unknown): void {
  const set = listeners.get(event);
  if (!set) return;
  set.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error(`[EventBus] listener error for "${event}":`, err);
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

/**
 * React hook to subscribe to an event with automatic cleanup.
 */
export function useEvent(event: TraderOSEvent, handler: (payload: unknown) => void): void {
  useEffect(() => {
    return on(event, handler);
  }, [event, handler]);
}
