/**
 * RecapViewer — Full-screen swipeable recap experience.
 *
 * Renders slides with Framer Motion transitions, progress bar,
 * tap-zone navigation, swipe gestures, and keyboard support.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
import { SLIDE_GRADIENTS } from './constants';
import {
  WelcomeSlide,
  TotalHoursSlide,
  TopProjectsSlide,
  BusiestDaySlide,
  StreaksPatternsSlide,
  AIInsightSlide,
  TeamStandingSlide,
  SummarySlide,
} from './slides';
import type { RecapSlide } from '@/lib/api/types';

interface RecapViewerProps {
  slides: RecapSlide[];
  initialSlide?: number;
  onClose: () => void;
  onSlideChange?: (index: number) => void;
}

const SWIPE_THRESHOLD = 50;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

function renderSlide(slide: RecapSlide) {
  switch (slide.type) {
    case 'welcome':
      return <WelcomeSlide {...slide} />;
    case 'total-hours':
      return <TotalHoursSlide {...slide} />;
    case 'top-projects':
      return <TopProjectsSlide {...slide} />;
    case 'busiest-day':
      return <BusiestDaySlide {...slide} />;
    case 'streaks-patterns':
      return <StreaksPatternsSlide {...slide} />;
    case 'ai-insight':
      return <AIInsightSlide {...slide} />;
    case 'team-standing':
      return <TeamStandingSlide {...slide} />;
    case 'summary':
      return <SummarySlide {...slide} />;
  }
}

export function RecapViewer({ slides, initialSlide = 0, onClose, onSlideChange }: RecapViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialSlide);
  const [direction, setDirection] = useState(0);

  const currentSlide = slides[currentIndex];
  const gradient = SLIDE_GRADIENTS[currentSlide?.type] ?? SLIDE_GRADIENTS.welcome;

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= slides.length) return;
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
      onSlideChange?.(index);
    },
    [currentIndex, slides.length, onSlideChange],
  );

  const goNext = useCallback(() => {
    if (currentIndex >= slides.length - 1) {
      onClose();
      return;
    }
    goTo(currentIndex + 1);
  }, [currentIndex, slides.length, goTo, onClose]);

  const goPrev = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  return (
    <motion.div
      className={`fixed inset-0 z-[100] flex flex-col bg-gradient-to-br ${gradient} transition-all duration-500`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Progress bar */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-white rounded-full"
              initial={false}
              animate={{ width: i <= currentIndex ? '100%' : '0%' }}
              transition={{ duration: 0.3 }}
            />
          </button>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
      >
        <IconX className="h-5 w-5" />
      </button>

      {/* Slide content */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -SWIPE_THRESHOLD) goNext();
              else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
            }}
            className="absolute inset-0 flex items-center justify-center px-6"
          >
            <div className="w-full max-w-md mx-auto">
              {renderSlide(currentSlide)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tap zones */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="w-[30%] pointer-events-auto cursor-pointer" onClick={goPrev} />
          <div className="flex-1" />
          <div className="w-[30%] pointer-events-auto cursor-pointer" onClick={goNext} />
        </div>
      </div>

      {/* Slide counter */}
      <div className="text-center text-white/60 text-sm pb-4">
        {currentIndex + 1} / {slides.length}
      </div>
    </motion.div>
  );
}
