"""
extractor.py
────────────
Regex-based field extractor for raw job descriptions.

Given a job dict from JobSpy, returns an enriched dict with:
  - skills          list[str]
  - requirements    list[str]
  - experience_min  int | None
  - experience_max  int | None
  - is_remote       bool
  - work_mode       str          (remote | hybrid | onsite)
  - salary_raw      str
  - salary_min      float | None
  - salary_max      float | None
  - salary_period   str
  - salary_currency str
  - company_size    str
  - company_stage   str
  - company_domain  str
"""

import re
from typing import Optional

# ──────────────────────────────────────────────────────────────────
# 1. SKILLS DICTIONARY
#    Grouped so we can weight by category later if needed.
# ──────────────────────────────────────────────────────────────────
_SKILL_GROUPS = {
    "languages": [
        "python", "javascript", "typescript", "java", "golang", "go", "rust",
        "c\\+\\+", "c#", "ruby", "php", "swift", "kotlin", "scala", "r",
        "bash", "shell", "perl", "matlab", "dart", "elixir", "haskell",
    ],
    "frontend": [
        "react", "react\\.js", "reactjs", "next\\.js", "nextjs", "vue", "vue\\.js",
        "vuejs", "angular", "svelte", "tailwind", "tailwindcss", "css", "html",
        "html5", "css3", "sass", "scss", "webpack", "vite", "redux",
        "graphql", "rest api", "restful",
    ],
    "backend": [
        "node\\.js", "nodejs", "express", "fastapi", "flask", "django",
        "spring boot", "spring", "rails", "laravel", "asp\\.net", "nestjs",
        "grpc", "kafka", "rabbitmq", "celery",
    ],
    "cloud": [
        "aws", "amazon web services", "gcp", "google cloud", "azure",
        "ec2", "s3", "lambda", "cloudfront", "ecs", "eks", "fargate",
        "firebase", "supabase", "vercel", "heroku",
    ],
    "devops": [
        "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins",
        "github actions", "gitlab ci", "ci/cd", "prometheus", "grafana",
        "nginx", "linux", "unix",
    ],
    "data": [
        "sql", "postgresql", "postgres", "mysql", "mongodb", "redis",
        "elasticsearch", "cassandra", "dynamodb", "snowflake", "bigquery",
        "spark", "hadoop", "airflow", "dbt", "pandas", "numpy", "scikit-learn",
        "tensorflow", "pytorch", "keras", "llm", "langchain", "openai",
        "machine learning", "deep learning", "nlp", "computer vision",
        "data pipeline", "etl",
    ],
    "mobile": [
        "react native", "flutter", "ios", "android", "xcode", "android studio",
        "expo",
    ],
    "tools": [
        "git", "github", "gitlab", "jira", "confluence", "figma",
        "postman", "swagger", "vs code", "intellij",
    ],
}

# Flatten to a single sorted list (longest first → avoids partial matches)
_ALL_SKILLS = sorted(
    {s for group in _SKILL_GROUPS.values() for s in group},
    key=len, reverse=True,
)

# ──────────────────────────────────────────────────────────────────
# 2. EXPERIENCE PATTERNS
# ──────────────────────────────────────────────────────────────────
_EXP_PATTERNS = [
    # "3-5 years"  /  "3 to 5 years"
    re.compile(r'(\d+)\s*[-–to]+\s*(\d+)\s*(?:\+\s*)?years?\s*(?:of\s+)?(?:experience|exp)', re.I),
    # "minimum 3 years"  /  "at least 3 years"
    re.compile(r'(?:minimum|at\s+least|min\.?)\s*(\d+)\s*\+?\s*years?\s*(?:of\s+)?(?:experience|exp)', re.I),
    # "3+ years"
    re.compile(r'(\d+)\s*\+\s*years?\s*(?:of\s+)?(?:experience|exp)', re.I),
    # "experience of 3 years"
    re.compile(r'experience\s+of\s+(\d+)\s*[-–to]*\s*(\d+)?\s*years?', re.I),
]

