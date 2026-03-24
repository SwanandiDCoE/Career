'use client';

import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import type { ResumeFeedback } from '@/types';
import { getScoreColor } from '@/lib/utils';

interface Props {
  feedback: ResumeFeedback;
}

export default function ResumeFeedbackPanel({ feedback }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Overall Score */}
      <div className="card flex items-center gap-6">
        <div className={`text-6xl font-black ${getScoreColor(feedback.overall_score)}`}>
          {feedback.overall_score}
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Resume Score</p>
          <p className="text-gray-400 text-sm">Out of 100 — based on clarity, impact, and ATS readiness</p>
        </div>
      </div>

      {/* Strengths */}
      <div className="card">
        <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Strengths
        </h3>
        <ul className="flex flex-col gap-2">
          {feedback.strengths.map((s, i) => (
            <li key={i} className="text-gray-300 text-sm">• {s}</li>
          ))}
        </ul>
      </div>

      {/* Suggestions */}
      <div className="card">
        <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> Improvements
        </h3>
        <ul className="flex flex-col gap-2">
          {feedback.suggestions.map((s, i) => (
            <li key={i} className="text-gray-300 text-sm">• {s}</li>
          ))}
        </ul>
      </div>

      {/* ATS Tips */}
      <div className="card">
        <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> ATS Optimization Tips
        </h3>
        <ul className="flex flex-col gap-2">
          {feedback.ats_tips.map((s, i) => (
            <li key={i} className="text-gray-300 text-sm">• {s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
