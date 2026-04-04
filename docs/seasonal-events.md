# Seasonal Events

> Last updated: 2026-04-04

## Overview

The seasonal events system adds festive visual effects, banners, and interactive pranks to the application on specific calendar dates. It is designed around a **registry/adapter pattern** that follows the Open/Closed Principle: new events and effects can be added without modifying any existing code.

The system supports three types of seasonal behavior:
1. **Banners** -- Dismissible gradient banners with emoji and message.
2. **Visual effects** -- Full-screen animated overlays (confetti, snowfall, fireworks, color splashes, diyas).
3. **Button pranks** -- The "New Log" button dodges the user's cursor a configurable number of times before allowing interaction.

## How It Works

### Detection Flow

1. `useSeasonalEvent()` hook runs on every page load.
2. It checks today's month and day against all events in the `SEASONAL_EVENTS` registry.
3. If a match is found, the `SeasonalEvent` object is returned; otherwise `null`.
4. `DashboardLayout` conditionally renders `SeasonalBanner` and `SeasonalEffectRenderer` based on the returned event.
5. `DailyLog` page independently checks for `buttonPrank` on the active event.

### DashboardLayout Integration

In `DashboardLayout.tsx`, the seasonal event is consumed as follows:

```tsx
const seasonalEvent = useSeasonalEvent();

// Inside the main content area:
{seasonalEvent?.banner && (
    <SeasonalBanner banner={seasonalEvent.banner} eventName={seasonalEvent.name} />
)}
{seasonalEvent?.effects && (
    <SeasonalEffectRenderer effect={seasonalEvent.effects} />
)}
```

The banner renders above the page content. The effect renderer overlays the entire viewport with `position: fixed` and `pointer-events: none`.

### DailyLog Button Prank Integration

On the DailyLog page, when `buttonPrank.enabled` is true:

1. A random dodge count is chosen between `minDodges` and `maxDodges`.
2. Each click on the "New Log" button applies a random CSS `transform` offset instead of navigating, with increasing intensity (`1 + attemptCount * 0.3`).
3. After exhausting all dodges, the button snaps back, a toast appears, confetti fires, and the user can proceed normally.

## Adapter Pattern

The system uses a **registry pattern** with a component map to decouple event definitions from their rendering:

### Event Registry (`registry.ts`)

A flat array of `SeasonalEvent` objects. Each event declares its ID, name, dates, and optional banner/effects/buttonPrank configuration. Adding a new event is a single array entry -- no other files need modification.

### Effect Renderer (`SeasonalEffectRenderer.tsx`)

A component map (`EFFECT_COMPONENTS`) maps each `EffectType` string to a React component:

```typescript
const EFFECT_COMPONENTS: Record<string, React.ComponentType> = {
  confetti: ConfettiEffect,
  snowfall: SnowfallEffect,
  fireworks: FireworksEffect,
  colorSplash: ColorSplashEffect,
  diyas: DiyasEffect,
};
```

The renderer looks up the component by `effect.type` and renders it only if `autoTrigger` is true. This adapter pattern means new effect types only require: (1) creating a component, and (2) adding one entry to this map.

### Type Definitions (`types.ts`)

```typescript
interface SeasonalEvent {
  id: string;
  name: string;
  dates: SeasonalEventDate[];    // { month, day } (1-based month)
  banner?: SeasonalBanner;       // { message, emoji, gradient }
  effects?: SeasonalEffect;      // { type: EffectType, autoTrigger: boolean }
  buttonPrank?: ButtonPrank;     // { enabled, minDodges, maxDodges }
}

type EffectType = 'confetti' | 'snowfall' | 'fireworks' | 'colorSplash' | 'diyas';
```

## Registered Events

| ID | Name | Date(s) | Banner | Effect | Button Prank |
|----|------|---------|--------|--------|--------------|
| `april-fools` | April Fools' Day | Apr 1 | No | Confetti (manual trigger) | Yes (3-7 dodges) |
| `holi` | Holi | Mar 4 | Pink/yellow/green gradient | Color splash (auto) | No |
| `independence-day` | Independence Day | Aug 15 | Orange/white/green gradient | None | No |
| `diwali` | Diwali | Oct 21-22 | Amber/orange/yellow gradient | Diyas (auto) | No |
| `christmas` | Christmas | Dec 25 | Red/green gradient | Snowfall (auto) | No |
| `new-year` | New Year | Jan 1 | Violet/purple/indigo gradient | Fireworks (auto) | No |