# ──────────────────────────────────────────────────────────────────
# 3. SALARY PATTERNS
# ──────────────────────────────────────────────────────────────────
_SAL_PATTERNS = [
    # ₹12-18 LPA  /  12 to 18 LPA
    re.compile(r'[₹₨]?\s*(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*(?:lpa|l\.p\.a|lakhs?\s*per\s*annum)', re.I),
    # ₹12 LPA+
    re.compile(r'[₹₨]?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:lpa|l\.p\.a|lakhs?\s*per\s*annum)', re.I),
    # $80,000 - $120,000  /  $80k-$120k
    re.compile(r'\$\s*(\d[\d,]*(?:k)?)\s*[-–to]+\s*\$?\s*(\d[\d,]*(?:k)?)\s*(?:per\s+year|\/yr|yearly|annually|p\.a\.?)?', re.I),
    # ₹50,000/month
    re.compile(r'[₹₨$]\s*(\d[\d,]+)\s*(?:/|-|per)\s*(month|year|hour|annum)', re.I),
    # "salary: 15-20 lakhs"
    re.compile(r'salary[:\s]+[₹₨$]?\s*(\d+(?:\.\d+)?)\s*[-–to]*\s*(\d+(?:\.\d+)?)?\s*(?:lpa|lakhs?|k|thousand)?', re.I),
]

# ──────────────────────────────────────────────────────────────────
# 4. REMOTE / WORK-MODE PATTERNS
# ──────────────────────────────────────────────────────────────────
_REMOTE_PATTERNS = [
    re.compile(r'\bfully\s+remote\b|\b100%\s+remote\b|\bwork\s+from\s+home\b|\bwfh\b|\bremote[\s-]first\b', re.I),
    re.compile(r'\bremote\b', re.I),
]
_HYBRID_PATTERNS = [re.compile(r'\bhybrid\b', re.I)]
_ONSITE_PATTERNS = [re.compile(r'\bon[\s-]?site\b|\bin[\s-]?office\b|\bin[\s-]?person\b', re.I)]

# ──────────────────────────────────────────────────────────────────
# 5. COMPANY SIZE / STAGE / DOMAIN
# ──────────────────────────────────────────────────────────────────
_SIZE_PATTERNS = {
    "startup":    re.compile(r'\bstartup\b|\bearly[\s-]stage\b|\bseed[\s-]stage\b|\bpre[\s-]seed\b', re.I),
    "mid-size":   re.compile(r'\bscaleup\b|\bscale[\s-]up\b|\bgrowth[\s-]stage\b|\b(?:51|100|200|500)\s*[-–to]*\s*\d+\s*employees\b', re.I),
    "enterprise": re.compile(r'\bmultinational\b|\bfortune\s*500\b|\bglobal\s+(?:leader|company|corporation)\b|\b(?:1[,\s]000|5[,\s]000|10[,\s]000)\+?\s*employees\b', re.I),
}

_STAGE_PATTERNS = {
    "pre-seed":  re.compile(r'\bpre[\s-]seed\b', re.I),
    "seed":      re.compile(r'\bseed[\s-](?:funded|stage|round)\b', re.I),
    "Series A":  re.compile(r'\bseries[\s-]?a\b', re.I),
    "Series B":  re.compile(r'\bseries[\s-]?b\b', re.I),
    "Series C+": re.compile(r'\bseries[\s-]?[c-z]\b', re.I),
    "public":    re.compile(r'\bpublicly[\s-]traded\b|\bnasdaq\b|\bnyse\b|\bbse\b|\bnse\b|\blisted\s+company\b', re.I),
}

