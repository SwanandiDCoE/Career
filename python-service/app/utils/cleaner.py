"""
DataFrame → list[dict] cleaner.
Normalizes JobSpy output to a consistent schema for the Node.js backend.
"""
import pandas as pd


def clean_jobs(df: pd.DataFrame) -> list[dict]:
    """
    Extract only the fields we need and ensure no NaN values leak out.
    """
    jobs = []

    for _, row in df.iterrows():
        job = {
            'title':       _safe_str(row.get('title')),
            'company':     _safe_str(row.get('company')),
            'location':    _safe_str(row.get('location')),
            'job_url':     _safe_str(row.get('job_url')),
            'description': _safe_str(row.get('description'), max_len=3000),
            'date_posted': _safe_str(row.get('date_posted')),
            'salary_min':  _safe_num(row.get('min_amount')),
            'salary_max':  _safe_num(row.get('max_amount')),
            'job_type':    _safe_str(row.get('job_type')),
            'source':      _safe_str(row.get('site')),
        }
        # Only include jobs with a title and URL
        if job['title'] and job['job_url']:
            jobs.append(job)

    return jobs


def _safe_str(val, max_len: int = None) -> str:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return ''
    result = str(val).strip()
    return result[:max_len] if max_len else result


def _safe_num(val):
    try:
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return None
        return float(val)
    except (ValueError, TypeError):
        return None
