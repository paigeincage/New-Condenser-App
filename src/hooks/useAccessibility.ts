import { useEffect } from 'react';
import { useProfile } from './useProfile';

export function useAccessibility() {
  const profile = useProfile();

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.font = profile.fontChoice;
    html.dataset.contrast = profile.highContrast ? 'high' : 'normal';
    html.style.setProperty('--font-scale', String(profile.fontScale ?? 1));
  }, [profile.fontChoice, profile.highContrast, profile.fontScale]);
}