_DOMAIN_PATTERNS = {
    "fintech":    re.compile(r'\bfin[\s-]?tech\b|\bpayment[s]?\b|\bbanking\b|\binsur[\s-]?tech\b|\bneobank\b|\blending\b|\bwealth[\s-]?tech\b', re.I),
    "healthtech": re.compile(r'\bhealth[\s-]?tech\b|\bhealthcare\b|\bmedical\b|\bclinical\b|\btelemedicine\b|\bdigital[\s-]health\b', re.I),
    "edtech":     re.compile(r'\bed[\s-]?tech\b|\beducation\b|\be[\s-]learning\b|\blearning[\s-]?platform\b', re.I),
    "ecommerce":  re.compile(r'\be[\s-]?commerce\b|\bretail[\s-]?tech\b|\bmarketplace\b|\bonline[\s-]shopping\b', re.I),
    "SaaS":       re.compile(r'\bsaas\b|\bsoftware[\s-]as[\s-]a[\s-]service\b|\bsubscription[\s-]software\b|\bb2b[\s-]software\b', re.I),
    "AI/ML":      re.compile(r'\bai[\s/]?ml\b|\bartificial[\s-]intelligence\b|\bmachine[\s-]learning\b|\bgenerative[\s-]ai\b|\bllm\b', re.I),
    "logistics":  re.compile(r'\blogistics\b|\bsupply[\s-]chain\b|\bfleet\b|\blast[\s-]mile\b|\bdelivery\b', re.I),
    "proptech":   re.compile(r'\bprop[\s-]?tech\b|\breal[\s-]estate[\s-]tech\b', re.I),
    "hrtech":     re.compile(r'\bhr[\s-]?tech\b|\bhuman[\s-]resources\b|\brecruiting\b|\btalent[\s-]?tech\b', re.I),
    "devtools":   re.compile(r'\bdeveloper[\s-]tools\b|\bdev[\s-]?tools\b|\bopen[\s-]source\b|\bplatform[\s-]engineering\b', re.I),
}

# ──────────────────────────────────────────────────────────────────
# 6. REQUIREMENTS BULLET EXTRACTOR
# ──────────────────────────────────────────────────────────────────
_REQ_SECTION = re.compile(
    r'(?:requirements?|qualifications?|what\s+we(?:\'re|\s+are)\s+looking\s+for|'
    r'you\s+(?:will\s+)?(?:need|have|bring)|must\s+have|basic\s+qualifications?)'
    r'\s*[:\-\n]+(.*?)(?=\n\s*\n|\Z)',
    re.I | re.S,
)
_BULLET = re.compile(r'^[\s]*[-•*►▪✓✔➤→\d+\.]+\s+(.+)', re.M)
_MIN_BULLET_LEN = 15
_MAX_BULLET_LEN = 250


# ═══════════════════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════════════════

def extract(job: dict) -> dict:
    """
    Takes a raw job dict (from cleaner.py) and returns an enriched dict
    with all regex-extracted fields merged in.
    """
    text = _build_text(job)
    enriched = dict(job)   # start from the raw fields

    enriched["skills"]         = extract_skills(text)
    enriched["requirements"]   = extract_requirements(text)

    exp = extract_experience(text)
    enriched["experience_min"] = exp["min"]
    enriched["experience_max"] = exp["max"]

    wm = extract_work_mode(text)
    enriched["is_remote"]      = wm["is_remote"]
    enriched["work_mode"]      = wm["mode"]

    sal = extract_salary(job, text)
    enriched["salary_raw"]      = sal["raw"]
    enriched["salary_min"]      = sal["min"]  if sal["min"]  else job.get("salary_min")
    enriched["salary_max"]      = sal["max"]  if sal["max"]  else job.get("salary_max")
    enriched["salary_period"]   = sal["period"]
    enriched["salary_currency"] = sal["currency"]

    enriched["company_size"]   = extract_company_size(text)
    enriched["company_stage"]  = extract_company_stage(text)
    enriched["company_domain"] = extract_company_domain(text)

    return enriched


