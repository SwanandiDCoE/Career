import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: "HireNext — Find Jobs You'll Actually Get",
  description:
    'Upload your resume and get AI-ranked job matches, skill gap analysis, cold emails, and an apply strategy — in 30 seconds. No account needed.',
  keywords: ['job search', 'AI resume', 'job matching', 'career', 'HireNext', 'skill gap analysis'],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
      </body>
    </html>
  );
}
