import { motion } from 'framer-motion';
import { STAGGER_CONTAINER, FADE_SLIDE_ITEM } from '../motionVariants';

interface WelcomeSlideProps {
  userName: string;
  monthName: string;
  year: number;
  totalLogs: number;
}

export function WelcomeSlide({ userName, monthName, year, totalLogs }: WelcomeSlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-lg mx-auto gap-6"
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
    >
      <motion.p variants={FADE_SLIDE_ITEM} className="text-lg opacity-80">
        Hey {userName}!
      </motion.p>
      <motion.h1 variants={FADE_SLIDE_ITEM} className="text-5xl font-bold leading-tight">
        Your {monthName} {year} Recap
      </motion.h1>
      <motion.p variants={FADE_SLIDE_ITEM} className="text-xl opacity-70">
        {totalLogs} logs recorded this month
      </motion.p>
    </motion.div>
  );
}
