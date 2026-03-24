'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BrainCircuit, FileText, Zap, Target, Mail,
  Linkedin, ArrowRight, CheckCircle2, Star,
  TrendingUp, Rocket, Sparkles, Users, BarChart3,
} from 'lucide-react';

/* ── Animation Variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.4 } },
};

/* ── Static Data ────────────────────────────────────────────── */
const FEATURES = [
  { icon: Target,      title: 'AI Job Matching',       color: 'text-indigo-400', glow: 'rgba(99,102,241,0.15)',  desc: 'Get a precise 0–100 match score for every job based on your exact skills, not keywords.' },
  { icon: FileText,    title: 'Resume Feedback',        color: 'text-emerald-400',glow: 'rgba(16,185,129,0.12)', desc: 'Specific, actionable suggestions that fix the exact issues causing your rejections.' },
  { icon: Rocket,      title: 'Apply Strategy Engine',  color: 'text-violet-400', glow: 'rgba(139,92,246,0.15)', desc: 'Get your personal action plan: what to fix, what to learn, and how to ace the interview.' },
  { icon: Mail,        title: 'Cold Email Generator',   color: 'text-sky-400',    glow: 'rgba(14,165,233,0.12)', desc: 'Personalised outreach per job — not templates. Written like you, not a bot.' },
  { icon: Linkedin,    title: 'LinkedIn Post Generator',color: 'text-blue-400',   glow: 'rgba(59,130,246,0.12)', desc: 'High-engagement posts designed to make recruiters land in your inbox.' },
  { icon: TrendingUp,  title: 'Live Job Listings',      color: 'text-pink-400',   glow: 'rgba(236,72,153,0.12)', desc: 'Jobs scraped in real-time from Indeed, Glassdoor & LinkedIn — never stale.' },
];

const STEPS = [
  { n: '01', title: 'Upload your resume',   desc: 'Drop your PDF — parsed instantly, no account needed.' },
  { n: '02', title: 'AI ranks live jobs',    desc: 'We score real listings against your profile in seconds.' },
  { n: '03', title: 'Get your action plan', desc: 'Match scores, skill gaps, emails — everything to land the role.' },
];

const STATS = [
  { value: '3.2×',  label: 'more interviews',   icon: TrendingUp },
  { value: '30s',   label: 'to first match',     icon: Zap        },
  { value: '94%',   label: 'accuracy score',     icon: Target     },
  { value: '10K+',  label: 'jobs analysed daily',icon: BarChart3  },
];

const TESTIMONIALS = [
  { name: 'Priya S.',  role: 'SDE Fresher',      quote: 'Got 3 interview calls in a week. CareerPilot told me exactly which jobs to apply to and what to fix first.' },
  { name: 'Arjun M.',  role: 'Career Switcher',   quote: 'The skill gap feature showed me I was missing Jest. I learned it in 4 days and got shortlisted at Swiggy.' },
  { name: 'Sneha R.',  role: 'MBA Graduate',      quote: 'The cold email generator is wild. Hiring managers at 3 companies actually replied to me.' },
];

