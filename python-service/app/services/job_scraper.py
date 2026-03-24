"""
JobSpy scraping service.
Fetches real job listings from Indeed, Glassdoor, and LinkedIn.
Returns a clean list of dicts ready for the Node.js scoring pipeline.
"""
import os
from jobspy import scrape_jobs as jobspy_scrape
from app.utils.cleaner import clean_jobs


def scrape_jobs(job_title: str, location: str, results_wanted: int = 20) -> list[dict]:
    """
    Scrape jobs using JobSpy and return cleaned list.
    """
    hours_old = int(os.getenv('DEFAULT_HOURS_OLD', 72))

    df = jobspy_scrape(
        site_name=['indeed', 'glassdoor', 'linkedin'],
        search_term=job_title,
        location=location,
        results_wanted=results_wanted,
        hours_old=hours_old,
        country_indeed='India',    # Change to your target country
    )

    if df is None or df.empty:
        return []

    return clean_jobs(df)
