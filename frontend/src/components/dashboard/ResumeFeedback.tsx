'use client';

import {
  CheckCircle2, Lightbulb, ShieldAlert, ArrowUpRight,
} from 'lucide-react';
import type { ResumeFeedback as ResumeFeedbackType } from '@/types';
import ScoreRing from '@/components/ui/ScoreRing';

interface Props {
  feedback: ResumeFeedbackType;
}

export default function ResumeFeedback({ feedback }: Props) {
  const scoreLabel =
    feedback.overall_score >= 80 ? 'Excellent'
    : feedback.overall_score >= 65 ? 'Good'
    : feedback.overall_score >= 50 ? 'Needs Work'
    : 'Poor';

  const scoreSub =
    feedback.overall_score >= 80 ? 'Your resume is recruiter-ready.'
    : feedback.overall_score >= 65 ? 'A few tweaks will make a big difference.'
    : feedback.overall_score >= 50 ? 'Several important improvements needed.'
    : 'Significant restructuring recommended.';

  return (
    <div className="flex flex-col gap-5">
      {/* Overall Score Banner */}
      <div className="card bg-gradient-to-br from-slate-900 to-slate-900/60 border-slate-700/60 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <ScoreRing score={feedback.overall_score} size={80} />
          <div className="flex-1 sm:flex-none">
            <p className="text-slate-400 text-sm mb-1">Resume Score</p>
            <h3 className="text-white text-2xl font-black">{scoreLabel}</h3>
            <p className="text-slate-400 text-sm mt-1">{scoreSub}</p>
          </div>
        </div>

        {/* Score breakdown bars */}
        <div className="w-full sm:ml-auto sm:min-w-[160px] flex flex-col gap-2">
          {[
            { label: 'Clarity',   val: Math.min(100, feedback.overall_score + 8)  },
            { label: 'Impact',    val: Math.max(0,   feedback.overall_score - 12) },
            { label: 'ATS Ready', val: Math.max(0,   feedback.overall_score - 5)  },
            { label: 'Keywords',  val: Math.min(100, feedback.overall_score + 4)  },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                <span>{item.label}</span>
                <span>{item.val}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${item.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Three columns of feedback */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Strengths */}
        <FeedbackSection
          title="Strengths"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          accentClass="border-emerald-500/20 bg-emerald-500/5"
          labelClass="text-emerald-400"
          items={feedback.strengths}
          bulletClass="text-emerald-500"
        />

        {/* Improvements */}
        <FeedbackSection
          title="Improvements"
          icon={<Lightbulb className="w-4 h-4 text-yellow-400" />}
          accentClass="border-yellow-500/20 bg-yellow-500/5"
          labelClass="text-yellow-400"
          items={feedback.suggestions}
          bulletClass="text-yellow-500"
        />

        {/* ATS Tips */}
        <FeedbackSection
          title="ATS Tips"
          icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
          accentClass="border-red-500/20 bg-red-500/5"
          labelClass="text-red-400"
          items={feedback.ats_tips}
          bulletClass="text-red-500"
        />
      </div>

      {/* Quick Action */}
      <div className="card border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              Next Best Action
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              {feedback.overall_score >= 75
                ? 'Your resume is strong. Focus on personalizing it per job description and writing targeted cold emails.'
                : feedback.overall_score >= 55
                  ? 'Add measurable impact to your work bullets (numbers, percentages, scale). This single change can raise your score by 15+ points.'
                  : 'Start with structure: one column, standard section headers, and a 2-line professional summary. ATS parsers need clean formatting.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackSection({
  title, icon, accentClass, labelClass, items, bulletClass,
}: {
  title: string;
  icon: React.ReactNode;
  accentClass: string;
  labelClass: string;
  items: string[];
  bulletClass: string;
}) {
  return (
    <div className={`card border ${accentClass} flex flex-col gap-3`}>
      <h4 className={`text-sm font-semibold flex items-center gap-2 ${labelClass}`}>
        {icon} {title}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-slate-300 text-sm leading-relaxed">
            <span className={`mt-0.5 shrink-0 ${bulletClass}`}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
