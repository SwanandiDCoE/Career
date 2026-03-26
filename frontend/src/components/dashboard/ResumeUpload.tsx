'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileCheck2, X, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { uploadResume } from '@/lib/api';
import type { AnalysisResult } from '@/types';

interface Props {
  onResult: (result: AnalysisResult) => void;
  onLoadingChange?: (loading: boolean) => void;
  hasResult: boolean;
}

export default function ResumeUpload({ onResult, onLoadingChange, hasResult }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      toast.success(`"${accepted[0].name}" ready to analyze`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.code === 'file-too-large'
        ? 'File is too large (max 5MB)'
        : 'Only PDF files are allowed';
      toast.error(msg);
    },
  });

  const handleAnalyze = async () => {
    if (!file || !jobTitle.trim()) {
      toast.error('Please upload a resume and enter a job title');
      return;
    }
    setLoading(true);
    onLoadingChange?.(true);
    try {
      // Call real backend — parses PDF, queries live DB jobs, scores them
      const result = await uploadResume(file, jobTitle.trim(), location.trim());
      // Backend wraps in { success, data } — unwrap if needed
      const data = (result as any).data ?? result;
      onResult(data);
      const count = data?.matches?.length ?? 0;
      toast.success(`Found ${count} real job matches!`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Analysis failed';
      toast.error(msg);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white text-sm flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-indigo-400" />
          Upload Resume
        </h2>
        {hasResult && <span className="badge-green badge text-xs">Analyzed</span>}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
            : file
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/40'
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-left">
              <p className="text-emerald-300 text-sm font-semibold truncate max-w-[120px] sm:max-w-[200px]">{file.name}</p>
              <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="ml-auto text-slate-500 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className={cn('w-8 h-8 mx-auto mb-2 transition-colors', isDragActive ? 'text-indigo-400' : 'text-slate-600')} />
            <p className="text-slate-300 text-sm font-medium">
              {isDragActive ? 'Drop your PDF here' : 'Drag & drop your resume'}
            </p>
            <p className="text-slate-600 text-xs mt-1">PDF only · Max 5MB</p>
          </>
        )}
      </div>

      {/* Job Title Input */}
      <input
        type="text"
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        placeholder="Target role (e.g. Frontend Developer)"
        className="input text-sm"
      />

      {/* Location Input */}
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location (e.g. Bangalore, Remote)"
        className="input text-sm"
      />

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !jobTitle.trim()}
        className="btn-primary w-full text-sm"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your profile...</>
        ) : (
          <><Search className="w-4 h-4" /> Find My Job Matches</>
        )}
      </button>

      {loading && (
        <div className="space-y-2">
          {['Parsing your resume...', 'Fetching live jobs...', 'Scoring with AI...'].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400 shrink-0" />
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
