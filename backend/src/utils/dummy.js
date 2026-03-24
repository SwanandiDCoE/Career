/**
 * Dummy data used when USE_AI=false or USE_LIVE_JOBS=false.
 * Mirrors the exact shapes the frontend expects so the app
 * works end-to-end with zero API keys during development/demo.
 */

// ── Jobs ──────────────────────────────────────────────────────────
exports.DUMMY_JOBS = [
  {
    title: 'Frontend Engineer',
    company: 'Razorpay',
    location: 'Bangalore, India',
    job_url: 'https://razorpay.com/jobs',
    description: 'Build payment UI flows in React and TypeScript. Own performance budgets and A/B testing pipelines. Work closely with design system team.',
    date_posted: '2025-06-10',
    job_type: 'Full-time',
    source: 'linkedin',
  },
  {
    title: 'SDE-2 (React)',
    company: 'Swiggy',
    location: 'Bangalore, India',
    job_url: 'https://careers.swiggy.com',
    description: 'Scale consumer-facing web apps to 50M+ users. Strong React, Redux, and Jest required. Experience with micro-frontends is a plus.',
    date_posted: '2025-06-09',
    job_type: 'Full-time',
    source: 'indeed',
  },
  {
    title: 'Full Stack Developer',
    company: 'Zepto',
    location: 'Mumbai, India',
    job_url: 'https://zepto.com/careers',
    description: 'Own full-stack features end-to-end from React UI to Node.js APIs. Python scripting, Docker, and Kafka experience valued.',
    date_posted: '2025-06-08',
    job_type: 'Full-time',
    source: 'glassdoor',
  },
  {
    title: 'UI Engineer',
    company: 'Meesho',
    location: 'Bangalore, India',
    job_url: 'https://meesho.io/jobs',
    description: 'Translate Figma designs into pixel-perfect React components. Tailwind CSS and design-system experience required.',
    date_posted: '2025-06-07',
    job_type: 'Full-time',
    source: 'linkedin',
  },
  {
    title: 'React Developer',
    company: 'CRED',
    location: 'Bangalore, India',
    job_url: 'https://cred.club/jobs',
    description: 'Architect micro-frontends and own web performance. 4+ years React, TypeScript, PWA, and React Native experience required.',
    date_posted: '2025-06-06',
    job_type: 'Full-time',
    source: 'indeed',
  },
];

// ── Resume Profile ────────────────────────────────────────────────
exports.DUMMY_PROFILE = {
  name: 'Rahul Sharma',
  email: 'rahul.sharma@gmail.com',
  skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'REST APIs', 'Git', 'SQL'],
  experience_years: 2,
  education: 'B.Tech CSE — VIT University',
  target_role: 'Frontend Developer',
};

// ── Job Matches ───────────────────────────────────────────────────
exports.DUMMY_MATCHES = [
  {
    title: 'Frontend Engineer',
    company: 'Razorpay',
    location: 'Bangalore, India',
    job_url: 'https://razorpay.com/jobs',
    match_score: 91,
    matched_skills: ['React', 'TypeScript', 'Next.js', 'REST APIs', 'Git'],
    missing_skills: ['GraphQL', 'Storybook'],
    reason: "Strong React + TypeScript stack aligns perfectly with Razorpay's frontend requirements.",
    verdict: 'Strong Match',
  },
  {
    title: 'SDE-2 (React)',
    company: 'Swiggy',
    location: 'Bangalore, India',
    job_url: 'https://careers.swiggy.com',
    match_score: 78,
    matched_skills: ['React', 'Next.js', 'Node.js', 'Tailwind CSS'],
    missing_skills: ['Redux', 'Jest', 'Cypress'],
    reason: 'Solid foundation but lacks testing framework experience explicitly required.',
    verdict: 'Good Match',
  },
  {
    title: 'Full Stack Developer',
    company: 'Zepto',
    location: 'Mumbai, India',
    job_url: 'https://zepto.com/careers',
    match_score: 65,
    matched_skills: ['React', 'Node.js', 'SQL', 'REST APIs'],
    missing_skills: ['Python', 'Docker', 'Kafka'],
    reason: 'Frontend strong but role requires backend infra knowledge not yet present.',
    verdict: 'Good Match',
  },
  {
    title: 'UI Engineer',
    company: 'Meesho',
    location: 'Bangalore, India',
    job_url: 'https://meesho.io/jobs',
    match_score: 82,
    matched_skills: ['React', 'Tailwind CSS', 'TypeScript', 'Git'],
    missing_skills: ['Figma handoff', 'A/B testing'],
    reason: 'Design-to-code skills and Tailwind proficiency are exactly what Meesho needs.',
    verdict: 'Good Match',
  },
  {
    title: 'React Developer',
    company: 'CRED',
    location: 'Bangalore, India',
    job_url: 'https://cred.club/jobs',
    match_score: 54,
    matched_skills: ['React', 'TypeScript'],
    missing_skills: ['Micro-frontends', 'Web Performance', 'PWA', 'React Native'],
    reason: 'Core skills match but CRED requires senior-level architecture experience.',
    verdict: 'Partial Match',
  },
];

