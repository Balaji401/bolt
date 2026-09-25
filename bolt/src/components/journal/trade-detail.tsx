'use client';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Clock, Target, Shield, FileText, Sparkles, Brain, HeartPulse, Image as ImageIcon, X, Edit3, Copy, Archive, Trash2, Globe2 } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { getTradeContext } from '@/lib/market-context';
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex items-center gap-3">
              <div className={cn('grid place-items-center w-11 h-11 rounded-xl border shadow-sm', isWin ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive')}>
                {trade.direction === 'long' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xl font-semibold tracking-[-0.03em] text-foreground">{trade.instrument}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-normal">
                  <span>{trade.direction.toUpperCase()}</span>
                  <span>•</span>
                  <span>{formatDateTime(trade.executed_at)}</span>
                </div>
              </div>
            </DialogTitle>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <Button size="sm" variant="ghost" onClick={onEdit}><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={onDuplicate}><Copy className="w-3.5 h-3.5 mr-1" /> Duplicate</Button>
              <Button size="sm" variant="ghost" onClick={onArchive}><Archive className="w-3.5 h-3.5 mr-1" /> Archive</Button>
              <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 mr-1 text-destructive" /></Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="P&L" value={formatCurrency(Number(trade.pnl))} accent={isWin ? 'success' : 'destructive'} />
            <SummaryCard label="R:R" value={Number(trade.rr).toFixed(2)} accent="primary" />
            <SummaryCard label="Direction" value={trade.direction.toUpperCase()} accent={trade.direction === 'long' ? 'success' : 'destructive'} />
            <SummaryCard label="Status" value={trade.status.toUpperCase()} accent={trade.status === 'open' ? 'warning' : 'secondary'} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-card/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Trade chart</div>
                  <Badge variant="outline" className="text-[10px]">{trade.session ? trade.session.replace('_', ' ') : 'Session not set'}</Badge>
                </div>

                {screenshots.length > 0 ? (
                  <a href={screenshots[0]} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border bg-background">
                    <img src={screenshots[0]} alt={`${trade.instrument} chart`} className="h-64 w-full object-cover" />
                  </a>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-background/70 text-center">
                    <div className="max-w-xs px-4">
                      <div className="text-sm font-medium text-foreground">Chart data unavailable for this trade.</div>
                      <div className="mt-2 text-xs leading-6 text-muted-foreground">No chart snapshot is attached for this trade yet, so the detail view keeps the review focused on actual trade data instead of fabricated market visuals.</div>
                    </div>
                  </div>
                )}
              </div>

              <DetailSection icon={TrendingUp} title="Trade Overview">
                <div className="grid gap-3 p-3 sm:grid-cols-2">
                  <DetailRow label="Instrument" value={trade.instrument} />
                  <DetailRow label="Direction" value={trade.direction.toUpperCase()} />
                  <DetailRow label="Account" value={trade.source || 'Manual'} />
                  <DetailRow label="Session" value={trade.session ? trade.session.replace('_', ' ') : '—'} />
                  <DetailRow label="Timeframe" value={trade.timeframe || '—'} />
                  <DetailRow label="Setup" value={trade.setup_type || '—'} />
                  <DetailRow label="Entry" value={trade.entry_price ? Number(trade.entry_price).toFixed(2) : '—'} />
                  <DetailRow label="Exit" value={trade.exit_price ? Number(trade.exit_price).toFixed(2) : '—'} />
                </div>
              </DetailSection>

              <DetailSection icon={Shield} title="Execution & Risk">
                <div className="grid gap-3 p-3 sm:grid-cols-2">
                  <DetailRow label="Stop Loss" value={trade.stop_loss ? Number(trade.stop_loss).toFixed(2) : '—'} />
                  <DetailRow label="Take Profit" value={trade.take_profit ? Number(trade.take_profit).toFixed(2) : '—'} />
                  <DetailRow label="Position Size" value={Number(trade.quantity).toFixed(2)} />
                  <DetailRow label="Risk %" value={trade.risk_pct ? `${Number(trade.risk_pct).toFixed(2)}%` : '—'} />
                  <DetailRow label="Planned R:R" value={Number(trade.rr).toFixed(2)} />
                  <DetailRow label="Realized P&L" value={formatCurrency(Number(trade.pnl))} />
                  <DetailRow label="Confidence" value={trade.confidence != null ? `${trade.confidence}/100` : '—'} />
                  <DetailRow label="Holding Time" value={trade.holding_minutes ? `${Math.floor(trade.holding_minutes / 60)}h ${trade.holding_minutes % 60}m` : '—'} />
                </div>
              </DetailSection>

              {(trade.notes || trade.before_notes || trade.during_notes || trade.after_notes || trade.lessons_learned) && (
                <DetailSection icon={FileText} title="Decision Context & Notes">
                  {trade.notes && <NoteBlock label="Trade Notes" content={trade.notes} />}
                  {trade.before_notes && <NoteBlock label="Before" content={trade.before_notes} />}
                  {trade.during_notes && <NoteBlock label="During" content={trade.during_notes} />}
                  {trade.after_notes && <NoteBlock label="After" content={trade.after_notes} />}
                  {trade.lessons_learned && <NoteBlock label="Lessons" content={trade.lessons_learned} />}
                </DetailSection>
              )}
            </div>

            <div className="space-y-5">
              <DetailSection icon={Target} title="Strategy & Setup">
                <div className="space-y-3 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(trade.strategy_tags || []).length > 0 ? trade.strategy_tags.map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>) : <span className="text-xs text-muted-foreground">No strategy tags recorded.</span>}
                  </div>
                  <div className="rounded-md border border-border bg-secondary/20 p-2 text-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Setup type</div>
                    <div className="text-foreground">{trade.setup_type || 'Not recorded'}</div>
                  </div>
                  {trade.mistakes && trade.mistakes.length > 0 && (
                    <div className="rounded-md border border-border bg-destructive/5 p-2 text-sm">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-destructive mb-1">Mistakes</div>
                      <div className="flex flex-wrap gap-1.5">{trade.mistakes.map((m) => <Badge key={m} variant="destructive" className="text-[10px]">{m}</Badge>)}</div>
                    </div>
                  )}
                </div>
              </DetailSection>

              <DetailSection icon={HeartPulse} title="Psychology">
                <div className="space-y-3 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <DetailRow label="Confidence" value={trade.confidence != null ? `${trade.confidence}/100` : '—'} />
                    <DetailRow label="Risk %" value={trade.risk_pct != null ? `${Number(trade.risk_pct).toFixed(2)}%` : '—'} />
                  </div>
                  {trade.emotions && trade.emotions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {trade.emotions.map((emotion) => <Badge key={emotion} variant="outline" className="text-[10px]">{emotion}</Badge>)}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No psychology state captured for this trade.</div>
                  )}
                </div>
              </DetailSection>

              <DetailSection icon={Globe2} title="Market Context">
                {(() => {
                  const context = getTradeContext(trade);
                  return (
                    <div className="space-y-3 p-3">
                      <div className="text-sm leading-relaxed text-foreground">{context.note}</div>
                      {context.session && (
                        <div className="rounded-md border border-border bg-secondary/20 p-2 text-xs text-muted-foreground">
                          Session context: {context.session.name} ({context.session.status})
                        </div>
                      )}
                      {context.events.length > 0 && (
                        <div className="space-y-2">
                          {context.events.map((event) => (
                            <div key={event.id} className="rounded-md border border-border bg-secondary/20 p-2 text-xs">
                              <div className="font-medium text-foreground">{event.title}</div>
                              <div className="mt-0.5 text-muted-foreground">{event.date} · {event.currency} · {event.impact.toUpperCase()}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </DetailSection>

              <DetailSection icon={Brain} title="AI Review">
                <div className="space-y-3 p-3">
                  <PlaceholderCard icon={Sparkles} title="AI Trade Review" description="Evidence-based review will appear here when available." />
                  <PlaceholderCard icon={HeartPulse} title="Psychology Review" description="Behavioral context will surface when journal data is present." />
                </div>
              </DetailSection>
            </div>
          </div>

          {screenshots.length > 1 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Additional screenshots</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {screenshots.slice(1).map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <img src={url} alt="Trade screenshot" className="h-28 w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
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
