"""
pipeline.py
───────────
Scrape → Extract → Deduplicate → Persist

Sources:
  • Indeed      (via python-jobspy)
  • Glassdoor   (via python-jobspy)
  • Naukri      (custom scraper)
  • YC / Work at a Startup (custom scraper)
"""

import os
import time
import logging
from jobspy import scrape_jobs as jobspy_scrape

from app.utils.cleaner      import clean_jobs
from app.utils.extractor    import extract
from app.utils.quality      import validate, compute_trust_score
from app.db.jobs_repo       import insert_jobs_batch
from app.scrapers.naukri    import scrape_naukri_bulk
from app.scrapers.yc_jobs   import scrape_yc_bulk

log = logging.getLogger(__name__)

# ── Comprehensive tech search terms (50 roles) ───────────────────────
TECH_SEARCH_TERMS = [
    # ── Core Engineering ─────────────────────────────────────────────
    "software engineer",
    "software developer",
    "full stack developer",
    "backend developer",
    "frontend developer",
    "web developer",

    # ── Language / Stack ─────────────────────────────────────────────
    "python developer",
    "javascript developer",
    "typescript developer",
    "java developer",
    "golang developer",
    "rust developer",
    "node js developer",
    "django developer",
    "fastapi developer",
    "spring boot developer",

    # ── Frontend ─────────────────────────────────────────────────────
    "react developer",
    "next js developer",
    "angular developer",
    "vue developer",
    "ui developer",

    # ── Data & AI ────────────────────────────────────────────────────
    "data engineer",
    "data scientist",
    "machine learning engineer",
    "ai engineer",
    "llm engineer",
    "generative ai developer",
    "nlp engineer",
    "computer vision engineer",
    "data analyst",
    "analytics engineer",

    # ── Infrastructure / Cloud ────────────────────────────────────────
    "devops engineer",
    "cloud engineer",
    "site reliability engineer",
    "platform engineer",
    "aws engineer",
    "gcp engineer",
    "azure engineer",
    "kubernetes engineer",

    # ── Mobile ───────────────────────────────────────────────────────
    "android developer",
    "ios developer",
    "react native developer",
    "flutter developer",

    # ── Security & QA ────────────────────────────────────────────────
    "security engineer",
    "qa engineer",
    "sdet",
    "test automation engineer",

    # ── Speciality ───────────────────────────────────────────────────
    "blockchain developer",
    "embedded engineer",
    "firmware engineer",
    "api developer",
    "database administrator",
    "solutions architect",
    "staff engineer",
    "principal engineer",
]

# ── Indian tech cities used for Glassdoor/Indeed/Naukri ──────────────
DEFAULT_LOCATIONS = [
    "Bangalore",
    "Hyderabad",
    "Mumbai",
    "Delhi",
    "Pune",
    "Chennai",
    "Noida",
    "Gurgaon",
    "Kolkata",
    "Ahmedabad",
]

# ── Subset of terms used for YC (global / remote-first companies) ────
YC_SEARCH_TERMS = [
    "software engineer",
    "full stack developer",
    "backend developer",
    "frontend developer",
    "python developer",
    "react developer",
    "data engineer",
    "machine learning engineer",
    "ai engineer",
    "llm engineer",
    "devops engineer",
    "mobile developer",
]

# ── Subset of terms for Naukri (broader India coverage) ─────────────
NAUKRI_SEARCH_TERMS = [
    "software engineer",
    "full stack developer",
    "backend developer",
    "frontend developer",
    "python developer",
    "javascript developer",
    "java developer",
    "react developer",
    "data engineer",
    "data scientist",
    "machine learning engineer",
    "devops engineer",
    "android developer",
    "ios developer",
    "react native developer",
    "node js developer",
    "cloud engineer",
    "qa engineer",
    "ai engineer",
    "software developer",
]


def _dedup(jobs: list[dict]) -> list[dict]:
    """Remove duplicate jobs by URL."""
    seen: set[str] = set()
    unique: list[dict] = []
    for j in jobs:
        url = j.get("job_url", "")
        if url and url not in seen:
            seen.add(url)
            unique.append(j)
    return unique


def _enrich(jobs: list[dict]) -> list[dict]:
    """Run regex extractor on each job dict."""
    enriched: list[dict] = []
    for job in jobs:
        try:
            enriched.append(extract(job))
        except Exception as exc:
            log.warning(f"[pipeline] Extractor error on '{job.get('title')}': {exc}")
            enriched.append(job)
    return enriched


# ─────────────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────────────

