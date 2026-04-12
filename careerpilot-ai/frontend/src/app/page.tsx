'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap, ArrowRight, CheckCircle2, Star,
  TrendingUp, Rocket, Sparkles, BarChart3,
  Building2, MapPin, ChevronDown, Target,
  ExternalLink, Wifi,
} from 'lucide-react';

/* ── Animation helpers ───────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

/* ── Demo data — compelling, real-feeling ────────────────────── */
const DEMO_PROFILE = {
  name: 'Rahul Sharma',
  role: 'Frontend Developer',
  exp:  '2 years experience',
  skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Tailwind CSS'],
};

const DEMO_TIER1 = [
  {
    rank: 1, score: 91, title: 'Frontend Engineer', company: 'Razorpay',
    location: 'Bangalore', work_mode: 'hybrid', salary: '18–26 LPA',
    matched: ['React', 'TypeScript', 'Next.js', 'REST APIs'],
    verdict: 'Apply today. You\'re ready.',
    verdictColor: '#34d399',
    reason: 'Strong React + TypeScript stack aligns perfectly with Razorpay\'s frontend requirements.',
    domain: 'fintech',
  },
  {
    rank: 2, score: 82, title: 'UI Engineer', company: 'Meesho',
    location: 'Bangalore', work_mode: 'remote', salary: '14–20 LPA',
    matched: ['React', 'Tailwind CSS', 'TypeScript', 'Git'],
    verdict: 'Apply today. Strong fit.',
    verdictColor: '#34d399',
    reason: 'Design-to-code skills and Tailwind proficiency are exactly what Meesho UI team needs.',
    domain: 'ecommerce',
  },
  {
    rank: 3, score: 78, title: 'SDE-2 (React)', company: 'Swiggy',
    location: 'Bangalore', work_mode: 'hybrid', salary: '16–22 LPA',
    matched: ['React', 'Next.js', 'Node.js', 'Tailwind CSS'],
    verdict: 'Apply in 2 weeks. Add Jest first.',
    verdictColor: '#fbbf24',
    reason: 'Solid foundation match but lacks testing framework experience they explicitly require.',
    domain: 'SaaS',
  },
];

const DEMO_TIER2 = [
  { rank: 4,  score: 72, title: 'React Developer',     company: 'CRED',    work_mode: 'hybrid' },
  { rank: 5,  score: 65, title: 'Full Stack Developer', company: 'Zepto',   work_mode: 'remote' },
  { rank: 6,  score: 61, title: 'Frontend Engineer',   company: 'Groww',   work_mode: 'remote' },
  { rank: 7,  score: 58, title: 'UI/UX Engineer',      company: 'PhonePe', work_mode: 'onsite' },
];

const STATS = [
  { value: '5,000+', label: 'jobs in our index', icon: BarChart3   },
  { value: '60s',    label: 'to your matches',   icon: Zap         },
  { value: '3.2×',   label: 'more interviews',   icon: TrendingUp  },
  { value: 'Free',   label: 'no signup needed',  icon: CheckCircle2 },
];

const TESTIMONIALS = [
  { name: 'Priya S.',  role: 'SDE Fresher → Swiggy',     quote: 'Got 3 interview calls in a week. It told me exactly which jobs to apply to and what to fix first.' },
  { name: 'Arjun M.',  role: 'Career switcher → Razorpay', quote: 'The skill gap feature showed I was missing Jest. Learned it in 4 days and got shortlisted.' },
  { name: 'Sneha R.',  role: 'MBA grad → Product role',   quote: 'The Apply Strategy was frighteningly accurate about what was blocking me. Fixed it. Got the offer.' },
];

/* ── Score ring ──────────────────────────────────────────────── */
function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const color = score >= 80 ? '#34d399' : score >= 65 ? '#60a5fa' : '#f59e0b';
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}/>
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-sm font-black leading-none" style={{ color }}>{score}</span>
        <span className="text-[9px] font-bold" style={{ color: color + '90' }}>%</span>
      </div>
    </div>
  );
}

