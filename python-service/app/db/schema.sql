-- ================================================================
-- Hirenext  –  PostgreSQL Schema
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_uuid()

-- ── Main jobs table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Raw fields from JobSpy
    title           TEXT        NOT NULL,
    company         TEXT        NOT NULL,
    location        TEXT,
    job_url         TEXT        UNIQUE NOT NULL,
    description     TEXT,
    date_posted     TEXT,
    job_type        TEXT,           -- full-time / part-time / contract / internship
    source          TEXT,           -- indeed / glassdoor

    -- Salary (raw + parsed)
    salary_min      NUMERIC,
    salary_max      NUMERIC,
    salary_currency TEXT        DEFAULT 'INR',
    salary_period   TEXT,           -- yearly / monthly / hourly
    salary_raw      TEXT,           -- e.g. "₹12–18 LPA" as scraped

    -- Regex-extracted structured fields
    skills          JSONB       DEFAULT '[]',     -- ["Python","React","AWS"]
    requirements    JSONB       DEFAULT '[]',     -- bullet points from JD
    experience_min  INT,                          -- 2  (years)
    experience_max  INT,                          -- 5  (years)
    is_remote       BOOLEAN     DEFAULT FALSE,
    work_mode       TEXT,           -- remote / hybrid / onsite

    -- Company enrichment (regex from description)
    company_size    TEXT,           -- startup / mid-size / enterprise / unknown
    company_stage   TEXT,           -- Series A / B / public / unknown
    company_domain  TEXT,           -- fintech / healthtech / edtech / SaaS etc.

    -- Quality
    trust_score     INT         DEFAULT 0,   -- 0–100 computed by quality.py

    -- Meta
    scraped_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN     DEFAULT TRUE
);

-- ── Indexes for fast filtering ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_source       ON jobs (source);
CREATE INDEX IF NOT EXISTS idx_jobs_location     ON jobs (location);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type     ON jobs (job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_is_remote    ON jobs (is_remote);
CREATE INDEX IF NOT EXISTS idx_jobs_skills       ON jobs USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at   ON jobs (scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_salary_min   ON jobs (salary_min);
CREATE INDEX IF NOT EXISTS idx_jobs_exp          ON jobs (experience_min, experience_max);
CREATE INDEX IF NOT EXISTS idx_jobs_company_dom  ON jobs (company_domain);

-- Full-text search index on title + company + description
CREATE INDEX IF NOT EXISTS idx_jobs_fts ON jobs
    USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company,'') || ' ' || coalesce(description,'')));
