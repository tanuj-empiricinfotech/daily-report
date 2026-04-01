import { useState, useEffect } from 'react';

const COLORS = ['#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#06b6d4'];
const SPLASH_COUNT = 15;
const DURATION_MS = 6000;

export function ColorSplashEffect() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const splashes = Array.from({ length: SPLASH_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 3,
    size: 30 + Math.random() * 60,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {splashes.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            opacity: 0,
            filter: 'blur(8px)',
            animation: `seasonal-splash 1.5s ease-out ${s.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes seasonal-splash {
          0% { transform: scale(0); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
