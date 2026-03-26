"""
jobs_repo.py
────────────
All database operations for the jobs table.

insert_job(job)             — upsert one enriched job dict
insert_jobs_batch(jobs)     — bulk upsert list of jobs
search_jobs(filters)        — filter by user profile
get_stats()                 — counts by source, domain, work mode
"""

import json
import psycopg2.extras
from app.db.connection import get_conn, release_conn


# ─────────────────────────────────────────────────────────────────
# INSERT / UPSERT
# ─────────────────────────────────────────────────────────────────

_UPSERT_SQL = """
INSERT INTO jobs (
    title, company, location, job_url, description, date_posted,
    job_type, source,
    salary_min, salary_max, salary_currency, salary_period, salary_raw,
    skills, requirements,
    experience_min, experience_max,
    is_remote, work_mode,
    company_size, company_stage, company_domain,
    trust_score
)
VALUES (
    %(title)s, %(company)s, %(location)s, %(job_url)s, %(description)s, %(date_posted)s,
    %(job_type)s, %(source)s,
    %(salary_min)s, %(salary_max)s, %(salary_currency)s, %(salary_period)s, %(salary_raw)s,
    %(skills)s::jsonb, %(requirements)s::jsonb,
    %(experience_min)s, %(experience_max)s,
    %(is_remote)s, %(work_mode)s,
    %(company_size)s, %(company_stage)s, %(company_domain)s,
    %(trust_score)s
)
ON CONFLICT (job_url) DO UPDATE SET
    title          = EXCLUDED.title,
    description    = EXCLUDED.description,
    salary_min     = EXCLUDED.salary_min,
    salary_max     = EXCLUDED.salary_max,
    salary_raw     = EXCLUDED.salary_raw,
    skills         = EXCLUDED.skills,
    requirements   = EXCLUDED.requirements,
    experience_min = EXCLUDED.experience_min,
    experience_max = EXCLUDED.experience_max,
    is_remote      = EXCLUDED.is_remote,
    work_mode      = EXCLUDED.work_mode,
    company_size   = EXCLUDED.company_size,
    company_stage  = EXCLUDED.company_stage,
    company_domain = EXCLUDED.company_domain,
    trust_score    = EXCLUDED.trust_score,
    scraped_at     = NOW()
RETURNING id;
"""


def _prep(job: dict) -> dict:
    """Ensure all expected keys are present and JSONB fields are serialised."""
    return {
        "title":           job.get("title", ""),
        "company":         job.get("company", ""),
        "location":        job.get("location", ""),
        "job_url":         job.get("job_url", ""),
        "description":     job.get("description", ""),
        "date_posted":     job.get("date_posted", ""),
        "job_type":        job.get("job_type", ""),
        "source":          job.get("source", ""),
        "salary_min":      job.get("salary_min"),
        "salary_max":      job.get("salary_max"),
        "salary_currency": job.get("salary_currency", "INR"),
        "salary_period":   job.get("salary_period", "yearly"),
        "salary_raw":      job.get("salary_raw", ""),
        "skills":          json.dumps(job.get("skills", [])),
        "requirements":    json.dumps(job.get("requirements", [])),
        "experience_min":  job.get("experience_min"),
        "experience_max":  job.get("experience_max"),
        "is_remote":       job.get("is_remote", False),
        "work_mode":       job.get("work_mode", "onsite"),
        "company_size":    job.get("company_size", "unknown"),
        "company_stage":   job.get("company_stage", "unknown"),
        "company_domain":  job.get("company_domain", "tech"),
        "trust_score":     job.get("trust_score", 0),
    }


