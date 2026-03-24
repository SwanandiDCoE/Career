'use client';

import { motion } from 'framer-motion';
import Skeleton from './Skeleton';

/* Stagger wrapper */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Sidebar skeleton ────────────────────────────────────────────── */
function SidebarSkeleton() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-5">
      {/* Upload card */}
      <motion.div variants={item} className="card flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-28 w-full" rounded="xl" />
        <Skeleton className="h-10 w-full" rounded="xl" />
        <Skeleton className="h-10 w-full" rounded="xl" />
        <Skeleton className="h-11 w-full" rounded="xl" />
      </motion.div>

      {/* Profile card */}
      <motion.div variants={item} className="card flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-col gap-3">
          {[80, 64, 48].map((w) => (
            <div key={w} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className={`h-4 w-[${w}%]`} />
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {[60, 72, 56, 80, 64, 52, 70, 58].map((w, i) => (
              <Skeleton key={i} className="h-6" style={{ width: `${w}px` }} rounded="full" />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex flex-col items-center gap-2 py-4">
            <Skeleton className="h-8 w-12" rounded="md" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ── Job card skeleton ───────────────────────────────────────────── */
function JobCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="card flex items-start gap-4 p-5"
    >
      {/* Score ring placeholder */}
      <Skeleton className="w-[76px] h-[76px] shrink-0" rounded="full" />

      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        {/* Title + company row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0" rounded="full" />
        </div>
        {/* Progress bar */}
        <Skeleton className="h-2 w-full mt-1" rounded="full" />
        {/* Reason */}
        <Skeleton className="h-3 w-3/4" />
      </div>
    </motion.div>
  );
}

/* ── Main content skeleton ───────────────────────────────────────── */
function MainSkeleton() {
  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="flex flex-col gap-5"
    >
      {/* Tab bar */}
      <motion.div variants={item}
        className="flex gap-1 p-1 rounded-xl overflow-hidden"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {[120, 130, 140, 100, 120].map((w, i) => (
          <Skeleton key={i} className="h-10" style={{ width: `${w}px` }} rounded="lg" />
        ))}
      </motion.div>

      {/* Header row — jobs found + filter pills */}
      <motion.div variants={item} className="flex items-center justify-between gap-3 flex-wrap">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2">
          {[48, 80, 72, 70].map((w, i) => (
            <Skeleton key={i} className="h-7" style={{ width: `${w}px` }} rounded="full" />
          ))}
        </div>
      </motion.div>

      {/* Job cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <JobCardSkeleton key={i} delay={i * 0.07} />
      ))}
    </motion.div>
  );
}

/* ── Public export ───────────────────────────────────────────────── */
export default function SkeletonDashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
      <SidebarSkeleton />
      <MainSkeleton />
    </div>
  );
}
