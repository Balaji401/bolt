'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type TimezoneContextType = {
  timezone: string;
  setTimezone: (tz: string) => void;
  formatTime: (date: Date | string) => string;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
};

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export const COMMON_TIMEZONES = [
  { value: 'auto', label: 'Auto (Browser)', offset: '' },
  { value: 'UTC', label: 'UTC', offset: '+00:00' },
  { value: 'America/New_York', label: 'New York (EST/EDT)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', offset: '-06:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: '-08:00' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)', offset: '-05:00' },
  { value: 'America/Sao_Paulo', label: 'Sao Paulo (BRT)', offset: '-03:00' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: '+00:00' },
  { value: 'Europe/Frankfurt', label: 'Frankfurt (CET/CEST)', offset: '+01:00' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: '+01:00' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+03:00' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: '+05:30' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: '+11:00' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT)', offset: '+13:00' },
];

function detectTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'; } catch { return 'auto'; }
}

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>('auto');

  useEffect(() => {
    const saved = localStorage.getItem('traderos-timezone');
    setTimezoneState(saved || 'auto');
  }, []);

  const setTimezone = useCallback((tz: string) => {
    setTimezoneState(tz);
    localStorage.setItem('traderos-timezone', tz);
  }, []);

  const getTz = () => (timezone === 'auto' ? detectTimezone() : timezone);

  const formatTime = useCallback((date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    try { return d.toLocaleTimeString('en-US', { timeZone: getTz(), hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }); }
    catch { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
  }, [timezone]);

  const formatDate = useCallback((date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    try { return d.toLocaleDateString('en-US', { timeZone: getTz(), month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  }, [timezone]);

  const formatDateTime = useCallback((date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    try { return d.toLocaleString('en-US', { timeZone: getTz(), month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }); }
  }, [timezone]);

  return <TimezoneContext.Provider value={{ timezone, setTimezone, formatTime, formatDate, formatDateTime }}>{children}</TimezoneContext.Provider>;
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) throw new Error('useTimezone must be used within TimezoneProvider');
  return ctx;
}
