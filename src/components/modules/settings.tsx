'use client';
import { useState } from 'react';
import { User, Shield, Trash2, Mail, Clock, MapPin, DollarSign, Globe, Award, Camera, AlertTriangle, Eye, EyeOff, Check, Layers } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTimezone, COMMON_TIMEZONES } from '@/components/timezone-provider';
import { validatePassword } from '@/lib/validation';
import { cn } from '@/lib/utils';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];
const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner (0-1 years)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'advanced', label: 'Advanced (3-5 years)' },
  { value: 'expert', label: 'Expert (5+ years)' },
];

export function Settings() {
  const { profile, user, updateProfile, changePassword, deleteAccount, signOutAllDevices } = useAuth();
  const { timezone, setTimezone } = useTimezone();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, profile, workspace, and security preferences.</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5"><User className="w-3.5 h-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="workspace" className="gap-1.5"><Layers className="w-3.5 h-3.5" /> Workspace</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield className="w-3.5 h-3.5" /> Security</TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Account</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6"><ProfileTab profile={profile} user={user} updateProfile={updateProfile} timezone={timezone} setTimezone={setTimezone} /></TabsContent>
        <TabsContent value="workspace" className="mt-6"><WorkspaceTab /></TabsContent>
        <TabsContent value="security" className="mt-6"><SecurityTab changePassword={changePassword} signOutAllDevices={signOutAllDevices} /></TabsContent>
        <TabsContent value="account" className="mt-6"><AccountTab profile={profile} user={user} deleteAccount={deleteAccount} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab({ profile, user, updateProfile, timezone, setTimezone }: {
  profile: any; user: any; updateProfile: any; timezone: string; setTimezone: (tz: string) => void;
}) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [currency, setCurrency] = useState(profile?.preferred_currency || 'USD');
  const [language, setLanguage] = useState(profile?.preferred_language || 'en');
  const [experience, setExperience] = useState(profile?.trading_experience || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    const tzToSave = timezone;
    const result = await updateProfile({
      full_name: fullName || null,
      display_name: displayName || null,
      username: username || null,
      preferred_currency: currency,
      preferred_language: language,
      trading_experience: (experience || null) as any,
      timezone: tzToSave,
    });
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  };

  const initials = (displayName || fullName || 'T').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Avatar + identity */}
      <Card>
        <CardHeader><CardTitle className="text-base">Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="grid place-items-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-chart-4 text-primary-foreground text-xl font-semibold shrink-0">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : initials}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{displayName || fullName || 'Trader'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Member since {memberSince}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Trader" /></div>
            <div className="space-y-2"><Label htmlFor="displayName">Display Name</Label><Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="JohnnyT" /></div>
            <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johnny_trader" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={user?.email || ''} disabled className="opacity-60" /><p className="text-[10px] text-muted-foreground">Email cannot be changed here.</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader><CardTitle className="text-base">Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">{COMMON_TIMEZONES.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Preferred Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Trading Experience</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
                <SelectContent>{EXPERIENCE_LEVELS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
      {saved && <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2 flex items-center gap-2"><Check className="w-4 h-4" /> Profile saved successfully.</div>}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

const DATE_FORMATS = [
  { value: 'MMM D, YYYY', label: 'Jan 15, 2026' },
  { value: 'DD/MM/YYYY', label: '15/01/2026' },
  { value: 'MM/DD/YYYY', label: '01/15/2026' },
  { value: 'YYYY-MM-DD', label: '2026-01-15' },
];
const NUMBER_FORMATS = [
  { value: 'en-US', label: '1,234.56 (US)' },
  { value: 'de-DE', label: '1.234,56 (EU)' },
  { value: 'ja-JP', label: '1,234.56 (JP)' },
];

function WorkspaceTab() {
  const { workspace, accounts, updateWorkspace } = useWorkspace();
  const [name, setName] = useState(workspace?.name || 'Personal');
  const [currency, setCurrency] = useState(workspace?.default_currency || 'USD');
  const [tz, setTz] = useState(workspace?.default_timezone || 'auto');
  const [dateFormat, setDateFormat] = useState(workspace?.date_format || 'MMM D, YYYY');
  const [numberFormat, setNumberFormat] = useState(workspace?.number_format || 'en-US');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    const result = await updateWorkspace({
      name, default_currency: currency, default_timezone: tz,
      date_format: dateFormat, number_format: numberFormat,
    });
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved(true);
  };

  const activeCount = accounts.filter((a) => a.status === 'active').length;
  const archivedCount = accounts.filter((a) => a.status === 'archived').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="ws_name">Workspace Name</Label><Input id="ws_name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Workspace Type</Label><Input value={workspace?.workspace_type === 'team' ? 'Team' : 'Personal'} disabled className="opacity-60 capitalize" /><p className="text-[10px] text-muted-foreground">Team workspaces coming soon.</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Defaults</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Default Currency</Label>
              <Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Default Timezone</Label>
              <Select value={tz} onValueChange={setTz}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="max-h-64">{COMMON_TIMEZONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DATE_FORMATS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Number Format</Label>
              <Select value={numberFormat} onValueChange={setNumberFormat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{NUMBER_FORMATS.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-2xl font-bold text-primary">{accounts.length}</div><div className="text-xs text-muted-foreground">Total Accounts</div></div>
            <div><div className="text-2xl font-bold text-success">{activeCount}</div><div className="text-xs text-muted-foreground">Active</div></div>
            <div><div className="text-2xl font-bold text-muted-foreground">{archivedCount}</div><div className="text-xs text-muted-foreground">Archived</div></div>
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
      {saved && <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2 flex items-center gap-2"><Check className="w-4 h-4" /> Workspace settings saved.</div>}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Save Workspace'}</Button>
      </div>
    </div>
  );
}

function SecurityTab({ changePassword, signOutAllDevices }: { changePassword: any; signOutAllDevices: any }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLogoutAll, setShowLogoutAll] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleChangePassword = async () => {
    setError(null); setSuccess(null);
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) { setError(pwCheck.message!); return; }
    setSaving(true);
    const result = await changePassword(newPassword);
    setSaving(false);
    if (result.error) setError(result.error);
    else { setSuccess('Password changed successfully.'); setNewPassword(''); setConfirmPassword(''); }
  };

  const handleSignOutAll = async () => {
    setLogoutLoading(true);
    const result = await signOutAllDevices();
    setLogoutLoading(false);
    if (result.error) setError(result.error);
    setShowLogoutAll(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input id="newPassword" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <p className="text-xs text-muted-foreground">Use 8+ characters with a mix of letters, numbers, and symbols.</p>
          </div>
          <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm New Password</Label><Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" /></div>
          {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2 flex items-center gap-2"><Check className="w-4 h-4" /> {success}</div>}
          <Button onClick={handleChangePassword} disabled={saving || !newPassword || !confirmPassword}>
            {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Active Sessions</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Sign out from all devices. You'll need to sign in again on every device.</p>
          <Button variant="outline" onClick={() => setShowLogoutAll(true)}><Shield className="w-4 h-4 mr-2" /> Sign Out All Devices</Button>
        </CardContent>
      </Card>

      {showLogoutAll && (
        <Dialog open onOpenChange={() => setShowLogoutAll(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Sign out from all devices?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">This will end your session on every device, including this one. You'll need to sign in again.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLogoutAll(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleSignOutAll} disabled={logoutLoading}>
                {logoutLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Sign Out Everywhere'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AccountTab({ profile, user, deleteAccount }: { profile: any; user: any; deleteAccount: any }) {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true); setError(null);
    const result = await deleteAccount();
    setLoading(false);
    if (result.error) setError(result.error);
    else setShowDelete(false);
  };

  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span><span className="font-medium">{user?.email}</span></div>
          <Separator />
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Member Since</span><span className="font-medium">{memberSince}</span></div>
          <Separator />
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Account Status</span><span className="font-medium capitalize text-success">{profile?.account_status || 'active'}</span></div>
          <Separator />
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Plan</span><span className="font-medium capitalize">{profile?.plan_tier || 'free'}</span></div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-base text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Permanently request account deletion. Your data will be soft-deleted and inaccessible. This action can be reversed by support within 30 days.</p>
          <Button variant="destructive" onClick={() => setShowDelete(true)}><Trash2 className="w-4 h-4 mr-2" /> Delete Account</Button>
        </CardContent>
      </Card>

      {showDelete && (
        <Dialog open onOpenChange={() => setShowDelete(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete your account?</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">This will soft-delete your account and make your data inaccessible. The action can be reversed by contacting support within 30 days.</p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Mark your account as deleted</li>
                  <li>Sign you out from all devices</li>
                  <li>Hide all your trading data from the app</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
                <Input id="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading || confirmText !== 'DELETE'}>
                {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Delete My Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
