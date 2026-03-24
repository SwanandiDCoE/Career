import type { AnalysisResult } from '@/types';

export const DUMMY_RESULT: AnalysisResult = {
  profile: {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'REST APIs', 'Git', 'SQL'],
    experience_years: 2,
    education: 'B.Tech CSE — VIT University',
    target_role: 'Frontend Developer',
  },
  matches: [
    {
      title: 'Frontend Engineer',
      company: 'Razorpay',
      location: 'Bangalore, India',
      job_url: '#',
      match_score: 91,
      matched_skills: ['React', 'TypeScript', 'Next.js', 'REST APIs', 'Git'],
      missing_skills: ['GraphQL', 'Storybook'],
      reason: 'Strong React + TypeScript stack aligns perfectly with Razorpay\'s frontend requirements.',
      verdict: 'Strong Match',
    },
    {
      title: 'SDE-2 (React)',
      company: 'Swiggy',
      location: 'Bangalore, India',
      job_url: '#',
      match_score: 78,
      matched_skills: ['React', 'Next.js', 'Node.js', 'Tailwind CSS'],
      missing_skills: ['Redux', 'Jest', 'Cypress'],
      reason: 'Solid foundation match but lacks testing framework experience they explicitly require.',
      verdict: 'Good Match',
    },
    {
      title: 'Full Stack Developer',
      company: 'Zepto',
      location: 'Mumbai, India',
      job_url: '#',
      match_score: 65,
      matched_skills: ['React', 'Node.js', 'SQL', 'REST APIs'],
      missing_skills: ['Python', 'Docker', 'Kafka'],
      reason: 'Frontend skills are a good match but the role requires backend infra knowledge you don\'t yet have.',
      verdict: 'Good Match',
    },
    {
      title: 'React Developer',
      company: 'CRED',
      location: 'Bangalore, India',
      job_url: '#',
      match_score: 54,
      matched_skills: ['React', 'TypeScript'],
      missing_skills: ['Micro-frontends', 'Web Performance', 'PWA', 'React Native'],
      reason: 'Core skills match but CRED requires senior-level architecture experience.',
      verdict: 'Partial Match',
    },
    {
      title: 'UI Engineer',
      company: 'Meesho',
      location: 'Bangalore, India',
      job_url: '#',
      match_score: 82,
      matched_skills: ['React', 'Tailwind CSS', 'TypeScript', 'Git'],
      missing_skills: ['Figma handoff experience', 'A/B testing'],
      reason: 'Design-to-code skills and Tailwind proficiency are exactly what Meesho UI team needs.',
      verdict: 'Good Match',
    },
  ],
  feedback: {
    overall_score: 68,
    strengths: [
      'Strong technical skills section with relevant modern stack (React, TypeScript, Next.js)',
      'Education section is clean and prominently placed',
      'Projects section demonstrates hands-on experience',
    ],
    suggestions: [
      'Add quantified impact to each work experience bullet (e.g. "Reduced load time by 40%")',
      'Move your Skills section above Education — recruiters scan skills first',
      'Add a 2-line professional summary at the top tailored to your target role',
      'Include GitHub and LinkedIn URLs — many ATS systems extract these',
      'Use consistent date formatting throughout (currently mixing "Jan 2023" and "2023-01")',
    ],
    ats_tips: [
      'Avoid using tables or columns — ATS parsers often misread them as garbled text',
      'Use standard section headers: "Experience", "Education", "Skills" — not creative labels',
      'Increase keyword density: include "frontend development", "web application", "responsive design"',
    ],
  },
};

