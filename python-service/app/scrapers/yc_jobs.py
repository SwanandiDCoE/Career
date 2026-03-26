"""
yc_jobs.py
──────────
Scrapes ALL tech jobs from Y Combinator's Work at a Startup board.
URL: https://www.workatastartup.com/jobs

How it works:
  - The site is an Inertia.js app; all job data is embedded in
    <div data-page='{"props":{"jobs":[...]}}'>  on every page load.
  - We query by each engineering role type URL to maximise coverage,
    then also run keyword queries for AI/ML roles not in the role filter.
  - Deduplication by job ID happens inside this module before returning.
"""

import json
import logging
import time
import requests
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

_BASE_URL = "https://www.workatastartup.com"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# All engineering role type slugs from the site's JOBS_GLOBALS
_ENG_ROLE_TYPES = [
    "be",         # Backend
    "fe",         # Frontend
    "fs",         # Full stack
    "data_sci",   # Data science / ML
    "ml",         # Machine learning
    "devops",     # DevOps / Infra
    "android",    # Android
    "ios",        # iOS
    "qa",         # QA
    "embedded",   # Embedded systems
    "eng_mgmt",   # Engineering manager
    "robotics",   # Robotics
]

# Additional keyword queries to catch AI/LLM/cloud roles not in role filters
_KEYWORD_QUERIES = [
    "AI engineer",
    "LLM engineer",
    "machine learning",
    "data engineer",
    "cloud engineer",
    "platform engineer",
    "security engineer",
    "founding engineer",
    "react",
    "python",
    "golang",
]


def _extract_jobs_from_html(html: str) -> list[dict]:
    """Parse Inertia data-page JSON from the page HTML and return the jobs list."""
    soup = BeautifulSoup(html, "lxml")

    # Inertia apps store page data in the first div with a data-page attribute
    div = soup.find("div", attrs={"data-page": True})
    if not div:
        return []

    try:
        page_data = json.loads(div["data-page"])
    except (json.JSONDecodeError, KeyError):
        return []

    props = page_data.get("props", {})
    jobs  = props.get("jobs", [])
    return jobs if isinstance(jobs, list) else []


def _fetch_url(url: str, params: dict | None = None) -> list[dict]:
    """GET a page and return the embedded jobs list."""
    try:
        resp = requests.get(url, params=params, headers=_HEADERS, timeout=20)
        if resp.status_code != 200:
            log.warning(f"[yc] HTTP {resp.status_code} → {url}")
            return []
        return _extract_jobs_from_html(resp.text)
    except Exception as exc:
        log.error(f"[yc] Request failed → {url}: {exc}")
        return []


def _fetch_job_detail(job_id: int) -> dict:
    """
    Fetch the individual job page and return enriched fields:
    description, skills, salary_raw, experience text.
    Returns empty dict on failure.
    """
    try:
        resp = requests.get(
            f"{_BASE_URL}/jobs/{job_id}",
            headers=_HEADERS,
            timeout=20,
        )
        if resp.status_code != 200:
            return {}

        soup = BeautifulSoup(resp.text, "lxml")
        div  = soup.find("div", attrs={"data-page": True})
        if not div:
            return {}

        data    = json.loads(div["data-page"])
        props   = data.get("props", {})
        job     = props.get("job", {})
        company = props.get("company", {})

        # Full description from HTML
        desc_html = job.get("descriptionHtml") or ""
        if desc_html:
            desc = BeautifulSoup(desc_html, "lxml").get_text(" ", strip=True)
        else:
            # Fallback: company hiring description
            hire_html = company.get("hiringDescriptionHtml") or ""
            desc = BeautifulSoup(hire_html, "lxml").get_text(" ", strip=True) if hire_html else ""

        # Skills
        skills = [str(s).strip() for s in (job.get("skills") or []) if s]

        # Salary
        salary_raw = " | ".join(filter(None, [
            job.get("salaryRange") or "",
            job.get("equityRange") or "",
        ])).strip()

        return {
            "description": desc[:3000],
            "skills":      skills,
            "salary_raw":  salary_raw,
            "_min_exp":    job.get("minExperience") or "",
        }
    except Exception as exc:
        log.debug(f"[yc] Detail fetch failed for job {job_id}: {exc}")
        return {}


