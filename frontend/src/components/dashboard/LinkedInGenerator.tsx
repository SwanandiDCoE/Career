'use client';

import { useState } from 'react';
import { Linkedin, Loader2, RefreshCw, Eye, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import CopyButton from '@/components/ui/CopyButton';
import { generateLinkedInPost } from '@/lib/api';
import type { ResumeProfile } from '@/types';

interface Props {
  profile: ResumeProfile;
}

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Clean, formal, recruiter-focused' },
  { id: 'authentic',    label: 'Authentic',    desc: 'Personal story, emotional hook'  },
  { id: 'bold',         label: 'Bold',         desc: 'Confident, direct, attention-grabbing' },
] as const;

type Tone = typeof TONES[number]['id'];

export default function LinkedInGenerator({ profile }: Props) {
  const [tone, setTone]   = useState<Tone>('authentic');
  const [post, setPost]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateLinkedInPost(profile, tone);
      setPost(typeof result === 'string' ? result : JSON.stringify(result));
      toast.success('LinkedIn post generated!');
    } catch {
      toast.error('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const charCount    = post?.length ?? 0;
  const linkedInLimit = 3000;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="card bg-gradient-to-br from-sky-950/40 to-slate-900 border-sky-500/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Linkedin className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">LinkedIn Post Generator</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Generate a high-engagement "open to work" post tailored to your skills
              and target role — optimized for recruiter discovery.
            </p>
          </div>
        </div>
      </div>

      {/* Tone Selector */}
      <div className="card flex flex-col gap-3">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Choose your tone</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTone(t.id); setPost(null); }}
              className={`flex flex-col gap-1 p-3.5 rounded-xl border text-left transition-all ${
                tone === t.id
                  ? 'border-sky-500/40 bg-sky-500/10'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <span className={`text-sm font-semibold ${tone === t.id ? 'text-sky-300' : 'text-white'}`}>
                {t.label}
              </span>
              <span className="text-slate-500 text-xs">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Preview */}
      <div className="card border-slate-800 bg-slate-800/30 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 font-medium">Writing for:</span>
        <span className="text-white text-xs font-semibold">{profile.name}</span>
        <span className="text-slate-600">·</span>
        <span className="badge-blue badge text-xs">{profile.target_role}</span>
        <span className="badge-gray badge text-xs">{profile.experience_years} yrs exp</span>
        {profile.skills.slice(0, 3).map((s) => (
          <span key={s} className="badge-gray badge text-xs">{s}</span>
        ))}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Writing your post...</>
        ) : post ? (
          <><RefreshCw className="w-4 h-4" /> Regenerate Post</>
        ) : (
          <><Linkedin className="w-4 h-4" /> Generate LinkedIn Post</>
        )}
      </button>

      {/* Generated Post */}
      {post && (
        <div className="card border-sky-500/20 bg-slate-900 fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              Generated Post Preview
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${charCount > linkedInLimit ? 'text-red-400' : 'text-slate-500'}`}>
                {charCount}/{linkedInLimit}
              </span>
              <CopyButton text={post} />
            </div>
          </div>

          {/* LinkedIn-style card preview */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {profile.name.charAt(0)}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{profile.name}</p>
                <p className="text-slate-500 text-xs">{profile.target_role} · 1st</p>
              </div>
            </div>
            <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans px-4 py-4">
              {post}
            </pre>
            <div className="flex items-center flex-wrap gap-2 sm:gap-4 px-4 py-3 border-t border-slate-700 text-slate-500 text-xs">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>↩️ Repost</span>
              <span>📤 Send</span>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-slate-500 text-xs">
            <Hash className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Paste this into LinkedIn. Post between 8–10 AM Tuesday–Thursday for maximum recruiter visibility.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
