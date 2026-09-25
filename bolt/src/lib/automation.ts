import type { Automation, AutomationTriggerType, AutomationActionType, AutomationCondition, AutomationExecution, NotificationRecord, NotificationPreference } from './supabase';
import { supabase } from './supabase';
import { emit, type TraderOSEvent } from './event-bus';
import { logger } from './logger';

export type TriggerMeta = { value: AutomationTriggerType; label: string; description: string; category: 'event' | 'schedule' };
export type ActionMeta = { value: AutomationActionType; label: string; description: string; icon: string };
export type ConditionField = { value: string; label: string; type: 'text' | 'number' | 'select' | 'boolean'; options?: string[] };

export const TRIGGERS: TriggerMeta[] = [
  { value: 'trade_created', label: 'Trade Created', description: 'When a new trade is added to the journal', category: 'event' },
  { value: 'trade_closed', label: 'Trade Closed', description: 'When a trade is closed with a P&L result', category: 'event' },
  { value: 'daily_loss_limit', label: 'Daily Loss Limit Reached', description: 'When daily loss exceeds your configured limit', category: 'event' },
  { value: 'weekly_loss_limit', label: 'Weekly Loss Limit Reached', description: 'When weekly loss exceeds your configured limit', category: 'event' },
  { value: 'drawdown_threshold', label: 'Drawdown Threshold Reached', description: 'When drawdown exceeds a specified percentage', category: 'event' },
  { value: 'journal_not_completed', label: 'Journal Not Completed', description: 'When a trade lacks journal notes', category: 'event' },
  { value: 'goal_deadline_approaching', label: 'Goal Deadline Approaching', description: 'When a goal deadline is within X days', category: 'event' },
  { value: 'habit_missed', label: 'Habit Missed', description: 'When a tracked habit is not completed', category: 'event' },
  { value: 'market_event_approaching', label: 'High-impact Market Event Approaching', description: 'When a high-impact economic event is within a configured window', category: 'event' },
  { value: 'market_event_released', label: 'Economic Event Released', description: 'When a scheduled economic event is released', category: 'event' },
  { value: 'market_news_available', label: 'Important Market News Available', description: 'When a relevant market news item becomes available', category: 'event' },
  { value: 'market_session_opening', label: 'Session Opening', description: 'When a major session opens', category: 'event' },
  { value: 'market_session_closing', label: 'Session Closing', description: 'When a major session closes', category: 'event' },
  { value: 'report_generated', label: 'Report Generated', description: 'When a new report is generated', category: 'event' },
  { value: 'ai_review_completed', label: 'AI Review Completed', description: 'When an AI review is finished', category: 'event' },
  { value: 'schedule_daily', label: 'Daily Schedule', description: 'Runs every day at a specified time', category: 'schedule' },
  { value: 'schedule_weekly', label: 'Weekly Schedule', description: 'Runs every week on a specified day and time', category: 'schedule' },
  { value: 'schedule_monthly', label: 'Monthly Schedule', description: 'Runs every month on a specified day', category: 'schedule' },
  { value: 'schedule_specific', label: 'Specific Date/Time', description: 'Runs once at a specific date and time', category: 'schedule' },
];

export const ACTIONS: ActionMeta[] = [
  { value: 'send_notification', label: 'Send Notification', description: 'Send a notification to the notification center', icon: 'bell' },
  { value: 'create_reminder', label: 'Create Reminder', description: 'Create a reminder for a future date', icon: 'clock' },
  { value: 'generate_report', label: 'Generate Report', description: 'Generate a trading report', icon: 'file' },
  { value: 'start_ai_review', label: 'Start AI Review', description: 'Trigger an AI review of recent trades', icon: 'brain' },
  { value: 'add_journal_reminder', label: 'Add Journal Reminder', description: 'Remind the user to journal their trades', icon: 'book' },
  { value: 'update_goal_status', label: 'Update Goal Status', description: 'Update a trading goal status', icon: 'target' },
  { value: 'create_task', label: 'Create Internal Task', description: 'Create an internal task for follow-up', icon: 'check' },
];

