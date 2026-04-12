export interface ResumeProfile {
  name: string;
  email: string;
  skills: string[];
  experience_years: number;
  education: string;
  target_role: string;
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  domain?: string;
  work_preference?: 'remote' | 'hybrid' | 'onsite' | 'flexible';
}

export interface JobMatch {
  title: string;
  company: string;
  location: string;
  job_url: string;           // real Indeed / Glassdoor apply link
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  reason: string;
  verdict: 'Strong Match' | 'Good Match' | 'So Close' | 'Weak Match';
  // Extra fields from live DB jobs
  description?: string;
  work_mode?: string;        // remote | hybrid | onsite
  salary_raw?: string;       // "25-40 LPA" as scraped
  company_domain?: string;   // fintech | SaaS | AI/ML
  source?: string;           // indeed | glassdoor
  date_posted?: string;
  requirements?: string[];
  company_size?: string;
}

export interface ResumeFeedback {
  overall_score: number;
  suggestions: string[];
  strengths: string[];
  ats_tips: string[];
}

export interface AnalysisResult {
  profile: ResumeProfile;
  matches: JobMatch[];
  feedback: ResumeFeedback;
  resume_text?: string;
}

// ── Apply Strategy Engine ─────────────────────────────────────────

export interface MissingSkill {
  skill: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  context: string;
}

export interface ImprovementAction {
  type: 'resume_edit' | 'skill_to_learn' | 'project_to_build';
  action: string;
  impact: 'high' | 'medium';
}

export interface InterviewTip {
  likely_question: string;
  why_they_ask: string;
  how_to_answer: string;
}

export type ApplicationPriority = 'apply_now' | 'apply_after_improvements' | 'long_term_goal';

export interface ApplyStrategy {
  match_score:          number;
  match_summary:        string;
  strengths:            string[];
  missing_skills:       MissingSkill[];
  improvement_actions:  ImprovementAction[];
  interview_tips:       InterviewTip[];
  application_priority: ApplicationPriority;
  priority_reason:      string;
}
