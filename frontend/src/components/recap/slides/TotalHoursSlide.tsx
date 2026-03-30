import { motion } from 'framer-motion';
import { AnimatedNumber } from '../AnimatedNumber';
import { STAGGER_CONTAINER, FADE_SLIDE_ITEM } from '../motionVariants';

interface TotalHoursSlideProps {
  totalHours: number;
  avgHoursPerDay: number;
  totalDaysLogged: number;
  comparisonToPrevMonth: number;
}

export function TotalHoursSlide({ totalHours, avgHoursPerDay, totalDaysLogged, comparisonToPrevMonth }: TotalHoursSlideProps) {
  const isPositive = comparisonToPrevMonth >= 0;

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-lg mx-auto gap-6"
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
    >
      <motion.p variants={FADE_SLIDE_ITEM} className="text-lg opacity-80">Total Hours</motion.p>
      <motion.div variants={FADE_SLIDE_ITEM} className="text-7xl font-bold">
        <AnimatedNumber value={totalHours} suffix="h" decimals={1} className="tabular-nums" />
      </motion.div>
      <motion.div variants={FADE_SLIDE_ITEM} className="flex gap-6 text-sm opacity-70">
        <span>{avgHoursPerDay.toFixed(1)}h avg/day</span>
        <span>{totalDaysLogged} days logged</span>
      </motion.div>
      <motion.div
        variants={FADE_SLIDE_ITEM}
        className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium ${
          isPositive ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
        }`}
      >
        <span>{isPositive ? '↑' : '↓'}</span>
        <span>{Math.abs(comparisonToPrevMonth).toFixed(1)}% vs last month</span>
      </motion.div>
    </motion.div>
  );
}
