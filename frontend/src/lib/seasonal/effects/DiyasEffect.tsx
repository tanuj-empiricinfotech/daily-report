import { useState, useEffect } from 'react';

const DIYA_COUNT = 12;
const DURATION_MS = 8000;

export function DiyasEffect() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const diyas = Array.from({ length: DIYA_COUNT }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 3,
    size: 20 + Math.random() * 16,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {diyas.map((d) => (
        <div
          key={d.id}
          className="absolute"
          style={{
            left: `${d.x}%`,
            bottom: '-40px',
            fontSize: `${d.size}px`,
            animation: `seasonal-float ${d.duration}s ease-in-out ${d.delay}s forwards`,
          }}
        >
          🪔
        </div>
      ))}
      <style>{`
        @keyframes seasonal-float {
          0% { transform: translateY(0); opacity: 0.8; }
          50% { opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
