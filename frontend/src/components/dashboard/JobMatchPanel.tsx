'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, ExternalLink,
  MapPin, Building2, TrendingUp, AlertTriangle,
  Briefcase, SlidersHorizontal,
} from 'lucide-react';
import type { JobMatch } from '@/types';
import ScoreRing from '@/components/ui/ScoreRing';
import ProgressBar from '@/components/ui/ProgressBar';
import { getScoreBadgeClass, getScoreLabel, getScoreRingColor } from '@/lib/utils';

interface Props {
  matches: JobMatch[];
}

type Filter = 'all' | 'strong' | 'good' | 'partial';

const FILTERS: { id: Filter; label: string; min?: number; max?: number }[] = [
  { id: 'all',     label: 'All' },
  { id: 'strong',  label: 'Strong 80+',  min: 80  },
  { id: 'good',    label: 'Good 65–79',  min: 65, max: 80 },
  { id: 'partial', label: 'Partial <65', max: 65  },
];

export default function JobMatchPanel({ matches }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(0);
  const [filter, setFilter]         = useState<Filter>('all');

  const filtered = matches.filter((m) => {
    const f = FILTERS.find(f => f.id === filter)!;
    if (f.min !== undefined && m.match_score < f.min)  return false;
    if (f.max !== undefined && m.match_score >= f.max) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header row ─────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" style={{ color: 'var(--brand-light)' }} />
          <span className="font-semibold text-white text-sm">
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1" style={{ color: 'var(--text-muted)' }} />
          {FILTERS.map((f) => {
            const count = f.id === 'all' ? matches.length
              : matches.filter(m =>
                  (f.min === undefined || m.match_score >= f.min) &&
                  (f.max === undefined || m.match_score <  f.max)
                ).length;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150"
                style={filter === f.id ? {
                  background: 'var(--brand)',
                  color: '#fff',
                  boxShadow: '0 0 12px rgba(99,102,241,0.35)',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'var(--text-secondary)',
                }}>
                {f.label} <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="rounded-2xl py-16 text-center"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No jobs match this filter.</p>
        </div>
      )}

      {/* ── Cards ───────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {filtered.map((match, i) => (
          <motion.div key={`${match.company}-${match.title}`}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16,1,0.3,1] }}>
            <JobCard
              match={match}
              index={i}
              isExpanded={expandedId === i}
              onToggle={() => setExpandedId(expandedId === i ? null : i)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── Job Card ───────────────────────────────────────────────── */
function JobCard({ match, index, isExpanded, onToggle }: {
  match: JobMatch; index: number; isExpanded: boolean; onToggle: () => void;
}) {
  const ringColor = getScoreRingColor(match.match_score);

  return (
    <motion.div
      whileHover={!isExpanded ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: isExpanded
          ? 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, var(--surface-2) 100%)'
          : 'var(--surface-2)',
        border: isExpanded
          ? '1px solid rgba(99,102,241,0.2)'
          : '1px solid var(--border)',
        boxShadow: isExpanded
          ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1)'
          : 'var(--shadow-card)',
      }}>

      {/* ── Card Header ─────────────────────────────────────── */}
      <div className="flex items-start gap-4 p-5 cursor-pointer select-none" onClick={onToggle}>
        {/* Score Ring */}
        <ScoreRing score={match.match_score} size={76} strokeWidth={5} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-white font-semibold text-[15px] leading-snug">{match.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {match.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {match.location}
                </span>
                {/* Live data badges */}
                {match.work_mode && (
                  <span className="badge-blue badge capitalize">{match.work_mode}</span>
                )}
                {match.salary_raw && (
                  <span className="badge-yellow badge">{match.salary_raw}</span>
                )}
                {match.source && (
                  <span className="badge-gray badge capitalize">{match.source}</span>
                )}
              </div>
            </div>
            <span className={`${getScoreBadgeClass(match.match_score)} badge shrink-0`}>
              {getScoreLabel(match.match_score)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <ProgressBar score={match.match_score} showLabel />
          </div>

          {/* Reason */}
          <p className="text-xs mt-2 italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            "{match.reason}"
          </p>
        </div>

        {/* Toggle chevron */}
        <button className="shrink-0 mt-1 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{ color: isExpanded ? 'var(--brand-light)' : 'var(--text-muted)',
                   background: isExpanded ? 'rgba(99,102,241,0.12)' : 'transparent' }}>
          {isExpanded
            ? <ChevronUp  className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Expanded Panel ───────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
            style={{ overflow: 'hidden' }}>
            <div className="px-5 pb-5 flex flex-col gap-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="pt-4 grid sm:grid-cols-2 gap-4">

                {/* Matched Skills */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <p className="section-label flex items-center gap-1.5 mb-3" style={{ color: '#10b981' }}>
                    <TrendingUp className="w-3 h-3" /> Matched Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.matched_skills.map((s) => (
                      <span key={s} className="badge-green badge">{s}</span>
                    ))}
                  </div>
                </div>

                {/* Skill Gaps */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <p className="section-label flex items-center gap-1.5 mb-3" style={{ color: '#f87171' }}>
                    <AlertTriangle className="w-3 h-3" /> Skill Gaps
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.missing_skills.length > 0
                      ? match.missing_skills.map((s) => <span key={s} className="badge-red badge">{s}</span>)
                      : <span className="text-emerald-400 text-xs font-semibold">No gaps — perfect match!</span>
                    }
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Rank #{index + 1} · via {match.source || 'job board'}
                    {match.date_posted ? ` · posted ${match.date_posted}` : ''}
                  </p>
                  {match.company_domain && (
                    <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--brand-light)' }}>
                      {match.company_domain} company
                    </p>
                  )}
                </div>
                {match.job_url && match.job_url !== '#' ? (
                  <motion.a
                    href={match.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary text-sm py-2 px-5">
                    Apply Now <ExternalLink className="w-3.5 h-3.5" />
                  </motion.a>
                ) : (
                  <span className="text-xs px-4 py-2 rounded-xl opacity-40"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                    Link unavailable
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