export const CONDITION_FIELDS: ConditionField[] = [
  { value: 'instrument', label: 'Instrument', type: 'text' },
  { value: 'direction', label: 'Direction', type: 'select', options: ['long', 'short'] },
  { value: 'session', label: 'Session', type: 'select', options: ['asia', 'london', 'new_york', 'sydney', 'other'] },
  { value: 'pnl', label: 'P&L', type: 'number' },
  { value: 'risk_pct', label: 'Risk %', type: 'number' },
  { value: 'rr', label: 'R:R', type: 'number' },
  { value: 'drawdown', label: 'Drawdown %', type: 'number' },
  { value: 'trade_count', label: 'Trade Count', type: 'number' },
  { value: 'strategy', label: 'Strategy', type: 'text' },
  { value: 'account', label: 'Account', type: 'text' },
];

export const CONDITION_OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'gte', label: 'greater or equal' },
  { value: 'lte', label: 'less or equal' },
  { value: 'contains', label: 'contains' },
];

export type AutomationTemplate = {
  name: string;
  description: string;
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, unknown>;
  conditions: AutomationCondition[];
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  schedule_config: Record<string, unknown>;
};

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    name: 'Daily Journal Reminder',
    description: 'Remind yourself to journal trades every day at 8 PM',
    trigger_type: 'schedule_daily',
    trigger_config: { time: '20:00' },
    conditions: [],
    action_type: 'add_journal_reminder',
    action_config: { message: 'Time to journal your trades for today' },
    schedule_config: { time: '20:00' },
  },
  {
    name: 'Weekly Trading Review Reminder',
    description: 'Remind yourself to review your trading every Sunday at 6 PM',
    trigger_type: 'schedule_weekly',
    trigger_config: { day: 'sunday', time: '18:00' },
    conditions: [],
    action_type: 'create_reminder',
    action_config: { message: 'Weekly review time — analyze your performance' },
    schedule_config: { day: 'sunday', time: '18:00' },
  },
  {
    name: 'Risk Limit Alert',
    description: 'Get notified when daily loss exceeds your limit',
    trigger_type: 'daily_loss_limit',
    trigger_config: {},
    conditions: [],
    action_type: 'send_notification',
    action_config: { priority: 'critical', category: 'risk' },
    schedule_config: {},
  },
  {
    name: 'Drawdown Alert',
    description: 'Get notified when drawdown exceeds 10%',
    trigger_type: 'drawdown_threshold',
    trigger_config: { threshold: 10 },
    conditions: [],
    action_type: 'send_notification',
    action_config: { priority: 'critical', category: 'risk' },
    schedule_config: {},
  },
  {
    name: 'Goal Deadline Reminder',
    description: 'Get reminded 3 days before a goal deadline',
    trigger_type: 'goal_deadline_approaching',
    trigger_config: { days_before: 3 },
    conditions: [],
    action_type: 'send_notification',
    action_config: { priority: 'warning', category: 'goals' },
    schedule_config: {},
  },
  {
    name: 'Monthly Report Reminder',
    description: 'Remind yourself to generate a monthly report on the 1st',
    trigger_type: 'schedule_monthly',
    trigger_config: { day: 1 },
    conditions: [],
    action_type: 'generate_report',
    action_config: { report_type: 'performance' },
    schedule_config: { day: 1 },
  },
  {
    name: 'AI Weekly Review Reminder',
    description: 'Start an AI review every Sunday at 7 PM',
    trigger_type: 'schedule_weekly',
    trigger_config: { day: 'sunday', time: '19:00' },
    conditions: [],
    action_type: 'start_ai_review',
    action_config: {},
    schedule_config: { day: 'sunday', time: '19:00' },
  },
  {
    name: 'Habit Missed Alert',
    description: 'Get notified when a tracked habit is missed',
    trigger_type: 'habit_missed',
    trigger_config: {},
    conditions: [],
    action_type: 'send_notification',
    action_config: { priority: 'warning', category: 'journal' },
    schedule_config: {},
  },
];

