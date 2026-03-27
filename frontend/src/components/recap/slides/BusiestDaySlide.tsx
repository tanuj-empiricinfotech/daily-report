import { motion } from 'framer-motion';

interface BusiestDaySlideProps {
  date: string;
  dayOfWeek: string;
  hours: number;
  tasks: number;
  topProject: string;
}

const container = { show: { transition: { staggerChildren: 0.2 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export function BusiestDaySlide({ date, dayOfWeek, hours, tasks, topProject }: BusiestDaySlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-lg mx-auto gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.p variants={item} className="text-lg opacity-80">Your Busiest Day</motion.p>
      <motion.h2 variants={item} className="text-5xl font-bold">{dayOfWeek}</motion.h2>
      <motion.p variants={item} className="text-xl opacity-70">{date}</motion.p>
      <motion.div variants={item} className="flex gap-6 text-sm">
        <span className="bg-white/10 rounded-full px-4 py-2">{hours.toFixed(1)} hours</span>
        <span className="bg-white/10 rounded-full px-4 py-2">{tasks} tasks</span>
      </motion.div>
      <motion.p variants={item} className="text-sm opacity-60">
        Top project: {topProject}
      </motion.p>
    </motion.div>
  );
}