/* ── Live Demo Preview ───────────────────────────────────────── */
function LiveDemoPreview() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Browser chrome */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}>

        {/* Chrome bar */}
        <div className="flex items-center gap-3 px-4 py-3"
          style={{ background: '#0d0f16', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }}/>
            <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }}/>
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }}/>
          </div>
          <div className="flex-1 h-5 rounded-md flex items-center px-3 text-[11px]"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
            ✦ hirenext.org/dashboard
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
            Live jobs
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 flex flex-col gap-4" style={{ background: '#0f1117' }}>

          {/* Profile pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              <Sparkles className="w-3 h-3"/>
              AI scanned live jobs · ranked 47 matches for Rahul
            </div>
          </div>

          {/* Tier 1 header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <Star className="w-3 h-3" style={{ color: '#34d399' }}/>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Your Best Shots</p>
                <p className="text-[10px]" style={{ color: '#64748b' }}>AI ranked these first — apply today</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
              3 jobs
            </span>
          </div>

          {/* Tier 1 Cards */}
          {DEMO_TIER1.map((job, i) => (
            <motion.div key={job.rank}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.4, ease: [0.16,1,0.3,1] }}
              className="rounded-xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.04) 0%, rgba(15,17,23,0.98) 60%)',
                border: '1px solid rgba(52,211,153,0.18)',
              }}>
              {/* Left accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ background: 'linear-gradient(180deg, #34d399 0%, #34d39940 100%)' }}/>

              <div className="pl-4 pr-4 py-3 flex items-start gap-3">
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#475569' }}>#{job.rank}</span>
                  <ScoreRing score={job.score} size={48}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                      ✨ Top Fit
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white leading-snug">{job.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] flex-wrap" style={{ color: '#64748b' }}>
                    <span className="flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5"/>{job.company}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5"/>{job.location}</span>
                    {job.work_mode === 'remote' && (
                      <span className="flex items-center gap-0.5 font-semibold" style={{ color: '#34d399' }}>
                        <Wifi className="w-2.5 h-2.5"/>Remote
                      </span>
                    )}
                    <span className="font-semibold text-white/50">{job.salary}</span>
                  </div>
                  {/* Verdict */}
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold" style={{ color: job.verdictColor }}>
                      → {job.verdict}
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                      Apply →
                    </span>
                  </div>
                  {/* Skills */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {job.matched.map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(52,211,153,0.07)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.12)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Tier 2 header */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
                <Target className="w-3 h-3" style={{ color: '#60a5fa' }}/>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Strong Contenders</p>
                <p className="text-[10px]" style={{ color: '#64748b' }}>Great fits with minor gaps</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)' }}>
              15 jobs
            </span>
          </div>

          {/* Tier 2 compact cards */}
          <div className="flex flex-col gap-1.5">
            {DEMO_TIER2.map((job, i) => {
              const color = '#60a5fa';
              return (
                <motion.div key={job.rank}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.07, duration: 0.3, ease: [0.16,1,0.3,1] }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[9px] font-black w-4 shrink-0" style={{ color: '#475569' }}>#{job.rank}</span>
                  <div className="w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0"
                    style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                    <span className="text-[11px] font-black leading-none" style={{ color }}>{job.score}</span>
                    <span className="text-[8px]" style={{ color: color + '70' }}>%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">{job.title}</p>
                    <p className="text-[10px] truncate" style={{ color: '#475569' }}>{job.company} · {job.work_mode}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.18)' }}>
                    Strong Match
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Tier 3 collapsed */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-semibold" style={{ color: '#475569' }}>Explore 29 More Opportunities</p>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: '#475569' }}/>
          </motion.div>
        </div>
      </div>

      {/* Fade out bottom */}
      <div className="h-16 -mt-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--surface))' }}/>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)' }}>

      {/* ── Navbar ────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 mt-2 sm:mt-3">
          <div className="flex items-center justify-between h-14 px-3 sm:px-5 rounded-2xl"
            style={{ background: 'rgba(20,23,32,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
                <Zap className="w-4 h-4 text-white"/>
              </div>
              <span className="font-bold text-white text-[15px] tracking-[-0.01em]">HireNext</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {['How it works', 'Reviews'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g,'-')}`}
                  className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                  {item}
                </a>
              ))}
            </div>
            <Link href="/upload" className="btn-primary text-sm py-2 px-4 rounded-xl">
              Try Free <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero — product first, form second ─────────────────── */}
      <section className="hero-gradient noise relative pt-24 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-6">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }}/>

        <motion.div variants={stagger} initial="hidden" animate="show"
          className="max-w-3xl mx-auto text-center mb-14">

          {/* Pill */}
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-300"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <Sparkles className="w-3 h-3"/>
            Real-time jobs · AI-ranked · Zero guesswork
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp}
            className="text-[2rem] sm:text-[2.8rem] md:text-[4.5rem] font-black leading-[1.06] tracking-[-0.03em] text-balance mb-5">
            <span className="text-white">Know exactly which jobs</span>
            <br/>
            <span className="gradient-text">to apply to — right now.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeUp}
            className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8 text-balance"
            style={{ color: 'var(--text-secondary)' }}>
            Upload your resume. In 60 seconds, get AI-ranked job matches,
            skill gaps, and a verdict: <em>apply today</em> or <em>not yet</em>.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-6">
            <Link href="/upload" className="btn-primary text-[15px] px-7 py-3.5 rounded-xl glow-indigo text-center">
              Analyse My Resume Free
              <ArrowRight className="w-4 h-4"/>
            </Link>
            <a href="#how-it-works" className="btn-secondary text-[15px] px-7 py-3.5 rounded-xl text-center">
              See How It Works
            </a>
          </motion.div>

          {/* Trust */}
          <motion.div variants={fadeUp}
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm"
            style={{ color: 'var(--text-muted)' }}>
            {['No signup required', 'Free forever', 'Results in 60 seconds'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70"/> {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Live product preview ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <LiveDemoPreview/>
        </motion.div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="py-10 sm:py-12 px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map((s, i) => (
            <motion.div key={i} variants={fadeUp}
              className="text-center py-6 px-4 rounded-2xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <s.icon className="w-5 h-5 mx-auto mb-3" style={{ color: 'var(--brand-light)' }}/>
              <p className="text-3xl font-black text-white tracking-tight">{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="text-center mb-16">
            <motion.p variants={fadeUp} className="section-label">How It Works</motion.p>
            <motion.h2 variants={fadeUp}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              60 seconds to clarity
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid sm:grid-cols-3 gap-6 sm:gap-6 relative">
            <div className="hidden md:block absolute top-8 left-[33%] right-[33%] h-px"
              style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))' }}/>

            {[
              { n: '01', title: 'Drop your resume',      desc: 'PDF upload — no account, no signup. Parsed instantly.' },
              { n: '02', title: 'AI ranks live jobs',     desc: 'We scan 4,926 real listings and score every one against your exact profile.' },
              { n: '03', title: 'Get your verdict',       desc: 'Each job gets a clear directive: apply today, apply after improvements, or skip.' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 font-black text-xl relative z-10"
                  style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--brand-light)', boxShadow: '0 0 24px rgba(99,102,241,0.15)' }}>
                  {s.n}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center mt-14">
            <Link href="/upload" className="btn-primary text-[15px] px-8 py-3.5">
              Get My Matches <ArrowRight className="w-4 h-4"/>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section id="reviews" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="text-center mb-14">
            <motion.p variants={fadeUp} className="section-label">Reviews</motion.p>
            <motion.h2 variants={fadeUp}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              People are getting hired
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={fadeUp}
                className="flex flex-col gap-4 p-6 rounded-2xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex gap-0.5">
                  {Array(5).fill(0).map((_,j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400"/>)}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg,hsl(${i*80+220},70%,50%),hsl(${i*80+260},60%,45%))` }}>
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

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
          className="max-w-3xl mx-auto text-center rounded-3xl py-12 sm:py-16 px-5 sm:px-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(99,102,241,0.15) 0%,transparent 70%)' }}/>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
              <Rocket className="w-7 h-7 text-white"/>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Your next offer starts here.
            </h2>
            <p className="text-base sm:text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
              Stop applying blindly. Know exactly where you stand.
            </p>
            <Link href="/upload" className="btn-primary text-[15px] px-8 py-3.5 rounded-xl inline-flex">
              Analyse My Resume Free <ArrowRight className="w-4 h-4"/>
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              {['No signup needed','Free forever','PDF upload','Live job listings'].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60"/> {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm"
          style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Zap className="w-3 h-3 text-white"/>
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>HireNext</span>
          </div>
          <p>© 2026 HireNext · Built for job seekers.</p>
        </div>
      </footer>

    </div>
  );
}
