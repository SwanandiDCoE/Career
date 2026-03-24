"""
test_extractor.py
─────────────────
Unit tests for the regex extractor.
Tests are self-contained — no DB or network required.

Run:  python -m pytest tests/test_extractor.py -v
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from app.utils.extractor import (
    extract_skills,
    extract_experience,
    extract_work_mode,
    extract_salary,
    extract_requirements,
    extract_company_size,
    extract_company_stage,
    extract_company_domain,
    extract,
)

# ─────────────────────────────────────────────────────────────────
# Fixtures — realistic job descriptions
# ─────────────────────────────────────────────────────────────────

BACKEND_JD = """
Senior Backend Engineer – Payments Platform

We are a Series B fintech startup building the next-gen payment infrastructure.
We have 200+ employees and are backed by Sequoia Capital.

Requirements:
- 4-7 years of experience in backend development
- Strong proficiency in Python, Golang
- Experience with PostgreSQL, Redis, Kafka
- Hands-on with AWS (EC2, Lambda, S3)
- Docker, Kubernetes experience preferred
- RESTful API design
- CI/CD with GitHub Actions

Compensation: ₹25–40 LPA
Location: Bangalore (Hybrid – 3 days in office)
"""

FRONTEND_JD = """
Frontend Developer (React)

Remote-first company | Series A startup | EdTech

We're looking for a passionate React developer with 2-4 years of experience.

What you'll need:
• Proficiency in React.js, TypeScript, and Next.js
• Strong knowledge of Tailwind CSS, HTML5, CSS3
• Familiarity with Redux and GraphQL
• Experience with Git and GitHub
• Knowledge of REST APIs

Salary: $70k – $95k per year
Fully remote, anywhere in the world.
"""

ML_JD = """
Machine Learning Engineer

We are an enterprise AI/ML platform company (Fortune 500).

Basic Qualifications:
- PhD or Master's in Computer Science or related field
- 5+ years experience with Machine Learning, Deep Learning
- PyTorch, TensorFlow, scikit-learn proficiency
- Python, Scala
- Apache Spark, Kafka for data pipelines
- AWS or GCP cloud experience

