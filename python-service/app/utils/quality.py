"""
quality.py
──────────
Job quality validation and trust scoring.

validate(job)       → (is_valid: bool, reasons: list[str])
trust_score(job)    → int  0–100
experience_level(job) → str
clean_schema(job)   → dict  (output-ready format)
"""

import re
from datetime import datetime, timezone

# ── Vague / non-tech title patterns ──────────────────────────────────
_VAGUE_TITLE_EXACT = {
    "engineer", "developer", "manager", "analyst", "consultant",
    "specialist", "associate", "executive", "intern", "fresher",
    "professional", "officer", "coordinator", "lead", "head",
    "job", "position", "opportunity", "vacancy", "opening",
    "hiring", "recruitment", "staff", "employee", "candidate",
}

_NON_TECH_PATTERNS = re.compile(
    r"\b(sales|marketing|hr |human resource|accountant|finance|legal|"
    r"operations manager|supply chain|logistics manager|content writer|"
    r"graphic design|video edit|seo|social media manager|"
    r"business development manager|customer support|customer success manager|"
    r"product marketing|brand manager|pr manager|copywriter)\b",
    re.IGNORECASE,
)

_TECH_INDICATORS = re.compile(
    r"\b(engineer|developer|architect|devops|sre|data|ml|ai|cloud|"
    r"backend|frontend|fullstack|full.stack|mobile|android|ios|"
    r"python|java|golang|react|node|django|fastapi|kubernetes|"
    r"security|qa|sdet|embedded|firmware|nlp|llm|platform|"
    r"infrastructure|software|sde|swe|tech|cto|vp eng)\b",
    re.IGNORECASE,
)

# ── Source trust weights (out of 30) ─────────────────────────────────
_SOURCE_WEIGHT = {
    "yc":        30,
    "glassdoor": 25,
    "linkedin":  22,
    "indeed":    18,
    "naukri":    12,
}

# ── Recency helpers ───────────────────────────────────────────────────
_DATE_PATTERNS = [
    r"(\d{4}-\d{2}-\d{2})",                        # 2024-03-15
    r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",            # 15/03/2024
    r"(\d+)\s*day[s]?\s*ago",                       # 3 days ago
    r"(\d+)\s*week[s]?\s*ago",                      # 2 weeks ago
    r"(\d+)\s*month[s]?\s*ago",                     # 1 month ago
    r"about\s+(\d+)\s*(hour|day|week|month)",       # about 3 days
]


