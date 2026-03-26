'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { JobMatch } from '@/types';
import { cn, getScoreColor } from '@/lib/utils';

interface Props {
  match: JobMatch;
}

export default function JobMatchCard({ match }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('card border transition-all')}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Job Info */}
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">{match.title}</h3>
          <p className="text-gray-400 text-sm">{match.company} · {match.location}</p>
          <p className="text-gray-500 text-sm mt-2 italic">"{match.reason}"</p>
        </div>

        {/* Right: Score */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className={`text-4xl font-black ${getScoreColor(match.match_score)}`}>
            {match.match_score}
          </span>
          <span className="text-xs text-gray-500 font-medium">{match.verdict}</span>
        </div>
      </div>

      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {expanded ? 'Show less' : 'See skill breakdown'}
      </button>

      {expanded && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-emerald-400 text-xs font-semibold mb-2 uppercase tracking-wide">Matched Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {match.matched_skills.map((s) => (
                <span key={s} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-red-400 text-xs font-semibold mb-2 uppercase tracking-wide">Missing Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {match.missing_skills.map((s) => (
                <span key={s} className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apply CTA */}
      <div className="mt-4 flex justify-end">
        <a
          href={match.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          Apply Now <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
