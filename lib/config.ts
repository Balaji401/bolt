/**
 * TraderOS Platform Configuration
 * Centralized configuration — avoids hardcoded values across the app.
 *
 * All runtime preferences (currency, timezone, theme, etc.) are stored
 * in localStorage and accessed via the ConfigProvider.
 */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'INR' | 'SGD' | 'AED';
export type DateFormat = 'MMM d, yyyy' | 'd MMM yyyy' | 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
export type NumberFormat = 'en-US' | 'de-DE' | 'ja-JP' | 'en-IN' | 'en-GB';

export type NotificationPrefs = {
  trade_reminders: boolean;
  economic_events: boolean;
  ai_insights: boolean;
  goal_milestones: boolean;
  broker_sync_alerts: boolean;
  email_digest: boolean;
};

export type AIPrefs = {
  ai_coach_enabled: boolean;
  ai_chat_enabled: boolean;
  ai_insights_frequency: 'realtime' | 'daily' | 'weekly';
  openai_model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
};

export type TradingPrefs = {
  default_instrument: string;
  default_session: string;
  default_risk_percent: number;
  default_account_size: number;
  default_direction: 'long' | 'short' | 'both';
  confirm_before_delete: boolean;
};

export type BrokerPrefs = {
  auto_sync_interval: number; // minutes
  sync_on_startup: boolean;
  notify_on_sync: boolean;
};

export type RiskDefaults = {
  max_risk_per_trade: number; // % of account
  max_daily_loss: number; // % of account
  max_weekly_loss: number;
  max_open_positions: number;
  require_stop_loss: boolean;
  require_take_profit: boolean;
};

export type PsychologySettings = {
  daily_checkin_reminder: boolean;
  checkin_time: string; // HH:MM
  tilt_detection: boolean;
  discipline_scoring: boolean;
};

export type AnalyticsPrefs = {
  default_timeframe: '7d' | '30d' | '90d' | 'ytd' | 'all';
  show_weekends: boolean;
  benchmark_symbol: string;
  include_pending: boolean;
};

export type ImportSettings = {
  default_format: 'csv' | 'mt4' | 'mt5' | 'ctrader' | 'binance';
  skip_duplicates: boolean;
  auto_map_instruments: boolean;
  require_confirmation: boolean;
};

export type SecuritySettings = {
  two_factor_required: boolean;
  session_timeout_minutes: number;
  api_key_rotation_days: number;
};

export type DeveloperSettings = {
  debug_mode: boolean;
  show_event_log: boolean;
  mock_api: boolean;
  verbose_logging: boolean;
};

export type PlatformConfig = {
  brand: typeof import('./brand').brand;
  theme: 'dark' | 'light' | 'system';
  language: string;
  currency: Currency;
  timezone: string;
  date_format: DateFormat;
  number_format: NumberFormat;
  notifications: NotificationPrefs;
  ai: AIPrefs;
  trading: TradingPrefs;
  broker: BrokerPrefs;
  risk: RiskDefaults;
  psychology: PsychologySettings;
  analytics: AnalyticsPrefs;
  import: ImportSettings;
  security: SecuritySettings;
  developer: DeveloperSettings;
};

export const DEFAULT_CONFIG: Omit<PlatformConfig, 'brand'> = {
  theme: 'dark',
  language: 'en',
  currency: 'USD',
  timezone: 'auto',
  date_format: 'MMM d, yyyy',
  number_format: 'en-US',
  notifications: {
    trade_reminders: true,
    economic_events: true,
    ai_insights: true,
    goal_milestones: true,
    broker_sync_alerts: true,
    email_digest: false,
  },
  ai: {
    ai_coach_enabled: true,
    ai_chat_enabled: true,
    ai_insights_frequency: 'daily',
    openai_model: 'gpt-4o-mini',
  },
  trading: {
    default_instrument: 'EURUSD',
    default_session: 'london',
    default_risk_percent: 1,
    default_account_size: 10000,
    default_direction: 'both',
    confirm_before_delete: true,
  },
  broker: {
    auto_sync_interval: 15,
    sync_on_startup: false,
    notify_on_sync: true,
  },
  risk: {
    max_risk_per_trade: 2,
    max_daily_loss: 5,
    max_weekly_loss: 10,
    max_open_positions: 5,
    require_stop_loss: true,
    require_take_profit: false,
  },
  psychology: {
    daily_checkin_reminder: true,
    checkin_time: '08:00',
    tilt_detection: true,
    discipline_scoring: true,
  },
  analytics: {
    default_timeframe: '30d',
    show_weekends: false,
    benchmark_symbol: 'SPX',
    include_pending: false,
  },
  import: {
    default_format: 'csv',
    skip_duplicates: true,
    auto_map_instruments: true,
    require_confirmation: true,
  },
  security: {
    two_factor_required: false,
    session_timeout_minutes: 60,
    api_key_rotation_days: 90,
  },
  developer: {
    debug_mode: false,
    show_event_log: false,
    mock_api: false,
    verbose_logging: false,
  },
};

const STORAGE_KEY = 'traderos-config';

export function loadConfig(): Omit<PlatformConfig, 'brand'> {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Omit<PlatformConfig, 'brand'>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('[Config] Failed to save:', err);
  }
}

export function resetConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
