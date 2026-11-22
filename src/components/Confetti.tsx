import { useMemo, type CSSProperties } from 'react';

const COLORS = ['var(--gold)', 'var(--cream-light)', 'var(--gold-deep)', 'var(--crimson-bright)'];

/** 1등 공개용 금빛 종이 조각 (촬영 시 깜빡임이 없도록 느리고 큰 조각) */
export default function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 3.8 + Math.random() * 2.4,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 240,
        width: 14 + Math.random() * 14,
        color: COLORS[index % COLORS.length],
      })),
    [count],
  );

  return (
    <div className="confetti" aria-hidden>
      {pieces.map((piece, index) => (
        <span
          key={index}
          style={
            {
              left: `${piece.left}%`,
              width: piece.width,
              height: piece.width * 0.45,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              '--rotate': `${piece.rotate}deg`,
              '--drift': `${piece.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
