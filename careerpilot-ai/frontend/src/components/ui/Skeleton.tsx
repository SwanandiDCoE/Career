'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  style?: React.CSSProperties;
}

export default function Skeleton({ className, rounded = 'lg', style }: SkeletonProps) {
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
      style={style}
      aria-hidden="true"
    />
  );
}
