import { useEffect } from 'react';
import { useProfile, saveProfile } from './useProfile';
import type { ThemeMode } from '../db';

function systemPref(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme() {
  const profile = useProfile();
  const effective: ThemeMode = profile.themeMode ?? systemPref();

  useEffect(() => {
    document.documentElement.dataset.theme = effective;
  }, [effective]);

  const setTheme = (mode: ThemeMode) => {
    saveProfile({ themeMode: mode });
  };

  const toggle = () => setTheme(effective === 'dark' ? 'light' : 'dark');

  return { theme: effective, setTheme, toggle };
}
