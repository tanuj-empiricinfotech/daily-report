import { motion } from 'framer-motion';
import { STAGGER_CONTAINER } from '../motionVariants';

interface TopProjectsSlideProps {
  projects: Array<{ name: string; hours: number; percentage: number }>;
}

const TOP_PROJECTS_CONTAINER = {
  ...STAGGER_CONTAINER,
  show: { transition: { staggerChildren: 0.15 } },
};

const TOP_PROJECTS_ITEM = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function TopProjectsSlide({ projects }: TopProjectsSlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-white max-w-md mx-auto gap-6 w-full"
      variants={TOP_PROJECTS_CONTAINER}
      initial="hidden"
      animate="show"
    >
      <motion.h2 variants={TOP_PROJECTS_ITEM} className="text-3xl font-bold text-center">
        Your Top Projects
      </motion.h2>
      <div className="w-full flex flex-col gap-4">
        {projects.map((project) => (
          <motion.div key={project.name} variants={TOP_PROJECTS_ITEM} className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{project.name}</span>
              <span className="opacity-70">{project.hours.toFixed(1)}h ({project.percentage}%)</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-white/80"
                initial={{ width: 0 }}
                animate={{ width: `${project.percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
