'use client';

import { getScoreBarColor } from '@/lib/utils';

interface Props {
  score: number;
  showLabel?: boolean;
}

export default function ProgressBar({ score, showLabel = false }: Props) {
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Match</span>
          <span className="font-semibold">{score}%</span>
        </div>
      )}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getScoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
