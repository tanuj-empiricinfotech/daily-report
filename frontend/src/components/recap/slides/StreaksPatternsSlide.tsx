import { motion } from 'framer-motion';
import { STAGGER_CONTAINER, FADE_SLIDE_ITEM } from '../motionVariants';

interface StreaksPatternsSlideProps {
  longestStreak: number;
  currentStreak: number;
  mostProductiveDayOfWeek: string;
}

export function StreaksPatternsSlide({ longestStreak, currentStreak, mostProductiveDayOfWeek }: StreaksPatternsSlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-lg mx-auto gap-6"
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
    >
      <motion.p variants={FADE_SLIDE_ITEM} className="text-lg opacity-80">Streaks & Patterns</motion.p>
      <motion.div variants={FADE_SLIDE_ITEM} className="flex items-center gap-3">
        <span className="text-5xl">🔥</span>
        <span className="text-6xl font-bold">{longestStreak} days</span>
      </motion.div>
      <motion.p variants={FADE_SLIDE_ITEM} className="text-sm opacity-60">Longest streak</motion.p>
      <motion.div variants={FADE_SLIDE_ITEM} className="flex gap-6 text-sm">
        <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
          <p className="text-2xl font-bold">{currentStreak}</p>
          <p className="opacity-70">Current streak</p>
        </div>
        <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
          <p className="text-2xl font-bold">{mostProductiveDayOfWeek}</p>
          <p className="opacity-70">Most productive day</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
