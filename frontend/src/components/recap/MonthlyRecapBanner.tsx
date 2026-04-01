/**
 * MonthlyRecapBanner — Alert bar shown across all pages when a recap is available.
 *
 * Displays a dismissible gradient banner prompting users to view their monthly recap.
 * Renders the RecapViewer when triggered.
 */

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconSparkles, IconX } from '@tabler/icons-react';
import { useAvailableRecaps, useMonthlyRecap, useUpdateRecapProgress } from '@/lib/query/hooks/useRecaps';
import { RecapViewer } from './RecapViewer';
import { Skeleton } from '@/components/ui/skeleton';
import { MONTH_NAMES } from './constants';

const VISIBILITY_DAYS = 5;

export function MonthlyRecapBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const { data: availableMonths } = useAvailableRecaps();

  // Visibility window: show during first 5 days of the month for last month's recap
  const now = new Date();
  const isInVisibilityWindow = now.getDate() <= VISIBILITY_DAYS;

  // Previous month (the recap we're showing)
  const recapMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-based, previous month
  const recapYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  // Check if previous month has any log data
  const prevMonthHasData = useMemo(() => {
    if (!availableMonths?.length) return false;
    return availableMonths.some(
      (m) => m.month === recapMonth && m.year === recapYear,
    );
  }, [availableMonths, recapMonth, recapYear]);

  // Fetch recap data for previous month when viewer is opened
  const { data: recap, isLoading: recapLoading } = useMonthlyRecap(
    recapYear,
    recapMonth,
    viewerOpen && prevMonthHasData,
  );

  const progressMutation = useUpdateRecapProgress();

  if (!isInVisibilityWindow || !prevMonthHasData || dismissed) return null;

  const monthName = MONTH_NAMES[recapMonth - 1];

  return (
    <>
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
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Recap Viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <>
            {recapLoading ? (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
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
            ) : recap ? (
              <RecapViewer
                slides={recap.slides_data}
                initialSlide={recap.last_viewed_slide}
                onClose={() => setViewerOpen(false)}
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
