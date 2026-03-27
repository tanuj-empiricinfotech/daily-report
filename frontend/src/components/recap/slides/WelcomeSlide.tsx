import { motion } from 'framer-motion';

interface WelcomeSlideProps {
  userName: string;
  monthName: string;
  year: number;
  totalLogs: number;
}

const container = { show: { transition: { staggerChildren: 0.2 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export function WelcomeSlide({ userName, monthName, year, totalLogs }: WelcomeSlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-lg mx-auto gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.p variants={item} className="text-lg opacity-80">
        Hey {userName}!
      </motion.p>
      <motion.h1 variants={item} className="text-5xl font-bold leading-tight">
        Your {monthName} {year} Recap
      </motion.h1>
      <motion.p variants={item} className="text-xl opacity-70">
        {totalLogs} logs recorded this month
      </motion.p>
    </motion.div>
  );
}
