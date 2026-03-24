"""
pipeline.py
───────────
Scrape → Extract → Deduplicate → Persist
"""

import os
import time
import logging
from jobspy import scrape_jobs as jobspy_scrape

from app.utils.cleaner   import clean_jobs
from app.utils.extractor import extract
from app.db.jobs_repo    import insert_jobs_batch

log = logging.getLogger(__name__)

# ── 25 search terms covering every major tech role ───────────────
TECH_SEARCH_TERMS = [
    # Engineering
    "software engineer",
    "full stack developer",
    "backend developer",
    "frontend developer",
    "software developer",
    # Languages
    "python developer",
    "javascript developer",
    "java developer",
    "golang developer",
    "node js developer",
    # Frontend
    "react developer",
    "angular developer",
    "vue developer",
    # Data & AI
    "data engineer",
    "data scientist",
    "machine learning engineer",
    "ai engineer",
    "llm engineer",
    # Infrastructure
    "devops engineer",
    "cloud engineer",
    "site reliability engineer",
    # Mobile
    "android developer",
    "ios developer",
    "react native developer",
    # Speciality
    "qa engineer",
]

# ── Top Indian tech cities + remote ──────────────────────────────
DEFAULT_LOCATIONS = [
    "Bangalore",
    "Hyderabad",
    "Mumbai",
    "Delhi",
    "Pune",
    "Chennai",
    "Noida",
    "Gurgaon",
]


def run_pipeline(
    search_terms:      list[str] | None = None,
    locations:         list[str] | None = None,
    results_per_query: int = 20,
    sources:           list[str] | None = None,
) -> dict:
    """
    Scrape → extract → deduplicate → bulk-upsert.
    Returns a summary dict.
    """
    start = time.time()

    terms     = search_terms or TECH_SEARCH_TERMS
    locs      = locations    or DEFAULT_LOCATIONS
    site_list = sources      or ["indeed", "glassdoor"]
    hours_old = int(os.getenv("DEFAULT_HOURS_OLD", 72))
    delay     = float(os.getenv("SCRAPE_DELAY_SECONDS", 1.0))

    total_queries  = len(terms) * len(locs)
    all_raw_jobs:  list[dict] = []
    failed_queries: list[str] = []

    log.info(f"[pipeline] START — {len(terms)} terms × {len(locs)} cities = {total_queries} queries")

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
                    log.info(f"[pipeline]   → {len(cleaned)} jobs  (total so far: {len(all_raw_jobs)})")
                else:
                    log.info(f"[pipeline]   → 0 jobs returned")
            except Exception as e:
                log.warning(f"[pipeline]   FAILED: {e}")
                failed_queries.append(f"{term}@{loc}")

            time.sleep(delay)

    total_scraped = len(all_raw_jobs)
    log.info(f"[pipeline] Scraping done — {total_scraped} raw jobs, {len(failed_queries)} failed queries")

    if total_scraped == 0:
        return {
            "total_scraped":   0, "total_extracted": 0,
            "inserted":        0, "failed":          0,
            "errors":          [], "failed_queries":  failed_queries,
            "duration_seconds": round(time.time() - start, 2),
            "queries_run":      total_queries,
        }

    # ── Deduplicate by URL ───────────────────────────────────────
    seen_urls: set[str] = set()
    unique_jobs = []
    for j in all_raw_jobs:
        url = j.get("job_url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_jobs.append(j)

    log.info(f"[pipeline] After dedup: {len(unique_jobs)} unique jobs ({total_scraped - len(unique_jobs)} dupes removed)")

    # ── Regex extraction ─────────────────────────────────────────
    enriched_jobs = []
    for job in unique_jobs:
        try:
            enriched_jobs.append(extract(job))
        except Exception as e:
            log.warning(f"[pipeline] Extractor error on '{job.get('title')}': {e}")
            enriched_jobs.append(job)

    log.info(f"[pipeline] Extraction complete: {len(enriched_jobs)} jobs enriched")

    # ── Bulk upsert ──────────────────────────────────────────────
    db_result = insert_jobs_batch(enriched_jobs)
    duration  = round(time.time() - start, 2)

    log.info(f"[pipeline] DONE — inserted={db_result['inserted']} failed={db_result['failed']} time={duration}s")

    return {
        "total_scraped":    total_scraped,
        "unique_jobs":      len(unique_jobs),
        "total_extracted":  len(enriched_jobs),
        "inserted":         db_result["inserted"],
        "failed":           db_result["failed"],
        "errors":           db_result["errors"][:10],
        "failed_queries":   failed_queries[:20],
        "duration_seconds": duration,
        "queries_run":      total_queries,
    }
