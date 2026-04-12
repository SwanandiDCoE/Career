'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, BookOpen,
  Code2, FileEdit, MessageSquare, Zap,
  ArrowRight, Clock, TrendingUp, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ScoreRing from '@/components/ui/ScoreRing';
import { generateStrategy } from '@/lib/api';
import { DUMMY_STRATEGY } from '@/lib/dummy-data';
import type {
  JobMatch, ApplyStrategy as ApplyStrategyType,
  ImprovementAction, MissingSkill, InterviewTip,
  ApplicationPriority,
} from '@/types';

interface Props { matches: JobMatch[]; resumeText?: string; isDemo?: boolean; }

/* ── Config maps ──────────────────────────────────────────────── */
const PRIORITY = {
  apply_now: {
    label: 'Apply Now',
    reason: "You're well-qualified — don't wait.",
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    icon: Rocket,
  },
  apply_after_improvements: {
    label: 'Apply After Improvements',
    reason: 'A few targeted changes will significantly boost your chances.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    icon: Clock,
  },
  long_term_goal: {
    label: 'Long-Term Goal',
    reason: 'Focus on closing skill gaps before applying.',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.2)',
    icon: TrendingUp,
  },
} satisfies Record<ApplicationPriority, object>;

const ACTION_TYPE = {
  resume_edit:      { icon: FileEdit, label: 'Resume Edit',    color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.15)' },
  skill_to_learn:   { icon: BookOpen, label: 'Learn This',     color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.15)'  },
  project_to_build: { icon: Code2,    label: 'Build a Project', color: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.15)' },
};

const IMPORTANCE = {
  critical:       { label: 'Critical',      color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)' },
  important:      { label: 'Important',     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)'  },
  'nice-to-have': { label: 'Nice to Have', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)'},
};

/* ── Framer variants ──────────────────────────────────────────── */
const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.16,1,0.3,1] } },
};

/* ═══════════════════════════════════════════════════════════════ */

