'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, FileText, UploadCloud, ArrowRight,
  CheckCircle2, Loader2, Briefcase, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadResume } from '@/lib/api';

const PIPELINE_STEPS = [
  { label: 'Reading your resume',           detail: 'Extracting text and structure from your PDF'              },
  { label: 'Detecting skills & experience', detail: 'Identifying your stack, seniority level, and domain'      },
  { label: 'Fetching live job listings',    detail: 'Pulling relevant roles matching your title and location'  },
  { label: 'Ranking your top matches',      detail: 'Scoring skill overlap, title fit, and seniority alignment'},
  { label: 'Writing your resume feedback',  detail: 'Generating specific, actionable improvement suggestions'  },
];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile]         = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState(0);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: () => toast.error('PDF only, max 5MB.'),
  });

  const handleAnalyse = async () => {
    if (!file || !jobTitle.trim()) return;
    setLoading(true);
    setStep(0);

    // Animate pipeline steps while waiting
    const interval = setInterval(() => {
      setStep(s => (s < PIPELINE_STEPS.length - 1 ? s + 1 : s));
    }, 1800);

    try {
      const data = await uploadResume(file, jobTitle.trim(), location.trim() || 'Remote');
      sessionStorage.setItem('hirenext_result', JSON.stringify(data));
      router.push('/dashboard');
    } catch {
      toast.error('Analysis failed — please try again.');
      setLoading(false);
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="min-h-screen grid-texture flex flex-col">

      {/* Navbar */}
      <nav className="px-4 sm:px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-[15px]">HireNext</span>
        </Link>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-300"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <Zap className="w-3 h-3" /> Step 1 of 1 — Upload your resume
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
              Find your best-fit jobs
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Drop your PDF and get AI-ranked matches in 30 seconds.
            </p>
          </div>

          <div className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>

            {/* Dropzone */}
            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} />
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="rounded-xl py-8 sm:py-10 flex flex-col items-center justify-center gap-2 transition-all duration-200"
                style={isDragActive
                  ? { background: 'rgba(99,102,241,0.1)', border: '2px dashed rgba(99,102,241,0.6)' }
                  : file
                    ? { background: 'rgba(16,185,129,0.06)', border: '2px dashed rgba(16,185,129,0.4)' }
                    : { background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)' }
                }>
                {file ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <p className="text-emerald-400 font-semibold text-sm">{file.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {(file.size / 1024).toFixed(0)} KB · Click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-medium text-white">
                      {isDragActive ? 'Drop it here...' : 'Drag & drop your resume'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF only · Max 5MB</p>
                  </>
                )}
              </motion.div>
            </div>

            {/* Job Title */}
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Target role  (e.g. Frontend Developer)"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="w-full pl-9 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Location  (e.g. Bangalore, Remote)"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full pl-9 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border)',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleAnalyse}
              disabled={!file || !jobTitle.trim() || loading}
              whileHover={!loading && file && jobTitle ? { scale: 1.01 } : {}}
              whileTap={!loading  && file && jobTitle ? { scale: 0.98 } : {}}
              className="btn-primary w-full py-3.5 text-[15px] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</>
                : <><Zap className="w-4 h-4" /> Analyse My Resume <ArrowRight className="w-4 h-4" /></>
              }
            </motion.button>

            {/* Trust line */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {['No signup needed', 'Results in ~30s', 'Free forever'].map(t => (
                <span key={t} className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500/60" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Pipeline loading overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-2xl overflow-hidden"
                style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                {/* Progress bar */}
                <div className="h-0.5 w-full" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.round(((step + 1) / PIPELINE_STEPS.length) * 100)}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <div className="p-4 flex flex-col gap-0.5">
                  {PIPELINE_STEPS.map((s, i) => {
                    const done    = i < step;
                    const active  = i === step;
                    const pending = i > step;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: pending ? 0.3 : 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        className="flex items-start gap-3 py-2"
                      >
                        <div className="shrink-0 mt-0.5">
                          {done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
                            : active
                              ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#818cf8' }}/>
                              : <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}/>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug"
                            style={{ color: done ? '#34d399' : active ? '#a5b4fc' : 'var(--text-muted)' }}>
                            {done ? '✓ ' : ''}{s.label}
                          </p>
                          {(done || active) && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="text-xs mt-0.5 leading-relaxed"
                              style={{ color: done ? 'var(--text-muted)' : '#818cf8' }}>
                              {s.detail}
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
