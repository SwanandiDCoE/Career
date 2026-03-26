"""
naukri.py
─────────
Scrapes tech jobs from Naukri.com using their public JSON search API.

Usage:
    from app.scrapers.naukri import scrape_naukri
    jobs = scrape_naukri("python developer", "Bangalore", results=20)
"""

import logging
import time
import requests

log = logging.getLogger(__name__)

_BASE_URL   = "https://www.naukri.com"
_SEARCH_URL = f"{_BASE_URL}/jobapi/v3/search"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "appid":    "109",
    "systemid": "109",
    "Accept":   "application/json, text/plain, */*",
    "Referer":  "https://www.naukri.com/",
}


def scrape_naukri(
    keyword:  str,
    location: str = "",
    results:  int = 20,
    page:     int = 1,
) -> list[dict]:
    """
    Query the Naukri public search API and return normalised job dicts
    that are compatible with the extractor/cleaner pipeline.

    Returns an empty list on any error.
    """
    params: dict = {
        "noOfResults": min(results, 50),
        "urlType":     "search_by_key_loc",
        "searchType":  "adv",
        "keyword":     keyword,
        "pageNo":      page,
    }
    if location:
        params["location"] = location

    try:
        resp = requests.get(
            _SEARCH_URL,
            params=params,
            headers=_HEADERS,
            timeout=20,
        )
        if resp.status_code != 200:
            log.warning(f"[naukri] HTTP {resp.status_code} for '{keyword}' @ '{location}'")
            return []

        data = resp.json()
    except Exception as exc:
        log.error(f"[naukri] Request failed for '{keyword}' @ '{location}': {exc}")
        return []

    raw_jobs = data.get("jobDetails", [])
    jobs: list[dict] = []

    for item in raw_jobs:
        try:
            job_url = item.get("jdURL", "")
            if job_url and not job_url.startswith("http"):
                job_url = _BASE_URL + job_url

            if not job_url:
                continue  # skip jobs with no URL (can't deduplicate)

            # Naukri returns location inside a "placeholders" list
            placeholders = item.get("placeholders", [])
            loc_text = ""
            for ph in placeholders:
                if ph.get("type") == "location":
                    loc_text = ph.get("label", "")
                    break
            if not loc_text:
                loc_text = location

            # Salary placeholder
            salary_raw = ""
            for ph in placeholders:
                if ph.get("type") == "salary":
                    salary_raw = ph.get("label", "")
                    break

            # Experience placeholder
            exp_text = ""
            for ph in placeholders:
                if ph.get("type") == "experience":
                    exp_text = ph.get("label", "")
                    break

            description = item.get("jobDescription", "")
            # Naukri sometimes sends HTML; keep as plain text for extractor
            if "<" in description:
                try:
                    from bs4 import BeautifulSoup
                    description = BeautifulSoup(description, "lxml").get_text(" ", strip=True)
                except Exception:
                    pass

            skills_list = [s.strip() for s in item.get("tagsAndSkills", "").split(",") if s.strip()]

            jobs.append({
                "title":       item.get("title", "").strip(),
                "company":     item.get("companyName", "").strip(),
                "location":    loc_text.strip(),
                "job_url":     job_url.strip(),
                "description": description[:3000],
                "date_posted": item.get("footerPlaceholderLabel", ""),
                "job_type":    "full-time",
                "source":      "naukri",
                "salary_min":  None,
                "salary_max":  None,
                "salary_raw":  salary_raw,
                # Pre-parsed skills from Naukri tag cloud (extractor will enrich further)
                "skills":      skills_list,
                "_exp_text":   exp_text,   # used by extractor for experience parsing
            })
        except Exception as exc:
            log.warning(f"[naukri] Failed to parse job item: {exc}")
            continue

    log.info(f"[naukri] '{keyword}' @ '{location}' → {len(jobs)} jobs")
    return jobs


def scrape_naukri_bulk(
    keywords:  list[str],
    locations: list[str],
    results_per_query: int = 20,
    delay:     float = 1.5,
) -> list[dict]:
    """
    Run multiple keyword × location queries and return all jobs combined.
    Respects a configurable delay between requests to avoid rate-limiting.
    """
    all_jobs: list[dict] = []
    for kw in keywords:
        for loc in locations:
            batch = scrape_naukri(kw, loc, results=results_per_query)
            all_jobs.extend(batch)
            time.sleep(delay)
    return all_jobs
