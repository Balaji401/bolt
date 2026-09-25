'use client';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Clock, Target, Shield, FileText, Sparkles, Brain, HeartPulse, Image as ImageIcon, X, Edit3, Copy, Archive, Trash2 } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function TradeDetail({ trade, onClose, onEdit, onDuplicate, onArchive, onDelete }: {
  trade: Trade;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const isWin = Number(trade.pnl) >= 0;
  const screenshots = trade.screenshots || (trade.screenshot_url ? [trade.screenshot_url] : []);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className={cn('grid place-items-center w-10 h-10 rounded-lg', isWin ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                {trade.direction === 'long' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-lg font-semibold">{trade.instrument}</div>
                <div className="text-xs text-muted-foreground font-normal">{formatDateTime(trade.executed_at)}</div>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={onEdit}><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={onDuplicate}><Copy className="w-3.5 h-3.5 mr-1" /> Duplicate</Button>
              <Button size="sm" variant="ghost" onClick={onArchive}><Archive className="w-3.5 h-3.5 mr-1" /> Archive</Button>
              <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 mr-1 text-destructive" /></Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="P&L" value={formatCurrency(Number(trade.pnl))} accent={isWin ? 'success' : 'destructive'} />
            <SummaryCard label="R:R" value={Number(trade.rr).toFixed(2)} accent="primary" />
            <SummaryCard label="Direction" value={trade.direction.toUpperCase()} accent={trade.direction === 'long' ? 'success' : 'destructive'} />
            <SummaryCard label="Status" value={trade.status.toUpperCase()} accent={trade.status === 'open' ? 'warning' : 'secondary'} />
          </div>

          {/* Price Info */}
          <DetailSection icon={TrendingUp} title="Price Information">
            <DetailRow label="Entry Price" value={Number(trade.entry_price).toString()} />
            <DetailRow label="Exit Price" value={trade.exit_price ? Number(trade.exit_price).toString() : '—'} />
            <DetailRow label="Stop Loss" value={trade.stop_loss ? Number(trade.stop_loss).toString() : '—'} />
            <DetailRow label="Take Profit" value={trade.take_profit ? Number(trade.take_profit).toString() : '—'} />
            <DetailRow label="Position Size" value={Number(trade.quantity).toString()} />
          </DetailSection>

          {/* Risk Info */}
          <DetailSection icon={Shield} title="Risk Information">
            <DetailRow label="Risk %" value={trade.risk_pct ? `${Number(trade.risk_pct)}%` : '—'} />
            <DetailRow label="R:R Ratio" value={Number(trade.rr).toFixed(2)} />
            <DetailRow label="Confidence" value={trade.confidence != null ? `${trade.confidence}/100` : '—'} />
          </DetailSection>

          {/* Classification */}
          <DetailSection icon={Target} title="Classification">
            <DetailRow label="Market" value={trade.market || '—'} />
            <DetailRow label="Session" value={trade.session ? trade.session.charAt(0).toUpperCase() + trade.session.slice(1).replace('_', ' ') : '—'} />
            <DetailRow label="Timeframe" value={trade.timeframe || '—'} />
            <DetailRow label="Setup Type" value={trade.setup_type || '—'} />
            {(trade.strategy_tags || []).length > 0 && (
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1">{(trade.strategy_tags || []).map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}</div>
              </div>
            )}
          </DetailSection>

          {/* Timing */}
          <DetailSection icon={Clock} title="Trade Timeline">
            <DetailRow label="Entry" value={formatDateTime(trade.executed_at)} />
            <DetailRow label="Exit" value={trade.closed_at ? formatDateTime(trade.closed_at) : '—'} />
            <DetailRow label="Holding Time" value={trade.holding_minutes ? `${Math.floor(trade.holding_minutes / 60)}h ${trade.holding_minutes % 60}m` : '—'} />
          </DetailSection>

          {/* Notes */}
          {(trade.notes || trade.before_notes || trade.during_notes || trade.after_notes || trade.lessons_learned) && (
            <DetailSection icon={FileText} title="Notes">
              {trade.notes && <NoteBlock label="Trade Notes" content={trade.notes} />}
              {trade.before_notes && <NoteBlock label="Before" content={trade.before_notes} />}
              {trade.during_notes && <NoteBlock label="During" content={trade.during_notes} />}
              {trade.after_notes && <NoteBlock label="After" content={trade.after_notes} />}
              {trade.lessons_learned && <NoteBlock label="Lessons" content={trade.lessons_learned} />}
            </DetailSection>
          )}

          {/* Mistakes */}
          {(trade.mistakes || []).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mistakes</div>
              <div className="flex flex-wrap gap-1.5">{(trade.mistakes || []).map((m) => <Badge key={m} variant="destructive" className="text-[10px]">{m}</Badge>)}</div>
            </div>
          )}

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Screenshots</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {screenshots.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-colors group">
                    <img src={url} alt="Chart screenshot" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Placeholders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PlaceholderCard icon={Sparkles} title="AI Trade Review" description="Automated trade analysis and scoring coming soon." />
            <PlaceholderCard icon={Brain} title="AI Mistake Detection" description="AI-powered mistake detection and suggestions coming soon." />
            <PlaceholderCard icon={HeartPulse} title="AI Psychology Review" description="Psychological analysis of this trade coming soon." />
            <PlaceholderCard icon={Target} title="AI Confidence Score" description="AI-generated confidence assessment coming soon." />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: 'success' | 'destructive' | 'primary' | 'warning' | 'secondary' }) {
  const colors = { success: 'text-success', destructive: 'text-destructive', primary: 'text-primary', warning: 'text-warning', secondary: 'text-muted-foreground' };
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className={cn('text-lg font-bold tabular-nums', colors[accent])}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function DetailSection({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {title}</div>
      <div className="rounded-lg border border-border bg-card/50 divide-y divide-border">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function NoteBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="px-3 py-2">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-sm leading-relaxed">{content}</div>
    </div>
  );
}

function PlaceholderCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-3 text-center">
      <Icon className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1.5" />
      <div className="text-xs font-medium">{title}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>
    </div>
  );
}
