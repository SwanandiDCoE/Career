'use client';

import { useState } from 'react';
import { Mail, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import CopyButton from '@/components/ui/CopyButton';
import ScoreRing from '@/components/ui/ScoreRing';
import type { JobMatch, ResumeProfile } from '@/types';
import { DUMMY_COLD_EMAIL } from '@/lib/dummy-data';

interface Props {
  matches: JobMatch[];
  profile: ResumeProfile;
}

export default function ColdEmailGenerator({ matches, profile }: Props) {
  const [selectedJob, setSelectedJob] = useState<JobMatch>(matches[0]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // In production: call /api/generate/cold-email
      // const res = await axios.post('/api/generate/cold-email', { match: selectedJob, profile_summary: ... });
      // setEmail(res.data.email);
      await new Promise((r) => setTimeout(r, 1600));
      setEmail(DUMMY_COLD_EMAIL);
      toast.success('Cold email generated!');
    } catch {
      toast.error('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="card bg-gradient-to-br from-violet-950/40 to-slate-900 border-violet-500/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">Cold Email Generator</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              AI writes a personalized email for each job — not a template.
              Mention the company, your top matching skill, and a clear CTA.
            </p>
          </div>
        </div>
      </div>

      {/* Job Selector */}
      <div className="card flex flex-col gap-3">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Select a job to target
        </h3>
        <div className="flex flex-col gap-2">
          {matches.map((match, i) => (
            <button
              key={i}
              onClick={() => { setSelectedJob(match); setEmail(null); }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                selectedJob.title === match.title && selectedJob.company === match.company
                  ? 'border-indigo-500/40 bg-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <ScoreRing score={match.match_score} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{match.title}</p>
                <p className="text-slate-500 text-xs">{match.company} · {match.location}</p>
              </div>
              {selectedJob.title === match.title && selectedJob.company === match.company && (
                <span className="badge-blue badge text-xs shrink-0">Selected</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Writing your email...</>
        ) : email ? (
          <><RefreshCw className="w-4 h-4" /> Regenerate Email</>
        ) : (
          <><Mail className="w-4 h-4" /> Generate Cold Email for {selectedJob.company}</>
        )}
      </button>

      {/* Generated Email */}
      {email && (
        <div className="card border-violet-500/20 bg-slate-900 fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-400" />
              Generated Email — {selectedJob.company}
            </h3>
            <CopyButton text={email} />
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {email}
            </pre>
          </div>
          <p className="mt-3 text-slate-500 text-xs">
            Tip: Replace [Hiring Manager's Name] with the actual name from LinkedIn before sending.
          </p>
        </div>
      )}
    </div>
  );
}
