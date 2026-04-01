import { useState, useEffect } from 'react';

const FLAKE_COUNT = 30;
const DURATION_MS = 10000;

export function SnowfallEffect() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const flakes = Array.from({ length: FLAKE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 4,
    size: 4 + Math.random() * 8,
    opacity: 0.4 + Math.random() * 0.6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {flakes.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${f.x}%`,
            top: '-10px',
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            animation: `seasonal-snow ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes seasonal-snow {
          0% { transform: translateY(-10px) translateX(0); }
          50% { transform: translateY(50vh) translateX(20px); }
          100% { transform: translateY(100vh) translateX(-10px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
