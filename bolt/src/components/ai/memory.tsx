'use client';
import { Brain, Trash2, RefreshCw, Target } from 'lucide-react';
import type { AiContext } from '@/lib/ai-context';
import { generateMemoryEntries } from '@/lib/ai-context';
import type { AiMemory } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  strategy: 'text-chart-2', habit: 'text-chart-3', mistake: 'text-destructive', goal: 'text-warning', preference: 'text-primary', style: 'text-chart-4', observation: 'text-muted-foreground', rule: 'text-success',
};

export function AiMemoryPanel({ memory, workspaceId, onRefresh }: { memory: AiMemory[]; workspaceId: string | null; onRefresh: () => void }) {
  const syncMemory = async (ctx?: AiContext) => {
    if (!ctx) return;
    const entries = generateMemoryEntries(ctx);
    for (const entry of entries) {
      await supabase.from('ai_memory').insert({ ...entry, workspace_id: workspaceId });
    }
    onRefresh();
  };

  const deleteMemory = async (id: string) => {
    await supabase.from('ai_memory').delete().eq('id', id);
    onRefresh();
  };

  const deleteAll = async () => {
    await supabase.from('ai_memory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    onRefresh();
  };

  const grouped = memory.reduce((acc, m) => {
    (acc[m.memory_type] = acc[m.memory_type] || []).push(m);
    return acc;
  }, {} as Record<string, AiMemory[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-primary" />AI Memory</h3><p className="text-xs text-muted-foreground mt-1">Long-term memory about your trading style, strategies, and patterns.</p></div>
        <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => deleteAll()} disabled={memory.length === 0}><Trash2 className="w-3.5 h-3.5 mr-1" />Clear All</Button></div>
      </div>
      {memory.length === 0 ? (
        <EmptyState icon={Brain} title="No AI memory yet" description="AI memory is built from your trading data — strategies, habits, mistakes, and preferences. It helps the AI give you more personalized advice." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <Card key={type}>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className={cn('w-3.5 h-3.5', TYPE_COLORS[type] || 'text-muted-foreground')} />{type.charAt(0).toUpperCase() + type.slice(1)}s</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {items.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-2.5">
                    <div className="min-w-0"><div className="text-xs font-medium">{m.key}</div><div className="text-[11px] text-muted-foreground">{m.value}</div><Badge variant="outline" className="text-[9px] mt-1">{m.source}</Badge></div>
                    <button onClick={() => deleteMemory(m.id)} className="p-1 rounded hover:bg-secondary shrink-0"><Trash2 className="w-3 h-3 text-destructive" /></button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