def _normalise(raw: dict, fetch_detail: bool = True) -> dict | None:
    """Convert a raw YC job dict into the standard pipeline schema."""
    try:
        job_id  = raw.get("id")
        title   = (raw.get("title") or "").strip()
        company = (raw.get("companyName") or "").strip()

        if not title or not job_id:
            return None

        # Canonical job URL (no auth redirect)
        job_url = f"{_BASE_URL}/jobs/{job_id}"

        location = (raw.get("location") or "Remote").strip()
        is_remote = "remote" in location.lower()

        job_type = raw.get("jobType", "fulltime")
        if job_type == "fulltime":
            job_type = "full-time"
        elif job_type == "intern":
            job_type = "internship"

        # Fetch full detail page for rich description + skills + salary
        detail: dict = {}
        if fetch_detail:
            detail = _fetch_job_detail(job_id)
            time.sleep(0.5)

        description = detail.get("description") or (raw.get("companyOneLiner") or "").strip()
        skills      = detail.get("skills") or []
        salary_raw  = detail.get("salary_raw") or ""
        yc_batch    = raw.get("companyBatch") or ""

        return {
            "title":       title,
            "company":     company,
            "location":    location,
            "job_url":     job_url,
            "description": description[:3000],
            "date_posted": raw.get("companyLastActiveAt") or "",
            "job_type":    job_type,
            "source":      "yc",
            "salary_min":  None,
            "salary_max":  None,
            "salary_raw":  salary_raw,
            "is_remote":   is_remote,
            "skills":      skills,
            "_yc_batch":   yc_batch,
            "_yc_one_liner": raw.get("companyOneLiner") or "",
            "_min_exp":    detail.get("_min_exp") or "",
        }
    except Exception as exc:
        log.warning(f"[yc] Normalise error: {exc}")
        return None


def _scrape_hn_jobs() -> list[dict]:
    """
    Pull job listings posted directly on Hacker News via the Firebase API.
    These are authentic YC/startup jobs posted by founders.
    Returns up to ~200 latest job items.
    """
    try:
        resp = requests.get(
            "https://hacker-news.firebaseio.com/v0/jobstories.json",
            headers=_HEADERS,
            timeout=15,
        )
        if resp.status_code != 200:
            return []
        job_ids: list[int] = resp.json()[:200]
    except Exception as exc:
        log.error(f"[yc/hn] Failed to fetch job IDs: {exc}")
        return []

    jobs: list[dict] = []
    for jid in job_ids:
        try:
            r2 = requests.get(
                f"https://hacker-news.firebaseio.com/v0/item/{jid}.json",
                headers=_HEADERS,
                timeout=10,
            )
            if r2.status_code != 200:
                continue
            item = r2.json()
            if not item or item.get("type") != "job":
                continue
            title = item.get("title", "")
            url   = item.get("url", f"https://news.ycombinator.com/item?id={jid}")
            text  = item.get("text", "")
            if text and "<" in text:
                try:
                    text = BeautifulSoup(text, "lxml").get_text(" ", strip=True)
                except Exception:
                    pass
            # Parse "Company (YC Sxx) | Role | Location" from title
            company, role, location = title, title, "Remote"
            if "|" in title:
                parts = [p.strip() for p in title.split("|")]
                company  = parts[0]
                role     = parts[1] if len(parts) > 1 else title
                location = parts[2] if len(parts) > 2 else "Remote"
            elif "–" in title or "-" in title:
                sep = "–" if "–" in title else "-"
                parts = [p.strip() for p in title.split(sep, 1)]
                company = parts[0]
                role    = parts[1] if len(parts) > 1 else title

            jobs.append({
                "title":       role.strip(),
                "company":     company.strip(),
                "location":    location.strip(),
                "job_url":     url,
                "description": text[:3000],
                "date_posted": str(item.get("time", "")),
                "job_type":    "full-time",
                "source":      "yc",
                "salary_min":  None,
                "salary_max":  None,
                "salary_raw":  "",
                "is_remote":   "remote" in location.lower() or "remote" in text.lower()[:200],
                "skills":      [],
                "_yc_batch":   "",
                "_yc_one_liner": "",
            })
            time.sleep(0.1)
        except Exception as exc:
            log.warning(f"[yc/hn] Failed to fetch item {jid}: {exc}")
            continue

    log.info(f"[yc/hn] HN Firebase → {len(jobs)} jobs")
    return jobs


