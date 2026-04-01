/**
 * SeasonalEffectRenderer — Renders the visual effect for the active seasonal event.
 */

import type { SeasonalEffect } from '../types';
import { ConfettiEffect } from '../effects/ConfettiEffect';
import { SnowfallEffect } from '../effects/SnowfallEffect';
import { FireworksEffect } from '../effects/FireworksEffect';
import { ColorSplashEffect } from '../effects/ColorSplashEffect';
import { DiyasEffect } from '../effects/DiyasEffect';

interface SeasonalEffectRendererProps {
  effect: SeasonalEffect;
}

const EFFECT_COMPONENTS: Record<string, React.ComponentType> = {
  confetti: ConfettiEffect,
  snowfall: SnowfallEffect,
  fireworks: FireworksEffect,
  colorSplash: ColorSplashEffect,
  diyas: DiyasEffect,
};

export function SeasonalEffectRenderer({ effect }: SeasonalEffectRendererProps) {
  if (!effect.autoTrigger) return null;

  const Component = EFFECT_COMPONENTS[effect.type];
  if (!Component) return null;

  return <Component />;
}
