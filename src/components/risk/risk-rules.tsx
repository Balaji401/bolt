'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shield, Save, RotateCcw } from 'lucide-react';
import { supabase, type RiskRules } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { getDefaultRules } from '@/lib/risk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RiskRulesEditor({ onSaved }: { onSaved?: (rules: RiskRules) => void }) {
  const { workspace, activeAccount } = useWorkspace();
  const [rules, setRules] = useState<RiskRules>(getDefaultRules());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadRules = useCallback(async () => {
    if (!workspace || !activeAccount) return;
    const { data } = await supabase
      .from('risk_rules')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('account_id', activeAccount.id)
      .maybeSingle();
    if (data) setRules(data as RiskRules);
    else setRules({ ...getDefaultRules(), workspace_id: workspace.id, user_id: workspace.user_id, account_id: activeAccount.id });
    setLoading(false);
  }, [workspace, activeAccount?.id]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const update = (key: keyof RiskRules, value: any) => {
    setRules((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    if (!workspace || !activeAccount) return;
    setSaving(true);
    const payload = { ...rules, workspace_id: workspace.id, user_id: workspace.user_id, account_id: activeAccount.id, updated_at: new Date().toISOString() };
    if (rules.id) {
      await supabase.from('risk_rules').update(payload).eq('id', rules.id);
    } else {
      const { data } = await supabase.from('risk_rules').insert(payload).select().maybeSingle();
      if (data) setRules(data as RiskRules);
    }
    setSaving(false);
    setSaved(true);
    onSaved?.(rules);
  };

  const reset = () => {
    setRules({ ...getDefaultRules(), workspace_id: workspace?.id || '', user_id: workspace?.user_id || '', account_id: activeAccount?.id || null });
    setSaved(false);
  };

  if (loading) return <div className="grid place-items-center h-32 text-sm text-muted-foreground">Loading risk rules…</div>;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Risk Rules Configuration</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="w-3 h-3 mr-1" /> Reset</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="w-3 h-3 mr-1" /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* General */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">General Limits</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RuleInput label="Max Daily Loss (%)" value={rules.max_daily_loss_pct} onChange={(v) => update('max_daily_loss_pct', v)} />
              <RuleInput label="Max Weekly Loss (%)" value={rules.max_weekly_loss_pct} onChange={(v) => update('max_weekly_loss_pct', v)} />
              <RuleInput label="Max Monthly Loss (%)" value={rules.max_monthly_loss_pct} onChange={(v) => update('max_monthly_loss_pct', v)} />
            </div>
          </div>

          {/* Trading */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Trading Limits</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <RuleInput label="Max Risk / Trade (%)" value={rules.max_risk_per_trade_pct} onChange={(v) => update('max_risk_per_trade_pct', v)} step="0.1" />
              <RuleInput label="Max Open Trades" value={rules.max_open_trades} onChange={(v) => update('max_open_trades', v)} step="1" />
              <RuleInput label="Max Daily Trades" value={rules.max_daily_trades} onChange={(v) => update('max_daily_trades', v)} step="1" />
              <RuleInput label="Max Position Size (%)" value={rules.max_position_size_pct} onChange={(v) => update('max_position_size_pct', v)} />
            </div>
          </div>

          {/* Behavior */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Behavior Rules</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RuleInput label="Stop After Losses" value={rules.stop_after_losses} onChange={(v) => update('stop_after_losses', v)} step="1" />
              <RuleInput label="Warning Threshold (%)" value={rules.warning_threshold_pct} onChange={(v) => update('warning_threshold_pct', v)} />
              <div className="space-y-2">
                <Label className="text-xs">Stop After Daily Loss</Label>
                <button
                  onClick={() => update('stop_after_daily_loss', !rules.stop_after_daily_loss)}
                  className={cn('w-full h-9 rounded-md border border-border text-sm font-medium transition-colors flex items-center justify-center',
                    rules.stop_after_daily_loss ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80')}
                >
                  {rules.stop_after_daily_loss ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/70">
            Rules generate alerts but do not automatically block trading. Always trade responsibly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RuleInput({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input type="number" step={step || '1'} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="h-9" />
    </div>
  );
}