def scrape_yc_all(delay: float = 1.5) -> list[dict]:
    """
    Scrape ALL YC tech jobs by:
      1. Iterating every engineering role type filter (/jobs?roleType=be etc.)
      2. Running keyword queries for roles not covered by filters
      3. Deduplicating by job ID

    Returns normalised job dicts ready for the extractor pipeline.
    """
    seen_ids:  set[int] = set()
    all_jobs:  list[dict] = []

    # ── Phase 1: role-type filters ────────────────────────────────────
    log.info(f"[yc] Phase 1: scraping {len(_ENG_ROLE_TYPES)} role types")
    for role in _ENG_ROLE_TYPES:
        raw_jobs = _fetch_url(f"{_BASE_URL}/jobs", params={"roleType": role})
        count_before = len(all_jobs)
        for raw in raw_jobs:
            job_id = raw.get("id")
            if job_id and job_id not in seen_ids:
                seen_ids.add(job_id)
                job = _normalise(raw)
                if job:
                    all_jobs.append(job)
        added = len(all_jobs) - count_before
        log.info(f"[yc]   roleType={role} → {len(raw_jobs)} raw, {added} new")
        time.sleep(delay)

    # ── Phase 2: keyword queries for additional coverage ──────────────
    log.info(f"[yc] Phase 2: {len(_KEYWORD_QUERIES)} keyword queries")
    for kw in _KEYWORD_QUERIES:
        raw_jobs = _fetch_url(f"{_BASE_URL}/jobs", params={"q": kw})
        count_before = len(all_jobs)
        for raw in raw_jobs:
            job_id = raw.get("id")
            if job_id and job_id not in seen_ids:
                seen_ids.add(job_id)
                job = _normalise(raw)
                if job:
                    all_jobs.append(job)
        added = len(all_jobs) - count_before
        log.info(f"[yc]   q='{kw}' → {len(raw_jobs)} raw, {added} new")
        time.sleep(delay)

    # ── Phase 3: HN Firebase job stories ─────────────────────────────
    log.info("[yc] Phase 3: HN Firebase job stories")
    hn_jobs = _scrape_hn_jobs()
    for job in hn_jobs:
        url = job.get("job_url", "")
        if url and url not in {j.get("job_url") for j in all_jobs}:
            all_jobs.append(job)

    log.info(f"[yc] DONE — total unique jobs: {len(all_jobs)}")
    return all_jobs


# Legacy compat — used by old pipeline calls
def scrape_yc_jobs(query: str, results: int = 30, remote: bool = False) -> list[dict]:
    raw_jobs = _fetch_url(f"{_BASE_URL}/jobs", params={"q": query})
    jobs = [j for raw in raw_jobs if (j := _normalise(raw)) is not None]
    return jobs[:results]


def scrape_yc_bulk(
    keywords:          list[str],
    results_per_query: int   = 30,
    delay:             float = 1.5,
    include_remote:    bool  = True,
) -> list[dict]:
    """Full scrape — ignores keyword list and runs scrape_yc_all() for full coverage."""
    return scrape_yc_all(delay=delay)
