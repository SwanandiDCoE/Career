'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ResumeDropzone from '@/components/resume/ResumeDropzone';
import { uploadResume } from '@/lib/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File, jobTitle: string, location: string) => {
    setLoading(true);
    try {
      const data = await uploadResume(file, jobTitle, location);
      // Store result in sessionStorage for dashboard
      sessionStorage.setItem('careerpilot_result', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h2 className="text-3xl font-bold mb-2">Upload Your Resume</h2>
      <p className="text-gray-400 mb-8">PDF format only. We'll handle the rest.</p>
      <ResumeDropzone onUpload={handleUpload} loading={loading} />
    </main>
  );
}