def insert_job(job: dict) -> str | None:
    """Upsert a single job. Returns the UUID or None on failure."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(_UPSERT_SQL, _prep(job))
            row = cur.fetchone()
            conn.commit()
            return str(row[0]) if row else None
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def insert_jobs_batch(jobs: list[dict]) -> dict:
    """
    Bulk upsert. Returns {"inserted": N, "failed": M, "errors": [...]}.
    Uses executemany for speed.
    """
    stats = {"inserted": 0, "failed": 0, "errors": []}
    conn  = get_conn()
    try:
        with conn.cursor() as cur:
            for job in jobs:
                try:
                    cur.execute(_UPSERT_SQL, _prep(job))
                    stats["inserted"] += 1
                except Exception as e:
                    stats["failed"] += 1
                    stats["errors"].append({"url": job.get("job_url", "?"), "error": str(e)})
                    conn.rollback()   # reset only this job's transaction
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)
    return stats


# ─────────────────────────────────────────────────────────────────
# SEARCH / FILTER
# ─────────────────────────────────────────────────────────────────

def search_jobs(filters: dict) -> list[dict]:
    """
    Filter jobs by a user profile dict.

    Accepted filter keys:
      skills          list[str]   — must overlap with job.skills (any match)
      keywords        str         — full-text search on title+company+description
      location        str         — partial match on location
      is_remote       bool
      work_mode       str         — remote | hybrid | onsite
      job_type        str         — full-time | part-time | contract | internship
      experience      int         — user's years of experience (fits within min–max range)
      salary_min      float       — job salary_min must be >= this
      company_domain  str
      source          str         — indeed | glassdoor
      limit           int         — default 50
      offset          int         — default 0
    """
    conditions = ["is_active = TRUE"]
    params     = {}

    # ── skills overlap (PostgreSQL ?| operator on JSONB) ──────────
    if filters.get("skills"):
        skill_list = [s.lower() for s in filters["skills"]]
        conditions.append(
            "EXISTS ("
            "  SELECT 1 FROM jsonb_array_elements_text(skills) AS s"
            "  WHERE lower(s) = ANY(%(skills)s)"
            ")"
        )
        params["skills"] = skill_list

    # ── full-text search ─────────────────────────────────────────
    if filters.get("keywords"):
        conditions.append(
            "to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company,'') || ' ' || coalesce(description,''))"
            " @@ plainto_tsquery('english', %(keywords)s)"
        )
        params["keywords"] = filters["keywords"]

    # ── location ────────────────────────────────────────────────
    # JobSpy returns state/region codes like "KA, IN" or "CA, US".
    # Map common city names → their codes so filters still work.
    _CITY_TO_STATE = {
        # India
        "bangalore": "ka", "bengaluru": "ka",
        "hyderabad": "tg", "mumbai": "mh", "pune": "mh",
        "delhi": "dl", "chennai": "tn", "kolkata": "wb",
        "gurgaon": "hr", "gurugram": "hr", "noida": "up", "ahmedabad": "gj",
        # USA
        "san francisco": "ca", "los angeles": "ca", "san jose": "ca",
        "new york": "ny", "new york city": "ny", "nyc": "ny",
        "seattle": "wa", "boston": "ma", "austin": "tx",
        "chicago": "il", "denver": "co", "atlanta": "ga",
        # UK / Europe
        "london": "uk", "manchester": "uk",
        "berlin": "germany", "amsterdam": "netherlands", "paris": "france",
        # Asia-Pacific
        "singapore": "singapore",
        "sydney": "australia", "melbourne": "australia",
        "toronto": "canada", "vancouver": "canada",
    }
    if filters.get("location"):
        loc_lower = filters["location"].lower().strip()
        state_code = _CITY_TO_STATE.get(loc_lower)
        if state_code:
            # Match either the city name OR the state code (e.g. "KA, IN")
            conditions.append(
                "(lower(location) LIKE %(location)s OR lower(location) LIKE %(state_code)s)"
            )
            params["location"]   = f"%{loc_lower}%"
            params["state_code"] = f"%{state_code}%"
        else:
            conditions.append("lower(location) LIKE %(location)s")
            params["location"] = f"%{loc_lower}%"

    # ── remote / work_mode ─────────────────────────────────────
    if filters.get("is_remote") is True:
        conditions.append("is_remote = TRUE")
    if filters.get("work_mode"):
        conditions.append("work_mode = %(work_mode)s")
        params["work_mode"] = filters["work_mode"]

    # ── job type ───────────────────────────────────────────────
    if filters.get("job_type"):
        conditions.append("lower(job_type) = %(job_type)s")
        params["job_type"] = filters["job_type"].lower()

    # ── experience fit ─────────────────────────────────────────
    if filters.get("experience") is not None:
        exp = int(filters["experience"])
        conditions.append(
            "(experience_min IS NULL OR %(exp)s >= experience_min) AND"
            " (experience_max IS NULL OR %(exp)s <= experience_max + 2)"
        )
        params["exp"] = exp

    # ── salary floor ──────────────────────────────────────────
    if filters.get("salary_min") is not None:
        conditions.append("(salary_min IS NULL OR salary_min >= %(sal_floor)s)")
        params["sal_floor"] = float(filters["salary_min"])

    # ── company domain ────────────────────────────────────────
    if filters.get("company_domain"):
        conditions.append("company_domain = %(company_domain)s")
        params["company_domain"] = filters["company_domain"]

    # ── source ────────────────────────────────────────────────
    if filters.get("source"):
        conditions.append("source = %(source)s")
        params["source"] = filters["source"]

    # ── trust_score floor ─────────────────────────────────────
    if filters.get("min_trust") is not None:
        conditions.append("trust_score >= %(min_trust)s")
        params["min_trust"] = int(filters["min_trust"])

    limit  = int(filters.get("limit",  50))
    offset = int(filters.get("offset", 0))

    where = " AND ".join(conditions)
    sql = f"""
        SELECT
            id, title, company, location, job_url, date_posted,
            job_type, source, work_mode, is_remote,
            salary_min, salary_max, salary_currency, salary_period, salary_raw,
            skills, requirements,
            experience_min, experience_max,
            company_size, company_stage, company_domain,
            trust_score, scraped_at
        FROM jobs
        WHERE {where}
        ORDER BY scraped_at DESC, salary_max DESC NULLS LAST
        LIMIT %(limit)s OFFSET %(offset)s
    """
    params["limit"]  = limit
    params["offset"] = offset

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            # Convert RealDictRow → plain dict, parse JSONB strings
            result = []
            for row in rows:
                d = dict(row)
                d["skills"]       = d["skills"]       if isinstance(d["skills"],       list) else []
                d["requirements"] = d["requirements"] if isinstance(d["requirements"], list) else []
                d["scraped_at"]   = d["scraped_at"].isoformat() if d.get("scraped_at") else None
                d["id"]           = str(d["id"])
                result.append(d)
            return result
    finally:
        release_conn(conn)


# ─────────────────────────────────────────────────────────────────
# QUALITY JOBS
# ─────────────────────────────────────────────────────────────────

def get_quality_jobs(min_trust: int = 70, limit: int = 500, offset: int = 0) -> list[dict]:
    """
    Return jobs with trust_score >= min_trust in clean output schema.
    Ordered by trust_score DESC, then scraped_at DESC.
    """
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    id, title, company, location, job_url, date_posted,
                    source, work_mode, is_remote,
                    salary_min, salary_max, salary_currency, salary_period, salary_raw,
                    skills, experience_min, experience_max, trust_score
                FROM jobs
                WHERE is_active = TRUE
                  AND trust_score >= %s
                ORDER BY trust_score DESC, scraped_at DESC
                LIMIT %s OFFSET %s
            """, (min_trust, limit, offset))
            rows = cur.fetchall()
            result = []
            for row in rows:
                d = dict(row)
                d["id"]     = str(d["id"])
                d["skills"] = d["skills"] if isinstance(d["skills"], list) else []
                result.append(d)
            return result
    finally:
        release_conn(conn)


