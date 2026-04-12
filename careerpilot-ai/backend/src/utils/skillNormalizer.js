/**
 * Skill Normalizer
 *
 * Maintains a canonical form for every known tech skill, plus all its
 * common aliases / abbreviations / misspellings.
 *
 * Usage:
 *   normalizeSkill("JS")      → "JavaScript"
 *   normalizeSkill("Postgres")→ "PostgreSQL"
 *   normalizeSkills(arr)      → deduplicated canonical array
 */

// canonical → [aliases]
const SKILL_ALIASES = {
  'JavaScript':    ['js', 'javascript', 'java script', 'ecmascript', 'es6', 'es2015', 'es2020', 'vanilla js', 'vanilla javascript'],
  'TypeScript':    ['ts', 'typescript', 'type script'],
  'Python':        ['python3', 'python 3', 'py'],
  'Java':          ['core java', 'java se', 'java ee', 'j2ee', 'java8', 'java 8', 'java 11', 'java 17'],
  'C++':           ['c plus plus', 'cpp', 'c/c++'],
  'C#':            ['c sharp', 'csharp', 'dotnet c#'],
  'Go':            ['golang', 'go lang'],
  'Rust':          ['rust lang'],
  'Ruby':          ['ruby lang'],
  'PHP':           ['php7', 'php8'],
  'Swift':         ['swift ui', 'swiftui'],
  'Kotlin':        ['kotlin android'],
  'Scala':         [],
  'R':             ['r language', 'r programming'],
  'MATLAB':        ['matlab'],

  // Frontend frameworks
  'React':         ['reactjs', 'react.js', 'react js', 'react native web', 'react hooks'],
  'Next.js':       ['nextjs', 'next js', 'next.js'],
  'Vue.js':        ['vue', 'vuejs', 'vue js', 'vue 3', 'nuxt', 'nuxtjs'],
  'Angular':       ['angularjs', 'angular.js', 'angular 2', 'angular 14'],
  'Svelte':        ['sveltekit'],
  'jQuery':        ['jquery'],
  'Redux':         ['redux toolkit', 'rtk'],

  // Backend
  'Node.js':       ['node', 'nodejs', 'node js'],
  'Express':       ['expressjs', 'express.js'],
  'NestJS':        ['nestjs', 'nest.js', 'nest js'],
  'Django':        ['django rest framework', 'drf'],
  'Flask':         ['flask python'],
  'FastAPI':       ['fast api'],
  'Spring Boot':   ['spring', 'spring framework', 'springboot'],
  'Laravel':       ['laravel php'],
  'Rails':         ['ruby on rails', 'ror'],
  'ASP.NET':       ['aspnet', 'asp net', '.net core', 'dotnet', 'dot net'],
  'GraphQL':       ['gql', 'graph ql'],

  // Databases
  'PostgreSQL':    ['postgres', 'postgresql', 'pg', 'postgre', 'psql'],
  'MySQL':         ['my sql', 'mysql db'],
  'MongoDB':       ['mongo', 'mongo db', 'mongoose'],
  'Redis':         ['redis cache', 'redis db'],
  'Elasticsearch': ['elastic search', 'elastic', 'elk'],
  'DynamoDB':      ['dynamo db', 'dynamo'],
  'SQLite':        ['sqlite3'],
  'Cassandra':     ['apache cassandra'],
  'Supabase':      [],
  'Firebase':      ['firestore', 'firebase db'],

  // Cloud
  'AWS':           ['amazon web services', 'amazon aws', 'aws cloud'],
  'GCP':           ['google cloud', 'google cloud platform', 'google gcp'],
  'Azure':         ['microsoft azure', 'azure cloud'],
  'Vercel':        [],
  'Netlify':       [],
  'Heroku':        [],

  // DevOps / infra
  'Docker':        ['dockerfile', 'docker container', 'docker compose'],
  'Kubernetes':    ['k8s', 'kube'],
  'Terraform':     [],
  'Ansible':       [],
  'CI/CD':         ['cicd', 'ci cd', 'continuous integration', 'continuous deployment', 'continuous delivery'],
  'GitHub Actions':['gh actions', 'github-actions'],
  'Jenkins':       [],
  'Linux':         ['unix', 'ubuntu', 'centos', 'debian'],
  'Bash':          ['shell', 'shell scripting', 'bash scripting', 'sh'],

  // Testing
  'Jest':          ['jest testing', 'jest js'],
  'Pytest':        [],
  'Cypress':       ['cypress testing'],
  'Selenium':      [],
  'Vitest':        [],

  // ML / Data
  'Machine Learning': ['ml', 'machine-learning'],
  'Deep Learning':    ['dl', 'deep-learning', 'neural networks', 'neural network'],
  'NLP':              ['natural language processing', 'natural-language-processing'],
  'TensorFlow':       ['tf', 'tensorflow 2'],
  'PyTorch':          ['torch', 'pytorch'],
  'scikit-learn':     ['sklearn', 'scikit learn'],
  'Pandas':           [],
  'NumPy':            ['numpy'],
  'Spark':            ['apache spark', 'pyspark'],
  'Hadoop':           ['apache hadoop'],
  'Data Science':     ['datascience', 'data-science'],
  'Data Analysis':    ['data analytics', 'data analyst skills'],
  'Power BI':         ['powerbi', 'power-bi'],
  'Tableau':          [],

  // Auth / protocols
  'REST API':      ['rest', 'restful', 'restful api', 'rest apis', 'rest services'],
  'WebSocket':     ['websockets', 'ws'],
  'OAuth':         ['oauth2', 'oauth 2.0'],
  'JWT':           ['json web token', 'json web tokens'],
  'gRPC':          ['grpc'],

  // Mobile
  'React Native':  ['reactnative', 'react-native'],
  'Flutter':       ['flutter dart'],
  'Android':       ['android development', 'android sdk'],
  'iOS':           ['ios development', 'ios sdk', 'xcode'],

  // Tools
  'Git':           ['version control', 'git flow', 'gitflow'],
  'GitHub':        ['github.com'],
  'GitLab':        ['gitlab ci'],
  'Jira':          ['atlassian jira'],
  'Figma':         ['figma design'],

  // Concepts
  'Microservices': ['micro services', 'microservice architecture'],
  'System Design': ['systems design', 'distributed systems'],
  'Agile':         ['agile methodology', 'agile development', 'scrum', 'kanban'],
  'OOP':           ['object oriented', 'object-oriented programming'],
  'Tailwind CSS':  ['tailwind', 'tailwindcss'],
  'SASS':          ['scss', 'sass/scss'],
  'CSS':           ['css3'],
  'HTML':          ['html5'],
};