def run_pipeline(
    search_terms:      list[str] | None = None,
    locations:         list[str] | None = None,
    results_per_query: int = 50,
    sources:           list[str] | None = None,
) -> dict:
    """
    Scrape all configured sources → extract metadata → deduplicate → upsert.

    sources controls which scrapers run. Accepted values:
        "indeed", "glassdoor"  — via python-jobspy
        "naukri"               — custom Naukri scraper
        "yc"                   — custom YC Work-at-a-Startup scraper

    Defaults to all four sources when sources=None.
    """
    start = time.time()

    terms     = search_terms or TECH_SEARCH_TERMS
    locs      = locations    or DEFAULT_LOCATIONS
    hours_old = int(os.getenv("DEFAULT_HOURS_OLD", 72))
    delay     = float(os.getenv("SCRAPE_DELAY_SECONDS", 1.0))

    # Decide which sources to use
    active_sources: list[str] = sources or ["indeed", "glassdoor", "naukri", "yc"]
    jobspy_sources  = [s for s in active_sources if s in ("indeed", "glassdoor")]
    use_naukri      = "naukri" in active_sources
    use_yc          = "yc"     in active_sources

    all_raw_jobs:   list[dict] = []
    failed_queries: list[str]  = []

    total_jobspy_queries = len(terms) * len(locs) * (1 if jobspy_sources else 0)
    log.info(
        f"[pipeline] START — sources={active_sources} | "
        f"jobspy: {len(terms)} terms × {len(locs)} cities | "
        f"naukri: {'yes' if use_naukri else 'no'} | "
        f"yc: {'yes' if use_yc else 'no'}"
    )

    # ── 1. Indeed + Glassdoor via python-jobspy ───────────────────────
    if jobspy_sources:
        log.info(f"[pipeline] JobSpy scraping ({', '.join(jobspy_sources)}) — {total_jobspy_queries} queries")
        for t_idx, term in enumerate(terms, 1):
            for l_idx, loc in enumerate(locs, 1):
                label = f"[{t_idx}/{len(terms)}] '{term}' @ {loc}"
                log.info(f"[pipeline] {label}")
                try:
                    df = jobspy_scrape(
                        site_name      = jobspy_sources,
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
                        log.info(f"[pipeline]   → {len(cleaned)} jobs (total: {len(all_raw_jobs)})")
                    else:
                        log.info(f"[pipeline]   → 0 jobs")
                except Exception as exc:
                    log.warning(f"[pipeline]   JobSpy FAILED: {exc}")
                    failed_queries.append(f"jobspy:{term}@{loc}")
                time.sleep(delay)

    # ── 2. Naukri ─────────────────────────────────────────────────────
    if use_naukri:
        naukri_terms = search_terms or NAUKRI_SEARCH_TERMS
        log.info(f"[pipeline] Naukri scraping — {len(naukri_terms)} terms × {len(locs)} cities")
        try:
            naukri_jobs = scrape_naukri_bulk(
                keywords          = naukri_terms,
                locations         = locs,
                results_per_query = results_per_query,
                delay             = delay,
            )
            all_raw_jobs.extend(naukri_jobs)
            log.info(f"[pipeline] Naukri → {len(naukri_jobs)} jobs (total: {len(all_raw_jobs)})")
        except Exception as exc:
            log.warning(f"[pipeline] Naukri FAILED: {exc}")
            failed_queries.append("naukri:bulk")

    # ── 3. YC / Work at a Startup ─────────────────────────────────────
    if use_yc:
        yc_terms = search_terms or YC_SEARCH_TERMS
        log.info(f"[pipeline] YC scraping — {len(yc_terms)} terms")
        try:
            yc_jobs = scrape_yc_bulk(
                keywords          = yc_terms,
                results_per_query = results_per_query,
                delay             = delay * 2,   # YC is more sensitive to rate-limiting
                include_remote    = True,
            )
            all_raw_jobs.extend(yc_jobs)
            log.info(f"[pipeline] YC → {len(yc_jobs)} jobs (total: {len(all_raw_jobs)})")
        except Exception as exc:
            log.warning(f"[pipeline] YC FAILED: {exc}")
            failed_queries.append("yc:bulk")

    # ── Deduplicate ───────────────────────────────────────────────────
    total_scraped = len(all_raw_jobs)
    if total_scraped == 0:
        return {
            "total_scraped":    0,
            "unique_jobs":      0,
            "total_extracted":  0,
            "inserted":         0,
            "failed":           0,
            "errors":           [],
            "failed_queries":   failed_queries,
            "duration_seconds": round(time.time() - start, 2),
            "sources_used":     active_sources,
        }

    unique_jobs = _dedup(all_raw_jobs)
    log.info(
        f"[pipeline] After dedup: {len(unique_jobs)} unique "
        f"({total_scraped - len(unique_jobs)} dupes removed)"
    )

    # ── Extract metadata ──────────────────────────────────────────────
    enriched_jobs = _enrich(unique_jobs)
    log.info(f"[pipeline] Extraction complete: {len(enriched_jobs)} jobs enriched")

    # ── Validate + score ──────────────────────────────────────────────
    valid_jobs: list[dict] = []
    invalid_count = 0
    for job in enriched_jobs:
        is_valid, reasons = validate(job)
        if is_valid:
            job["trust_score"] = compute_trust_score(job)
            valid_jobs.append(job)
        else:
            invalid_count += 1
            log.debug(f"[pipeline] Dropped '{job.get('title')}' @ '{job.get('company')}': {reasons}")

    log.info(f"[pipeline] Quality filter: {len(valid_jobs)} valid, {invalid_count} dropped")

    # ── Bulk upsert ───────────────────────────────────────────────────
    db_result = insert_jobs_batch(valid_jobs)
    duration  = round(time.time() - start, 2)

    log.info(
        f"[pipeline] DONE — inserted={db_result['inserted']} "
        f"failed={db_result['failed']} time={duration}s"
    )

    return {
        "total_scraped":    total_scraped,
        "unique_jobs":      len(unique_jobs),
        "total_extracted":  len(enriched_jobs),
        "inserted":         db_result["inserted"],
        "failed":           db_result["failed"],
        "errors":           db_result["errors"][:10],
        "failed_queries":   failed_queries[:20],
        "duration_seconds": duration,
        "sources_used":     active_sources,
    }