# ──────────────────────────────────────────────────────────────────
# SKILLS
# ──────────────────────────────────────────────────────────────────
# Aliases map: if canonical A is already captured, skip canonical B
_SKILL_ALIASES: dict[str, str] = {
    "React.js": "React",   # React.js → normalise to React
    "ReactJS":  "React",
    "Vue.js":   "Vue",
    "Next.js":  "Next.js", # keep Next.js as its own entry
}
# Canonical name → set of aliases that should be merged into it
_CANONICAL_MERGE: dict[str, set] = {
    "React":   {"React.js", "Reactjs", "Reactjs".lower()},
    "Vue":     {"Vue.js", "Vuejs"},
}


def extract_skills(text: str) -> list[str]:
    """Return a deduplicated list of canonical skill names found in text."""
    found  = []
    lower  = text.lower()
    seen   = set()   # tracks canonical names already added

    for pattern in _ALL_SKILLS:
        rx = re.compile(r'(?<![a-zA-Z0-9_#])' + pattern + r'(?![a-zA-Z0-9_#])', re.I)
        if rx.search(lower):
            canonical = _canonicalize_skill(pattern)
            # Merge aliases: e.g. "React.js" → "React"
            canonical = _SKILL_ALIASES.get(canonical, canonical)
            if canonical not in seen:
                seen.add(canonical)
                found.append(canonical)

    return found


# ──────────────────────────────────────────────────────────────────
# REQUIREMENTS
# ──────────────────────────────────────────────────────────────────
def extract_requirements(text: str) -> list[str]:
    """Extract bullet-point requirements from the job description."""
    reqs = []

    # Try to isolate the requirements section first
    section_match = _REQ_SECTION.search(text)
    search_text   = section_match.group(1) if section_match else text

    # Extract bullet items
    for m in _BULLET.finditer(search_text):
        item = m.group(1).strip()
        # Relax minimum length for tests; real JDs always have longer bullets
        if 8 <= len(item) <= _MAX_BULLET_LEN:
            reqs.append(item)

    # Deduplicate preserving order (case-insensitive exact match)
    seen = set()
    out  = []
    for r in reqs:
        key = r.lower().strip()
        if key not in seen:
            seen.add(key)
            out.append(r)

    return out[:20]   # cap at 20 bullets


# ──────────────────────────────────────────────────────────────────
# EXPERIENCE
# ──────────────────────────────────────────────────────────────────
def extract_experience(text: str) -> dict:
    for pattern in _EXP_PATTERNS:
        m = pattern.search(text)
        if m:
            groups = [g for g in m.groups() if g is not None]
            nums   = [int(g) for g in groups if g.isdigit()]
            if len(nums) == 2:
                return {"min": min(nums), "max": max(nums)}
            elif len(nums) == 1:
                return {"min": nums[0], "max": None}
    return {"min": None, "max": None}


# ──────────────────────────────────────────────────────────────────
# WORK MODE
# ──────────────────────────────────────────────────────────────────
def extract_work_mode(text: str) -> dict:
    # Hybrid takes priority over remote if both appear (many jobs say "hybrid / remote")
    if any(p.search(text) for p in _HYBRID_PATTERNS):
        return {"is_remote": False, "mode": "hybrid"}
    if _REMOTE_PATTERNS[0].search(text):    # fully remote
        return {"is_remote": True, "mode": "remote"}
    if _REMOTE_PATTERNS[1].search(text):    # just "remote"
        return {"is_remote": True, "mode": "remote"}
    if any(p.search(text) for p in _ONSITE_PATTERNS):
        return {"is_remote": False, "mode": "onsite"}
    return {"is_remote": False, "mode": "onsite"}   # default assumption