// Build reverse map: alias (lowercase) → canonical
const _reverseMap = new Map();
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  _reverseMap.set(canonical.toLowerCase(), canonical);
  for (const alias of aliases) {
    _reverseMap.set(alias.toLowerCase(), canonical);
  }
}

/**
 * Normalize a single skill string to its canonical form.
 * Returns the original (title-cased) if no alias match found.
 */
function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return skill;
  const lower = skill.trim().toLowerCase();
  return _reverseMap.get(lower) || _toTitleCase(skill.trim());
}

/**
 * Normalize an array of skills, deduplicate by canonical form.
 */
function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  const seen = new Set();
  const result = [];
  for (const s of skills) {
    const canonical = normalizeSkill(s);
    if (canonical && !seen.has(canonical.toLowerCase())) {
      seen.add(canonical.toLowerCase());
      result.push(canonical);
    }
  }
  return result;
}

/**
 * Compute skill overlap between two normalized skill arrays.
 * Returns { matched, missing, overlapRatio }
 */
function skillOverlap(profileSkills, jobSkills) {
  const normProfile = new Set(normalizeSkills(profileSkills).map(s => s.toLowerCase()));
  const normJob     = normalizeSkills(jobSkills);

  const matched = normJob.filter(s => normProfile.has(s.toLowerCase()));
  const missing  = normJob.filter(s => !normProfile.has(s.toLowerCase()));
  const overlapRatio = normJob.length > 0 ? matched.length / normJob.length : 0.5;

  return { matched, missing, overlapRatio };
}

/**
 * Extract skills from a raw text string (e.g. job description).
 * Matches all known canonical names and aliases against the text.
 */
function extractSkillsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  const found = new Set();

  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    const terms = [canonical, ...aliases];
    for (const term of terms) {
      // word-boundary aware match
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`(?<![a-zA-Z0-9_#])${escaped}(?![a-zA-Z0-9_#])`, 'i');
      if (rx.test(lower)) {
        found.add(canonical);
        break;
      }
    }
  }

  return [...found];
}

function _toTitleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { normalizeSkill, normalizeSkills, skillOverlap, extractSkillsFromText };
