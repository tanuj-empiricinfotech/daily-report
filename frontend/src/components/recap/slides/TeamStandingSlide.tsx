import { motion } from 'framer-motion';

interface TeamStandingSlideProps {
  rank: number;
  totalMembers: number;
  userHours: number;
  teamAvgHours: number;
  percentile: number;
}

const container = { show: { transition: { staggerChildren: 0.2 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export function TeamStandingSlide({ rank, totalMembers, userHours, teamAvgHours, percentile }: TeamStandingSlideProps) {
  const maxHours = Math.max(userHours, teamAvgHours);

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-md mx-auto gap-6 w-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.p variants={item} className="text-lg opacity-80">Team Standing</motion.p>
      <motion.h2 variants={item} className="text-7xl font-bold">#{rank}</motion.h2>
      <motion.p variants={item} className="text-sm opacity-60">
        out of {totalMembers} members
      </motion.p>
      <motion.div variants={item} className="bg-white/10 rounded-full px-5 py-2 text-sm font-medium">
        Top {percentile}%
      </motion.div>
      <motion.div variants={item} className="w-full space-y-3 text-sm">
        <div>
          <div className="flex justify-between mb-1">
            <span>You</span>
            <span>{userHours.toFixed(1)}h</span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/80"
              initial={{ width: 0 }}
              animate={{ width: `${(userHours / maxHours) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span>Team avg</span>
            <span>{teamAvgHours.toFixed(1)}h</span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/50"
              initial={{ width: 0 }}
              animate={{ width: `${(teamAvgHours / maxHours) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