Salary: ₹45 LPA+
Bangalore, Hyderabad – Onsite
"""

MINIMAL_JD = """
Software Developer needed. Must know JavaScript.
No experience required. Entry level role.
"""

SALARY_VARIANTS = [
    ("We offer ₹12-18 LPA for this role",    1_200_000, 1_800_000, "INR"),
    ("Salary: $80,000 - $120,000 per year",  80_000,    120_000,   "USD"),
    ("Compensation: $95k - $130k annually",  95_000,    130_000,   "USD"),
    ("Pay: ₹50,000/month",                   50_000,    None,      "INR"),
    ("Salary: 15-20 lakhs",                  1_500_000, 2_000_000, "INR"),
]

# ─────────────────────────────────────────────────────────────────
# SKILLS
# ─────────────────────────────────────────────────────────────────

class TestSkillExtraction:

    def test_backend_skills_found(self):
        skills = extract_skills(BACKEND_JD)
        for expected in ["Python", "Golang", "Redis", "Kafka", "Docker", "Kubernetes"]:
            assert any(expected.lower() in s.lower() for s in skills), \
                f"Expected skill '{expected}' not found in {skills}"

    def test_cloud_skills_found(self):
        skills = extract_skills(BACKEND_JD)
        assert any("aws" in s.lower() for s in skills), f"AWS not in {skills}"

    def test_frontend_skills_found(self):
        skills = extract_skills(FRONTEND_JD)
        for expected in ["React", "TypeScript", "Next.js", "Tailwind", "Redux", "GraphQL"]:
            assert any(expected.lower() in s.lower() for s in skills), \
                f"Expected '{expected}' not in {skills}"

    def test_ml_skills_found(self):
        skills = extract_skills(ML_JD)
        for expected in ["Python", "Pytorch", "Tensorflow"]:
            assert any(expected.lower() in s.lower() for s in skills), \
                f"Expected '{expected}' not in {skills}"

    def test_no_false_positives_on_minimal_jd(self):
        skills = extract_skills(MINIMAL_JD)
        # Should find JavaScript but not hallucinate Python/React etc.
        assert any("javascript" in s.lower() for s in skills)
        assert not any("python" in s.lower() for s in skills)
        assert not any("react" in s.lower() for s in skills)

    def test_deduplication(self):
        text = "React React.js ReactJS are all the same"
        skills = extract_skills(text)
        react_skills = [s for s in skills if "react" in s.lower()]
        assert len(react_skills) == 1, f"Duplicate React skills: {react_skills}"

    def test_returns_list(self):
        assert isinstance(extract_skills(""), list)
        assert len(extract_skills("")) == 0


# ─────────────────────────────────────────────────────────────────
# EXPERIENCE
# ─────────────────────────────────────────────────────────────────

class TestExperienceExtraction:

    def test_range_pattern(self):
        exp = extract_experience(BACKEND_JD)
        assert exp["min"] == 4
        assert exp["max"] == 7

    def test_range_frontend(self):
        exp = extract_experience(FRONTEND_JD)
        assert exp["min"] == 2
        assert exp["max"] == 4

    def test_plus_pattern(self):
        exp = extract_experience("We need 5+ years of experience in Python")
        assert exp["min"] == 5
        assert exp["max"] is None

    def test_minimum_pattern(self):
        exp = extract_experience("Minimum 3 years experience required")
        assert exp["min"] == 3

    def test_no_experience_mentioned(self):
        exp = extract_experience(MINIMAL_JD)
        assert exp["min"] is None
        assert exp["max"] is None


# ─────────────────────────────────────────────────────────────────
# WORK MODE
# ─────────────────────────────────────────────────────────────────

class TestWorkModeExtraction:

    def test_hybrid_detected(self):
        wm = extract_work_mode(BACKEND_JD)
        assert wm["mode"] == "hybrid"
        assert wm["is_remote"] is False

    def test_fully_remote(self):
        wm = extract_work_mode(FRONTEND_JD)
        assert wm["mode"] == "remote"
        assert wm["is_remote"] is True

    def test_onsite(self):
        wm = extract_work_mode(ML_JD)
        assert wm["mode"] == "onsite"
        assert wm["is_remote"] is False

    def test_wfh_is_remote(self):
        wm = extract_work_mode("This is a work from home opportunity")
        assert wm["is_remote"] is True

    def test_default_is_onsite(self):
        wm = extract_work_mode("A software job in Chennai")
        assert wm["mode"] == "onsite"


# ─────────────────────────────────────────────────────────────────
# SALARY
# ─────────────────────────────────────────────────────────────────

class TestSalaryExtraction:

    @pytest.mark.parametrize("text,expected_min,expected_max,currency", SALARY_VARIANTS)
    def test_salary_variants(self, text, expected_min, expected_max, currency):
        sal = extract_salary({}, text)
        assert sal["currency"] == currency, f"Currency mismatch: {sal}"
        assert sal["min"] == expected_min,  f"Min mismatch: {sal} for '{text}'"
        if expected_max is not None:
            assert sal["max"] == expected_max, f"Max mismatch: {sal} for '{text}'"

    def test_prefers_structured_salary_in_job_dict(self):
        job = {"salary_min": 500000, "salary_max": 800000, "source": "glassdoor"}
        sal = extract_salary(job, "no salary text here")
        assert sal["min"] == 500000
        assert sal["max"] == 800000

    def test_no_salary_returns_none(self):
        sal = extract_salary({}, "Join our team as a software developer")
        assert sal["min"] is None
        assert sal["max"] is None


# ─────────────────────────────────────────────────────────────────
# REQUIREMENTS
# ─────────────────────────────────────────────────────────────────

class TestRequirementsExtraction:

    def test_bullet_requirements_extracted(self):
        reqs = extract_requirements(BACKEND_JD)
        assert len(reqs) >= 3, f"Too few requirements: {reqs}"

    def test_requirements_are_strings(self):
        reqs = extract_requirements(FRONTEND_JD)
        for r in reqs:
            assert isinstance(r, str)
            assert len(r) >= 15

    def test_cap_at_20_items(self):
        # Repeat bullets many times
        text = "\n".join([f"- Requirement number {i} that is quite specific and detailed" for i in range(50)])
        reqs = extract_requirements(text)
        assert len(reqs) <= 20

    def test_deduplication(self):
        text = "Requirements:\n- Know Python\n- Know Python\n- Know Python\n"
        reqs = extract_requirements(text)
        assert len([r for r in reqs if "Python" in r]) == 1


# ─────────────────────────────────────────────────────────────────
# COMPANY ENRICHMENT
# ─────────────────────────────────────────────────────────────────

class TestCompanyEnrichment:

    def test_fintech_domain(self):
        assert extract_company_domain(BACKEND_JD) == "fintech"

    def test_edtech_domain(self):
        assert extract_company_domain(FRONTEND_JD) == "edtech"

    def test_aiml_domain(self):
        assert extract_company_domain(ML_JD) == "AI/ML"

    def test_series_b_stage(self):
        assert extract_company_stage(BACKEND_JD) == "Series B"

    def test_series_a_stage(self):
        assert extract_company_stage(FRONTEND_JD) == "Series A"

    def test_enterprise_size(self):
        assert extract_company_size(ML_JD) == "enterprise"

    def test_startup_size(self):
        assert extract_company_size(BACKEND_JD) == "startup"

    def test_unknown_stage(self):
        assert extract_company_stage(MINIMAL_JD) == "unknown"


# ─────────────────────────────────────────────────────────────────
# FULL EXTRACT PIPELINE
# ─────────────────────────────────────────────────────────────────

class TestFullExtract:

    def test_returns_all_expected_keys(self):
        job = {
            "title": "Backend Engineer",
            "company": "Razorpay",
            "location": "Bangalore",
            "job_url": "https://example.com/job/1",
            "description": BACKEND_JD,
            "source": "indeed",
        }
        result = extract(job)
        required_keys = [
            "skills", "requirements", "experience_min", "experience_max",
            "is_remote", "work_mode", "salary_raw", "salary_min", "salary_max",
            "salary_period", "salary_currency", "company_size", "company_stage",
            "company_domain",
        ]
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_preserves_original_fields(self):
        job = {
            "title": "Test Engineer", "company": "TestCo",
            "job_url": "https://x.com/1", "description": BACKEND_JD,
        }
        result = extract(job)
        assert result["title"]   == "Test Engineer"
        assert result["company"] == "TestCo"

    def test_empty_description_doesnt_crash(self):
        job = {"title": "Dev", "company": "Co", "job_url": "https://x.com/2", "description": ""}
        result = extract(job)
        assert result["skills"] == []
        assert result["requirements"] == []


# ─────────────────────────────────────────────────────────────────
# DATA USEFULNESS ASSESSMENT
# ─────────────────────────────────────────────────────────────────

class TestDataUsefulnessForJobSeekers:
    """
    Simulates a job seeker profile and validates that the extracted
    data would produce meaningful, useful filter results.
    """

    def _run_profile(self, jd: str, profile: dict) -> dict:
        """
        Given a JD text and a job seeker profile, check how well
        the extracted data matches the profile. Returns a score dict.
        """
        job = {"title": "Role", "company": "Co", "job_url": "https://x.com/3", "description": jd}
        extracted = extract(job)

        extracted_skills_lower = [s.lower() for s in extracted["skills"]]
        profile_skills_lower   = [s.lower() for s in profile.get("skills", [])]

        matched_skills   = [s for s in profile_skills_lower if any(s in es for es in extracted_skills_lower)]
        skill_match_rate = len(matched_skills) / len(profile_skills_lower) if profile_skills_lower else 0

        exp_ok = True
        if profile.get("years_exp") is not None:
            mn = extracted["experience_min"]
            mx = extracted["experience_max"]
            if mn and profile["years_exp"] < mn - 1:
                exp_ok = False
            if mx and profile["years_exp"] > mx + 2:
                exp_ok = False

        remote_ok = True
        if profile.get("wants_remote") and not extracted["is_remote"]:
            remote_ok = False

        return {
            "skill_match_rate": skill_match_rate,
            "matched_skills":   matched_skills,
            "exp_ok":           exp_ok,
            "remote_ok":        remote_ok,
            "has_salary":       extracted["salary_min"] is not None,
            "has_skills":       len(extracted["skills"]) > 0,
            "has_exp_range":    extracted["experience_min"] is not None,
        }

    def test_python_backend_dev_profile(self):
        profile = {
            "skills":      ["Python", "PostgreSQL", "AWS", "Docker"],
            "years_exp":   5,
            "wants_remote": False,
        }
        result = self._run_profile(BACKEND_JD, profile)
        assert result["skill_match_rate"] >= 0.75, \
            f"Low skill match for Python dev: {result['matched_skills']} ({result['skill_match_rate']:.0%})"
        assert result["exp_ok"],   "Experience range check failed"
        assert result["has_skills"], "No skills extracted — filtering useless"
        print(f"\n[PASS] Python backend dev: {result['skill_match_rate']:.0%} skill match")

    def test_react_developer_profile(self):
        profile = {
            "skills":      ["React", "TypeScript", "GraphQL", "Next.js"],
            "years_exp":   3,
            "wants_remote": True,
        }
        result = self._run_profile(FRONTEND_JD, profile)
        assert result["skill_match_rate"] >= 0.75, \
            f"Low skill match for React dev: {result['skill_match_rate']:.0%}"
        assert result["remote_ok"], "Remote job not detected for remote-first JD"
        assert result["has_salary"], "Salary not extracted from frontend JD"
        print(f"\n[PASS] React dev: {result['skill_match_rate']:.0%} skill match, remote={result['remote_ok']}")

    def test_ml_engineer_profile(self):
        profile = {
            "skills":      ["Python", "PyTorch", "Machine Learning", "AWS"],
            "years_exp":   6,
            "wants_remote": False,
        }
        result = self._run_profile(ML_JD, profile)
        assert result["skill_match_rate"] >= 0.50, \
            f"Low skill match for ML eng: {result['skill_match_rate']:.0%}"
        assert result["has_skills"]
        print(f"\n[PASS] ML engineer: {result['skill_match_rate']:.0%} skill match")

    def test_overqualified_candidate_flagged(self):
        """A 15-year veteran applying to a 2-4 year role should NOT pass exp filter."""
        profile = {"skills": ["React"], "years_exp": 15, "wants_remote": True}
        result  = self._run_profile(FRONTEND_JD, profile)
        # exp_ok allows +2 buffer, 15 > 4+2=6 → should be False
        assert result["exp_ok"] is False, "Overqualified candidate should fail exp check"
        print("\n[PASS] Overqualified candidate correctly flagged")

    def test_underqualified_candidate_flagged(self):
        """A 1-year dev applying to a 4-7 year role should be flagged."""
        profile = {"skills": ["Python"], "years_exp": 1, "wants_remote": False}
        result  = self._run_profile(BACKEND_JD, profile)
        assert result["exp_ok"] is False, "Underqualified candidate should fail exp check"
        print("\n[PASS] Underqualified candidate correctly flagged")

    def test_salary_extraction_gives_useful_number(self):
        """Verify that extracted salary is non-trivially useful (> 0)."""
        job = {"title": "Dev", "company": "Co", "job_url": "https://x.com/4",
               "description": BACKEND_JD}
        extracted = extract(job)
        assert extracted["salary_min"] is not None
        assert extracted["salary_min"] > 0
        # ₹25 LPA = 2,500,000
        assert extracted["salary_min"] >= 2_000_000, \
            f"Salary seems wrong: {extracted['salary_min']}"
        print(f"\n[PASS] Salary extracted: INR {extracted['salary_min']:,.0f} - INR {extracted['salary_max']:,.0f}")
