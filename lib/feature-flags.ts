/**
 * TraderOS Feature Flags
 * Enable/disable features at runtime. Supports tiers, beta, experimental, and admin-only flags.
 */

import type { PlanTier } from '@/lib/supabase';

export type FeatureFlagKey =
  | 'ai_coach'
  | 'ai_chat'
  | 'ai_insights'
  | 'strategy_intelligence'
  | 'decision_intelligence'
  | 'multi_account_intelligence'
  | 'prop_firm_intelligence'
  | 'market_intelligence'
  | 'trader_dna'
  | 'broker_sync'
  | 'economic_calendar'
  | 'news_center'
  | 'export_csv'
  | 'export_pdf'
  | 'api_access'
  | 'multi_account_aggregation'
  | 'custom_ai_reports'
  | 'beta_experimental_ui'
  | 'beta_voice_commands'
  | 'beta_advanced_analytics'
  | 'experimental_ml_predictions'
  | 'experimental_social_trading'
  | 'admin_panel'
  | 'admin_user_management'
  | 'admin_system_health';

export type FeatureFlag = {
  key: FeatureFlagKey;
  label: string;
  description: string;
  enabled: boolean;
  min_tier: PlanTier;
  category: 'core' | 'ai' | 'intelligence' | 'beta' | 'experimental' | 'admin';
};

export const FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlag> = {
  // Core
  ai_coach:                    { key: 'ai_coach',                    label: 'AI Coach',                    description: 'Personalized AI coaching from trade history',           enabled: true,  min_tier: 'pro',     category: 'ai' },
  ai_chat:                     { key: 'ai_chat',                     label: 'AI Chat',                      description: 'Conversational AI trading assistant',                    enabled: true,  min_tier: 'free',    category: 'ai' },
  ai_insights:                 { key: 'ai_insights',                 label: 'AI Insights',                  description: 'AI-generated insights on dashboard',                    enabled: true,  min_tier: 'starter', category: 'ai' },
  broker_sync:                 { key: 'broker_sync',                 label: 'Broker Sync',                  description: 'Auto-sync trades from connected brokers',                enabled: true,  min_tier: 'free',    category: 'core' },
  economic_calendar:           { key: 'economic_calendar',           label: 'Economic Calendar',             description: 'Market-moving economic events',                         enabled: true,  min_tier: 'free',    category: 'core' },
  news_center:                 { key: 'news_center',                 label: 'News Center',                  description: 'AI-curated financial news',                              enabled: true,  min_tier: 'free',    category: 'core' },

  // Intelligence
  strategy_intelligence:       { key: 'strategy_intelligence',       label: 'Strategy Intelligence',        description: 'Deep strategy performance analysis',                    enabled: true,  min_tier: 'pro',     category: 'intelligence' },
  decision_intelligence:       { key: 'decision_intelligence',       label: 'Decision Intelligence',        description: 'Pre-trade decision support engine',                     enabled: true,  min_tier: 'pro',     category: 'intelligence' },
  multi_account_intelligence:  { key: 'multi_account_intelligence',  label: 'Multi-Account Intelligence',   description: 'Aggregate analytics across all accounts',                enabled: true,  min_tier: 'elite',   category: 'intelligence' },
  prop_firm_intelligence:      { key: 'prop_firm_intelligence',      label: 'Prop Firm Intelligence',       description: 'Prop firm challenge tracking and rules',                enabled: true,  min_tier: 'pro',     category: 'intelligence' },
  market_intelligence:          { key: 'market_intelligence',          label: 'Market Intelligence',          description: 'Market structure and sentiment analysis',               enabled: true,  min_tier: 'pro',     category: 'intelligence' },
  trader_dna:                   { key: 'trader_dna',                   label: 'Trader DNA',                   description: 'Your unique trading personality profile',               enabled: true,  min_tier: 'pro',     category: 'intelligence' },

  // Premium
  export_csv:                   { key: 'export_csv',                   label: 'CSV Export',                   description: 'Export trades and analytics to CSV',                    enabled: true,  min_tier: 'pro',     category: 'core' },
  export_pdf:                   { key: 'export_pdf',                   label: 'PDF Export',                   description: 'Export reports to PDF',                                 enabled: true,  min_tier: 'pro',     category: 'core' },
  api_access:                   { key: 'api_access',                   label: 'API Access',                   description: 'Programmatic access to TraderOS data',                  enabled: true,  min_tier: 'elite',   category: 'core' },
  multi_account_aggregation:    { key: 'multi_account_aggregation',    label: 'Multi-Account Aggregation',    description: 'View combined metrics across all accounts',             enabled: true,  min_tier: 'elite',   category: 'core' },
  custom_ai_reports:            { key: 'custom_ai_reports',            label: 'Custom AI Reports',            description: 'Generate custom AI analysis reports',                   enabled: true,  min_tier: 'elite',   category: 'ai' },

  // Beta
  beta_experimental_ui:         { key: 'beta_experimental_ui',         label: 'Experimental UI',               description: 'Try upcoming UI redesigns early',                        enabled: false, min_tier: 'pro',     category: 'beta' },
  beta_voice_commands:          { key: 'beta_voice_commands',          label: 'Voice Commands',               description: 'Control TraderOS with voice',                           enabled: false, min_tier: 'pro',     category: 'beta' },
  beta_advanced_analytics:      { key: 'beta_advanced_analytics',      label: 'Advanced Analytics',           description: 'Next-gen analytics with ML insights',                   enabled: false, min_tier: 'pro',     category: 'beta' },

  // Experimental
  experimental_ml_predictions:  { key: 'experimental_ml_predictions',  label: 'ML Predictions',               description: 'Machine learning trade outcome predictions',            enabled: false, min_tier: 'elite',   category: 'experimental' },
  experimental_social_trading:  { key: 'experimental_social_trading',  label: 'Social Trading',               description: 'Share and follow trade setups',                         enabled: false, min_tier: 'elite',   category: 'experimental' },

  // Admin
  admin_panel:                  { key: 'admin_panel',                  label: 'Admin Panel',                  description: 'System administration dashboard',                      enabled: false, min_tier: 'elite',   category: 'admin' },
  admin_user_management:        { key: 'admin_user_management',        label: 'User Management',              description: 'Manage user accounts and subscriptions',                 enabled: false, min_tier: 'elite',   category: 'admin' },
  admin_system_health:          { key: 'admin_system_health',          label: 'System Health',                description: 'Monitor platform health and uptime',                    enabled: false, min_tier: 'elite',   category: 'admin' },
};

const TIER_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'elite'];

export function isFeatureEnabled(key: FeatureFlagKey, tier: PlanTier = 'free'): boolean {
  const flag = FEATURE_FLAGS[key];
  if (!flag) return false;
  if (!flag.enabled) return false;
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(flag.min_tier);
}

export function getEnabledFeatures(tier: PlanTier): FeatureFlagKey[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]).filter((k) => isFeatureEnabled(k, tier));
}

export function getFeaturesByCategory(category: FeatureFlag['category'], tier: PlanTier): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter(
    (f) => f.category === category && TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(f.min_tier)
  );
}
