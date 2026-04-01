/**
 * SeasonalBanner — Displays a festive greeting banner for seasonal events.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
import type { SeasonalBanner as SeasonalBannerType } from '../types';

interface SeasonalBannerProps {
  banner: SeasonalBannerType;
  eventName: string;
}

export function SeasonalBanner({ banner, eventName }: SeasonalBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${banner.gradient} text-white mb-4`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{banner.emoji}</span>
              <span className="text-sm font-medium">{banner.message}</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-full p-1 hover:bg-white/20 transition shrink-0"
              aria-label={`Dismiss ${eventName} banner`}
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
