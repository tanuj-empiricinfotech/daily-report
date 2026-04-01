/**
 * useSeasonalEvent — Returns the active seasonal event for today, if any.
 */

import { useMemo } from 'react';
import { SEASONAL_EVENTS } from './registry';
import type { SeasonalEvent } from './types';

export function useSeasonalEvent(): SeasonalEvent | null {
  return useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    return SEASONAL_EVENTS.find((event) =>
      event.dates.some((d) => d.month === month && d.day === day)
    ) ?? null;
  }, []);
}
