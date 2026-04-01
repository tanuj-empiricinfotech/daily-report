/**
 * Seasonal Events Type Definitions
 */

export interface SeasonalEventDate {
  month: number; // 1-based (1 = January)
  day: number;
}

export interface SeasonalBanner {
  message: string;
  emoji: string;
  gradient: string; // Tailwind gradient classes
}

export type EffectType = 'confetti' | 'snowfall' | 'fireworks' | 'colorSplash' | 'diyas';

export interface SeasonalEffect {
  type: EffectType;
  autoTrigger: boolean; // Trigger on page load
}

export interface ButtonPrank {
  enabled: boolean;
  minDodges: number;
  maxDodges: number;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  dates: SeasonalEventDate[];
  banner?: SeasonalBanner;
  effects?: SeasonalEffect;
  buttonPrank?: ButtonPrank;
}
