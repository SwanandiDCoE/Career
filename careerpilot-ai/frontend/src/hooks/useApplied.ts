'use client';

import { useState, useEffect, useCallback } from 'react';
import type { JobMatch } from '@/types';

interface AppliedJob {
  title: string;
  company: string;
  appliedAt: number;
}

const KEY = 'hirenext_applied';

function load(): AppliedJob[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function useApplied() {
  const [applied, setApplied] = useState<AppliedJob[]>([]);

  useEffect(() => {
    setApplied(load());
  }, []);

  const isApplied = useCallback(
    (match: JobMatch) =>
      applied.some(a => a.title === match.title && a.company === match.company),
    [applied],
  );

  const toggleApplied = useCallback((match: JobMatch) => {
    setApplied(prev => {
      const already = prev.some(
        a => a.title === match.title && a.company === match.company,
      );
      const next = already
        ? prev.filter(a => !(a.title === match.title && a.company === match.company))
        : [...prev, { title: match.title, company: match.company, appliedAt: Date.now() }];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const appliedThisWeek = applied.filter(
    a => Date.now() - a.appliedAt < 7 * 24 * 60 * 60 * 1000,
  ).length;

  return { applied, isApplied, toggleApplied, appliedThisWeek };
}
