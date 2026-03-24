import { useState } from 'react';
import type { AnalysisResult } from '@/types';
import { uploadResume } from '@/lib/api';

export function useJobMatch() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (file: File, jobTitle: string, location: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadResume(file, jobTitle, location);
      setResult(data);
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Analysis failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, analyze };
}
