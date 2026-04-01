/**
 * MonthlyRecapBanner — Alert bar shown across all pages when a recap is available.
 *
 * Visible during the first 5 days of each month, showing the previous month's recap.
 * E.g. Apr 1-5 shows "Your March 2026 Recap is ready!"
 * Dismissible within a session. Renders the RecapViewer when triggered.
 */

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconSparkles, IconX } from '@tabler/icons-react';
import { useAvailableRecaps, useMonthlyRecap, useUpdateRecapProgress } from '@/lib/query/hooks/useRecaps';
import { RecapViewer } from './RecapViewer';
import { Skeleton } from '@/components/ui/skeleton';
import { MONTH_NAMES } from './constants';

const VISIBILITY_DAYS = 5;

function RecapLoadingOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
      >
        <IconX className="h-5 w-5" />
      </button>
      <div className="text-center text-white space-y-4">
        <IconSparkles className="h-12 w-12 mx-auto animate-pulse" />
        <p className="text-lg font-medium">Generating your recap...</p>
        <p className="text-sm text-white/70">This may take a few seconds</p>
        <div className="flex gap-2 justify-center">
          <Skeleton className="h-2 w-16 bg-white/20" />
          <Skeleton className="h-2 w-12 bg-white/20" />
          <Skeleton className="h-2 w-20 bg-white/20" />
        </div>
      </div>
    </div>
  );
}

export function MonthlyRecapBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const { data: availableMonths } = useAvailableRecaps();

  // Compute visibility window and recap month once (stable across renders)
  const { isInVisibilityWindow, recapMonth, recapYear } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return {
      isInVisibilityWindow: now.getDate() <= VISIBILITY_DAYS,
      recapMonth: month,
      recapYear: year,
    };
  }, []);

  const prevMonthHasData = useMemo(() => {
    if (!availableMonths?.length) return false;
    return availableMonths.some(
      (m) => m.month === recapMonth && m.year === recapYear,
    );
  }, [availableMonths, recapMonth, recapYear]);

  const { data: recap, isLoading: recapLoading, isError: recapError } = useMonthlyRecap(
    recapYear,
    recapMonth,
    viewerOpen && prevMonthHasData,
  );

  const progressMutation = useUpdateRecapProgress();

  const handleCloseViewer = () => setViewerOpen(false);

  const monthName = MONTH_NAMES[recapMonth - 1];

  return (
    <>
      {/* Banner */}
      <AnimatePresence>
        {isInVisibilityWindow && prevMonthHasData && !dismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white mb-4"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setViewerOpen(true)}
                className="flex items-center gap-2 hover:opacity-90 transition"
                aria-label={`View your ${monthName} ${recapYear} recap`}
              >
                <IconSparkles className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">
                  Your {monthName} {recapYear} Recap is ready!
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  View now
                </span>
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="rounded-full p-1 hover:bg-white/20 transition"
                aria-label="Dismiss recap banner"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recap Viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <>
            {recapLoading ? (
              <RecapLoadingOverlay onClose={handleCloseViewer} />
            ) : recapError ? (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
                <button
                  onClick={handleCloseViewer}
                  aria-label="Close"
                  className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
                >
                  <IconX className="h-5 w-5" />
                </button>
                <div className="text-center text-white space-y-4">
                  <p className="text-lg font-medium">Could not load your recap</p>
                  <p className="text-sm text-white/70">Please try again later</p>
                </div>
              </div>
            ) : recap ? (
              <RecapViewer
                slides={recap.slides_data}
                initialSlide={recap.last_viewed_slide}
                onClose={handleCloseViewer}
                onSlideChange={(index) => {
                  progressMutation.mutate({ id: recap.id, slideIndex: index });
                }}
              />
            ) : null}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
