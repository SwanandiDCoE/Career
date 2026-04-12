import axios from 'axios';
import type { AnalysisResult, JobMatch, ApplyStrategy } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 90000,   // 90s — real PDF parse + DB query + scoring takes ~5–15s
});

// Unwrap backend envelope: { success: true, data: {...} } → data
function unwrap<T>(res: { data: { data?: T; success?: boolean } & T }): T {
  return (res.data as any).data ?? res.data;
}

// Upload resume and trigger full analysis pipeline
export async function uploadResume(
  file: File,
  jobTitle: string,
  location: string
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('job_title', jobTitle);
  formData.append('location', location);

  const res = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap<AnalysisResult>(res);
}

// Fetch resume feedback for an already-parsed profile
export async function getResumeFeedback(resumeText: string) {
  const res = await api.post('/api/feedback', { resume_text: resumeText });
  return res.data;
}

// Generate cold email for a specific job match
export async function generateColdEmail(match: JobMatch, profileSummary: string) {
  const res = await api.post('/api/generate/cold-email', { match, profile_summary: profileSummary });
  return res.data;
}

// Generate LinkedIn post
export async function generateLinkedInPost(profileSummary: string, targetRole: string) {
  const res = await api.post('/api/generate/linkedin-post', { profile_summary: profileSummary, target_role: targetRole });
  return res.data;
}

// Generate apply strategy for a specific job
export async function generateStrategy(resumeText: string, job: JobMatch): Promise<ApplyStrategy> {
  const res = await api.post('/api/strategy', { resume_text: resumeText, job });
  return unwrap<ApplyStrategy>(res);
}

// Create a shareable public profile card
export async function shareProfile(
  profile: import('@/types').ResumeProfile,
  topMatch: JobMatch | null,
  resumeScore: number,
  topMatches?: JobMatch[],
): Promise<{ slug: string; url: string }> {
  const res = await api.post('/api/share', { profile, topMatch, resumeScore, topMatches: topMatches?.slice(0, 3) });
  return res.data;
}
