import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: "Hirenext — Find Jobs You'll Actually Get",
  description:
    'Upload your resume and get AI-ranked job matches, resume feedback, cold emails, and LinkedIn posts — in 30 seconds.',
  keywords: ['job search', 'AI resume', 'job matching', 'career'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster
          position="top-right"
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
