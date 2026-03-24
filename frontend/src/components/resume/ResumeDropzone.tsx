'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onUpload: (file: File, jobTitle: string, location: string) => void;
  loading: boolean;
}

export default function ResumeDropzone({ onUpload, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleSubmit = () => {
    if (!file || !jobTitle) return;
    onUpload(file, jobTitle, location);
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          'card border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-12 transition-colors',
          isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-gray-700 hover:border-gray-500'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-10 h-10 text-gray-500 mb-3" />
        {file ? (
          <p className="text-brand-400 font-semibold">{file.name}</p>
        ) : (
          <>
            <p className="text-gray-300 font-medium">Drop your PDF resume here</p>
            <p className="text-gray-500 text-sm mt-1">or click to browse</p>
          </>
        )}
      </div>

      <input
        type="text"
        placeholder="Target job title (e.g. Frontend Developer)"
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
      />
      <input
        type="text"
        placeholder="Location (e.g. Bangalore, Remote)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
      />

      <button
        onClick={handleSubmit}
        disabled={!file || !jobTitle || loading}
        className="btn-primary w-full"
      >
        {loading ? 'Analyzing your resume...' : 'Find My Job Matches →'}
      </button>
    </div>
  );
}
