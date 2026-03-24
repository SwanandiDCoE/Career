import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong Match';
  if (score >= 65) return 'Good Match';
  if (score >= 45) return 'Partial Match';
  return 'Weak Match';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 65) return 'text-yellow-400';
  if (score >= 45) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 65) return 'bg-yellow-500';
  if (score >= 45) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getScoreBadgeClass(score: number): string {
  if (score >= 80) return 'badge-green';
  if (score >= 65) return 'badge-yellow';
  if (score >= 45) return 'badge-yellow';
  return 'badge-red';
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return '#10b981'; // emerald-500
  if (score >= 65) return '#eab308'; // yellow-500
  if (score >= 45) return '#f97316'; // orange-500
  return '#ef4444';                  // red-500
}
