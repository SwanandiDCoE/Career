'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, MapPin, Building2, ChevronDown, ChevronUp,
  TrendingUp, AlertCircle, Sparkles, Search, Wifi, Star,
  Target, Compass, ChevronRight, Mail, FileEdit, MessageSquare,
  Loader2, Check, Copy, BookOpen, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { JobMatch, ResumeProfile, ApplyStrategy } from '@/types';
import { generateColdEmail, generateStrategy } from '@/lib/api';
import { DUMMY_COLD_EMAIL, DUMMY_STRATEGY } from '@/lib/dummy-data';

interface Props {
  matches: JobMatch[];
  profile: ResumeProfile;
  resumeText?: string;
  isDemo: boolean;
  isApplied: (match: JobMatch) => boolean;
  toggleApplied: (match: JobMatch) => void;
}

/* ── Tier thresholds ───────────────────────────────────────────── */
const TIER1_COUNT = 5;
const TIER2_COUNT = 15;

/* ── Learning resource links ────────────────────────────────────── */
const LEARNING_LINKS: Record<string, string> = {
  'TypeScript': 'https://www.typescriptlang.org/docs/handbook/',
  'Python': 'https://docs.python.org/3/tutorial/',
  'Go': 'https://go.dev/tour/',
  'Rust': 'https://doc.rust-lang.org/book/',
  'Java': 'https://dev.java/learn/',
  'Kotlin': 'https://kotlinlang.org/docs/getting-started.html',
  'React': 'https://react.dev/learn',
  'Next.js': 'https://nextjs.org/docs',
  'Vue': 'https://vuejs.org/guide/introduction.html',
  'Angular': 'https://angular.io/guide/quickstart',
  'Node.js': 'https://nodejs.dev/en/learn/',
  'Docker': 'https://docs.docker.com/get-started/',
  'Kubernetes': 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
  'AWS': 'https://aws.amazon.com/getting-started/',
  'GCP': 'https://cloud.google.com/docs',
  'Azure': 'https://learn.microsoft.com/en-us/azure/',
  'GitHub Actions': 'https://docs.github.com/en/actions',
  'Terraform': 'https://developer.hashicorp.com/terraform/tutorials',
  'PostgreSQL': 'https://www.postgresql.org/docs/current/tutorial.html',
  'MongoDB': 'https://www.mongodb.com/docs/manual/tutorial/',
  'Redis': 'https://redis.io/docs/getting-started/',
  'GraphQL': 'https://graphql.org/learn/',
  'Machine Learning': 'https://www.coursera.org/learn/machine-learning',
  'TensorFlow': 'https://www.tensorflow.org/tutorials',
  'PyTorch': 'https://pytorch.org/tutorials/',
  'Jest': 'https://jestjs.io/docs/getting-started',
  'Cypress': 'https://docs.cypress.io/guides/getting-started/installing-cypress',
  'Playwright': 'https://playwright.dev/docs/intro',
  'Storybook': 'https://storybook.js.org/docs/get-started',
  'Tailwind CSS': 'https://tailwindcss.com/docs/installation',
  'System Design': 'https://github.com/donnemartin/system-design-primer',
  'Data Structures': 'https://neetcode.io/',
  'Algorithms': 'https://leetcode.com/',
  'CI/CD': 'https://docs.github.com/en/actions',
  'gRPC': 'https://grpc.io/docs/what-is-grpc/introduction/',
  'Elasticsearch': 'https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html',
};

function getLearningLink(skill: string): string {
  return (
    LEARNING_LINKS[skill] ||
    `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}+tutorial`
  );
}