// ── Resume Feedback ───────────────────────────────────────────────
exports.DUMMY_FEEDBACK = {
  overall_score: 68,
  strengths: [
    'Strong technical skills section with relevant modern stack (React, TypeScript, Next.js)',
    'Education section is clean and prominently placed',
    'Projects section demonstrates hands-on experience with real deliverables',
  ],
  suggestions: [
    'Add quantified impact to each work experience bullet (e.g. "Reduced load time by 40%")',
    'Move your Skills section above Education — recruiters scan skills first',
    'Add a 2-line professional summary at the top tailored to your target role',
    'Include GitHub and LinkedIn URLs — many ATS systems extract these automatically',
    'Use consistent date formatting throughout (currently mixing formats)',
  ],
  ats_tips: [
    'Avoid tables or columns — ATS parsers often misread them as garbled text',
    'Use standard section headers: "Experience", "Education", "Skills" — not creative labels',
    'Increase keyword density: include "frontend development", "web application", "responsive design"',
  ],
};

// ── Apply Strategy ────────────────────────────────────────────────
exports.DUMMY_STRATEGY = {
  match_score: 78,
  match_summary: 'Your React and TypeScript experience is a strong fit for the core UI work at Razorpay. The main gap is around payment-domain knowledge and testing frameworks — both closeable within 3-4 weeks.',

  strengths: [
    'Your 2 years of production React + TypeScript directly matches Razorpay\'s primary stack — the checkout team rebuilds are all TypeScript-first',
    'Next.js experience is relevant: Razorpay\'s consumer dashboard is a Next.js app and they list it as preferred',
    'REST API integration experience aligns with their requirement for engineers who own both UI and BFF (backend-for-frontend) layers',
  ],

  missing_skills: [
    {
      skill: 'Jest / React Testing Library',
      importance: 'critical',
      context: 'Razorpay requires 80%+ test coverage on all payment flows — they ask about testing in every frontend interview round',
    },
    {
      skill: 'GraphQL',
      importance: 'important',
      context: 'Their internal tooling team uses GraphQL for the merchant dashboard APIs — not required day-one but expected within 3 months',
    },
    {
      skill: 'Web Performance Optimization',
      importance: 'important',
      context: 'Payment pages must load under 1.5s globally — they explicitly test candidates on Lighthouse audits and bundle analysis',
    },
    {
      skill: 'Storybook',
      importance: 'nice-to-have',
      context: 'Razorpay\'s design system team uses Storybook for component documentation — mentioned in JD as a plus',
    },
  ],

  improvement_actions: [
    {
      type: 'resume_edit',
      action: 'Your "E-commerce Dashboard" project bullet currently says "Built dashboard with React". Rewrite it to: "Built real-time sales dashboard with React + TypeScript — reduced data fetch latency by 40% using SWR caching, achieving <2s load time on 3G". This directly addresses Razorpay\'s performance obsession.',
      impact: 'high',
    },
    {
      type: 'skill_to_learn',
      action: 'Complete "Testing React Apps" on TestingJavaScript.com by Kent C. Dodds — specifically the "Testing Implementation Details" and "Integration Tests" modules. 6 hours total. Gets you to the level where you can confidently answer "How do you test a payment form with async validation?"',
      impact: 'high',
    },
    {
      type: 'project_to_build',
      action: 'Build a Razorpay Payment Button clone: React + TypeScript form that integrates with Razorpay\'s test API, handles success/failure webhooks, and has 90%+ Jest coverage. Deploy on Vercel and link in your resume. This is the single most powerful portfolio piece for this application.',
      impact: 'high',
    },
    {
      type: 'resume_edit',
      action: 'Add a "Performance" line to your skills section: "Web Performance: Lighthouse audits, bundle analysis, lazy loading, code splitting". This keyword appears 3 times in Razorpay\'s JD and is likely in their ATS filter.',
      impact: 'medium',
    },
    {
      type: 'skill_to_learn',
      action: 'Read "Web Performance 101" on web.dev/performance — 2 hours. Focus on the Core Web Vitals module. You need to be able to explain LCP, FID, and CLS in your interview — Razorpay asks this in round 1.',
      impact: 'medium',
    },
  ],

  interview_tips: [
    {
      likely_question: 'How would you optimize a payment checkout page that\'s loading slowly on mobile?',
      why_they_ask: 'Payment conversion drops 7% for every 100ms delay — this is a real business problem Razorpay\'s frontend team owns',
      how_to_answer: 'Use your dashboard project as the anchor: "On my sales dashboard I diagnosed a 3.2s LCP using Lighthouse. I found two issues: a 400KB unminified vendor bundle and synchronous API calls blocking render. I code-split the chart library and moved API calls to SWR with optimistic UI — brought LCP to 1.4s. For a payment page specifically, I\'d also add resource hints for the payment SDK, eliminate render-blocking scripts, and lazy-load everything below the fold."',
    },
    {
      likely_question: 'Walk me through how you\'d test a checkout form that has async field validation and a payment API call.',
      why_they_ask: 'They need to know you can write tests that catch real bugs, not just tests that confirm the code runs',
      how_to_answer: 'Be specific: "I\'d use React Testing Library to test from the user\'s perspective. Three test layers: (1) Unit test the validation logic in isolation, (2) Integration test the form component with msw to mock the payment API — test success, failure, and network timeout scenarios, (3) E2E with Playwright for the full checkout flow. I\'d specifically test that the submit button is disabled during the API call and that error messages appear in the right place."',
    },
    {
      likely_question: 'Tell me about a time you had to debug a production issue under pressure.',
      why_they_ask: 'Razorpay\'s systems handle live payments — they need engineers who stay calm and methodical during incidents',
      how_to_answer: 'Use your real work: "During a demo to a client, the dashboard stopped updating in real-time. I had 10 minutes. I checked the browser console — WebSocket was reconnecting every 5 seconds. Traced it to a useEffect cleanup that was killing the connection on every state change. Fixed by moving the socket reference to useRef and only initializing once. I documented the root cause and added a test to catch it. The key lesson: always check network tab first before touching code."',
    },
  ],

  application_priority: 'apply_after_improvements',
  priority_reason: 'You\'re 78% there — adding Jest tests to your existing project and rewriting 2 resume bullets will push you to 88%+ and put you in the "strong match" pool within 2 weeks.',
};