def _days_since_posted(date_str: str) -> int | None:
    """Return approximate days since job was posted, or None if unparseable."""
    if not date_str:
        return None
    s = str(date_str).strip().lower()

    # "N days ago"
    m = re.search(r"(\d+)\s*day", s)
    if m:
        return int(m.group(1))

    # "N hours ago"
    m = re.search(r"(\d+)\s*hour", s)
    if m:
        return max(1, int(m.group(1)) // 24)

    # "N weeks ago"
    m = re.search(r"(\d+)\s*week", s)
    if m:
        return int(m.group(1)) * 7

    # "N months ago"
    m = re.search(r"(\d+)\s*month", s)
    if m:
        return int(m.group(1)) * 30

    # ISO date
    m = re.search(r"(\d{4}-\d{2}-\d{2})", s)
    if m:
        try:
            posted = datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
            return (datetime.now(timezone.utc) - posted).days
        except ValueError:
            pass

    # Unix timestamp (YC HN)
    try:
        ts = int(s)
        posted = datetime.fromtimestamp(ts, tz=timezone.utc)
        return (datetime.now(timezone.utc) - posted).days
    except (ValueError, OSError):
        pass

    return None


# ─────────────────────────────────────────────────────────────────────
# Validation
# ─────────────────────────────────────────────────────────────────────

def validate(job: dict) -> tuple[bool, list[str]]:
    """
    Returns (is_valid, list_of_failure_reasons).
    A job fails if ANY of the hard rules triggers.
    """
    reasons: list[str] = []
    title   = (job.get("title") or "").strip()
    company = (job.get("company") or "").strip()
    url     = (job.get("job_url") or "").strip()
    desc    = (job.get("description") or "").strip()

    # ── Hard rules ────────────────────────────────────────────────────
    if not company or len(company) < 2:
        reasons.append("missing_company")

    if not url or not url.startswith("http"):
        reasons.append("missing_job_url")

    if len(desc) < 50:
        reasons.append("empty_description")

    if not title or len(title) < 4:
        reasons.append("title_too_short")
    else:
        # Single-word vague title
        if title.lower() in _VAGUE_TITLE_EXACT:
            reasons.append("vague_title")
        # Non-tech role that slipped past domain filter
        elif _NON_TECH_PATTERNS.search(title) and not _TECH_INDICATORS.search(title):
            reasons.append("non_tech_title")

    return len(reasons) == 0, reasons


# ─────────────────────────────────────────────────────────────────────
# Trust Score
# ─────────────────────────────────────────────────────────────────────

def compute_trust_score(job: dict) -> int:
    """
    Score breakdown (max 100):

      Source quality         30 pts  (YC highest, naukri lowest)
      Valid URL              15 pts
      Description quality    15 pts  (length proxy for info richness)
      Skills extracted       20 pts  (structured data quality)
      Recency                15 pts
      Has salary              5 pts  (bonus — most Indian jobs omit salary)

    Note: salary is a bonus (5 pts) not a penalty, because Indian job boards
    rarely publish salary data. Description quality and skills carry more weight.
    """
    score = 0

    # ── Source (30 pts) ───────────────────────────────────────────────
    source = (job.get("source") or "").lower()
    score += _SOURCE_WEIGHT.get(source, 8)

    # ── Valid URL (15 pts) ────────────────────────────────────────────
    url = (job.get("job_url") or "").strip()
    if url.startswith("http") and len(url) > 15:
        score += 15

    # ── Description quality (15 pts) ─────────────────────────────────
    desc_len = len((job.get("description") or "").strip())
    if desc_len >= 300:
        score += 15
    elif desc_len >= 100:
        score += 8
    elif desc_len >= 50:
        score += 3

    # ── Skills extracted (20 pts) ─────────────────────────────────────
    skills = job.get("skills") or []
    if isinstance(skills, list):
        n = len(skills)
        if n >= 5:
            score += 20
        elif n >= 3:
            score += 15
        elif n >= 1:
            score += 10

    # ── Recency (15 pts) ──────────────────────────────────────────────
    days = _days_since_posted(job.get("date_posted") or "")
    if days is not None:
        if days <= 7:
            score += 15
        elif days <= 30:
            score += 12
        elif days <= 90:
            score += 8
        # older than 90 days → 0

    # ── Salary bonus (5 pts) ─────────────────────────────────────────
    has_salary = (
        bool((job.get("salary_raw") or "").strip())
        or job.get("salary_min") is not None
        or job.get("salary_max") is not None
    )
    if has_salary:
        score += 5

    return min(score, 100)


# ─────────────────────────────────────────────────────────────────────
# Experience Level
# ─────────────────────────────────────────────────────────────────────

def experience_level(job: dict) -> str:
    lo = job.get("experience_min")
    hi = job.get("experience_max")

    if lo is None and hi is None:
        return "Not specified"

    yrs = lo if lo is not None else hi

    if yrs <= 1:
        return "Entry Level (0–1 yrs)"
    elif yrs <= 3:
        return "Junior (1–3 yrs)"
    elif yrs <= 5:
        return "Mid Level (3–5 yrs)"
    elif yrs <= 8:
        return "Senior (5–8 yrs)"
    else:
        return "Lead / Principal (8+ yrs)"


# ─────────────────────────────────────────────────────────────────────
# Clean output schema
# ─────────────────────────────────────────────────────────────────────

def clean_schema(job: dict) -> dict:
    """
    Map an enriched job dict → the clean output schema:
    {
      id, title, company, location,
      required_skills[], experience_level,
      salary_range, job_url, source,
      work_mode, trust_score
    }
    """
    # Salary range string
    sal_raw = (job.get("salary_raw") or "").strip()
    if sal_raw:
        salary_range = sal_raw
    elif job.get("salary_min") and job.get("salary_max"):
        cur  = job.get("salary_currency", "INR")
        sym  = "₹" if cur == "INR" else "$"
        per  = job.get("salary_period", "yearly")
        salary_range = f"{sym}{job['salary_min']:,.0f}–{sym}{job['salary_max']:,.0f} {per}"
    elif job.get("salary_min"):
        salary_range = f"{job['salary_min']:,.0f}+"
    else:
        salary_range = None

    skills = job.get("skills") or []
    if not isinstance(skills, list):
        skills = []

    return {
        "id":               str(job.get("id", "")),
        "title":            (job.get("title") or "").strip(),
        "company":          (job.get("company") or "").strip(),
        "location":         (job.get("location") or "").strip(),
        "required_skills":  [str(s) for s in skills],
        "experience_level": experience_level(job),
        "salary_range":     salary_range,
        "job_url":          (job.get("job_url") or "").strip(),
        "source":           (job.get("source") or "").strip(),
        "work_mode":        (job.get("work_mode") or "onsite").strip(),
        "trust_score":      job.get("trust_score") or compute_trust_score(job),
    }
