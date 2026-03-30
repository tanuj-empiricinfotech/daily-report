import { motion } from 'framer-motion';
import { STAGGER_CONTAINER } from '../motionVariants';

interface AIInsightSlideProps {
  insight: string;
  highlights: string[];
  emoji: string;
}

const AI_INSIGHT_CONTAINER = {
  ...STAGGER_CONTAINER,
  show: { transition: { staggerChildren: 0.15 } },
};

const AI_INSIGHT_ITEM = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function AIInsightSlide({ insight, highlights, emoji }: AIInsightSlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-md mx-auto gap-6"
      variants={AI_INSIGHT_CONTAINER}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={AI_INSIGHT_ITEM} className="flex items-center gap-2 text-lg opacity-80">
        <span>{emoji}</span>
        <span>AI Insight</span>
        <span>✨</span>
      </motion.div>
      <motion.p variants={AI_INSIGHT_ITEM} className="text-2xl font-semibold leading-relaxed">
        {insight}
      </motion.p>
      {highlights.length > 0 && (
        <motion.ul variants={AI_INSIGHT_ITEM} className="text-left text-sm opacity-80 space-y-2">
          {highlights.map((highlight, index) => (
            <motion.li key={index} variants={AI_INSIGHT_ITEM} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">•</span>
              <span>{highlight}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
}
