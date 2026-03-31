/**
 * useVersionCheck — Polls for new frontend deployments and prompts user to reload.
 *
 * Fetches /version.json periodically and compares with the version captured
 * on initial load. Shows a confirm dialog when a new version is detected.
 */

import { useEffect, useRef } from 'react';

const VERSION_CHECK_INTERVAL_MS = 60_000; // Check every 60 seconds
const VERSION_URL = '/version.json';

let currentVersion: string | null = null;

async function fetchVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.version ?? null;
  } catch {
    return null;
  }
}

export function useVersionCheck() {
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    // Capture current version on first load
    fetchVersion().then((version) => {
      if (version) currentVersion = version;
    });

    const interval = setInterval(async () => {
      if (hasPromptedRef.current) return;

      const latestVersion = await fetchVersion();
      if (!latestVersion || !currentVersion) return;

      if (latestVersion !== currentVersion) {
        hasPromptedRef.current = true;
        const shouldReload = window.confirm(
          'A new version of the app is available. Reload to update?'
        );
        if (shouldReload) {
          window.location.reload();
        }
      }
    }, VERSION_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
