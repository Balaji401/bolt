import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
  confidence: number | null;
  notes: string | null;
  screenshot_url: string | null;
  executed_at: string;
  closed_at: string | null;
  created_at: string;
  setup_type: string | null;
  before_notes: string | null;
  during_notes: string | null;
  after_notes: string | null;
  mistakes: string[] | null;
  lessons_learned: string | null;
  screenshots: string[] | null;
  holding_minutes: number | null;
  market: string | null;
  timeframe: string | null;
  risk_pct: number | null;
  archived: boolean | null;
  broker_trade_id: string | null;
  import_job_id: string | null;
  source: string | null;
};

export type TradeTag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type ImportJob = {
  id: string;
  user_id: string;
  trading_account_id: string | null;
  broker_name: string;
  source_format: string;
  file_name: string | null;
  file_size: number | null;
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed' | 'cancelled';
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  failed_rows: number;
  progress: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type ImportError = {
  id: string;
  import_job_id: string;
  row_number: number;
  row_data: Record<string, unknown> | null;
  error_type: string;
  error_message: string;
  created_at: string;
};

export type CsvMappingTemplate = {
  id: string;
  user_id: string;
  broker_format: string;
  template_name: string;
  column_mapping: Record<string, string>;
  created_at: string;
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
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  plan_tier: PlanTier;
  timezone: string | null;
  preferred_currency: string;
  preferred_language: string;
  trading_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  last_login_at: string | null;
  account_status: 'active' | 'suspended' | 'deleted';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_tier: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

export type PlanTier = 'free' | 'starter' | 'pro' | 'elite';

export type Workspace = {
  id: string;
  user_id: string;
  name: string;
  workspace_type: 'personal' | 'team';
  default_currency: string;
  default_timezone: string;
  date_format: string;
  number_format: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type TradingAccountPlatform = 'MT4' | 'MT5' | 'cTrader' | 'DXtrade' | 'Match-Trader' | 'TradingView' | 'Manual';
export type TradingAccountType = 'live' | 'demo' | 'prop_funded' | 'evaluation';
export type TradingAccountStatus = 'active' | 'archived' | 'closed';

export type TradingAccount = {
  id: string;
  workspace_id: string;
  user_id: string;
  account_name: string;
  broker_name: string | null;
  platform: TradingAccountPlatform;
  account_number: string | null;
  account_type: TradingAccountType;
  base_currency: string;
  timezone: string;
  initial_balance: number;
  current_balance: number;
  status: TradingAccountStatus;
  is_default: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RiskRules = {
  id: string;
  user_id: string;
  workspace_id: string;
  max_daily_loss_pct: number;
  max_weekly_loss_pct: number;
  max_monthly_loss_pct: number;
  max_risk_per_trade_pct: number;
  max_open_trades: number;
  max_daily_trades: number;
  max_position_size_pct: number;
  stop_after_losses: number;
  stop_after_daily_loss: boolean;
  warning_threshold_pct: number;
  created_at: string;
  updated_at: string;
};

export type RiskAlert = {
  id: string;
  user_id: string;
  workspace_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric_value: number | null;
  threshold_value: number | null;
  acknowledged: boolean;
  created_at: string;
};