const EVENT_TO_TRIGGER: Partial<Record<TraderOSEvent, AutomationTriggerType>> = {
  'trade:created': 'trade_created',
  'trade:closed': 'trade_closed',
  'rule:violated': 'daily_loss_limit',
  'review:completed': 'ai_review_completed',
  'insight:generated': 'ai_review_completed',
  'psychology:logged': 'journal_not_completed',
};

export function evaluateCondition(condition: AutomationCondition, context: Record<string, unknown>): boolean {
  const actual = context[condition.field];
  const expected = condition.value;
  if (actual == null) return false;
  switch (condition.operator) {
    case 'eq': return String(actual) === String(expected);
    case 'neq': return String(actual) !== String(expected);
    case 'gt': return Number(actual) > Number(expected);
    case 'lt': return Number(actual) < Number(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    case 'contains': return String(actual).includes(String(expected));
    default: return false;
  }
}

export function evaluateConditions(conditions: AutomationCondition[], logic: 'and' | 'or', context: Record<string, unknown>): boolean {
  if (conditions.length === 0) return true;
  if (logic === 'and') return conditions.every((c) => evaluateCondition(c, context));
  return conditions.some((c) => evaluateCondition(c, context));
}

export async function sendNotification(params: {
  userId: string;
  workspaceId: string | null;
  category: NotificationRecord['category'];
  priority: NotificationRecord['priority'];
  title: string;
  message: string;
  relatedType?: string;
  relatedId?: string;
  actionUrl?: string;
  actionLabel?: string;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== params.userId) return;
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      workspace_id: params.workspaceId,
      category: params.category,
      priority: params.priority,
      title: params.title,
      message: params.message,
      related_type: params.relatedType || null,
      related_id: params.relatedId || null,
      action_url: params.actionUrl || null,
      action_label: params.actionLabel || null,
    });
    if (error) throw error;
    emit('notification:sent', { category: params.category, title: params.title }, 'automation');
    logger.info('Automation', `Notification sent: ${params.title}`);
  } catch (err) {
    logger.error('Automation', `Failed to send notification: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function executeAutomation(automation: Automation, context: Record<string, unknown> = {}): Promise<{ success: boolean; error: string | null }> {
  const startTime = Date.now();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== automation.user_id) {
      return { success: false, error: 'User mismatch' };
    }
    const conditionsMet = evaluateConditions(automation.conditions, automation.condition_logic, context);
    if (!conditionsMet) {
      await logExecution(automation, 'skipped', Date.now() - startTime, { reason: 'conditions not met' }, null);
      return { success: true, error: null };
    }

    let actionResult: Record<string, unknown> = {};
    let actionError: string | null = null;

    switch (automation.action_type) {
      case 'send_notification': {
        const cfg = automation.action_config;
        await sendNotification({
          userId: automation.user_id,
          workspaceId: automation.workspace_id,
          category: (cfg.category as NotificationRecord['category']) || 'system',
          priority: (cfg.priority as NotificationRecord['priority']) || 'info',
          title: (cfg.title as string) || automation.name,
          message: (cfg.message as string) || automation.description || automation.name,
        });
        actionResult = { notification_sent: true };
        break;
      }
      case 'create_reminder': {
        await sendNotification({
          userId: automation.user_id,
          workspaceId: automation.workspace_id,
          category: 'system',
          priority: 'info',
          title: `Reminder: ${automation.name}`,
          message: (automation.action_config.message as string) || automation.description || 'Reminder triggered',
        });
        actionResult = { reminder_created: true };
        break;
      }
      case 'generate_report': {
        emit('module:changed', 'reports', 'automation');
        actionResult = { report_triggered: true };
        break;
      }
      case 'start_ai_review': {
        emit('module:changed', 'ai_intelligence', 'automation');
        actionResult = { ai_review_started: true };
        break;
      }
      case 'add_journal_reminder': {
        await sendNotification({
          userId: automation.user_id,
          workspaceId: automation.workspace_id,
          category: 'journal',
          priority: 'info',
          title: 'Journal Reminder',
          message: (automation.action_config.message as string) || 'Time to journal your trades',
          actionUrl: '/journal',
          actionLabel: 'Open Journal',
        });
        actionResult = { journal_reminder_sent: true };
        break;
      }
      case 'update_goal_status': {
        actionResult = { goal_update_triggered: true };
        break;
      }
      case 'create_task': {
        await sendNotification({
          userId: automation.user_id,
          workspaceId: automation.workspace_id,
          category: 'system',
          priority: 'info',
          title: `Task: ${automation.name}`,
          message: (automation.action_config.message as string) || 'New task created by automation',
        });
        actionResult = { task_created: true };
        break;
      }
    }

    const duration = Date.now() - startTime;
    await logExecution(automation, 'success', duration, actionResult, actionError);
    await supabase.from('automations').update({
      last_run_at: new Date().toISOString(),
      run_count: automation.run_count + 1,
    }).eq('id', automation.id);

    return { success: true, error: null };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - startTime;
    await logExecution(automation, 'failed', duration, {}, errorMsg);
    await supabase.from('automations').update({
      failure_count: automation.failure_count + 1,
    }).eq('id', automation.id);
    logger.error('Automation', `Execution failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

async function logExecution(automation: Automation, status: AutomationExecution['status'], durationMs: number, result: Record<string, unknown>, error: string | null): Promise<void> {
  try {
    await supabase.from('automation_executions').insert({
      user_id: automation.user_id,
      workspace_id: automation.workspace_id,
      automation_id: automation.id,
      trigger_type: automation.trigger_type,
      status,
      duration_ms: durationMs,
      result,
      error,
    });
  } catch { /* ignore logging errors */ }
}

export async function retryExecution(execution: AutomationExecution, automation: Automation): Promise<void> {
  if (automation.failure_count >= automation.max_retries) return;
  await supabase.from('automation_executions').update({ retried: true }).eq('id', execution.id);
  await executeAutomation(automation);
}

export function computeNextRun(triggerType: AutomationTriggerType, config: Record<string, unknown>, timezone?: string): string | null {
  const now = new Date();
  switch (triggerType) {
    case 'schedule_daily': {
      const time = (config.time as string) || '08:00';
      const [h, m] = time.split(':').map(Number);
      const next = new Date(now);
      next.setHours(h, m, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toISOString();
    }
    case 'schedule_weekly': {
      const day = (config.day as string) || 'monday';
      const time = (config.time as string) || '08:00';
      const [h, m] = time.split(':').map(Number);
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = days.indexOf(day.toLowerCase());
      const next = new Date(now);
      next.setHours(h, m, 0, 0);
      let diff = targetDay - next.getDay();
      if (diff < 0) diff += 7;
      if (diff === 0 && next <= now) diff = 7;
      next.setDate(next.getDate() + diff);
      return next.toISOString();
    }
    case 'schedule_monthly': {
      const day = (config.day as number) || 1;
      const next = new Date(now);
      next.setDate(day);
      next.setHours(8, 0, 0, 0);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      return next.toISOString();
    }
    case 'schedule_specific': {
      const date = config.date as string;
      const time = (config.time as string) || '08:00';
      if (!date) return null;
      const next = new Date(`${date}T${time}:00`);
      return next > now ? next.toISOString() : null;
    }
    default: return null;
  }
}

export const NOTIFICATION_CATEGORIES: { value: NotificationRecord['category']; label: string }[] = [
  { value: 'risk', label: 'Risk' },
  { value: 'trading', label: 'Trading' },
  { value: 'journal', label: 'Journal' },
  { value: 'goals', label: 'Goals' },
  { value: 'reports', label: 'Reports' },
  { value: 'ai', label: 'AI' },
  { value: 'system', label: 'System' },
];

export const PRIORITY_LEVELS: { value: NotificationRecord['priority']; label: string; color: string }[] = [
  { value: 'info', label: 'Information', color: 'text-primary' },
  { value: 'warning', label: 'Warning', color: 'text-warning' },
  { value: 'critical', label: 'Critical', color: 'text-destructive' },
];