export default function ApplyStrategy({ matches, resumeText, isDemo }: Props) {
  const [selected, setSelected]   = useState<JobMatch>(matches[0]);
  const [strategy, setStrategy]   = useState<ApplyStrategyType | null>(null);
  const [loading, setLoading]     = useState(false);
  const [openTip, setOpenTip]     = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setStrategy(null);
    try {
      if (resumeText) {
        const result = await generateStrategy(resumeText, selected);
        setStrategy(result);
      } else {
        await new Promise(r => setTimeout(r, 2000));
        setStrategy({
          ...DUMMY_STRATEGY,
          match_score:   selected.match_score,
          match_summary: `Your profile is a ${selected.match_score >= 80 ? 'strong' : 'partial'} fit for ${selected.title} at ${selected.company}. ${DUMMY_STRATEGY.match_summary.split('.').slice(1).join('.').trim()}`,
        });
      }
      toast.success('Strategy ready!');
    } catch {
      toast.error('Generation failed — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl flex items-start gap-3 sm:gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 100%)',
                 border: '1px solid rgba(99,102,241,0.18)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}>
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-[15px] flex items-center gap-2">
            Apply Strategy Engine
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={isDemo
                ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                : { background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
              {isDemo ? 'Demo' : 'AI'}
            </span>
          </h2>
          <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Get a precise action plan: exact resume edits, skills to learn,
            projects to build, and interview prep — specific to this company.
          </p>
        </div>
      </div>

      {/* ── Job Selector ────────────────────────────────────── */}
      <div className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <p className="section-label">Select target job</p>
        {matches.map((m, i) => {
          const isActive = selected.title === m.title && selected.company === m.company;
          return (
            <motion.button key={i} onClick={() => { setSelected(m); setStrategy(null); }}
              whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
              className="flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 w-full"
              style={isActive ? {
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
              } : {
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
              <ScoreRing score={m.match_score} size={44} strokeWidth={4} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{m.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.company} · {m.location}</p>
              </div>
              {isActive && (
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                  Targeting
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Generate Button ──────────────────────────────────── */}
      <motion.button onClick={handleGenerate} disabled={loading}
        whileHover={!loading ? { scale: 1.01 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
        className="btn-primary w-full py-3.5 text-[15px] rounded-xl disabled:opacity-50">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {isDemo ? 'Loading sample strategy…' : 'Generating strategy…'}</>
          : strategy
            ? <><Sparkles className="w-4 h-4" /> Regenerate for {selected.company}</>
            : <><Zap className="w-4 h-4" /> {isDemo ? 'See sample strategy for' : 'Generate Strategy for'} {selected.company}</>
        }
      </motion.button>

      {/* Loading pipeline indicator */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
            className="rounded-2xl p-4 flex flex-col gap-2.5"
            style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
            {[
              'Analysing your resume against the job description…',
              'Identifying specific gaps and strengths…',
              'Crafting targeted improvement actions…',
              'Preparing company-specific interview questions…',
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ color: '#818cf8' }} />
                {step}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          STRATEGY OUTPUT
          ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {strategy && (
          <motion.div variants={container} initial="hidden" animate="show"
            className="flex flex-col gap-5">

            {/* ── 1. Score + Summary + Priority ──────────────── */}
            <motion.div variants={item}
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-4">
                <ScoreRing score={strategy.match_score} size={72} strokeWidth={5} />
                <div className="flex-1 min-w-0">
                  <p className="section-label">Match Analysis</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {strategy.match_summary}
                  </p>
                </div>
              </div>

              {/* Priority banner */}
              {(() => {
                const p = PRIORITY[strategy.application_priority];
                return (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl"
                    style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                    <p.icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: p.color }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: p.color }}>{p.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{strategy.priority_reason}</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>

            {/* ── 2. Strengths ─────────────────────────────────── */}
            <motion.div variants={item}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: '#10b981' }}>
                <CheckCircle2 className="w-4 h-4" /> Your Strengths for This Role
              </h3>
              <ul className="flex flex-col gap-2.5">
                {strategy.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* ── 3. Missing Skills ────────────────────────────── */}
            <motion.div variants={item}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#f87171' }}>
                <AlertTriangle className="w-4 h-4" /> Skill Gaps
              </h3>
              <div className="flex flex-col gap-3">
                {strategy.missing_skills.map((skill, i) => {
                  const imp = IMPORTANCE[skill.importance];
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5"
                        style={{ background: imp.bg, border: `1px solid ${imp.border}`, color: imp.color }}>
                        {imp.label}
                      </span>
                      <div>
                        <p className="text-white text-sm font-semibold">{skill.skill}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{skill.context}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── 4. Action Plan ───────────────────────────────── */}
            <motion.div variants={item}
              className="rounded-2xl p-5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-white">
                <ArrowRight className="w-4 h-4" style={{ color: 'var(--brand-light)' }} />
                Your Action Plan
                <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {strategy.improvement_actions.length} actions
                </span>
              </h3>
              <div className="flex flex-col gap-3">
                {strategy.improvement_actions.map((action, i) => (
                  <ActionCard key={i} action={action} index={i} />
                ))}
              </div>
            </motion.div>

            {/* ── 5. Interview Tips ─────────────────────────────── */}
            <motion.div variants={item}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#c084fc' }}>
                <MessageSquare className="w-4 h-4" />
                Interview Prep
                <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                  — likely questions for {selected.company}
                </span>
              </h3>
              <div className="flex flex-col gap-2.5">
                {strategy.interview_tips.map((tip, i) => (
                  <InterviewCard
                    key={i} tip={tip}
                    isOpen={openTip === i}
                    onToggle={() => setOpenTip(openTip === i ? null : i)}
                  />
                ))}
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Action Card ────────────────────────────────────────────── */
function ActionCard({ action, index }: { action: ImprovementAction; index: number }) {
  const cfg = ACTION_TYPE[action.type];
  return (
    <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }}
      className="flex gap-3.5 p-4 rounded-xl"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {/* Icon + number */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
          <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <span className="text-[10px] font-black tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {String(index + 1).padStart(2,'0')}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          {action.impact === 'high' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}>
              High Impact
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {action.action}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Interview Card ─────────────────────────────────────────── */
function InterviewCard({ tip, isOpen, onToggle }: {
  tip: InterviewTip; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200"
      style={isOpen
        ? { background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }
        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Question row */}
      <button className="w-full flex items-start gap-3 p-3.5 text-left" onClick={onToggle}>
        <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#c084fc' }} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-snug">{tip.likely_question}</p>
          {!isOpen && (
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{tip.why_they_ask}</p>
          )}
        </div>
        <span className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded answer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }} style={{ overflow: 'hidden' }}>
            <div className="px-3.5 pb-3.5 flex flex-col gap-2.5">
              {/* Why they ask */}
              <div className="p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Why they ask
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tip.why_they_ask}</p>
              </div>
              {/* How to answer */}
              <div className="p-3 rounded-lg"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#c084fc' }}>
                  How to answer
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>{tip.how_to_answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
