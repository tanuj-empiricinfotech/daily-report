/**
 * Seasonal Events Registry
 *
 * Central registry of all seasonal events. Add new events here.
 * Events are matched by month and day.
 */

import type { SeasonalEvent } from './types';

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'april-fools',
    name: "April Fools' Day",
    dates: [{ month: 4, day: 1 }],
    buttonPrank: { enabled: true, minDodges: 3, maxDodges: 7 },
    effects: { type: 'confetti', autoTrigger: false },
  },
  {
    id: 'holi',
    name: 'Holi',
    dates: [{ month: 3, day: 4 }], // 2026 date
    banner: {
      message: 'Happy Holi! May your life be filled with colors',
      emoji: '🎨',
      gradient: 'from-pink-500 via-yellow-400 to-green-500',
    },
    effects: { type: 'colorSplash', autoTrigger: true },
  },
  {
    id: 'independence-day',
    name: 'Independence Day',
    dates: [{ month: 8, day: 15 }],
    banner: {
      message: 'Happy Independence Day! Jai Hind',
      emoji: '🇮🇳',
      gradient: 'from-orange-500 via-white to-green-600',
    },
  },
  {
    id: 'diwali',
    name: 'Diwali',
    dates: [{ month: 10, day: 21 }, { month: 10, day: 22 }], // 2026 dates
    banner: {
      message: 'Happy Diwali! Festival of Lights',
      emoji: '🪔',
      gradient: 'from-amber-500 via-orange-500 to-yellow-400',
    },
    effects: { type: 'diyas', autoTrigger: true },
  },
  {
    id: 'christmas',
    name: 'Christmas',
    dates: [{ month: 12, day: 25 }],
    banner: {
      message: 'Merry Christmas!',
      emoji: '🎄',
      gradient: 'from-red-600 via-green-600 to-red-600',
    },
    effects: { type: 'snowfall', autoTrigger: true },
  },
  {
    id: 'new-year',
    name: 'New Year',
    dates: [{ month: 1, day: 1 }],
    banner: {
      message: 'Happy New Year!',
      emoji: '🎆',
      gradient: 'from-violet-600 via-purple-500 to-indigo-600',
    },
    effects: { type: 'fireworks', autoTrigger: true },
  },
];
