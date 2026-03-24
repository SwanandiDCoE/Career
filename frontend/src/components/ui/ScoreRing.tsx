'use client';

import { useEffect, useRef } from 'react';
import { getScoreColor, getScoreRingColor } from '@/lib/utils';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export default function ScoreRing({ score, size = 80, strokeWidth = 6, animate = true }: Props) {
  const circleRef = useRef<SVGCircleElement>(null);
  const r = (size / 2) - (strokeWidth / 2) - 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  useEffect(() => {
    if (!animate || !circleRef.current) return;
    // Start at empty, then spring to target
    circleRef.current.style.strokeDashoffset = String(circumference);
    const frame = requestAnimationFrame(() => {
      if (!circleRef.current) return;
      circleRef.current.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s';
      circleRef.current.style.strokeDashoffset = String(offset);
    });
    return () => cancelAnimationFrame(frame);
  }, [score, circumference, offset, animate]);

  const ringColor  = getScoreRingColor(score);
  const textColor  = getScoreColor(score);
  const glowColor  = ringColor;

  // Track glow: faint ring behind active ring
  const trackColor = 'rgba(255,255,255,0.05)';

  return (
    <div className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90"
        style={{ filter: `drop-shadow(0 0 6px ${glowColor}50)` }}>
        {/* Background track */}
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Filled arc */}
        <circle
          ref={circleRef}
          cx={center} cy={center} r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          style={{ transition: animate ? undefined : 'none' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-black leading-none tabular-nums ${textColor}`}
          style={{ fontSize: size * 0.24 }}>
          {score}
        </span>
        <span className="font-medium leading-none mt-0.5"
          style={{ fontSize: size * 0.13, color: 'var(--text-muted)' }}>
          /100
        </span>
      </div>
    </div>
  );
}