def backfill_trust_scores() -> dict:
    """
    Compute and update trust_score for all active jobs.
    Also deactivates jobs that fail validation.
    Safe to run multiple times.
    """
    from app.utils.quality import compute_trust_score, validate

    conn = get_conn()
    updated = skipped = deactivated = 0
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT id, title, company, job_url, description, source,
                       salary_raw, salary_min, salary_max, date_posted, skills
                FROM jobs WHERE is_active = TRUE
            """)
            rows = cur.fetchall()

        with conn.cursor() as cur:
            for row in rows:
                job = dict(row)
                job["skills"] = job["skills"] if isinstance(job["skills"], list) else []

                is_valid, _ = validate(job)
                if not is_valid:
                    cur.execute(
                        "UPDATE jobs SET is_active = FALSE WHERE id = %s",
                        (job["id"],)
                    )
                    deactivated += 1
                    continue

                score = compute_trust_score(job)
                cur.execute(
                    "UPDATE jobs SET trust_score = %s WHERE id = %s",
                    (score, job["id"])
                )
                updated += 1

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)

    return {"updated": updated, "deactivated": deactivated, "skipped": skipped}


# ─────────────────────────────────────────────────────────────────
# IDF SUPPORT
# ─────────────────────────────────────────────────────────────────

def get_skills_for_idf() -> tuple[int, dict[str, int]]:
    """
    Return (total_active_jobs, {skill: job_count}) for IDF computation.
    Lightweight — only fetches the skills column.
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE")
            total = cur.fetchone()[0]
            cur.execute(
                "SELECT skills FROM jobs WHERE is_active = TRUE AND skills IS NOT NULL"
            )
            skill_counts: dict[str, int] = {}
            for (skills,) in cur.fetchall():
                if isinstance(skills, list):
                    for s in set(s.lower() for s in skills):
                        skill_counts[s] = skill_counts.get(s, 0) + 1
            return total, skill_counts
    finally:
        release_conn(conn)


# ─────────────────────────────────────────────────────────────────
# STATS
# ─────────────────────────────────────────────────────────────────

def get_stats() -> dict:
    """Return a breakdown of stored jobs for the /stats endpoint."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM jobs WHERE is_active = TRUE")
            total = cur.fetchone()["total"]

            cur.execute("""
                SELECT source, COUNT(*) AS count
                FROM jobs WHERE is_active = TRUE
                GROUP BY source ORDER BY count DESC
            """)
            by_source = {r["source"]: r["count"] for r in cur.fetchall()}

            cur.execute("""
                SELECT company_domain, COUNT(*) AS count
                FROM jobs WHERE is_active = TRUE
                GROUP BY company_domain ORDER BY count DESC LIMIT 10
            """)
            by_domain = {r["company_domain"]: r["count"] for r in cur.fetchall()}

            cur.execute("""
                SELECT work_mode, COUNT(*) AS count
                FROM jobs WHERE is_active = TRUE
                GROUP BY work_mode ORDER BY count DESC
            """)
            by_work_mode = {r["work_mode"]: r["count"] for r in cur.fetchall()}

            cur.execute("""
                SELECT COUNT(*) AS count
                FROM jobs WHERE is_active = TRUE
                AND array_length(ARRAY(SELECT jsonb_array_elements_text(skills)), 1) > 0
            """)
            with_skills = cur.fetchone()["count"]

        return {
            "total":         total,
            "by_source":     by_source,
            "by_domain":     by_domain,
            "by_work_mode":  by_work_mode,
            "with_skills":   with_skills,
            "skills_coverage": f"{round(with_skills/total*100, 1)}%" if total else "0%",
        }
    finally:
        release_conn(conn)
