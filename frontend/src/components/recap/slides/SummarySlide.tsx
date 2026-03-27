import { motion } from 'framer-motion';

interface SummarySlideProps {
  totalHours: number;
  topProject: string;
  daysLogged: number;
  funFact: string;
}

const container = { show: { transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export function SummarySlide({ totalHours, topProject, daysLogged, funFact }: SummarySlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-md mx-auto gap-6 w-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h2 variants={item} className="text-3xl font-bold">Month in Review</motion.h2>
      <motion.div variants={item} className="grid grid-cols-3 gap-4 w-full">
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-3xl font-bold">{totalHours.toFixed(0)}</p>
          <p className="text-xs opacity-70 mt-1">Hours</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-3xl font-bold">{daysLogged}</p>
          <p className="text-xs opacity-70 mt-1">Days</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-sm font-bold leading-tight">{topProject}</p>
          <p className="text-xs opacity-70 mt-1">Top Project</p>
        </div>
      </motion.div>
      <motion.div variants={item} className="bg-white/10 rounded-2xl p-5 w-full">
        <p className="text-xs uppercase tracking-wide opacity-60 mb-2">Fun Fact</p>
        <p className="text-sm leading-relaxed">{funFact}</p>
      </motion.div>
    </motion.div>
  );
}
