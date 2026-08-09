'use client';
import { useState, useEffect, useCallback } from 'react';
import { Heart, Plus, X } from 'lucide-react';
import type { CustomEmotion } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { DEFAULT_EMOTIONS } from '@/lib/psychology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarChart } from '@/components/charts';
import { cn } from '@/lib/utils';

export function EmotionTracker({ emotionFrequency }: { emotionFrequency: Record<string, number> }) {
  const { workspace } = useWorkspace();
  const [customEmotions, setCustomEmotions] = useState<CustomEmotion[]>([]);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase.from('custom_emotions').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false });
    setCustomEmotions((data || []) as CustomEmotion[]);
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  const addCustom = async () => {
    if (!workspace || !newName.trim()) return;
    const { data } = await supabase.from('custom_emotions').insert({ name: newName.trim(), workspace_id: workspace.id, user_id: workspace.user_id }).select().maybeSingle();
    if (data) setCustomEmotions((prev) => [data as CustomEmotion, ...prev]);
    setNewName('');
  };

  const removeCustom = async (id: string) => {
    await supabase.from('custom_emotions').delete().eq('id', id);
    setCustomEmotions((prev) => prev.filter((e) => e.id !== id));
  };

  const allEmotions = [...DEFAULT_EMOTIONS, ...customEmotions.map((e) => ({ name: e.name, color: e.color }))];
  const chartData = Object.entries(emotionFrequency).map(([name, count]) => {
    const preset = allEmotions.find((e) => e.name.toLowerCase() === name.toLowerCase());
    return { name, count, color: preset?.color || '#6366f1' };
  }).sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Emotion Tracking</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Emotion tags */}
        <div className="flex flex-wrap gap-2">
          {allEmotions.map((e) => {
            const count = emotionFrequency[e.name.toLowerCase()] || 0;
            return (
              <div key={e.name} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', count > 0 ? 'border-border bg-secondary' : 'border-dashed border-border opacity-50')}>
                <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                {e.name}
                {count > 0 && <span className="text-muted-foreground">{count}</span>}
              </div>
            );
          })}
        </div>

        {/* Add custom emotion */}
        <div className="flex items-center gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add custom emotion…" className="h-8 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }} />
          <Button size="sm" variant="outline" onClick={addCustom}><Plus className="w-3 h-3" /></Button>
        </div>

        {/* Custom emotions list */}
        {customEmotions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customEmotions.map((e) => (
              <div key={e.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary">
                {e.name}
                <button onClick={() => removeCustom(e.id)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Frequency chart */}
        {chartData.length > 0 ? (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Emotion Frequency</h4>
            <BarChart data={chartData} xKey="name" bars={[{ key: 'count', name: 'Occurrences' }]} height={200} colors={chartData.map((d) => d.color)} />
          </div>
        ) : (
          <div className="grid place-items-center h-24 text-sm text-muted-foreground">Tag emotions on your trades to see frequency data.</div>
        )}
      </CardContent>
    </Card>
  );
}
