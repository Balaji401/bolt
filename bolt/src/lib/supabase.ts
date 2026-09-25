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

export type DailyJournal = {
  id: string;
  user_id: string;
  workspace_id: string;
  journal_date: string;
  sleep_quality: number | null;
  energy_level: number | null;
  emotional_state_pre: string | null;
  confidence_pre: number | null;
  stress_level: number | null;
  trading_plan: string | null;
  market_bias: string | null;
  goals_today: string | null;
  overall_mood: string | null;
  biggest_mistake: string | null;
  biggest_success: string | null;
  lessons_learned: string | null;
  improvements: string | null;
  followed_plan: boolean | null;
  overall_satisfaction: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WeeklyReview = {
  id: string;
  user_id: string;
  workspace_id: string;
  week_start: string;
  week_end: string;
  trades_taken: number;
  win_rate: number;
  biggest_win: string | null;
  biggest_loss: string | null;
  best_decision: string | null;
  worst_decision: string | null;
  psychology_notes: string | null;
  lessons_learned: string | null;
  goals_next_week: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyReview = {
  id: string;
  user_id: string;
  workspace_id: string;
  month_year: string;
  performance_summary: string | null;
  discipline_review: string | null;
  psychology_review: string | null;
  goal_progress: string | null;
  habit_completion: string | null;
  biggest_improvements: string | null;
  biggest_problems: string | null;
  action_plan: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  frequency: string;
  active: boolean;
  created_at: string;
};

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  completed: boolean;
  created_at: string;
};

export type Mistake = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  category: string;
  description: string | null;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  solution: string | null;
  related_trade_ids: string[];
  created_at: string;
  updated_at: string;
};

export type TradeReview = {
  id: string;
  user_id: string;
  trade_id: string;
  why_taken: string | null;
  followed_setup: boolean | null;
  respected_risk: boolean | null;
  entered_early: boolean | null;
  exited_early: boolean | null;
  improvements: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

export type CustomEmotion = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Strategy = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  category: string;
  description: string | null;
  market: string | null;
  instrument_type: string | null;
  timeframe: string | null;
  status: 'active' | 'inactive' | 'testing' | 'archived';
  market_conditions: string | null;
  entry_conditions: string | null;
  exit_conditions: string | null;
  risk_rules: string | null;
  position_rules: string | null;
  advantages: string | null;
  weaknesses: string | null;
  common_mistakes: string | null;
  improvements: string | null;
  tags: string[];
  version: number;
  created_at: string;
  updated_at: string;
};

export type StrategyVersion = {
  id: string;
  strategy_id: string;
  user_id: string;
  version_number: number;
  change_summary: string | null;
  snapshot: Record<string, unknown>;
  created_at: string;
};

export type TradeSetup = {
  id: string;
  strategy_id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  setup_type: string | null;
  entry_pattern: string | null;
  confirmation_rules: string | null;
  invalidation_rules: string | null;
  preferred_session: string | null;
  preferred_market: string | null;
  screenshot_urls: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Playbook = {
  id: string;
  user_id: string;
  workspace_id: string;
  strategy_id: string | null;
  name: string;
  market_preparation: string | null;
  entry_checklist: string[];
  risk_checklist: string[];
  exit_checklist: string[];
  post_trade_checklist: string[];
  common_mistakes: string[];
  golden_rules: string[];
  example_chart_urls: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistTemplate = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  checklist_type: 'before_entry' | 'after_exit' | 'pre_market' | 'risk_check' | 'custom';
  items: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type StrategyAttachment = {
  id: string;
  strategy_id: string;
  user_id: string;
  attachment_type: 'image' | 'pdf' | 'note' | 'link';
  title: string | null;
  file_url: string | null;
  external_url: string | null;
  notes: string | null;
  created_at: string;
};

export type StrategyCategory = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type AiConversation = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  session_id: string;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type AiMemory = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  memory_type: 'strategy' | 'habit' | 'mistake' | 'goal' | 'preference' | 'style' | 'observation' | 'rule';
  key: string;
  value: string;
  source: string;
  created_at: string;
};

export type AiReview = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  review_type: 'trade' | 'psychology' | 'goal' | 'weekly' | 'monthly' | 'daily';
  ref_id: string | null;
  title: string | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  rating: number | null;
  created_at: string;
};

export type AiScore = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  score_type: 'trading' | 'psychology' | 'discipline' | 'risk' | 'overall';
  score: number;
  breakdown: Record<string, unknown> | null;
  period: string;
  created_at: string;
};

export type AiRecommendation = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  category: 'risk' | 'psychology' | 'discipline' | 'strategy' | 'habit' | 'goal' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  body: string;
  data_ref: string | null;
  action_taken: boolean;
  dismissed: boolean;
  created_at: string;
};

export type AiInsightRecord = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  insight_type: string;
  title: string;
  body: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  confidence: 'high' | 'medium' | 'low';
  data_ref: string | null;
  evidence_refs: { type: string; ref_id: string; label: string }[];
  feedback: 'useful' | 'not_useful' | 'correct' | 'incorrect' | 'saved' | 'dismissed' | null;
  generated_at: string;
  created_at: string;
};

