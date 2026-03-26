'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Briefcase, FileText, Mail, Linkedin,
  Rocket, ChevronLeft, User, BarChart3, UploadCloud,
} from 'lucide-react';
import ResumeUpload        from '@/components/dashboard/ResumeUpload';
import JobMatchPanel       from '@/components/dashboard/JobMatchPanel';
import ResumeFeedback      from '@/components/dashboard/ResumeFeedback';
import ColdEmailGenerator  from '@/components/dashboard/ColdEmailGenerator';
import LinkedInGenerator   from '@/components/dashboard/LinkedInGenerator';
import ApplyStrategy       from '@/components/dashboard/ApplyStrategy';
import SkeletonDashboard   from '@/components/ui/SkeletonDashboard';
import type { AnalysisResult } from '@/types';

type Tab = 'jobs' | 'strategy' | 'feedback' | 'email' | 'linkedin';

const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'jobs',     label: 'Job Matches',    icon: Briefcase                },
  { id: 'strategy', label: 'Apply Strategy', icon: Rocket,   badge: 'AI'   },
  { id: 'feedback', label: 'Resume Feedback', icon: FileText                },
  { id: 'email',    label: 'Cold Email',      icon: Mail                    },
  { id: 'linkedin', label: 'LinkedIn Post',   icon: Linkedin                },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function DashboardPage() {
  const [result, setResult]       = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('jobs');

  /* ── Show full skeleton while the upload pipeline runs ── */
  if (analyzing) {
    return (
      <div className="min-h-screen grid-texture">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--brand-light)' }}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
            Parsing your resume, fetching live jobs and scoring matches with AI — this takes ~5–15s...
          </motion.div>
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  /* ── No result yet — show upload prompt ─────────────────── */
  if (!result) {
    return (
      <div className="min-h-screen grid-texture">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
            <motion.aside
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <ResumeUpload
                onResult={setResult}
                onLoadingChange={setAnalyzing}
                hasResult={false}
              />
            </motion.aside>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl"
              style={{ border: '1px dashed var(--border)', background: 'rgba(255,255,255,0.01)' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <UploadCloud className="w-7 h-7" style={{ color: 'var(--brand-light)' }} />
              </div>
              <div className="text-center max-w-xs">
                <p className="text-white font-semibold text-base">Upload your resume to get started</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Your personalised job matches, resume score, cold emails, and more will appear here.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Full dashboard with results ────────────────────────── */
  return (
    <div className="min-h-screen grid-texture">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">

          {/* ── Left Sidebar ──────────────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5 order-2 xl:order-1"
          >
            <ResumeUpload
              onResult={setResult}
              onLoadingChange={setAnalyzing}
              hasResult={!!result}
            />

            {/* Profile Summary */}
            <motion.div
              initial="hidden" animate="show" variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" style={{ color: 'var(--brand-light)' }} />
                <h3 className="font-semibold text-white text-sm">Your Profile</h3>
              </div>
              <div className="flex flex-col gap-3">
                <ProfileField label="Name"        value={result.profile.name} />
                <ProfileField label="Target Role" value={result.profile.target_role} />
                <ProfileField label="Experience"  value={`${result.profile.experience_years} years`} />
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.profile.skills.slice(0, 8).map((skill) => (
                      <span key={skill} className="badge-blue badge text-xs">{skill}</span>
                    ))}
                    {result.profile.skills.length > 8 && (
                      <span className="badge text-xs"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        +{result.profile.skills.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial="hidden" animate="show" variants={fadeUp}
              transition={{ delay: 0.18 }}
              className="grid grid-cols-2 gap-3"
            >
              <StatCard value={result.matches.length}                                                                    label="Jobs Found"     color="text-indigo-400" />
              <StatCard value={result.matches.filter(m => m.match_score >= 80).length}                                   label="Strong Matches" color="text-emerald-400" />
              <StatCard value={result.feedback.overall_score}                                                            label="Resume Score"   color="text-yellow-400" />
              <StatCard value={Math.round(result.matches.reduce((s, m) => s + m.match_score, 0) / result.matches.length)} label="Avg Match"     color="text-violet-400" />
            </motion.div>
          </motion.aside>

          {/* ── Main Content ──────────────────────────────────────── */}
          <motion.main
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5 min-w-0 order-1 xl:order-2"
          >
            {/* Tab Navigation */}
            <div className="flex gap-0.5 sm:gap-1 p-1 rounded-xl overflow-x-auto scrollbar-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 flex-1 sm:flex-none"
                    style={active ? {
                      background: tab.id === 'strategy'
                        ? 'linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%)'
                        : 'var(--brand)',
                      color: '#fff',
                      boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                    } : {
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline text-sm">{tab.label}</span>
                    <span className="sm:hidden text-[11px]">{tab.label.split(' ')[0]}</span>

                    {tab.badge && (
                      <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={active
                          ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                          : { background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                        {tab.badge}
                      </span>
                    )}

                    {tab.id === 'jobs' && (
                      <span className="hidden sm:inline text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={active
                          ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        {result.matches.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1"
              >
                {activeTab === 'jobs'     && <JobMatchPanel      matches={result.matches} />}
                {activeTab === 'strategy' && <ApplyStrategy      matches={result.matches} resumeText={result.resume_text} />}
                {activeTab === 'feedback' && <ResumeFeedback     feedback={result.feedback} />}
                {activeTab === 'email'    && <ColdEmailGenerator matches={result.matches} profile={result.profile} />}
                {activeTab === 'linkedin' && <LinkedInGenerator  profile={result.profile} />}
              </motion.div>
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl"
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(15,17,23,0.9)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
        <Link href="/"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <ChevronLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%)' }}>
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Hirenext</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <User className="w-3.5 h-3.5" style={{ color: 'var(--brand-light)' }} />
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="card text-center py-4">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}
