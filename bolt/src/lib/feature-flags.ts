import type { PlanTier } from './supabase';

export type FeatureFlagKey =
  | 'ai_coach' | 'ai_chat' | 'ai_insights' | 'strategy_intelligence' | 'decision_intelligence'
  | 'multi_account_intelligence' | 'prop_firm_intelligence' | 'market_intelligence' | 'trader_dna'
  | 'broker_sync' | 'economic_calendar' | 'news_center' | 'export_csv' | 'export_pdf'
  | 'api_access' | 'multi_account_aggregation' | 'custom_ai_reports'
  | 'beta_experimental_ui' | 'beta_voice_commands' | 'beta_advanced_analytics'
  | 'experimental_ml_predictions' | 'experimental_social_trading'
  | 'admin_panel' | 'admin_user_management' | 'admin_system_health';

export type FeatureFlag = {
  key: FeatureFlagKey;
  label: string;
  description: string;
  enabled: boolean;
  min_tier: PlanTier;
  category: 'core' | 'ai' | 'intelligence' | 'beta' | 'experimental' | 'admin';
};

export const FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlag> = {
  ai_coach:                    { key: 'ai_coach', label: 'AI Coach', description: 'Personalized AI coaching', enabled: true, min_tier: 'pro', category: 'ai' },
  ai_chat:                     { key: 'ai_chat', label: 'AI Chat', description: 'Conversational AI assistant', enabled: true, min_tier: 'free', category: 'ai' },
  ai_insights:                 { key: 'ai_insights', label: 'AI Insights', description: 'AI-generated insights', enabled: true, min_tier: 'starter', category: 'ai' },
  broker_sync:                 { key: 'broker_sync', label: 'Broker Sync', description: 'Auto-sync from brokers', enabled: true, min_tier: 'free', category: 'core' },
  economic_calendar:           { key: 'economic_calendar', label: 'Economic Calendar', description: 'Market events', enabled: true, min_tier: 'free', category: 'core' },
  news_center:                 { key: 'news_center', label: 'News Center', description: 'AI-curated news', enabled: true, min_tier: 'free', category: 'core' },
  strategy_intelligence:       { key: 'strategy_intelligence', label: 'Strategy Intelligence', description: 'Strategy analysis', enabled: true, min_tier: 'pro', category: 'intelligence' },
  decision_intelligence:       { key: 'decision_intelligence', label: 'Decision Intelligence', description: 'Pre-trade support', enabled: true, min_tier: 'pro', category: 'intelligence' },
  multi_account_intelligence:  { key: 'multi_account_intelligence', label: 'Multi-Account Intelligence', description: 'Aggregate analytics', enabled: true, min_tier: 'elite', category: 'intelligence' },
  prop_firm_intelligence:      { key: 'prop_firm_intelligence', label: 'Prop Firm Intelligence', description: 'Prop firm tracking', enabled: true, min_tier: 'pro', category: 'intelligence' },
  market_intelligence:         { key: 'market_intelligence', label: 'Market Intelligence', description: 'Market structure analysis', enabled: true, min_tier: 'pro', category: 'intelligence' },
  trader_dna:                  { key: 'trader_dna', label: 'Trader DNA', description: 'Trading personality profile', enabled: true, min_tier: 'pro', category: 'intelligence' },
  export_csv:                  { key: 'export_csv', label: 'CSV Export', description: 'Export to CSV', enabled: true, min_tier: 'pro', category: 'core' },
  export_pdf:                  { key: 'export_pdf', label: 'PDF Export', description: 'Export to PDF', enabled: true, min_tier: 'pro', category: 'core' },
  api_access:                  { key: 'api_access', label: 'API Access', description: 'Programmatic access', enabled: true, min_tier: 'elite', category: 'core' },
  multi_account_aggregation:   { key: 'multi_account_aggregation', label: 'Multi-Account Aggregation', description: 'Combined metrics', enabled: true, min_tier: 'elite', category: 'core' },
  custom_ai_reports:           { key: 'custom_ai_reports', label: 'Custom AI Reports', description: 'Custom AI analysis', enabled: true, min_tier: 'elite', category: 'ai' },
  beta_experimental_ui:        { key: 'beta_experimental_ui', label: 'Experimental UI', description: 'Upcoming UI redesigns', enabled: false, min_tier: 'pro', category: 'beta' },
  beta_voice_commands:         { key: 'beta_voice_commands', label: 'Voice Commands', description: 'Voice control', enabled: false, min_tier: 'pro', category: 'beta' },
  beta_advanced_analytics:     { key: 'beta_advanced_analytics', label: 'Advanced Analytics', description: 'ML insights', enabled: false, min_tier: 'pro', category: 'beta' },
  experimental_ml_predictions: { key: 'experimental_ml_predictions', label: 'ML Predictions', description: 'ML outcome predictions', enabled: false, min_tier: 'elite', category: 'experimental' },
  experimental_social_trading: { key: 'experimental_social_trading', label: 'Social Trading', description: 'Share setups', enabled: false, min_tier: 'elite', category: 'experimental' },
  admin_panel:                 { key: 'admin_panel', label: 'Admin Panel', description: 'System admin', enabled: false, min_tier: 'elite', category: 'admin' },
  admin_user_management:       { key: 'admin_user_management', label: 'User Management', description: 'Manage users', enabled: false, min_tier: 'elite', category: 'admin' },
  admin_system_health:         { key: 'admin_system_health', label: 'System Health', description: 'Monitor platform', enabled: false, min_tier: 'elite', category: 'admin' },
};

const TIER_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'elite'];

export function isFeatureEnabled(key: FeatureFlagKey, tier: PlanTier = 'free'): boolean {
  const flag = FEATURE_FLAGS[key];
  if (!flag || !flag.enabled) return false;
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(flag.min_tier);
}

export function getEnabledFeatures(tier: PlanTier): FeatureFlagKey[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]).filter((k) => isFeatureEnabled(k, tier));
}
