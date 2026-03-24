/**
 * resumeParser.js
 * ───────────────
 * Zero-dependency resume parser using regex + keyword matching.
 * Extracts skills, name, email, experience, and education
 * directly from raw PDF text — no AI key needed.
 */

// ── Master skill list ────────────────────────────────────────────
const SKILL_LIST = [
  // Languages
  'JavaScript','TypeScript','Python','Java','Go','Golang','Rust','C++','C#','Ruby',
  'PHP','Swift','Kotlin','Scala','R','MATLAB','Perl','Bash','Shell','PowerShell',
  // Frontend
  'React','React.js','Next.js','Vue','Vue.js','Angular','Svelte','Nuxt.js',
  'Redux','Zustand','Recoil','MobX','React Query','TanStack Query',
  'HTML','CSS','Sass','SCSS','Tailwind','Tailwind CSS','Bootstrap','Material UI',
  'Chakra UI','Styled Components','Emotion','Webpack','Vite','Parcel','Rollup',
  'Storybook','Figma','Jest','Vitest','Cypress','Playwright','Testing Library',
  'GraphQL','Apollo','tRPC','WebSockets','PWA',
  // Backend
  'Node.js','Express','Express.js','Fastify','NestJS','Django','Flask','FastAPI',
  'Spring','Spring Boot','Rails','Laravel','ASP.NET','.NET','gRPC','REST','REST API',
  'Microservices','Kafka','RabbitMQ','Redis','Celery','GraphQL',
  // Databases
  'PostgreSQL','MySQL','SQLite','MongoDB','DynamoDB','Cassandra','Redis',
  'Elasticsearch','Prisma','TypeORM','Sequelize','SQLAlchemy','Firebase',
  'Supabase','PlanetScale','CockroachDB',
  // Cloud & DevOps
  'AWS','Azure','GCP','Google Cloud','Docker','Kubernetes','Terraform','Ansible',
  'Helm','Jenkins','GitHub Actions','GitLab CI','CircleCI','ArgoCD','Prometheus',
  'Grafana','Datadog','New Relic','Nginx','Apache','Linux','Ubuntu',
  // Data & AI/ML
  'TensorFlow','PyTorch','Keras','scikit-learn','Pandas','NumPy','Spark',
  'Airflow','dbt','Snowflake','BigQuery','Redshift','Tableau','Power BI',
  'LangChain','OpenAI','Hugging Face','LLM','RAG','Machine Learning','Deep Learning',
  'NLP','Computer Vision','Data Engineering','Data Science','MLOps',
  // Mobile
  'React Native','Flutter','Dart','Android','iOS','Xcode','Swift UI',
  // Tools & Practices
  'Git','GitHub','GitLab','Bitbucket','Jira','Confluence','Notion','Postman',
  'CI/CD','Agile','Scrum','TDD','BDD','System Design','Microservices',
  'API Design','OAuth','JWT','gRPC','WebRTC',
  // Soft skills worth tracking
  'Leadership','Mentoring','Code Review','Technical Writing','Communication',
];

// Build a case-insensitive regex that matches whole words
const _SKILL_PATTERNS = SKILL_LIST.map(skill => ({
  skill,
  re: new RegExp(`(?<![\\w.])${skill.replace(/[.+]/g, '\\$&')}(?![\\w.])`, 'gi'),
}));

function extractSkills(text) {
  const found = new Set();
  for (const { skill, re } of _SKILL_PATTERNS) {
    if (re.test(text)) found.add(skill);
    re.lastIndex = 0; // reset stateful regex
  }
  return [...found];
}

// ── Email ────────────────────────────────────────────────────────
function extractEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : '';
}

// ── Name ─────────────────────────────────────────────────────────
// Heuristic: first non-empty line that is 2-4 words, no special chars,
// and does NOT look like a section header or email.
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 15)) {
    if (line.includes('@')) continue;
    if (/^\d/.test(line)) continue;
    if (/[|•·\/\\]/.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Z][a-zA-Z'-]+$/.test(w))) {
      return line;
    }
  }
  return 'Candidate';
}

// ── Experience years ─────────────────────────────────────────────
// Scan for year ranges like "2019 – 2023" or "Jan 2020 - Present"
// and sum up the durations.
function extractExperienceYears(text) {
  const currentYear = new Date().getFullYear();
  let totalMonths = 0;

  // Pattern: 4-digit year (optional month) – 4-digit year OR "Present"/"Current"
  const rangeRe = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*(\d{4})\s*[-–—to]+\s*(present|current|now|(\d{4}))/gi;
  let m;
  while ((m = rangeRe.exec(text)) !== null) {
    const start = parseInt(m[1], 10);
    const end = m[3] ? parseInt(m[3], 10) : currentYear;
    if (start >= 1990 && start <= currentYear && end >= start && end <= currentYear + 1) {
      totalMonths += (end - start) * 12;
    }
  }

  const years = Math.round(totalMonths / 12);
  return Math.min(years, 30); // cap at 30
}

// ── Education ────────────────────────────────────────────────────
const EDU_RE = /(b\.?tech|b\.?e\.?|m\.?tech|m\.?s\.?|m\.?sc\.?|b\.?sc\.?|phd|m\.?b\.?a|bachelor|master|doctor)[^,\n]{0,60}/i;

function extractEducation(text) {
  const m = text.match(EDU_RE);
  return m ? m[0].trim() : '';
}

// ── Main export ──────────────────────────────────────────────────
function parseResume(text, targetRole) {
  return {
    name:             extractName(text),
    email:            extractEmail(text),
    skills:           extractSkills(text),
    experience_years: extractExperienceYears(text),
    education:        extractEducation(text),
    target_role:      targetRole,
  };
}

module.exports = { parseResume };
