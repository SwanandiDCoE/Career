import axios from 'axios';
import type { AnalysisResult, JobMatch, ResumeProfile, ApplyStrategy } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 90000,   // 90s — real PDF parse + DB query + AI scoring takes ~5–15s
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

// Generate apply strategy for a specific job using the resume text
export async function generateStrategy(
  resumeText: string,
  job: Pick<JobMatch, 'title' | 'company' | 'location' | 'job_url'> & { description?: string }
): Promise<ApplyStrategy> {
  const res = await api.post('/api/strategy', { resume_text: resumeText, job });
  return unwrap<ApplyStrategy>(res);
}

// Generate cold email for a specific job match
export async function generateColdEmail(
  match: JobMatch,
  profileSummary: string
): Promise<string> {
  const res = await api.post('/api/email', {
    job: {
      title:    match.title,
      company:  match.company,
      location: match.location,
    },
    matched_skills:  match.matched_skills,
    profile_summary: profileSummary,
  });
  return unwrap<any>(res)?.email ?? res.data;
}

// Generate LinkedIn post
export async function generateLinkedInPost(
  profile: ResumeProfile,
  tone: 'professional' | 'authentic' | 'bold' = 'authentic'
): Promise<string> {
  const res = await api.post('/api/linkedin', {
    profile: {
      name:             profile.name,
      target_role:      profile.target_role,
      skills:           profile.skills,
      experience_years: profile.experience_years,
    },
    tone,
  });
  return unwrap<any>(res)?.post ?? res.data;
}

// Fetch resume feedback for an already-parsed profile
export async function getResumeFeedback(resumeText: string) {
  const res = await api.post('/api/feedback', { resume_text: resumeText });
  return res.data;
}