// ── Cold Email ────────────────────────────────────────────────────
exports.DUMMY_COLD_EMAIL = (jobTitle, company, topSkill) => `Subject: ${jobTitle} — excited about ${company}'s engineering challenges

Hi [Hiring Manager's Name],

I've been following ${company}'s engineering blog — your recent work on scaling the frontend impressed me deeply.

I'm Rahul, a frontend engineer with 2 years of production experience in ${topSkill} and React. I recently built a real-time dashboard that reduced client-side latency by 35%, which made me think I could add direct value to your team.

I'd love a 20-minute call to learn more about the role. Happy to share my GitHub or do a quick technical exercise.

Thanks for your time,
Rahul Sharma
rahul.sharma@gmail.com | github.com/rahulsharma`;

// ── LinkedIn Post ─────────────────────────────────────────────────
exports.DUMMY_LINKEDIN_POST = (name, role, skills) => `Two years ago I was rejected from 60 jobs in a row. Today I get interviews every week. Here's what changed 👇

I stopped applying to everything and started applying smart.

I now only apply to roles where my skills are an 80%+ match. I quantified every bullet on my resume. I rewrote my headline to say what I do, not what I am.

Skills I bring to the table:
${skills.slice(0, 3).map(s => `→ ${s}`).join('\n')}
→ ${(new Date().getFullYear() - 2023)} years of production experience

I'm currently open to ${role} roles in Bangalore (hybrid/remote).

If you're building something interesting, let's talk. My DMs are open.

#OpenToWork #Frontend #ReactJS #WebDevelopment #SoftwareEngineering`;
