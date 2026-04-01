import { useState, useEffect } from 'react';

const COLORS = ['#f43f5e', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#10b981'];
const BURST_COUNT = 5;
const PARTICLES_PER_BURST = 12;
const DURATION_MS = 5000;

interface Particle {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  delay: number;
}

export function FireworksEffect() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const particles: Particle[] = [];
  for (let bi = 0; bi < BURST_COUNT; bi++) {
    const cx = 15 + Math.random() * 70;
    const cy = 15 + Math.random() * 50;
    const color = COLORS[bi % COLORS.length];
    const delay = bi * 0.8;
    for (let pi = 0; pi < PARTICLES_PER_BURST; pi++) {
      const angle = (pi / PARTICLES_PER_BURST) * 2 * Math.PI;
      const dist = 40 + Math.random() * 60;
      particles.push({
        id: `${bi}-${pi}`,
        x: cx,
        y: cy,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        color,
        delay,
      });
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: '5px',
            height: '5px',
            backgroundColor: p.color,
            animation: `seasonal-fw-${p.id.replace('-', '')} 0.8s ease-out ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{
        particles.map((p) => `
          @keyframes seasonal-fw-${p.id.replace('-', '')} {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(${p.dx}px, ${p.dy}px) scale(0); opacity: 0; }
          }
        `).join('')
      }</style>
    </div>
  );
}