/* ── Component ──────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)' }}>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50"
      >
        <div className="mx-auto max-w-6xl px-6 mt-3">
          <div className="flex items-center justify-between h-14 px-5 rounded-2xl"
            style={{ background: 'rgba(20,23,32,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-[15px] tracking-[-0.01em]">CareerPilot AI</span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              {['Features', 'How it works', 'Reviews'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-150">
                  {item}
                </a>
              ))}
            </div>

            <Link href="/dashboard"
              className="btn-primary text-sm py-2 px-4 rounded-xl">
              Try Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="hero-gradient noise relative pt-36 pb-28 px-6">
        {/* Ambient orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <motion.div variants={stagger} initial="hidden" animate="show"
          className="max-w-4xl mx-auto text-center">

          {/* Pill badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-300"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <Sparkles className="w-3 h-3" />
            AI-Powered · Real-Time Jobs · Zero Guesswork
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp}
            className="text-[3.5rem] md:text-[5rem] font-black leading-[1.02] tracking-[-0.035em] text-balance mb-6">
            <span className="text-white">Find jobs you </span>
            <span className="gradient-text">actually have</span>
            <br />
            <span className="text-white">a chance of getting.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={fadeUp}
            className="text-[1.1rem] leading-relaxed max-w-2xl mx-auto mb-10 text-balance"
            style={{ color: 'var(--text-secondary)' }}>
            Upload your resume. Get AI-ranked job matches with match scores, skill gaps,
            targeted cold emails, and an apply strategy — in under 30 seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard"
              className="btn-primary text-[15px] px-7 py-3.5 rounded-xl glow-indigo">
              Analyse My Resume Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="btn-secondary text-[15px] px-7 py-3.5 rounded-xl">
              See How It Works
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.div variants={fadeUp}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-7 text-sm"
            style={{ color: 'var(--text-muted)' }}>
            {['No signup required', 'Works in 30 seconds', 'Free forever'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" /> {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Dashboard Preview ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 max-w-2xl mx-auto"
        >
          {/* Browser chrome */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)' }}>
            {/* Chrome bar */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ background: 'var(--surface-3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/50" />
              </div>
              <div className="flex-1 mx-3 h-5 rounded-md flex items-center px-3 text-[11px]"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                careerpilot.ai/dashboard
              </div>
            </div>

            {/* Preview content */}
            <div className="p-5 space-y-2.5"
              style={{ background: 'var(--surface-1)' }}>
              {[
                { title: 'Frontend Engineer', company: 'Razorpay',  score: 91, color: '#10b981', label: 'Strong Match' },
                { title: 'UI Engineer',        company: 'Meesho',   score: 82, color: '#10b981', label: 'Strong Match' },
                { title: 'SDE-2 (React)',      company: 'Swiggy',   score: 78, color: '#f59e0b', label: 'Good Match'   },
                { title: 'Full Stack Dev',     company: 'Zepto',    score: 65, color: '#f59e0b', label: 'Good Match'   },
              ].map((job, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08, ease: [0.16,1,0.3,1] }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Score circle */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: `${job.color}18`, border: `1px solid ${job.color}30`, color: job.color }}>
                    {job.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{job.title}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${job.color}15`, color: job.color, border: `1px solid ${job.color}25` }}>
                        {job.label}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{job.company}</p>
                    <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${job.score}%` }}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.8, ease: [0.16,1,0.3,1] }}
                        style={{ background: job.color }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Reflection fade */}
          <div className="h-20 -mt-1 rounded-b-2xl pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--surface))' }} />
        </motion.div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={i} variants={fadeUp}
              className="text-center py-6 px-4 rounded-2xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <s.icon className="w-5 h-5 mx-auto mb-3" style={{ color: 'var(--brand-light)' }} />
              <p className="text-3xl font-black text-white tracking-tight">{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="text-center mb-16">
            <motion.p variants={fadeUp} className="section-label">Features</motion.p>
            <motion.h2 variants={fadeUp}
              className="text-4xl md:text-5xl font-black text-white tracking-tight text-balance">
              Everything you need to land the job
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg max-w-xl mx-auto text-balance"
              style={{ color: 'var(--text-secondary)' }}>
              One PDF upload. Six AI-powered tools. Zero guesswork.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="card-hover group p-6 rounded-2xl"
                style={{ background: 'var(--surface-2)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: f.glow, border: `1px solid ${f.glow.replace('0.15','0.3').replace('0.12','0.25')}` }}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-white font-semibold text-[15px] mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6"
        style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="text-center mb-16">
            <motion.p variants={fadeUp} className="section-label">How It Works</motion.p>
            <motion.h2 variants={fadeUp}
              className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Three steps to your next offer
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector lines */}
            <div className="hidden md:block absolute top-8 left-[33%] right-[33%] h-px"
              style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))' }} />

            {STEPS.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 font-black text-xl relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: 'var(--brand-light)',
                    boxShadow: '0 0 24px rgba(99,102,241,0.15)',
                  }}>
                  {s.n}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center mt-12">
            <Link href="/dashboard" className="btn-primary text-[15px] px-8 py-3.5">
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <section id="reviews" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="text-center mb-14">
            <motion.p variants={fadeUp} className="section-label">Reviews</motion.p>
            <motion.h2 variants={fadeUp}
              className="text-4xl md:text-5xl font-black text-white tracking-tight">
              People are getting hired
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={stagger}
            className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={fadeUp}
                className="flex flex-col gap-4 p-6 rounded-2xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex gap-0.5">
                  {Array(5).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-2"
                  style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, hsl(${i * 80 + 220},70%,50%), hsl(${i * 80 + 260},60%,45%))` }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
          className="max-w-3xl mx-auto text-center rounded-3xl py-16 px-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Your AI recruiter is waiting.
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
              Stop applying blindly. Start applying smart.
            </p>
            <Link href="/dashboard" className="btn-primary text-[15px] px-8 py-3.5 rounded-xl">
              Analyse My Resume Free <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm"
              style={{ color: 'var(--text-muted)' }}>
              {['No signup needed', 'PDF upload', 'Live job listings', 'Free to use'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" /> {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm"
          style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>CareerPilot AI</span>
          </div>
          <p>© 2025 CareerPilot AI · Built for job seekers.</p>
        </div>
      </footer>
    </div>
  );
}
