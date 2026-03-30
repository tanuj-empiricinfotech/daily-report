import { motion } from 'framer-motion';
import { STAGGER_CONTAINER, FADE_SLIDE_ITEM } from '../motionVariants';

interface BusiestDaySlideProps {
  date: string;
  dayOfWeek: string;
  hours: number;
  tasks: number;
  topProject: string;
}

export function BusiestDaySlide({ date, dayOfWeek, hours, tasks, topProject }: BusiestDaySlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-lg mx-auto gap-6"
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
    >
      <motion.p variants={FADE_SLIDE_ITEM} className="text-lg opacity-80">Your Busiest Day</motion.p>
      <motion.h2 variants={FADE_SLIDE_ITEM} className="text-5xl font-bold">{dayOfWeek}</motion.h2>
      <motion.p variants={FADE_SLIDE_ITEM} className="text-xl opacity-70">{date}</motion.p>
      <motion.div variants={FADE_SLIDE_ITEM} className="flex gap-6 text-sm">
        <span className="bg-white/10 rounded-full px-4 py-2">{hours.toFixed(1)} hours</span>
        <span className="bg-white/10 rounded-full px-4 py-2">{tasks} tasks</span>
      </motion.div>
      <motion.p variants={FADE_SLIDE_ITEM} className="text-sm opacity-60">
        Top project: {topProject}
      </motion.p>
    </motion.div>
  );
}
