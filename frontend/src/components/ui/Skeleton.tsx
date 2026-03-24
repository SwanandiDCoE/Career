'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function Skeleton({ className, rounded = 'lg' }: SkeletonProps) {
  const roundedClass = {
    sm:   'rounded-sm',
    md:   'rounded-md',
    lg:   'rounded-lg',
    xl:   'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={cn('shimmer', roundedClass, className)}
      aria-hidden="true"
    />
  );
}