## Effect Components

All effects share a common pattern: render animated elements in a fixed full-screen overlay (`z-[200]`, `pointer-events-none`), auto-dismiss after a timeout.

| Effect | File | Element Count | Duration | Animation |
|--------|------|---------------|----------|-----------|
| **Confetti** | `ConfettiEffect.tsx` | 40 pieces | 3s | Colored circles/squares falling with rotation |
| **Snowfall** | `SnowfallEffect.tsx` | 30 flakes | 10s | White circles drifting down with horizontal sway (infinite loop) |
| **Fireworks** | `FireworksEffect.tsx` | 5 bursts x 12 particles | 5s | Particles explode outward from random screen positions |
| **Color Splash** | `ColorSplashEffect.tsx` | 15 splashes | 6s | Blurred circles scale up and fade at random positions |
| **Diyas** | `DiyasEffect.tsx` | 12 lamps | 8s | Lamp emoji float upward from the bottom of the screen |

## Extensibility

### Adding a New Event

1. Open `frontend/src/lib/seasonal/registry.ts`.
2. Add a new entry to the `SEASONAL_EVENTS` array:

```typescript
{
  id: 'republic-day',
  name: 'Republic Day',
  dates: [{ month: 1, day: 26 }],
  banner: {
    message: 'Happy Republic Day!',
    emoji: '🇮🇳',
    gradient: 'from-orange-500 via-white to-green-600',
  },
  effects: { type: 'confetti', autoTrigger: true },
},
```

No other files need to be changed. The `useSeasonalEvent` hook, `DashboardLayout`, and `SeasonalEffectRenderer` automatically pick it up.

### Adding a New Effect Type

1. Create a new effect component in `frontend/src/lib/seasonal/effects/`:

```typescript
// frontend/src/lib/seasonal/effects/SparkleEffect.tsx
import { useState, useEffect } from 'react';

const DURATION_MS = 5000;

export function SparkleEffect() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {/* Render sparkle elements with CSS animations */}
    </div>
  );
}
```

2. Add the type to `EffectType` in `frontend/src/lib/seasonal/types.ts`:

```typescript
export type EffectType = 'confetti' | 'snowfall' | 'fireworks' | 'colorSplash' | 'diyas' | 'sparkle';
```

3. Register the component in `frontend/src/lib/seasonal/components/SeasonalEffectRenderer.tsx`:

```typescript
import { SparkleEffect } from '../effects/SparkleEffect';

const EFFECT_COMPONENTS: Record<string, React.ComponentType> = {
  // ... existing entries
  sparkle: SparkleEffect,
};
```

4. Use it in any event in the registry:

```typescript
effects: { type: 'sparkle', autoTrigger: true },
```

### Open/Closed Principle

The design ensures that:
- **Event definitions** are data-only entries in the registry array -- no conditional logic elsewhere.
- **Effect components** are mapped via a lookup table -- no switch/if chains.
- **The hook** (`useSeasonalEvent`) is generic date-matching logic that never changes.
- **Layout integration** checks for optional properties (`banner`, `effects`) -- always works regardless of which properties an event defines.

## Key Files

- `frontend/src/lib/seasonal/types.ts` -- Type definitions for events, banners, effects, and pranks
- `frontend/src/lib/seasonal/registry.ts` -- Central registry of all seasonal events
- `frontend/src/lib/seasonal/useSeasonalEvent.ts` -- Hook that returns the active event for today
- `frontend/src/lib/seasonal/components/SeasonalBanner.tsx` -- Dismissible animated banner component
- `frontend/src/lib/seasonal/components/SeasonalEffectRenderer.tsx` -- Effect type to component adapter
- `frontend/src/lib/seasonal/effects/ConfettiEffect.tsx` -- Falling confetti animation
- `frontend/src/lib/seasonal/effects/SnowfallEffect.tsx` -- Snowfall animation
- `frontend/src/lib/seasonal/effects/FireworksEffect.tsx` -- Firework burst animation
- `frontend/src/lib/seasonal/effects/ColorSplashEffect.tsx` -- Color splash animation (Holi)
- `frontend/src/lib/seasonal/effects/DiyasEffect.tsx` -- Floating diya lamp animation (Diwali)
- `frontend/src/components/layout/DashboardLayout.tsx` -- Banner and effect rendering integration
- `frontend/src/pages/DailyLog.tsx` -- Button prank integration
