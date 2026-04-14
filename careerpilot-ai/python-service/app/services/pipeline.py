"""
pipeline.py
───────────
Scrape → Extract → Deduplicate → Persist → Expire stale jobs

Sources:
  - Indeed    (via python-jobspy)
  - LinkedIn  (via python-jobspy)
  - Glassdoor (via python-jobspy)
  - YC / Work at a Startup (custom requests scraper)

Runs every 24 hours via GitHub Actions cron.
"""

import os
import time
import logging
import json
import urllib.request
import urllib.parse
from jobspy import scrape_jobs as jobspy_scrape

from app.utils.cleaner   import clean_jobs
from app.utils.extractor import extract
from app.db.jobs_repo    import insert_jobs_batch, expire_old_jobs

log = logging.getLogger(__name__)

# ── Search terms covering every major tech role ───────────────────
TECH_SEARCH_TERMS = [
    # Engineering
    "software engineer", "full stack developer",
    "backend developer", "frontend developer", "software developer",
    # Languages
    "python developer", "javascript developer", "java developer",
    "golang developer", "node js developer",
    # Frontend
    "react developer", "angular developer", "vue developer",
    # Data & AI
    "data engineer", "data scientist", "machine learning engineer",
    "ai engineer", "llm engineer",
    # Infrastructure
    "devops engineer", "cloud engineer", "site reliability engineer",
    # Mobile
    "android developer", "ios developer", "react native developer",
    # Speciality
    "qa engineer",
]

# ── Top Indian tech cities ────────────────────────────────────────
DEFAULT_LOCATIONS = [
    "Bangalore", "Hyderabad", "Mumbai",
    "Delhi", "Pune", "Chennai", "Noida", "Gurgaon",
]

# ── All jobspy-supported sources ──────────────────────────────────
DEFAULT_SOURCES = ["indeed", "linkedin", "glassdoor"]


# ─────────────────────────────────────────────────────────────────
# YC / Work at a Startup scraper
# ─────────────────────────────────────────────────────────────────

def _scrape_yc() -> list[dict]:
    """
    Fetch jobs from YC's Work at a Startup public API.
    Returns cleaned job dicts ready for insert_jobs_batch.
    """
    jobs = []
    try:
        url = "https://www.workatastartup.com/jobs.json"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())

        listings = data if isinstance(data, list) else data.get("jobs", [])
        log.info(f"[yc] fetched {len(listings)} raw listings")

        for item in listings:
            title   = item.get("title", "") or ""
            company = (item.get("company") or {}).get("name", "") or ""
            url_    = item.get("url", "") or f"https://www.workatastartup.com/jobs/{item.get('id','')}"
            desc    = item.get("description", "") or ""
            loc     = item.get("location", "") or "Remote"
            remote  = bool(item.get("remote") or "remote" in loc.lower())

            if not title or not company:
                continue

            job = {
                "title":       title,
                "company":     company,
                "location":    loc,
                "job_url":     url_,
                "description": desc[:3000],
                "date_posted": str(item.get("created_at", "")),
                "job_type":    "full-time",
                "source":      "yc",
                "is_remote":   remote,
                "work_mode":   "remote" if remote else "onsite",
                "company_domain": "startup",
            }
            jobs.append(extract(job))

        log.info(f"[yc] {len(jobs)} valid jobs after cleaning")
    except Exception as e:
        log.warning(f"[yc] scraper failed: {e}")

    return jobs


# ─────────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────────