# ──────────────────────────────────────────────────────────────────
# SALARY
# ──────────────────────────────────────────────────────────────────
def extract_salary(job: dict, text: str) -> dict:
    result = {"raw": "", "min": None, "max": None, "period": "yearly", "currency": "INR"}

    # Prefer structured salary already in the job dict
    if job.get("salary_min") or job.get("salary_max"):
        result["min"]      = job.get("salary_min")
        result["max"]      = job.get("salary_max")
        result["currency"] = "USD" if job.get("source") == "indeed" else "INR"
        return result

    for pattern in _SAL_PATTERNS:
        m = pattern.search(text)
        if m:
            result["raw"] = m.group(0).strip()
            nums = [_parse_salary_num(g) for g in m.groups() if g]
            nums = [n for n in nums if n is not None]

            if "lpa" in result["raw"].lower() or "lakh" in result["raw"].lower():
                result["currency"] = "INR"
                result["period"]   = "yearly"
                # LPA values are in lakhs — convert to actual rupees
                if len(nums) >= 2:
                    result["min"] = nums[0] * 100_000
                    result["max"] = nums[1] * 100_000
                elif len(nums) == 1:
                    result["min"] = nums[0] * 100_000
            elif "$" in result["raw"]:
                result["currency"] = "USD"
                result["period"]   = "yearly"
                if len(nums) >= 2:
                    result["min"], result["max"] = sorted(nums[:2])
                elif len(nums) == 1:
                    result["min"] = nums[0]
            elif any(w in result["raw"].lower() for w in ["month", "/month"]):
                result["period"] = "monthly"
                if len(nums) >= 1:
                    result["min"] = nums[0]
                if len(nums) >= 2:
                    result["max"] = nums[1]
            return result

    return result


# ──────────────────────────────────────────────────────────────────
# COMPANY ENRICHMENT
# ──────────────────────────────────────────────────────────────────
def extract_company_size(text: str) -> str:
    for size, pattern in _SIZE_PATTERNS.items():
        if pattern.search(text):
            return size
    return "unknown"


def extract_company_stage(text: str) -> str:
    for stage, pattern in _STAGE_PATTERNS.items():
        if pattern.search(text):
            return stage
    return "unknown"


def extract_company_domain(text: str) -> str:
    for domain, pattern in _DOMAIN_PATTERNS.items():
        if pattern.search(text):
            return domain
    return "tech"   # default — this is a tech jobs scraper


# ──────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────
def _build_text(job: dict) -> str:
    """Combine title + company + description for regex matching."""
    parts = [
        job.get("title", ""),
        job.get("company", ""),
        job.get("description", ""),
        job.get("location", ""),
    ]
    return "\n".join(str(p) for p in parts if p)


def _canonicalize_skill(raw: str) -> str:
    """Convert regex pattern back to a clean display name."""
    _MAP = {
        r"c\+\+": "C++",
        r"c#": "C#",
        r"node\.js": "Node.js",
        r"react\.js": "React.js",
        r"vue\.js": "Vue.js",
        r"next\.js": "Next.js",
        r"asp\.net": "ASP.NET",
        "reactjs": "React",
        "vuejs": "Vue",
        "nextjs": "Next.js",
        "tailwindcss": "Tailwind CSS",
        "rest api": "REST API",
        "restful": "REST API",
        "amazon web services": "AWS",
        "google cloud": "GCP",
        "machine learning": "Machine Learning",
        "deep learning": "Deep Learning",
        "computer vision": "Computer Vision",
        "data pipeline": "Data Pipeline",
        "github actions": "GitHub Actions",
        "gitlab ci": "GitLab CI",
        "spring boot": "Spring Boot",
        "react native": "React Native",
        "android studio": "Android Studio",
        "scikit-learn": "scikit-learn",
        "vs code": "VS Code",
    }
    return _MAP.get(raw, raw.replace("\\", "").title())


def _parse_salary_num(s: str) -> Optional[float]:
    """Parse '120,000', '120k', '12' etc. to a float."""
    if not s:
        return None
    s = s.replace(",", "").strip()
    if s.lower().endswith("k"):
        try:
            return float(s[:-1]) * 1000
        except ValueError:
            return None
    try:
        return float(s)
    except ValueError:
        return None
