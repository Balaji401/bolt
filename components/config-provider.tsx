'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { type PlatformConfig } from '@/lib/config';
import { DEFAULT_CONFIG, loadConfig, saveConfig, resetConfig } from '@/lib/config';
import { emit } from '@/lib/event-bus';
import { logger } from '@/lib/logger';

type ConfigContextType = {
  config: Omit<PlatformConfig, 'brand'>;
  updateConfig: (section: keyof Omit<PlatformConfig, 'brand'>, updates: any) => void;
  setConfig: (config: Omit<PlatformConfig, 'brand'>) => void;
  reset: () => void;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    setConfigState(loadConfig());
  }, []);

  const updateConfig = useCallback((section: keyof Omit<PlatformConfig, 'brand'>, updates: Record<string, unknown>) => {
    setConfigState((prev) => {
      const currentSection = prev[section] as Record<string, unknown>;
      const next = {
        ...prev,
        [section]: { ...currentSection, ...updates },
      };
      saveConfig(next);
      emit('config:updated', { section, updates }, 'config-provider');
      logger.info('Config', `Updated section: ${section}`, { updates });
      return next;
    });
  }, []);

  const setConfig = useCallback((newConfig: Omit<PlatformConfig, 'brand'>) => {
    setConfigState(newConfig);
    saveConfig(newConfig);
    emit('config:updated', { section: 'all', updates: newConfig }, 'config-provider');
  }, []);

  const reset = useCallback(() => {
    resetConfig();
    setConfigState(DEFAULT_CONFIG);
    emit('config:updated', { section: 'reset', updates: DEFAULT_CONFIG }, 'config-provider');
    logger.info('Config', 'Configuration reset to defaults');
  }, []);

  return (
    <ConfigContext.Provider value={{ config, updateConfig, setConfig, reset }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
