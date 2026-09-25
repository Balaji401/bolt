'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, Send, Sparkles, Pin, Trash2, Search, Download, Edit3, Check, X } from 'lucide-react';
import type { AiContext } from '@/lib/ai-context';
import { contextToPrompt, CHAT_SUGGESTIONS } from '@/lib/ai-context';
import type { AiChatMessage, AiConversation } from '@/lib/supabase';
import { getSupabaseClientConfig, supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };

export function AiChat({ ctx, workspaceId }: { ctx: AiContext; workspaceId: string | null }) {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase.from('ai_conversations').select('*').order('updated_at', { ascending: false });
    setConversations((data || []) as AiConversation[]);
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    const { data } = await supabase.from('ai_chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    setMessages(((data || []) as AiChatMessage[]).map((m) => ({ role: m.role, content: m.content })));
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (activeSession) loadMessages(activeSession); }, [activeSession, loadMessages]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const newChat = async () => {
    const { data } = await supabase.from('ai_conversations').insert({ workspace_id: workspaceId, title: 'New Conversation' }).select().maybeSingle();
    if (data) { const conv = data as AiConversation; setConversations((prev) => [conv, ...prev]); setActiveSession(conv.session_id); setMessages([]); }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    let sessionId = activeSession;
    if (!sessionId) {
      const { data } = await supabase.from('ai_conversations').insert({ workspace_id: workspaceId, title: userMsg.slice(0, 40) }).select().maybeSingle();
      if (data) { const conv = data as AiConversation; sessionId = conv.session_id; setConversations((prev) => [conv, ...prev]); setActiveSession(conv.session_id); }
    }
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const { url, anonKey, isConfigured } = getSupabaseClientConfig();
      if (!isConfigured) throw new Error('Supabase environment is not configured');

      const res = await fetch(`${url}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({ message: userMsg, contextPrompt: contextToPrompt(ctx), history: messages.slice(-10), session_id: sessionId }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const reply = data.reply || data.response || 'Sorry, I could not process that request.';
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
      await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('session_id', sessionId);
      loadConversations();
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: `I couldn't reach the AI service. Based on your data: You have ${ctx.metrics.totalTrades} trades with a ${ctx.metrics.winRate.toFixed(1)}% win rate and ${ctx.metrics.totalPnl.toFixed(2)} P&L. Try again in a moment.` }]);
    } finally {
      setLoading(false);
    }
  };

  const renameConv = async (id: string) => {
    if (!editTitle.trim()) return;
    await supabase.from('ai_conversations').update({ title: editTitle, updated_at: new Date().toISOString() }).eq('id', id);
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: editTitle } : c));
    setEditingId(null);
  };

  const deleteConv = async (id: string, sessionId: string) => {
    await supabase.from('ai_chat_messages').delete().eq('session_id', sessionId);
    await supabase.from('ai_conversations').delete().eq('id', id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeSession === sessionId) { setActiveSession(null); setMessages([]); }
  };

  const togglePin = async (conv: AiConversation) => {
    await supabase.from('ai_conversations').update({ pinned: !conv.pinned }).eq('id', conv.id);
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, pinned: !c.pinned } : c));
  };

  const exportChat = () => {
    const text = messages.map((m) => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `traderos-chat-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)]">
      <div className="w-full lg:w-64 shrink-0 space-y-3">
        <Button onClick={newChat} className="w-full"><Plus className="w-4 h-4 mr-1.5" />New Chat</Button>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats…" className="pl-9 h-9" /></div>
        <div className="space-y-1 overflow-y-auto scrollbar-thin max-h-[calc(100vh-20rem)]">
          {pinned.length > 0 && <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">Pinned</div>}
          {pinned.map((conv) => <ConvItem key={conv.id} conv={conv} active={activeSession === conv.session_id} editing={editingId === conv.id} editTitle={editTitle} onSelect={() => setActiveSession(conv.session_id)} onStartEdit={() => { setEditingId(conv.id); setEditTitle(conv.title); }} onRename={() => renameConv(conv.id)} onCancelEdit={() => setEditingId(null)} onEditChange={setEditTitle} onTogglePin={() => togglePin(conv)} onDelete={() => deleteConv(conv.id, conv.session_id)} />)}
          {unpinned.length > 0 && pinned.length > 0 && <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1 mt-2">Recent</div>}
          {unpinned.map((conv) => <ConvItem key={conv.id} conv={conv} active={activeSession === conv.session_id} editing={editingId === conv.id} editTitle={editTitle} onSelect={() => setActiveSession(conv.session_id)} onStartEdit={() => { setEditingId(conv.id); setEditTitle(conv.title); }} onRename={() => renameConv(conv.id)} onCancelEdit={() => setEditingId(null)} onEditChange={setEditTitle} onTogglePin={() => togglePin(conv)} onDelete={() => deleteConv(conv.id, conv.session_id)} />)}
          {conversations.length === 0 && <p className="text-xs text-muted-foreground px-2 py-4">No conversations yet.</p>}
        </div>
      </div>
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <EmptyState icon={Sparkles} title="Ask your AI Coach" description="I understand your trades, strategies, psychology, and goals. Ask me anything about your trading." />
                <div className="flex flex-wrap gap-2 justify-center">
                  {CHAT_SUGGESTIONS.map((s) => <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors">{s}</button>)}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                  <div className={cn('grid place-items-center w-8 h-8 rounded-lg shrink-0', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>{m.role === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}</div>
                  <div className={cn('rounded-lg px-3 py-2 max-w-[80%] text-sm whitespace-pre-wrap', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>{m.content}</div>
                </div>
              ))
            )}
            {loading && <div className="flex gap-3"><div className="grid place-items-center w-8 h-8 rounded-lg bg-secondary"><Sparkles className="w-4 h-4 text-muted-foreground" /></div><div className="rounded-lg px-3 py-2 bg-secondary text-sm text-muted-foreground flex items-center gap-2"><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Thinking…</div></div>}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask about your trades, strategy, psychology…" className="flex-1" />
            {messages.length > 0 && <Button variant="ghost" size="icon" onClick={exportChat} title="Export chat"><Download className="w-4 h-4" /></Button>}
            <Button onClick={send} disabled={loading || !input.trim()}><Send className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConvItem({ conv, active, editing, editTitle, onSelect, onStartEdit, onRename, onCancelEdit, onEditChange, onTogglePin, onDelete }: {
  conv: AiConversation; active: boolean; editing: boolean; editTitle: string;
  onSelect: () => void; onStartEdit: () => void; onRename: () => void; onCancelEdit: () => void; onEditChange: (v: string) => void; onTogglePin: () => void; onDelete: () => void;
}) {
  return (
    <div className={cn('group rounded-lg px-2.5 py-2 transition-colors', active ? 'bg-primary/10' : 'hover:bg-secondary/50')}>
      {editing ? (
        <div className="flex gap-1"><Input value={editTitle} onChange={(e) => onEditChange(e.target.value)} className="h-7 text-xs" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') onRename(); }} /><Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRename}><Check className="w-3 h-3" /></Button><Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelEdit}><X className="w-3 h-3" /></Button></div>
      ) : (
        <div className="flex items-center gap-1">
          <button onClick={onSelect} className="flex-1 text-left text-xs font-medium truncate">{conv.title}</button>
          <button onClick={onTogglePin} className={cn('p-0.5 rounded transition-opacity', conv.pinned ? 'opacity-100 text-warning' : 'opacity-0 group-hover:opacity-60')}><Pin className={cn('w-3 h-3', conv.pinned && 'fill-warning')} /></button>
          <button onClick={onStartEdit} className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:opacity-100"><Edit3 className="w-3 h-3" /></button>
          <button onClick={onDelete} className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:opacity-100"><Trash2 className="w-3 h-3 text-destructive" /></button>
        </div>
      )}
    </div>
  );
}
