/**
 * TraderOS Validation Library
 * Reusable Zod schemas for client + server validation.
 */

import { z } from 'zod';

export const tradeSchema = z.object({
  instrument: z.string().min(1, 'Instrument is required').max(20),
  direction: z.enum(['long', 'short']),
  entry_price: z.number().positive('Entry price must be positive'),
  exit_price: z.number().positive().optional().nullable(),
  quantity: z.number().positive('Quantity must be positive').default(1),
  stop_loss: z.number().positive().optional().nullable(),
  take_profit: z.number().positive().optional().nullable(),
  pnl: z.number().default(0),
  rr: z.number().min(0).default(0),
  status: z.enum(['open', 'closed', 'pending']).default('closed'),
  session: z.enum(['asia', 'london', 'new_york', 'sydney', 'other']).optional().nullable(),
  strategy_tags: z.array(z.string()).default([]),
  emotions: z.array(z.string()).default([]),
  confidence: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  setup_type: z.string().max(100).optional().nullable(),
  before_notes: z.string().max(5000).optional().nullable(),
  during_notes: z.string().max(5000).optional().nullable(),
  after_notes: z.string().max(5000).optional().nullable(),
  mistakes: z.array(z.string()).optional().nullable(),
  lessons_learned: z.string().max(5000).optional().nullable(),
});

export const psychologyLogSchema = z.object({
  log_date: z.string().or(z.date()),
  confidence: z.number().int().min(0).max(100),
  fear: z.number().int().min(0).max(100).optional().nullable(),
  greed: z.number().int().min(0).max(100).optional().nullable(),
  fomo: z.number().int().min(0).max(100).optional().nullable(),
  discipline: z.number().int().min(0).max(100).optional().nullable(),
  patience: z.number().int().min(0).max(100).optional().nullable(),
  execution_quality: z.number().int().min(0).max(100).optional().nullable(),
  emotional_state: z.string().max(100).optional().nullable(),
  rule_violations: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional().nullable(),
});

export const tradingGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  goal_type: z.enum(['profit', 'win_rate', 'trades', 'rr', 'discipline', 'custom']),
  target_value: z.number().positive('Target must be positive'),
  current_value: z.number().min(0).default(0),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export const tradingPlanSchema = z.object({
  plan_type: z.enum(['daily', 'weekly', 'monthly']),
  title: z.string().min(1, 'Title is required').max(200),
  max_daily_loss: z.number().positive().optional().nullable(),
  max_weekly_loss: z.number().positive().optional().nullable(),
  max_risk_per_trade: z.number().positive().optional().nullable(),
  entry_checklist: z.array(z.string()).default([]),
  exit_checklist: z.array(z.string()).default([]),
  session_checklist: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
});

export const brokerConnectionSchema = z.object({
  broker_name: z.string().min(1, 'Broker name is required'),
  account_id: z.string().optional().nullable(),
  account_type: z.enum(['live', 'demo', 'prop']).optional().nullable(),
  login: z.string().optional().nullable(),
  server: z.string().optional().nullable(),
  currency: z.string().default('USD'),
  leverage: z.string().default('1:30'),
});

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Must contain at least one letter')
  .regex(/[0-9]/, 'Must contain at least one number');

export type TradeInput = z.infer<typeof tradeSchema>;
export type PsychologyLogInput = z.infer<typeof psychologyLogSchema>;
export type TradingGoalInput = z.infer<typeof tradingGoalSchema>;
export type TradingPlanInput = z.infer<typeof tradingPlanSchema>;
export type BrokerConnectionInput = z.infer<typeof brokerConnectionSchema>;

export function validate<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const firstError = result.error.issues[0];
  return { success: false, error: firstError?.message || 'Validation failed' };
}
