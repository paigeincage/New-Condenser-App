/**
 * Thin Plausible wrapper for the app. No-op until VITE_PLAUSIBLE_DOMAIN is set.
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

const DOMAIN: string | undefined = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  if (!DOMAIN) {
    console.info('[analytics] VITE_PLAUSIBLE_DOMAIN not set — analytics disabled');
    return;
  }
  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', DOMAIN);
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

export function track(event: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return;
  if (typeof window.plausible === 'function') {
    window.plausible(event, props ? { props } : undefined);
    return;
  }
  if (DOMAIN) return;
  console.debug('[analytics:track]', event, props ?? '');
}
