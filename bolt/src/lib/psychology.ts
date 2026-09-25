import type { Trade, PsychologyLog } from './supabase';
import { computeMetrics, type Metrics } from './analytics';

export type PsychologyMetrics = {
  disciplineScore: number;
  emotionalScore: number;
  consistencyScore: number;
  confidenceScore: number;
  patienceScore: number;
  ruleFollowingPct: number;
  revengeTradingCount: number;
  fomoTrades: number;
  overtradingScore: number;
  missedTrades: number;
  tradingStreak: number;
  emotionFrequency: Record<string, number>;
  disciplineTrend: { date: string; discipline: number; patience: number; confidence: number }[];
  rulesFollowed: number;
  rulesBroken: number;
  lateEntries: number;
  earlyExits: number;
  riskViolations: number;
  overtradingCount: number;
};

const NEGATIVE_EMOTIONS = ['fear', 'greed', 'revenge', 'fomo', 'impulsive'];
const POSITIVE_EMOTIONS = ['confident', 'calm', 'patient', 'disciplined'];

export function computePsychologyMetrics(
  trades: Trade[],
  psychLogs: PsychologyLog[],
  metrics?: Metrics
): PsychologyMetrics {
  const m = metrics || computeMetrics(trades);
  const closed = trades.filter((t) => t.status === 'closed');

  // Aggregate emotions from trades
  const emotionFrequency: Record<string, number> = {};
  for (const t of closed) {
    for (const e of t.emotions || []) {
      emotionFrequency[e] = (emotionFrequency[e] || 0) + 1;
    }
  }

  // Revenge trading: trades taken shortly after a loss with negative emotion
  const sorted = [...closed].sort((a, b) =>
    new Date(a.closed_at || a.executed_at).getTime() - new Date(b.closed_at || b.executed_at).getTime()
  );
  let revengeTradingCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const timeDiff = new Date(curr.executed_at).getTime() - new Date(prev.closed_at || prev.executed_at).getTime();
    if (prev.pnl < 0 && timeDiff < 3600000 && (curr.emotions || []).some((e) => ['revenge', 'fomo', 'impulsive'].includes(e))) {
      revengeTradingCount++;
    }
  }

  // FOMO trades
  const fomoTrades = closed.filter((t) => (t.emotions || []).includes('fomo')).length;

  // Overtrading: more than 5 trades in a single day
  const tradesByDay: Record<string, number> = {};
  for (const t of closed) {
    const d = (t.closed_at || t.executed_at).split('T')[0];
    tradesByDay[d] = (tradesByDay[d] || 0) + 1;
  }
  const overtradingCount = Object.values(tradesByDay).filter((c) => c > 5).length;
  const overtradingScore = closed.length > 0 ? Math.min((overtradingCount / Math.max(Object.keys(tradesByDay).length, 1)) * 100, 100) : 0;

  // Missed trades: trades with no notes/review
  const missedTrades = closed.filter((t) => !t.notes && !t.before_notes && !t.after_notes).length;

  // Trading streak
  const tradingStreak = m.currentStreak;

  // Rules followed/broken from trade mistakes field
  let rulesFollowed = 0;
  let rulesBroken = 0;
  let lateEntries = 0;
  let earlyExits = 0;
  let riskViolations = 0;
  for (const t of closed) {
    const mistakes = (t.mistakes || []);
    if (mistakes.length === 0) rulesFollowed++;
    else rulesBroken++;
    if (mistakes.some((m) => m.toLowerCase().includes('late') || m.toLowerCase().includes('early entry'))) lateEntries++;
    if (mistakes.some((m) => m.toLowerCase().includes('early exit') || m.toLowerCase().includes('premature'))) earlyExits++;
    if (mistakes.some((m) => m.toLowerCase().includes('risk') || m.toLowerCase().includes('overleverag'))) riskViolations++;
  }
  const ruleFollowingPct = closed.length > 0 ? (rulesFollowed / closed.length) * 100 : 100;

  // Scores from psychology logs (last 30 entries)
  const recentLogs = psychLogs.slice(0, 30);
  const avg = (key: keyof PsychologyLog) => {
    const vals = recentLogs.map((l) => Number(l[key] || 0)).filter((v) => v > 0);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };

  const disciplineScore = avg('discipline');
  const confidenceScore = avg('confidence');
  const patienceScore = avg('patience');

  // Emotional score: inverse of negative emotions
  const totalEmotions = Object.values(emotionFrequency).reduce((s, v) => s + v, 0);
  const negativeEmotionCount = Object.entries(emotionFrequency)
    .filter(([k]) => NEGATIVE_EMOTIONS.includes(k.toLowerCase()))
    .reduce((s, [, v]) => s + v, 0);
  const emotionalScore = totalEmotions > 0
    ? Math.max(0, 100 - (negativeEmotionCount / totalEmotions) * 100)
    : 75;

  // Consistency score: based on trade frequency regularity
  const days = Object.keys(tradesByDay).sort();
  const dayIntervals: number[] = [];
  for (let i = 1; i < days.length; i++) {
    dayIntervals.push(Math.abs(new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86400000);
  }
  const avgInterval = dayIntervals.length > 0 ? dayIntervals.reduce((s, v) => s + v, 0) / dayIntervals.length : 0;
  const intervalStdDev = dayIntervals.length > 1
    ? Math.sqrt(dayIntervals.reduce((s, v) => s + Math.pow(v - avgInterval, 2), 0) / dayIntervals.length)
    : 0;
  const consistencyScore = avgInterval > 0 ? Math.max(0, 100 - (intervalStdDev / avgInterval) * 50) : 50;

  // Discipline trend from psych logs
  const disciplineTrend = recentLogs
    .map((l) => ({
      date: l.log_date,
      discipline: Number(l.discipline || 0),
      patience: Number(l.patience || 0),
      confidence: Number(l.confidence || 0),
    }))
    .reverse();

  return {
    disciplineScore,
    emotionalScore,
    consistencyScore,
    confidenceScore,
    patienceScore,
    ruleFollowingPct,
    revengeTradingCount,
    fomoTrades,
    overtradingScore,
    missedTrades,
    tradingStreak,
    emotionFrequency,
    disciplineTrend,
    rulesFollowed,
    rulesBroken,
    lateEntries,
    earlyExits,
    riskViolations,
    overtradingCount,
  };
}

export const DEFAULT_EMOTIONS = [
  { name: 'Confident', color: '#10b981' },
  { name: 'Fear', color: '#ef4444' },
  { name: 'Greed', color: '#f59e0b' },
  { name: 'Hope', color: '#3b82f6' },
  { name: 'Revenge', color: '#dc2626' },
  { name: 'FOMO', color: '#f97316' },
  { name: 'Calm', color: '#06b6d4' },
  { name: 'Patient', color: '#8b5cf6' },
  { name: 'Disciplined', color: '#22c55e' },
  { name: 'Impulsive', color: '#e11d48' },
];

export const DEFAULT_HABITS = [
  'Journal Every Day',
  'Review Trades',
  'Read Trading Plan',
  'Meditation',
  'Exercise',
  'No Revenge Trading',
  'Respect Risk',
  'Sleep 8 Hours',
];

export const MISTAKE_CATEGORIES = [
  'Risk Management',
  'Entry',
  'Exit',
  'Psychology',
  'Strategy',
  'Execution',
  'Planning',
  'General',
];
