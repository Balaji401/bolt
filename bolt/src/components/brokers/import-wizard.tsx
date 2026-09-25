'use client';
import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Copy, ArrowRight, ArrowLeft, X, Loader2, Sparkles, Brain, Target, Tag as TagIcon } from 'lucide-react';
import type { Trade, TradingAccount } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { BROKER_LIST, BROKER_ADAPTERS, parseCSV, detectDelimiter, detectBrokerFormat, validateTrades, type BrokerFormat, type ParsedTrade, type ImportField, IMPORT_FIELDS } from '@/lib/brokers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/event-bus';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/format';

type Step = 'broker' | 'upload' | 'preview' | 'mapping' | 'validate' | 'importing' | 'success';

export function ImportWizard({ trades, accounts, onClose, onImported }: {
  trades: Trade[];
  accounts: TradingAccount[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<Step>('broker');
  const [brokerFormat, setBrokerFormat] = useState<BrokerFormat | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<{ valid: ParsedTrade[]; invalid: { rowNumber: number; error: string }[]; duplicates: { trade: ParsedTrade; rowNumber: number }[] } | null>(null);
  const [dupOption, setDupOption] = useState<'skip' | 'replace' | 'import_new'>('skip');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number; failed: number; jobId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cancelRef, setCancelRef] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: { key: Step; label: string }[] = [
    { key: 'broker', label: 'Select Broker' },
    { key: 'upload', label: 'Upload File' },
    { key: 'preview', label: 'Preview Data' },
    { key: 'mapping', label: 'Map Columns' },
    { key: 'validate', label: 'Validate' },
    { key: 'importing', label: 'Import' },
    { key: 'success', label: 'Done' },
  ];
  const currentStepIdx = steps.findIndex((s) => s.key === step);

  const selectBroker = (format: BrokerFormat) => {
    setBrokerFormat(format);
    setColumnMapping(BROKER_ADAPTERS[format].columnMapping);
    setStep('upload');
  };

  const handleFile = useCallback(async (f: File) => {
    if (!brokerFormat) return;
    const adapter = BROKER_ADAPTERS[brokerFormat];
    if (f.size > adapter.maxFileSize) {
      setError(`File exceeds maximum size of ${adapter.maxFileSize / 1024 / 1024}MB`);
      return;
    }
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!adapter.fileTypes.includes(ext) && !f.name.endsWith('.csv') && !f.name.endsWith('.txt')) {
      setError(`Unsupported file type. Allowed: ${adapter.fileTypes.join(', ')}`);
      return;
    }
    setError(null);
    setFile(f);
    const text = await f.text();
    setFileContent(text);
    const delimiter = detectDelimiter(text);
    const { headers: hdrs, rows: parsedRows } = parseCSV(text, delimiter, adapter.skipRows);
    setHeaders(hdrs);
    setRows(parsedRows);

    const detected = detectBrokerFormat(hdrs);
    if (detected !== 'generic_csv' && detected !== brokerFormat) {
      setColumnMapping(BROKER_ADAPTERS[detected].columnMapping);
    }
    setStep('preview');
  }, [brokerFormat]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const parseTrades = useCallback(() => {
    if (!brokerFormat) return [];
    const adapter = BROKER_ADAPTERS[brokerFormat];
    return rows.map((row) => adapter.parseRow(row, columnMapping)).filter((t): t is ParsedTrade => t !== null);
  }, [brokerFormat, rows, columnMapping]);

  const doPreview = () => {
    const parsed = parseTrades();
    setParsedTrades(parsed);
    setStep('mapping');
  };

  const doValidate = () => {
    const parsed = parseTrades();
    setParsedTrades(parsed);
    const result = validateTrades(parsed, trades, {
      skipDuplicates: dupOption === 'skip',
      replaceDuplicates: dupOption === 'replace',
    });
    setValidationResult({
      valid: result.valid,
      invalid: result.invalid.map((i) => ({ rowNumber: i.rowNumber, error: i.error })),
      duplicates: result.duplicates.map((d) => ({ trade: d.trade, rowNumber: d.rowNumber })),
    });
    setStep('validate');
  };

  const doImport = async () => {
    if (!validationResult || !brokerFormat) return;
    setStep('importing');
    setImportProgress(0);
    setCancelRef(false);

    const { data: jobData } = await supabase.from('import_jobs').insert({
      broker_name: BROKER_ADAPTERS[brokerFormat].label,
      source_format: brokerFormat,
      file_name: file?.name || null,
      file_size: file?.size || null,
      trading_account_id: accountId || null,
      status: 'importing',
      total_rows: parsedTrades.length,
      started_at: new Date().toISOString(),
    }).select().single();

    const jobId = jobData?.id || '';
    if (!jobId) { setError('Failed to create import job'); setStep('validate'); return; }

    const valid = validationResult.valid;
    const batchSize = 25;
    let imported = 0;
    let skipped = validationResult.duplicates.length;
    let failed = validationResult.invalid.length;

    for (let i = 0; i < valid.length; i += batchSize) {
      if (cancelRef) break;
      const batch = valid.slice(i, i + batchSize);
      const insertData = batch.map((t) => ({
        instrument: t.instrument,
        direction: t.direction,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        quantity: t.quantity,
        stop_loss: t.stop_loss,
        take_profit: t.take_profit,
        pnl: t.pnl,
        rr: t.rr,
        status: t.status,
        session: t.session,
        strategy_tags: t.strategy_tags,
        executed_at: t.executed_at,
        closed_at: t.closed_at,
        broker_trade_id: t.broker_trade_id,
        import_job_id: jobId,
        source: t.source,
      }));
      const { error: insErr } = await supabase.from('trades').insert(insertData);
      if (insErr) {
        failed += batch.length;
        logger.error('ImportWizard', 'Batch insert failed', { error: insErr.message });
      } else {
        imported += batch.length;
      }
      const progress = Math.min(100, Math.round(((i + batch.length) / valid.length) * 100));
      setImportProgress(progress);
      await supabase.from('import_jobs').update({ progress, imported_rows: imported, skipped_rows: skipped, failed_rows: failed }).eq('id', jobId);
    }

    const errorsToLog = validationResult.invalid.map((inv) => ({
      import_job_id: jobId,
      row_number: inv.rowNumber,
      error_message: inv.error,
      error_type: 'validation',
    }));
    if (errorsToLog.length > 0) {
      await supabase.from('import_errors').insert(errorsToLog);
    }

    await supabase.from('import_jobs').update({
      status: cancelRef ? 'cancelled' : 'completed',
      progress: 100,
      imported_rows: imported,
      skipped_rows: skipped,
      failed_rows: failed,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    setImportSummary({ imported, skipped, failed, jobId });
    emit('trades:imported', { jobId, imported, skipped, failed }, 'brokers');
    setStep('success');
    onImported();
  };

  const reset = () => {
    setStep('broker');
    setBrokerFormat(null);
    setFile(null);
    setFileContent('');
    setHeaders([]);
    setRows([]);
    setParsedTrades([]);
    setColumnMapping({});
    setValidationResult(null);
    setImportProgress(0);
    setImportSummary(null);
    setError(null);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Trades
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-thin pb-1">
          {steps.map((s, idx) => (
            <div key={s.key} className="flex items-center gap-1 shrink-0">
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                idx === currentStepIdx && 'bg-primary text-primary-foreground',
                idx < currentStepIdx && 'bg-success/15 text-success',
                idx > currentStepIdx && 'bg-secondary text-muted-foreground'
              )}>
                {idx < currentStepIdx ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 grid place-items-center text-[10px]">{idx + 1}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {idx < steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Select Broker */}
          {step === 'broker' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select your broker platform to begin importing trades.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BROKER_LIST.map((b) => (
                  <button key={b.id} onClick={() => selectBroker(b.id)} className={cn(
                    'flex flex-col items-start gap-2 p-3 rounded-lg border-2 text-left transition-all hover:border-primary/40',
                    brokerFormat === b.id ? 'border-primary bg-primary/5' : 'border-border'
                  )}>
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-semibold">{b.label}</div>
                      <div className="text-[10px] text-muted-foreground">{b.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default">{BROKER_ADAPTERS[brokerFormat!].label}</Badge>
                <button onClick={() => setStep('broker')} className="text-xs text-primary hover:underline">Change</button>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <div className="text-sm font-medium">{file ? file.name : 'Drop your CSV file here or click to browse'}</div>
                <div className="text-xs text-muted-foreground mt-1">Supported: CSV, TXT (max {BROKER_ADAPTERS[brokerFormat!].maxFileSize / 1024 / 1024}MB)</div>
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
              {file && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · {rows.length} rows detected</div>
                    </div>
                  </div>
                  <Button size="sm" onClick={doPreview}>Preview <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Data Preview <span className="text-muted-foreground">({rows.length} rows)</span></div>
                <Button size="sm" variant="outline" onClick={() => setStep('upload')}>Back</Button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border max-h-64 overflow-y-auto scrollbar-thin">
                <table className="w-full text-xs">
                  <thead className="bg-card/50 sticky top-0">
                    <tr>{headers.map((h) => <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-secondary/30">
                        {headers.map((h) => <td key={h} className="px-2 py-1.5 whitespace-nowrap">{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Showing first 50 of {rows.length} rows</div>
                <Button size="sm" onClick={() => setStep('mapping')}>Continue <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* Step 4: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Map Columns</div>
                <Button size="sm" variant="outline" onClick={() => setStep('preview')}>Back</Button>
              </div>
              <p className="text-xs text-muted-foreground">Match your CSV columns to TraderOS fields. Required fields are marked.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {IMPORT_FIELDS.map((field) => (
                  <div key={field.field} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <Label className="text-xs">{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                    </div>
                    <Select
                      value={Object.entries(columnMapping).find(([, v]) => v === field.field)?.[0] || ''}
                      onValueChange={(csvCol) => {
                        setColumnMapping((prev) => {
                          const next = { ...prev };
                          for (const [k, v] of Object.entries(next)) { if (v === field.field) delete next[k]; }
                          if (csvCol && csvCol !== 'none') next[csvCol] = field.field;
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="— Not mapped —" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Not mapped —</SelectItem>
                        {headers.map((h) => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <Button size="sm" onClick={doValidate}>Validate <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
            </div>
          )}

          {/* Step 5: Validate */}
          {step === 'validate' && validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Validation Results</div>
                <Button size="sm" variant="outline" onClick={() => setStep('mapping')}>Back</Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-center">
                  <div className="text-xl font-bold text-success">{validationResult.valid.length}</div>
                  <div className="text-[10px] text-muted-foreground">Valid</div>
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-center">
                  <div className="text-xl font-bold text-warning">{validationResult.duplicates.length}</div>
                  <div className="text-[10px] text-muted-foreground">Duplicates</div>
                </div>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                  <div className="text-xl font-bold text-destructive">{validationResult.invalid.length}</div>
                  <div className="text-[10px] text-muted-foreground">Invalid</div>
                </div>
              </div>

              {validationResult.duplicates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Duplicate Handling</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([['skip', 'Skip Duplicates'], ['replace', 'Replace'], ['import_new', 'Import All']] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setDupOption(val)} className={cn(
                        'px-3 py-2 rounded-lg border-2 text-xs font-medium transition-colors',
                        dupOption === val ? 'border-primary bg-primary/5' : 'border-border'
                      )}>{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {validationResult.invalid.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-destructive">Errors ({validationResult.invalid.length})</div>
                  <div className="max-h-32 overflow-y-auto scrollbar-thin rounded-lg border border-border p-2 space-y-1">
                    {validationResult.invalid.slice(0, 20).map((err, i) => (
                      <div key={i} className="text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 shrink-0" /> Row {err.rowNumber}: {err.error}
                      </div>
                    ))}
                    {validationResult.invalid.length > 20 && <div className="text-xs text-muted-foreground">...and {validationResult.invalid.length - 20} more</div>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Import to Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select account..." /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id} className="text-xs">{a.account_name} ({a.platform})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={doImport} disabled={validationResult.valid.length === 0}>
                Import {validationResult.valid.length} Trades <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 6: Importing */}
          {step === 'importing' && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <div className="text-sm font-medium">Importing trades...</div>
                <div className="text-xs text-muted-foreground mt-1">{importProgress}% complete</div>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${importProgress}%` }} />
              </div>
              <div className="text-center">
                <Button variant="outline" size="sm" onClick={() => setCancelRef(true)}>Cancel Import</Button>
              </div>
            </div>
          )}

          {/* Step 7: Success */}
          {step === 'success' && importSummary && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-success/10 border border-success/30 mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-success" />
                </div>
                <div className="text-lg font-semibold">Import Complete</div>
                <div className="text-sm text-muted-foreground">Your trades have been imported to the Trading Journal.</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-center">
                  <div className="text-xl font-bold text-success">{importSummary.imported}</div>
                  <div className="text-[10px] text-muted-foreground">Imported</div>
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-center">
                  <div className="text-xl font-bold text-warning">{importSummary.skipped}</div>
                  <div className="text-[10px] text-muted-foreground">Skipped</div>
                </div>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                  <div className="text-xl font-bold text-destructive">{importSummary.failed}</div>
                  <div className="text-[10px] text-muted-foreground">Failed</div>
                </div>
              </div>
              {/* AI Placeholders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <PlaceholderCard icon={Sparkles} title="AI Data Validation" description="AI-powered validation suggestions coming soon." />
                <PlaceholderCard icon={Brain} title="AI Strategy Detection" description="AI will detect and tag strategies from imported trades." />
                <PlaceholderCard icon={Target} title="AI Session Detection" description="AI will auto-detect trading sessions." />
                <PlaceholderCard icon={TagIcon} title="AI Categorization" description="AI will categorize imported trades automatically." />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={reset}>Import Another File</Button>
                <Button onClick={onClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
