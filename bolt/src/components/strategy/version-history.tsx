'use client';
import { History, Eye } from 'lucide-react';
import type { StrategyVersion } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/state';

export function VersionHistory({ versions, onView }: { versions: StrategyVersion[]; onView: (version: StrategyVersion) => void }) {
  if (versions.length === 0) return <EmptyState icon={History} title="No version history yet" description="Save edits to this strategy to create a version history." />;
  return <div className="space-y-2">{versions.map((version) => <Card key={version.id}><CardContent className="p-3 flex items-center gap-3"><div className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold">v{version.version_number}</div><div className="flex-1 min-w-0"><div className="text-xs font-medium">{version.change_summary || 'Strategy update'}</div><div className="text-[10px] text-muted-foreground">{new Date(version.created_at).toLocaleString()}</div></div><Button size="sm" variant="ghost" onClick={() => onView(version)}><Eye className="w-3.5 h-3.5 mr-1" />View</Button></CardContent></Card>)}</div>;
}
