'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  name: string;
  role: string;
  score: number | null;
}

export default function ShareButtons({ url, name, role, score }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const scoreText = score ? ` with a ${score}/100 resume score` : '';
  const shareText = `I just analysed my resume on HireNext${scoreText}. See my top job matches as a ${role} →`;

  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;
  const twitter  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select a hidden input
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 14px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    transition: 'opacity 0.15s',
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div style={{ padding: '0 20px 18px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>
        SHARE YOUR RESULTS
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Copy link */}
        <button
          onClick={copyLink}
          style={{
            ...btnBase,
            background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
            color: copied ? '#34d399' : '#94a3b8',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {copied ? (
            <>{checkIcon} Copied!</>
          ) : (
            <>{linkIcon} Copy link</>
          )}
        </button>

        {/* LinkedIn */}
        <a href={linkedin} target="_blank" rel="noopener noreferrer"
          style={{
            ...btnBase,
            background: 'rgba(10,102,194,0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(10,102,194,0.3)',
          }}
        >
          {linkedinIcon} LinkedIn
        </a>

        {/* WhatsApp */}
        <a href={whatsapp} target="_blank" rel="noopener noreferrer"
          style={{
            ...btnBase,
            background: 'rgba(37,211,102,0.1)',
            color: '#4ade80',
            border: '1px solid rgba(37,211,102,0.25)',
          }}
        >
          {whatsappIcon} WhatsApp
        </a>

        {/* X / Twitter */}
        <a href={twitter} target="_blank" rel="noopener noreferrer"
          style={{
            ...btnBase,
            background: 'rgba(255,255,255,0.05)',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {xIcon} Post
        </a>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ──────────────────────────────────────────── */
const linkIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const checkIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const linkedinIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const whatsappIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const xIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.833L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