export const DUMMY_STRATEGY = {
  match_score: 78,
  match_summary: "Your React and TypeScript experience is a strong fit for the core UI work at Razorpay. The main gap is around payment-domain knowledge and testing frameworks — both closeable within 3–4 weeks.",
  strengths: [
    "Your 2 years of production React + TypeScript directly matches Razorpay's primary stack — the checkout team rebuilds are all TypeScript-first",
    "Next.js experience is relevant: Razorpay's consumer dashboard is a Next.js app and they list it as preferred",
    "REST API integration experience aligns with their requirement for engineers who own both UI and BFF layers",
  ],
  missing_skills: [
    { skill: "Jest / React Testing Library", importance: "critical" as const, context: "Razorpay requires 80%+ test coverage on all payment flows — they ask about testing in every frontend interview round" },
    { skill: "GraphQL", importance: "important" as const, context: "Their internal tooling team uses GraphQL for the merchant dashboard APIs — expected within 3 months" },
    { skill: "Web Performance Optimization", importance: "important" as const, context: "Payment pages must load under 1.5s globally — they test candidates on Lighthouse audits and bundle analysis" },
    { skill: "Storybook", importance: "nice-to-have" as const, context: "Razorpay's design system team uses Storybook for component documentation — mentioned as a plus" },
  ],
  improvement_actions: [
    { type: "resume_edit" as const, action: "Your 'E-commerce Dashboard' bullet says 'Built dashboard with React'. Rewrite to: 'Built real-time sales dashboard with React + TypeScript — reduced data fetch latency by 40% using SWR caching, achieving <2s load time on 3G'. This directly addresses Razorpay's performance obsession.", impact: "high" as const },
    { type: "skill_to_learn" as const, action: "Complete 'Testing React Apps' on TestingJavaScript.com by Kent C. Dodds — specifically the Integration Tests module. 6 hours total. Gets you to the level where you can answer 'How do you test a payment form with async validation?'", impact: "high" as const },
    { type: "project_to_build" as const, action: "Build a Razorpay Payment Button clone: React + TypeScript form that integrates with Razorpay's test API, handles success/failure webhooks, and has 90%+ Jest coverage. Deploy on Vercel, link in your resume.", impact: "high" as const },
    { type: "resume_edit" as const, action: "Add a 'Performance' line to your skills section: 'Web Performance: Lighthouse audits, bundle analysis, lazy loading, code splitting'. This keyword appears 3 times in Razorpay's JD and is likely in their ATS filter.", impact: "medium" as const },
    { type: "skill_to_learn" as const, action: "Read 'Web Performance 101' on web.dev/performance — 2 hours. Focus on Core Web Vitals. You need to explain LCP, FID, and CLS in your interview — Razorpay asks this in round 1.", impact: "medium" as const },
  ],
  interview_tips: [
    { likely_question: "How would you optimize a payment checkout page that's loading slowly on mobile?", why_they_ask: "Payment conversion drops 7% for every 100ms delay — this is a real business problem Razorpay's frontend team owns", how_to_answer: "Use your dashboard project as the anchor: 'On my sales dashboard I diagnosed a 3.2s LCP using Lighthouse. Found two issues: a 400KB unminified vendor bundle and synchronous API calls blocking render. I code-split the chart library and moved calls to SWR — brought LCP to 1.4s. For a payment page I'd also add resource hints for the payment SDK and eliminate render-blocking scripts.'" },
    { likely_question: "Walk me through how you'd test a checkout form with async validation and a payment API call.", why_they_ask: "They need to know you write tests that catch real bugs, not just tests that confirm the code runs", how_to_answer: "Be specific: 'I'd use React Testing Library — three layers: (1) Unit test validation logic in isolation, (2) Integration test the form with msw to mock the payment API — test success, failure, and network timeout, (3) E2E with Playwright for the full checkout flow. I'd specifically test that the submit button is disabled during the API call.'" },
    { likely_question: "Tell me about a time you debugged a production issue under pressure.", why_they_ask: "Razorpay handles live payments — they need engineers who stay calm and methodical during incidents", how_to_answer: "Use your real work: 'During a client demo, the dashboard stopped updating in real-time. I had 10 minutes. Checked the browser console — WebSocket was reconnecting every 5 seconds. Traced it to a useEffect cleanup killing the connection on every state change. Fixed by moving the socket to useRef. Key lesson: always check network tab first.'" },
  ],
  application_priority: "apply_after_improvements" as const,
  priority_reason: "You're 78% there — adding Jest tests to your existing project and rewriting 2 resume bullets will push you to 88%+ within 2 weeks.",
};

export const DUMMY_COLD_EMAIL = `Subject: React Engineer excited about Razorpay's frontend challenges

Hi [Hiring Manager's Name],

I've been following Razorpay's engineering blog for a while — your post on optimizing checkout performance was genuinely impressive.

I'm Rahul, a frontend engineer with 2 years of production experience in React and TypeScript. I recently built a real-time dashboard that reduced client-side data latency by 35%, which made me think I could add real value to your payments UI team.

I'd love a 20-minute call to learn more about the role. Happy to share my GitHub or do a quick code challenge if helpful.

Thanks for your time,
Rahul Sharma
rahul.sharma@gmail.com · github.com/rahulsharma`;

export const DUMMY_LINKEDIN_POST = `Two years ago I was rejected from 60 jobs in a row. Today I'm getting interviews every week. Here's what changed 👇

I stopped applying to everything and started applying smart.

I now only apply to roles where my skills are an 80%+ match. I quantified every bullet on my resume. I rewrote my headline to say what I do, not what I am.

Skills I bring to the table:
→ React, Next.js, TypeScript
→ Node.js, REST APIs
→ 2 years of production frontend experience

I'm currently open to Frontend Engineer / SDE roles in Bangalore (hybrid/remote).

If you're building something interesting, let's talk. My DMs are open.

#OpenToWork #Frontend #ReactJS #WebDevelopment #SoftwareEngineering`;