/* ── Verdict logic ─────────────────────────────────────────────── */
function getVerdict(score: number, missingSkills: string[]) {
  const missing = missingSkills.length;
  if (score >= 80 && missing <= 2)
    return { emoji: '🟢', text: 'Apply today. You\'re ready.', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' };
  if (score >= 60 && missing <= 5) {
    const topSkill = missingSkills[0];
    return {
      emoji: '🟡',
      text: topSkill ? `Apply in 2 weeks. Learn ${topSkill} first.` : 'Apply after a few improvements.',
      color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)',
    };
  }
  return { emoji: '🔴', text: 'Better matches exist above — skip for now.', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' };
}

/* ── Score color ────────────────────────────────────────────────── */
function getScoreColor(score: number) {
  if (score >= 80) return '#34d399';
  if (score >= 65) return '#60a5fa';
  if (score >= 45) return '#f59e0b';
  return '#94a3b8';
}

/* ── Domain badge style ─────────────────────────────────────────── */
const DOMAIN_STYLES: Record<string, { background: string; color: string; border: string }> = {
  fintech:    { background: 'rgba(96,165,250,0.1)',  color: '#93c5fd', border: '1px solid rgba(96,165,250,0.2)'  },
  'AI/ML':    { background: 'rgba(167,139,250,0.1)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.2)' },
  SaaS:       { background: 'rgba(52,211,153,0.1)',  color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.2)'  },
  healthtech: { background: 'rgba(248,113,113,0.1)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.2)' },
  edtech:     { background: 'rgba(251,191,36,0.1)',  color: '#fcd34d', border: '1px solid rgba(251,191,36,0.2)'  },
  ecommerce:  { background: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)'  },
  devtools:   { background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' },
  logistics:  { background: 'rgba(148,163,184,0.1)', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.2)' },
};
function getDomainStyle(domain: string) {
  return DOMAIN_STYLES[domain] || { background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' };
}

/* ── Score ring ─────────────────────────────────────────────────── */
function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = getScoreColor(score);
  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-sm font-black leading-none" style={{ color }}>{score}</span>
        <span className="text-[9px] font-bold" style={{ color: color + '99' }}>%</span>
      </div>
    </div>
  );
}

/* ── Skills Gap Banner ──────────────────────────────────────────── */
function SkillsGapBanner({ gaps, totalJobs }: {
  gaps: { skill: string; count: number }[];
  totalJobs: number;
}) {
  if (gaps.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <BookOpen className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
        </div>
        <p className="text-sm font-semibold text-white">
          Close these gaps to unlock more top matches
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {gaps.map(({ skill, count }) => (
          <div key={skill} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(248,113,113,0.08)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.15)' }}>
                {skill}
              </span>
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                missing in {count}/{totalJobs} top matches
              </span>
            </div>
            <a
              href={getLearningLink(skill)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80"
              style={{ color: '#818cf8' }}
            >
              Learn <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Contextual Action Panel ────────────────────────────────────── */
type ContextAction = 'email' | 'tailor' | 'interview';

function ContextualPanel({ match, profile, resumeText, isDemo }: {
  match: JobMatch; profile: ResumeProfile; resumeText?: string; isDemo: boolean;
}) {
  const [active, setActive]               = useState<ContextAction | null>(null);
  const [loading, setLoading]             = useState(false);
  const [emailResult, setEmailResult]     = useState<string | null>(null);
  const [strategyResult, setStrategyResult] = useState<ApplyStrategy | null>(null);
  const [copied, setCopied]               = useState(false);

  const profileSummary = `${profile.name}, ${profile.experience_years} years of experience as ${profile.target_role}. Skills: ${profile.skills.join(', ')}.`;

  async function handleAction(action: ContextAction) {
    if (active === action) { setActive(null); return; }
    setActive(action);
    if (action === 'email' && emailResult) return;
    if ((action === 'tailor' || action === 'interview') && strategyResult) return;

    setLoading(true);
    try {
      if (action === 'email') {
        if (isDemo) {
          await new Promise(r => setTimeout(r, 1600));
          setEmailResult(DUMMY_COLD_EMAIL);
        } else {
          const data = await generateColdEmail(match, profileSummary);
          setEmailResult(data.email);
        }
      } else {
        if (isDemo || !resumeText) {
          await new Promise(r => setTimeout(r, 2000));
          setStrategyResult(DUMMY_STRATEGY as ApplyStrategy);
        } else {
          const data = await generateStrategy(resumeText, match);
          setStrategyResult(data);
        }
      }
    } catch {
      toast.error('Generation failed — try again.');
      setActive(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyEmail() {
    if (!emailResult) return;
    await navigator.clipboard.writeText(emailResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ACTIONS: { id: ContextAction; icon: React.ElementType; label: string; short: string; color: string; bg: string; border: string }[] = [
    { id: 'email',     icon: Mail,          label: 'Cold email',    short: 'Email',     color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
    { id: 'tailor',    icon: FileEdit,      label: 'Tailor resume', short: 'Tailor',    color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
    { id: 'interview', icon: MessageSquare, label: 'Interview prep',short: 'Interview', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)'  },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map(a => {
          const isActive = active === a.id;
          return (
            <button
              key={a.id}
              onClick={() => handleAction(a.id)}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-2.5 rounded-lg transition-all duration-150"
              style={isActive
                ? { background: a.bg, color: a.color, border: `1px solid ${a.border}` }
                : { background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              {loading && isActive
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <a.icon className="w-3 h-3 shrink-0" />}
              <span className="truncate">{a.short}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {active && !loading && (
          <motion.div
            key={active}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {active === 'email' && emailResult && (
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)' }}>
                <div className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(167,139,250,0.1)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>
                    Cold email for {match.company}
                  </span>
                  <button onClick={copyEmail}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(167,139,250,0.1)',
                             color: copied ? '#34d399' : '#a78bfa',
                             border: `1px solid ${copied ? 'rgba(52,211,153,0.2)' : 'rgba(167,139,250,0.2)'}` }}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap font-sans"
                  style={{ color: 'var(--text-secondary)' }}>{emailResult}</pre>
              </div>
            )}
            {active === 'tailor' && strategyResult && (
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)' }}>
                <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(96,165,250,0.1)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#60a5fa' }}>
                    Resume edits for {match.company}
                  </span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-2.5">
                  {strategyResult.improvement_actions.slice(0, 4).map((action, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="text-[10px] font-black mt-0.5 tabular-nums shrink-0"
                        style={{ color: 'var(--text-muted)' }}>{String(i+1).padStart(2,'0')}</span>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{action.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {active === 'interview' && strategyResult && (
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
                    Interview prep for {match.company}
                  </span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-3">
                  {strategyResult.interview_tips.slice(0, 3).map((tip, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-white">{tip.likely_question}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tip.how_to_answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Tier 1 Card ───────────────────────────────────────────────── */
function Tier1Card({ match, rank, isExpanded, onToggle, profile, resumeText, isDemo, isApplied, toggleApplied }: {
  match: JobMatch; rank: number; isExpanded: boolean; onToggle: () => void;
  profile: ResumeProfile; resumeText?: string; isDemo: boolean;
  isApplied: boolean; toggleApplied: () => void;
}) {
  const verdict = getVerdict(match.match_score, match.missing_skills);
  const scoreColor = getScoreColor(match.match_score);

  return (
    <motion.div layout className="rounded-2xl overflow-hidden relative"
      style={{
        background: isApplied
          ? 'linear-gradient(135deg, rgba(52,211,153,0.04) 0%, rgba(15,17,23,0.98) 50%)'
          : isExpanded
            ? 'linear-gradient(135deg, rgba(52,211,153,0.03) 0%, rgba(15,17,23,0.98) 50%)'
            : 'var(--surface-2)',
        border: isApplied
          ? '1px solid rgba(52,211,153,0.3)'
          : isExpanded ? '1px solid rgba(52,211,153,0.22)' : '1px solid rgba(52,211,153,0.12)',
        boxShadow: isExpanded ? '0 12px 40px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: `linear-gradient(180deg, ${scoreColor} 0%, ${scoreColor}40 100%)` }} />

      {/* ── Row 1: score ring + title info + collapse toggle ── */}
      <div className="pl-4 pr-4 pt-4 pb-0 flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>#{rank}</span>
          <ScoreRing score={match.match_score} size={52} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Verdict badge */}
          <div className="mb-1.5">
            <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-xl leading-snug"
              style={{ background: verdict.bg, color: verdict.color, border: `1px solid ${verdict.border}` }}>
              {verdict.emoji} {verdict.text}
            </span>
          </div>
          <h3 className="text-white font-bold text-base leading-snug">{match.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1"><Building2 className="w-3 h-3 shrink-0" />{match.company}</span>
            {match.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{match.location}</span>}
            {match.work_mode && (
              <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: match.work_mode === 'remote' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                         color: match.work_mode === 'remote' ? '#34d399' : 'var(--text-muted)',
                         border: `1px solid ${match.work_mode === 'remote' ? 'rgba(52,211,153,0.2)' : 'var(--border)'}` }}>
                {match.work_mode === 'remote' && <Wifi className="w-2.5 h-2.5 inline mr-0.5" />}
                {match.work_mode}
              </span>
            )}
            {match.salary_raw && <span className="font-semibold text-white/70">{match.salary_raw}</span>}
          </div>
          {match.matched_skills.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <TrendingUp className="w-3 h-3 shrink-0" style={{ color: '#34d399' }} />
              {match.matched_skills.slice(0, 5).map(s => (
                <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(52,211,153,0.08)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.15)' }}>
                  {s}
                </span>
              ))}
              {match.matched_skills.length > 5 && (
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{match.matched_skills.length - 5} more</span>
              )}
            </div>
          )}
        </div>

        {/* Collapse toggle — top right, never overlaps content */}
        <button onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 mt-0.5"
          style={{ color: isExpanded ? '#34d399' : 'var(--text-muted)', background: isExpanded ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)' }}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Row 2: action buttons — always own row, never overlaps ── */}
      <div className="px-4 pt-3 pb-4 flex items-center gap-2 flex-wrap">
        {isApplied && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
            <Check className="w-2.5 h-2.5" /> Applied
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); toggleApplied(); }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150"
          style={isApplied
            ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)' }
          }
        >
          {isApplied ? <Check className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {isApplied ? 'Mark unapplied' : 'Mark applied'}
        </button>
        {match.job_url && match.job_url !== '#' && (
          <motion.a
            href={match.job_url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl"
            style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
          >
            Apply Now <ExternalLink className="w-3 h-3" />
          </motion.a>
        )}
        <button onClick={onToggle}
          className="ml-auto flex items-center gap-1 text-[11px] font-semibold transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          {isExpanded ? <>Less <ChevronUp className="w-3 h-3" /></> : <>Details + AI tools <ChevronDown className="w-3 h-3" /></>}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-2 flex flex-col gap-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {match.reason && (
                <p className="text-xs leading-relaxed italic px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(52,211,153,0.05)', color: 'var(--text-secondary)', borderLeft: '2px solid rgba(52,211,153,0.4)' }}>
                  {match.reason}
                </p>
              )}
              {match.description && (
                <p className="text-xs leading-relaxed px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {match.description.slice(0, 200).trim()}{match.description.length > 200 ? '…' : ''}
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {match.matched_skills.length > 0 && (
                  <div className="p-3.5 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}>
                    <p className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: '#34d399' }}>
                      <TrendingUp className="w-3 h-3" /> You already have
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matched_skills.map(s => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.2)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-3.5 rounded-xl"
                  style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.12)' }}>
                  <p className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: '#f87171' }}>
                    <AlertCircle className="w-3 h-3" /> Worth picking up
                  </p>
                  {match.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_skills.map(s => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(248,113,113,0.08)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.2)' }}>{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold" style={{ color: '#34d399' }}>You cover all requirements.</p>
                  )}
                </div>
              </div>

              <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[11px] font-semibold mb-2.5" style={{ color: 'var(--text-muted)' }}>AI TOOLS FOR THIS JOB</p>
                <ContextualPanel match={match} profile={profile} resumeText={resumeText} isDemo={isDemo} />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {match.date_posted && <span>{match.date_posted}</span>}
                  {match.company_domain && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] capitalize"
                      style={getDomainStyle(match.company_domain)}>
                      {match.company_domain}
                    </span>
                  )}
                  {match.source && <span>via {match.source}</span>}
                </div>
                {match.job_url && match.job_url !== '#' && (
                  <a href={match.job_url} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5">
                    Apply Now <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Tier 2 Card ───────────────────────────────────────────────── */
function Tier2Card({ match, rank, isExpanded, onToggle, profile, resumeText, isDemo, isApplied, toggleApplied }: {
  match: JobMatch; rank: number; isExpanded: boolean; onToggle: () => void;
  profile: ResumeProfile; resumeText?: string; isDemo: boolean;
  isApplied: boolean; toggleApplied: () => void;
}) {
  const verdict = getVerdict(match.match_score, match.missing_skills);
  const scoreColor = getScoreColor(match.match_score);

  return (
    <motion.div layout className="rounded-xl overflow-hidden"
      style={{
        background: isApplied
          ? 'linear-gradient(135deg, rgba(52,211,153,0.04) 0%, var(--surface-2) 60%)'
          : isExpanded ? 'linear-gradient(135deg, rgba(96,165,250,0.04) 0%, var(--surface-2) 60%)' : 'var(--surface-2)',
        border: isApplied
          ? '1px solid rgba(52,211,153,0.25)'
          : isExpanded ? '1px solid rgba(96,165,250,0.2)' : '1px solid var(--border)',
      }}
    >
      <button onClick={onToggle} className="w-full text-left p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        <span className="text-[10px] font-black w-5 text-center shrink-0" style={{ color: 'var(--text-muted)' }}>#{rank}</span>
        <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex flex-col items-center justify-center"
          style={{ background: `${scoreColor}10`, border: `1.5px solid ${scoreColor}28` }}>
          <span className="text-sm font-black leading-none" style={{ color: scoreColor }}>{match.match_score}</span>
          <span className="text-[9px]" style={{ color: scoreColor + '80' }}>%</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: verdict.bg, color: verdict.color, border: `1px solid ${verdict.border}` }}>
              {verdict.emoji} <span className="hidden sm:inline">{verdict.text}</span>
            </span>
            {isApplied && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                <Check className="w-2.5 h-2.5" /> Applied
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white truncate mt-0.5">{match.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
            <span className="truncate max-w-[120px] sm:max-w-none">{match.company}</span>
            {match.location && <span className="hidden sm:inline">· {match.location}</span>}
            {match.work_mode && <span>· {match.work_mode}</span>}
          </div>
          {match.matched_skills.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {match.matched_skills.slice(0, 3).map(s => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(52,211,153,0.07)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.12)' }}>{s}</span>
              ))}
              {match.matched_skills.length > 3 && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{match.matched_skills.length - 3}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); toggleApplied(); }}
            className="text-xs font-semibold px-2 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1"
            style={isApplied
              ? { background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            {isApplied ? <Check className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          </button>
          {match.job_url && match.job_url !== '#' && (
            <a href={match.job_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Apply
            </a>
          )}
          <span style={{ color: 'var(--text-muted)' }}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {match.reason && (
                <p className="text-xs leading-relaxed italic pt-3 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(96,165,250,0.05)', color: 'var(--text-secondary)', borderLeft: '2px solid rgba(96,165,250,0.35)' }}>
                  {match.reason}
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-2">
                {match.matched_skills.length > 0 && (
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)' }}>
                    <p className="text-[11px] font-semibold mb-2 flex items-center gap-1" style={{ color: '#34d399' }}>
                      <TrendingUp className="w-3 h-3" /> You have
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.matched_skills.map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(52,211,153,0.08)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.15)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {match.missing_skills.length > 0 && (
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.1)' }}>
                    <p className="text-[11px] font-semibold mb-2 flex items-center gap-1" style={{ color: '#f87171' }}>
                      <AlertCircle className="w-3 h-3" /> Gaps
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.missing_skills.map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(248,113,113,0.07)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.15)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>AI TOOLS</p>
                <ContextualPanel match={match} profile={profile} resumeText={resumeText} isDemo={isDemo} />
              </div>
              <div className="flex justify-end">
                {match.job_url && match.job_url !== '#' && (
                  <a href={match.job_url} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5">
                    Apply Now <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Tier 3 Row ────────────────────────────────────────────────── */
function Tier3Row({ match, rank }: { match: JobMatch; rank: number }) {
  const scoreColor = getScoreColor(match.match_score);
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
      style={{ border: '1px solid transparent' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="text-[10px] w-6 text-center shrink-0 font-bold" style={{ color: 'var(--text-muted)' }}>{rank}</span>
      <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0"
        style={{ background: `${scoreColor}08`, border: `1px solid ${scoreColor}20` }}>
        <span className="text-[11px] font-black leading-none" style={{ color: scoreColor }}>{match.match_score}</span>
        <span className="text-[8px]" style={{ color: scoreColor + '70' }}>%</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 truncate">{match.title}</p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
          {match.company}{match.location ? ` · ${match.location}` : ''}{match.work_mode ? ` · ${match.work_mode}` : ''}
        </p>
      </div>
      {match.job_url && match.job_url !== '#' ? (
        <a href={match.job_url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand-light)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          View <ChevronRight className="w-3 h-3" />
        </a>
      ) : <div className="shrink-0 w-14" />}
    </div>
  );
}

/* ── Section Header ────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, count, iconColor }: {
  icon: React.ElementType; title: string; subtitle: string; count: number; iconColor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}25` }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
      </div>
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
        style={{ background: `${iconColor}10`, color: iconColor, border: `1px solid ${iconColor}20` }}>
        {count}
      </span>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */
export default function JobMatchPanel({ matches, profile, resumeText, isDemo, isApplied, toggleApplied }: Props) {
  const [expandedTier1, setExpandedTier1] = useState<number | null>(0);
  const [expandedTier2, setExpandedTier2] = useState<number | null>(null);
  const [tier3Open, setTier3Open]         = useState(false);
  const [search, setSearch]               = useState('');
  const [remoteOnly, setRemoteOnly]       = useState(false);

  const sorted = useMemo(() =>
    [...matches].sort((a, b) => b.match_score - a.match_score),
  [matches]);

  const tier1    = sorted.slice(0, TIER1_COUNT);
  const tier2    = sorted.slice(TIER1_COUNT, TIER1_COUNT + TIER2_COUNT);
  const tier3Raw = sorted.slice(TIER1_COUNT + TIER2_COUNT);

  const tier3 = useMemo(() => {
    let jobs = tier3Raw;
    if (remoteOnly) jobs = jobs.filter(j => j.work_mode?.toLowerCase() === 'remote');
    if (search.trim()) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }
    return jobs;
  }, [tier3Raw, search, remoteOnly]);

  // ── Skills gap tracker ────────────────────────────────────────
  const topGaps = useMemo(() => {
    const priorityJobs = [...tier1, ...tier2];
    const freq: Record<string, number> = {};
    for (const job of priorityJobs) {
      for (const skill of job.missing_skills) {
        freq[skill] = (freq[skill] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill, count]) => ({ skill, count }));
  }, [tier1, tier2]);

  const totalPriorityJobs = tier1.length + tier2.length;

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 rounded-2xl"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Search className="w-6 h-6" style={{ color: 'var(--brand-light)' }} />
        </div>
        <div>
          <p className="text-white font-bold text-base mb-1">No matches found</p>
          <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
            Try uploading a different resume or adjusting your target role to get better results.
          </p>
        </div>
        <a href="/upload" className="btn-primary text-sm py-2.5 px-5 rounded-xl flex items-center gap-2">
          Try a different resume <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── SKILLS GAP TRACKER ─────────────────────────────────── */}
      {topGaps.length > 0 && (
        <SkillsGapBanner gaps={topGaps} totalJobs={totalPriorityJobs} />
      )}

      {/* ── TIER 1 ─────────────────────────────────────────────── */}
      {tier1.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader
            icon={Star}
            title="Your Best Shots"
            subtitle="Apply to these first — AI ranked them highest for you"
            count={tier1.length}
            iconColor="#34d399"
          />
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {tier1.map((match, i) => (
                <motion.div
                  key={`t1-${match.company}-${match.title}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Tier1Card
                    match={match}
                    rank={i + 1}
                    isExpanded={expandedTier1 === i}
                    onToggle={() => setExpandedTier1(expandedTier1 === i ? null : i)}
                    profile={profile}
                    resumeText={resumeText}
                    isDemo={isDemo}
                    isApplied={isApplied(match)}
                    toggleApplied={() => toggleApplied(match)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── TIER 2 ─────────────────────────────────────────────── */}
      {tier2.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader
            icon={Target}
            title="Strong Contenders"
            subtitle="Good fits — apply after closing a few gaps"
            count={tier2.length}
            iconColor="#60a5fa"
          />
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {tier2.map((match, i) => (
                <motion.div
                  key={`t2-${match.company}-${match.title}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Tier2Card
                    match={match}
                    rank={TIER1_COUNT + i + 1}
                    isExpanded={expandedTier2 === i}
                    onToggle={() => setExpandedTier2(expandedTier2 === i ? null : i)}
                    profile={profile}
                    resumeText={resumeText}
                    isDemo={isDemo}
                    isApplied={isApplied(match)}
                    toggleApplied={() => toggleApplied(match)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── TIER 3 ─────────────────────────────────────────────── */}
      {tier3Raw.length > 0 && (
        <section className="flex flex-col gap-3">
          <button
            onClick={() => setTier3Open(o => !o)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all"
            style={{
              background: tier3Open ? 'var(--surface-2)' : 'rgba(255,255,255,0.02)',
              border: tier3Open ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)' }}>
                <Compass className="w-4 h-4" style={{ color: '#94a3b8' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Remaining Matches</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tier3Raw.length} more jobs — lower priority</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-1 rounded-full"
                style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }}>
                {tier3Raw.length}
              </span>
              {tier3Open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </div>
          </button>

          <AnimatePresence>
            {tier3Open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex flex-col sm:flex-row gap-2 px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Filter by title, company…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none"
                        style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <button
                      onClick={() => setRemoteOnly(o => !o)}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg whitespace-nowrap transition-all"
                      style={remoteOnly
                        ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                      }
                    >
                      <Wifi className="w-3.5 h-3.5" /> Remote only
                    </button>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {tier3.length > 0
                      ? tier3.map((match, i) => (
                          <Tier3Row key={`t3-${match.company}-${match.title}`}
                            match={match} rank={TIER1_COUNT + TIER2_COUNT + i + 1} />
                        ))
                      : <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No matches for current filters.</div>
                    }
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