def run_pipeline(
    search_terms:      list[str] | None = None,
    locations:         list[str] | None = None,
    results_per_query: int = 20,
    sources:           list[str] | None = None,
) -> dict:
    """
    Expire stale jobs → Scrape all sources → Extract → Dedupe → Upsert.
    Returns a summary dict.
    """
    start = time.time()

    terms     = search_terms or TECH_SEARCH_TERMS
    locs      = locations    or DEFAULT_LOCATIONS
    site_list = sources      or DEFAULT_SOURCES
    hours_old = int(os.getenv("DEFAULT_HOURS_OLD", 48))   # 48h freshness window
    delay     = float(os.getenv("SCRAPE_DELAY_SECONDS", 1.5))

    # ── Step 0: Expire jobs older than 48 hours ───────────────────
    expired = expire_old_jobs(hours=48)
    log.info(f"[pipeline] Expired {expired} stale jobs (>48h old)")

    all_raw_jobs:   list[dict] = []
    failed_queries: list[str]  = []
    total_queries = len(terms) * len(locs)

    log.info(f"[pipeline] START — {len(terms)} terms × {len(locs)} cities × {len(site_list)} sources = {total_queries} jobspy queries")

    # ── Step 1: jobspy (Indeed + LinkedIn + Glassdoor) ────────────
    for t_idx, term in enumerate(terms, 1):
        for l_idx, loc in enumerate(locs, 1):
            label = f"[{t_idx}/{len(terms)}] '{term}' @ {loc}"
            log.info(f"[pipeline] {label}")
            try:
                df = jobspy_scrape(
                    site_name      = site_list,
                    search_term    = term,
                    location       = loc,
                    results_wanted = results_per_query,
                    hours_old      = hours_old,
                    country_indeed = "India",
                    verbose        = 0,
                )
                if df is not None and not df.empty:
                    cleaned = clean_jobs(df)
                    all_raw_jobs.extend(cleaned)
                    log.info(f"[pipeline]   → {len(cleaned)} jobs  (total: {len(all_raw_jobs)})")
                else:
                    log.info(f"[pipeline]   → 0 jobs returned")
            except Exception as e:
                log.warning(f"[pipeline]   FAILED: {e}")
                failed_queries.append(f"{term}@{loc}")

            time.sleep(delay)

    # ── Step 2: YC jobs ───────────────────────────────────────────
    log.info("[pipeline] Scraping YC / Work at a Startup...")
    yc_jobs = _scrape_yc()
    all_raw_jobs.extend(yc_jobs)
    log.info(f"[pipeline] YC added {len(yc_jobs)} jobs (total: {len(all_raw_jobs)})")

    total_scraped = len(all_raw_jobs)
    log.info(f"[pipeline] Scraping done — {total_scraped} raw, {len(failed_queries)} failed queries")

    if total_scraped == 0:
        return {
            "expired": expired, "total_scraped": 0, "total_extracted": 0,
            "inserted": 0, "failed": 0, "errors": [],
            "failed_queries": failed_queries,
            "duration_seconds": round(time.time() - start, 2),
            "queries_run": total_queries,
        }

    # ── Step 3: Deduplicate by URL ────────────────────────────────
    seen_urls: set[str] = set()
    unique_jobs = []
    for j in all_raw_jobs:
        url = j.get("job_url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_jobs.append(j)

    dupes = total_scraped - len(unique_jobs)
    log.info(f"[pipeline] After dedup: {len(unique_jobs)} unique ({dupes} dupes removed)")

    # ── Step 4: Enrich ────────────────────────────────────────────
    enriched_jobs = []
    for job in unique_jobs:
        try:
            enriched_jobs.append(extract(job))
        except Exception as e:
            log.warning(f"[pipeline] Extractor error on '{job.get('title')}': {e}")
            enriched_jobs.append(job)

    log.info(f"[pipeline] Enriched {len(enriched_jobs)} jobs")

    # ── Step 5: Bulk upsert ───────────────────────────────────────
    db_result = insert_jobs_batch(enriched_jobs)
    duration  = round(time.time() - start, 2)

    log.info(f"[pipeline] DONE — inserted={db_result['inserted']} failed={db_result['failed']} time={duration}s")

    return {
        "expired":          expired,
        "total_scraped":    total_scraped,
        "unique_jobs":      len(unique_jobs),
        "total_extracted":  len(enriched_jobs),
        "inserted":         db_result["inserted"],
        "failed":           db_result["failed"],
        "errors":           db_result["errors"][:10],
        "failed_queries":   failed_queries[:20],
        "duration_seconds": duration,
        "queries_run":      total_queries,
        "sources":          site_list + ["yc"],
    }