export type AiInsightEvidence = {
  id: string;
  insight_id: string;
  user_id: string;
  evidence_type: 'trade' | 'journal' | 'metric' | 'psychology_log' | 'goal' | 'habit' | 'mistake' | 'strategy';
  ref_id: string | null;
  ref_table: string | null;
  label: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

export type AiBehaviorPattern = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  pattern_type: 'revenge_trading' | 'fomo' | 'overtrading' | 'early_exit' | 'late_entry' | 'increasing_risk_after_loss' | 'breaking_rules' | 'trading_outside_session' | 'trading_outside_strategy' | 'repeated_mistakes' | 'inconsistent_sizing' | 'chasing_losses';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  severity: 'info' | 'warning' | 'critical';
  occurrence_count: number;
  first_seen: string | null;
  last_seen: string | null;
  evidence_refs: { type: string; ref_id: string; label: string }[];
  dismissed: boolean;
  created_at: string;
  updated_at: string;
};

export type AiTraderProfile = {
  id: string;
  user_id: string;
  workspace_id: string;
  trading_style: string | null;
  preferred_markets: string[];
  preferred_instruments: string[];
  preferred_sessions: string[];
  preferred_timeframes: string[];
  typical_risk_pct: number;
  typical_holding_minutes: number | null;
  strong_strategies: string[];
  weak_strategies: string[];
  common_mistakes: string[];
  psychological_patterns: string[];
  strengths: string[];
  weaknesses: string[];
  learning_priorities: string[];
  profile_data: Record<string, unknown>;
  updated_at: string;
  created_at: string;
};

export type AiBehaviorEvent = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  event_type: 'risk_change' | 'drawdown_change' | 'psychology_change' | 'behavior_change' | 'performance_change' | 'streak_change' | 'rule_violation' | 'milestone';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  event_date: string;
  metric_value: number | null;
  previous_value: number | null;
  evidence_refs: { type: string; ref_id: string; label: string }[];
  created_at: string;
};

export type AiInsightFeedback = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  insight_id: string;
  feedback_type: 'useful' | 'not_useful' | 'correct' | 'incorrect' | 'saved' | 'dismissed' | 'ignored';
  comment: string | null;
  created_at: string;
};

export type ReportTemplate = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  report_type: 'performance' | 'trade' | 'risk' | 'psychology' | 'strategy' | 'journal' | 'account' | 'ai_review' | 'custom';
  filters: Record<string, unknown>;
  sections: string[];
  is_custom: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

export type ReportHistoryRecord = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  template_id: string | null;
  name: string;
  report_type: 'performance' | 'trade' | 'risk' | 'psychology' | 'strategy' | 'journal' | 'account' | 'ai_review' | 'custom';
  period_start: string | null;
  period_end: string | null;
  account_id: string | null;
  status: 'generating' | 'generated' | 'failed';
  filters: Record<string, unknown>;
  sections: string[];
  metrics: Record<string, unknown>;
  include_ai_summary: boolean;
  created_at: string;
};

export type ScheduledReport = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  template_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  account_id: string | null;
  delivery_preference: 'view' | 'download' | 'email';
  active: boolean;
  last_generated_at: string | null;
  next_generation_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Automation = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, unknown>;
  conditions: AutomationCondition[];
  condition_logic: 'and' | 'or';
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  schedule_config: Record<string, unknown>;
  status: 'active' | 'paused' | 'draft';
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  failure_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
};

export type AutomationTriggerType =
  | 'trade_created' | 'trade_closed' | 'daily_loss_limit' | 'weekly_loss_limit'
  | 'drawdown_threshold' | 'journal_not_completed' | 'goal_deadline_approaching'
  | 'habit_missed' | 'report_generated' | 'ai_review_completed'
  | 'schedule_daily' | 'schedule_weekly' | 'schedule_monthly' | 'schedule_specific';

export type AutomationActionType =
  | 'send_notification' | 'create_reminder' | 'generate_report'
  | 'start_ai_review' | 'add_journal_reminder' | 'update_goal_status' | 'create_task';

export type AutomationCondition = {
  field: string;
  operator: string;
  value: string | number | boolean;
};

export type AutomationExecution = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  automation_id: string;
  trigger_type: string;
  status: 'success' | 'failed' | 'running' | 'skipped';
  executed_at: string;
  duration_ms: number;
  result: Record<string, unknown>;
  error: string | null;
  retried: boolean;
  retry_of: string | null;
  created_at: string;
};

export type NotificationRecord = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  category: 'risk' | 'trading' | 'journal' | 'goals' | 'reports' | 'ai' | 'system';
  priority: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  related_type: string | null;
  related_id: string | null;
  read: boolean;
  archived: boolean;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
  read_at: string | null;
};

export type NotificationPreference = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  category: 'risk' | 'trading' | 'journal' | 'goals' | 'reports' | 'ai' | 'system';
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  min_priority: 'info' | 'warning' | 'critical';
  created_at: string;
  updated_at: string;
};
