import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'traderos-auth',
  },
});

export type Trade = {
  id: string;
  instrument: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  stop_loss: number | null;
  take_profit: number | null;
  pnl: number;
  rr: number;
  status: 'open' | 'closed' | 'pending';
  session: 'asia' | 'london' | 'new_york' | 'sydney' | 'other' | null;
  strategy_tags: string[];
  emotions: string[];
  confidence: number;
  notes: string | null;
  screenshot_url: string | null;
  executed_at: string;
  closed_at: string | null;
  created_at: string;
  // Enhanced journaling fields
  setup_type: string | null;
  before_notes: string | null;
  during_notes: string | null;
  after_notes: string | null;
  mistakes: string[] | null;
  lessons_learned: string | null;
  screenshots: string[] | null;
  holding_minutes: number | null;
};

export type AiInsight = {
  id: string;
  insight_type: 'warning' | 'strength' | 'suggestion' | 'observation' | 'summary';
  title: string;
  body: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  metric_ref: string | null;
  created_at: string;
};

export type Achievement = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  earned_at: string;
};

export type AiChatMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  session_id: string;
  created_at: string;
};

export type TradingGoal = {
  id: string;
  title: string;
  goal_type: 'profit' | 'win_rate' | 'trades' | 'rr' | 'discipline' | 'custom';
  target_value: number;
  current_value: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
  deadline: string | null;
  completed: boolean;
  created_at?: string;
};

export type PsychologyLog = {
  id: string;
  log_date: string;
  confidence: number;
  fear: number | null;
  greed: number | null;
  fomo: number | null;
  discipline: number | null;
  patience: number | null;
  execution_quality: number | null;
  emotional_state: string | null;
  rule_violations: string[];
  notes: string | null;
};

export type TradingPlan = {
  id: string;
  plan_type: 'daily' | 'weekly' | 'monthly';
  title: string;
  max_daily_loss: number | null;
  max_weekly_loss: number | null;
  max_risk_per_trade: number | null;
  entry_checklist: string[];
  exit_checklist: string[];
  session_checklist: string[];
  rules: string[];
  goals: string[];
  active: boolean;
};

export type BrokerConnection = {
  id: string;
  broker_name: string;
  account_id: string | null;
  account_type: 'live' | 'demo' | 'prop' | null;
  login: string | null;
  server: string | null;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  auto_sync: boolean;
  last_sync_at: string | null;
  balance: number;
  equity: number;
  currency: string;
  leverage: string;
};

export type OpenPosition = {
  id: string;
  broker_connection_id: string | null;
  instrument: string;
  direction: 'long' | 'short';
  volume: number;
  entry_price: number;
  current_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  swap: number;
  commission: number;
  floating_pnl: number;
  opened_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan_tier: 'free' | 'starter' | 'pro' | 'elite';
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_tier: 'free' | 'starter' | 'pro' | 'elite';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

export type PlanTier = 'free' | 'starter' | 'pro' | 'elite';
