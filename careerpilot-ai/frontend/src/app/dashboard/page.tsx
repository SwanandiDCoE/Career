'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApplied } from '@/hooks/useApplied';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Briefcase,
  Rocket, User, X, Sparkles, TrendingUp,
  CheckCircle2, ArrowRight, Share2, Copy, Check, Loader2, ExternalLink,
} from 'lucide-react';
import { DUMMY_RESULT } from '@/lib/dummy-data';
import JobMatchPanel     from '@/components/dashboard/JobMatchPanel';
import ApplyStrategy     from '@/components/dashboard/ApplyStrategy';
import SkeletonDashboard from '@/components/ui/SkeletonDashboard';
import { shareProfile }  from '@/lib/api';
import type { AnalysisResult, ResumeProfile } from '@/types';

type Tab = 'jobs' | 'strategy';

const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'jobs',     label: 'Job Matches',    icon: Briefcase              },
  { id: 'strategy', label: 'Apply Strategy', icon: Rocket,  badge: 'AI'  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [result, setResult]       = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('jobs');
  const [hydrated, setHydrated]   = useState(false);
  const [shareUrl, setShareUrl]   = useState<string | null>(null);
  const [sharing, setSharing]     = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('hirenext_result');
    if (stored) {
      try { setResult(JSON.parse(stored)); } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !result && !analyzing) {
      router.replace('/upload');
    }
  }, [hydrated, result, analyzing, router]);

  const data       = result ?? DUMMY_RESULT;
  const isDemo     = !result;
  const resumeText = result?.resume_text;

  const { isApplied, toggleApplied, appliedThisWeek } = useApplied();

  async function handleShare() {
    if (sharing) return;
    if (isDemo) {
      toast('Upload your real resume to create a shareable profile card.', { icon: '🔗' });
      return;
    }
    setSharing(true);
    try {
      const { url } = await shareProfile(data.profile, topMatch ?? null, data.feedback.overall_score, data.matches.slice(0, 3));
      setShareUrl(url);
    } catch {
      toast.error('Could not create share link — try again.');
    } finally {
      setSharing(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  const strongMatches = data.matches.filter(m => m.match_score >= 80).length;
  const avgScore      = data.matches.length
    ? Math.round(data.matches.reduce((s, m) => s + m.match_score, 0) / data.matches.length)
    : 0;
  const topMatch      = data.matches[0];

  if (!hydrated) return null;

  if (analyzing) {
    return (
      <div className="min-h-screen grid-texture">
        <Navbar isDemo={isDemo} profile={data.profile} />
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--brand-light)' }}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
            Fetching live jobs and ranking matches for your profile — ~15s
          </motion.div>
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-texture">
      <Navbar isDemo={isDemo} profile={data.profile} />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-4 sm:p-6 md:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(99,102,241,0.18)',
          }}
        >
          {/* Scan pill — honest about demo vs live */}
          {isDemo ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
              <Sparkles className="w-3 h-3" />
              Sample results — upload your resume to see your real matches
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
              <Sparkles className="w-3 h-3" />
              AI scanned live jobs · ranked {data.matches.length} matches for you
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                {strongMatches > 0
                  ? <>{strongMatches} jobs you should apply to <span className="text-indigo-400">right now</span></>
                  : <>Your top {data.matches.length} job matches are ready</>
                }
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {topMatch
                  ? `Best fit: ${topMatch.title} at ${topMatch.company} · ${topMatch.match_score}% match`
                  : `Based on your ${data.profile.target_role} profile and ${data.profile.experience_years} yrs exp`
                }
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatChip value={data.matches.length} label="Jobs Found"     color="#818cf8" />
              <StatChip value={strongMatches}        label="Apply Now"      color="#34d399" />
              <StatChip value={data.feedback.overall_score} label="Resume Score" color="#fbbf24" suffix="/100" />
              <StatChip value={avgScore}             label="Avg Match"      color="#c084fc" suffix="%" />
              {appliedThisWeek > 0 && (
                <StatChip value={appliedThisWeek} label="Applied" color="#34d399" suffix=" this wk" />
              )}
            </div>
          </div>

          {/* Top match CTA + Share */}
          <div className="mt-4 sm:mt-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
              {topMatch && topMatch.job_url && topMatch.job_url !== '#' && (
                <a
                  href={topMatch.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm py-3 px-5 rounded-xl flex items-center justify-center gap-2"
                >
                  Apply to #1 Match — {topMatch.company}
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => setActiveTab('jobs')}
                className="text-sm font-semibold flex items-center gap-1.5"
                style={{ color: 'var(--brand-light)' }}
              >
                View all {data.matches.length} matches <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Share button */}
              {!shareUrl && (
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  {sharing ? 'Creating link…' : 'Share my profile'}
                </button>
              )}
            </div>

            {/* Share URL chip */}
            <AnimatePresence>
              {shareUrl && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono"
                      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', maxWidth: 'min(320px, 100%)' }}>
                      <Share2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{shareUrl}</span>
                    </div>
                    <button
                      onClick={copyShareUrl}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                      style={shareCopied
                        ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
                        : { background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }
                      }
                    >
                      {shareCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {shareCopied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                  {/* Social share quick links */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Share on:</span>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(10,102,194,0.12)', color: '#60a5fa', border: '1px solid rgba(10,102,194,0.25)' }}
                    >
                      LinkedIn
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`I just analysed my resume on HireNext — see my top job matches → ${shareUrl}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(37,211,102,0.08)', color: '#4ade80', border: '1px solid rgba(37,211,102,0.2)' }}
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Just used AI to rank my job matches on HireNext 🚀')}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      X / Twitter
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ── NEXT STEP ────────────────────────────────────────────── */}
        {topMatch && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">
                Your move: apply to <span style={{ color: '#34d399' }}>{topMatch.company}</span> first — it's your {topMatch.match_score}% match
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Expand the card below → write a cold email → hit apply. Takes 10 minutes.
              </p>
            </div>
            {topMatch.job_url && topMatch.job_url !== '#' && (
              <a href={topMatch.job_url} target="_blank" rel="noopener noreferrer"
                className="btn-primary text-xs py-2 px-3 rounded-lg shrink-0 flex items-center gap-1.5">
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </motion.div>
        )}

        {/* ── TOOLS ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4"
        >
          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl overflow-x-auto"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 justify-center"
                  style={active ? {
                    background: 'var(--brand)',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                  } : {
                    color: 'var(--text-secondary)',
                  }}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>

                  {tab.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={active
                        ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                        : { background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>
                      {tab.badge}
                    </span>
                  )}

                  {tab.id === 'jobs' && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={active
                        ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                      {data.matches.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'jobs'     && <JobMatchPanel  matches={data.matches} profile={data.profile} resumeText={resumeText} isDemo={isDemo} isApplied={isApplied} toggleApplied={toggleApplied} />}
              {activeTab === 'strategy' && <ApplyStrategy matches={data.matches} resumeText={resumeText} isDemo={isDemo} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}

/* ── Stat Chip ────────────────────────────────────────────────────── */
function StatChip({ value, label, color, suffix = '' }: {
  value: number; label: string; color: string; suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl min-w-[60px]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-lg font-black" style={{ color }}>{value}{suffix}</p>
      <p className="text-[10px] mt-0.5 font-medium text-center" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

/* ── Navbar ───────────────────────────────────────────────────────── */
function Navbar({ isDemo, profile }: { isDemo: boolean; profile: ResumeProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const initials = profile.name
    .split(' ').slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '').join('');

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl"
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(15,17,23,0.92)' }}>
      <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%)' }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm">HireNext</span>
        </Link>

        {/* Status pill — honest about mode */}
        {!isDemo && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live jobs
          </div>
        )}

        {isDemo && (
          <Link href="/upload" className="min-w-0 flex-1 sm:flex-none">
            <span className="badge text-xs cursor-pointer transition-all hover:border-indigo-400/40 block truncate sm:block"
              style={{ background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="hidden sm:inline">✦ Showing sample results — upload yours to personalise</span>
              <span className="sm:hidden">✦ Sample results — upload yours</span>
            </span>
          </Link>
        )}

        {/* Profile */}
        <div className="ml-auto relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-150"
            style={{ background: open ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                     border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%)' }}>
              {initials || <User className="w-3 h-3" />}
            </div>
            <span className="hidden sm:block text-xs font-semibold text-white max-w-[100px] truncate">
              {profile.name.split(' ')[0]}
            </span>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)',
                         boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
              >
                {/* Profile header */}
                <div className="p-4 flex items-center gap-3"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%)' }}>
                    {initials || <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{profile.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--brand-light)' }}>
                      {profile.target_role} · {profile.experience_years}y exp
                    </p>
                    {profile.email && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{profile.email}</p>
                    )}
                  </div>
                  <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Skills */}
                <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold mb-2.5" style={{ color: 'var(--text-muted)' }}>
                    DETECTED SKILLS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 12).map(skill => (
                      <span key={skill} className="badge-blue badge text-xs">{skill}</span>
                    ))}
                    {profile.skills.length > 12 && (
                      <span className="badge text-xs"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        +{profile.skills.length - 12}
                      </span>
                    )}
                  </div>
                </div>

                {/* Education */}
                {profile.education && (
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>EDUCATION</p>
                    <p className="text-xs text-white">{profile.education}</p>
                  </div>
                )}

                <div className="p-4">
                  <Link href="/upload" onClick={() => setOpen(false)}
                    className="btn-primary w-full text-xs py-2 rounded-xl text-center flex items-center justify-center gap-1.5">
                    <Zap className="w-3 h-3" /> Re-analyse Resume
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
