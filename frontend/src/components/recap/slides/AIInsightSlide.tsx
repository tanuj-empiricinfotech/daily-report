import { motion } from 'framer-motion';

interface AIInsightSlideProps {
  insight: string;
  highlights: string[];
  emoji: string;
}

const container = { show: { transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export function AIInsightSlide({ insight, highlights, emoji }: AIInsightSlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center text-white max-w-md mx-auto gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex items-center gap-2 text-lg opacity-80">
        <span>{emoji}</span>
        <span>AI Insight</span>
        <span>✨</span>
      </motion.div>
      <motion.p variants={item} className="text-2xl font-semibold leading-relaxed">
        {insight}
      </motion.p>
      {highlights.length > 0 && (
        <motion.ul variants={item} className="text-left text-sm opacity-80 space-y-2">
          {highlights.map((highlight, index) => (
            <motion.li key={index} variants={item} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">•</span>
              <span>{highlight}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
}
