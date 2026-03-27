import { motion } from 'framer-motion';
import { AnimatedNumber } from '../AnimatedNumber';

interface TotalHoursSlideProps {
  totalHours: number;
  avgHoursPerDay: number;
  totalDaysLogged: number;
  comparisonToPrevMonth: number;
}

const container = { show: { transition: { staggerChildren: 0.2 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export function TotalHoursSlide({ totalHours, avgHoursPerDay, totalDaysLogged, comparisonToPrevMonth }: TotalHoursSlideProps) {
  const isPositive = comparisonToPrevMonth >= 0;

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-lg mx-auto gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.p variants={item} className="text-lg opacity-80">Total Hours</motion.p>
      <motion.div variants={item} className="text-7xl font-bold">
        <AnimatedNumber value={totalHours} suffix="h" decimals={1} className="tabular-nums" />
      </motion.div>
      <motion.div variants={item} className="flex gap-6 text-sm opacity-70">
        <span>{avgHoursPerDay.toFixed(1)}h avg/day</span>
        <span>{totalDaysLogged} days logged</span>
      </motion.div>
      <motion.div
        variants={item}
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
