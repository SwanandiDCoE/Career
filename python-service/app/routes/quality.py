"""
routes/quality.py
─────────────────
GET  /quality/jobs          — return clean JSON of high-trust jobs
POST /quality/backfill      — recompute trust_scores for all existing jobs
"""

from flask import Blueprint, request, jsonify
from app.db.jobs_repo  import get_quality_jobs, backfill_trust_scores
from app.utils.quality import clean_schema

quality_bp = Blueprint("quality", __name__)


@quality_bp.get("/quality/jobs")
def quality_jobs():
    """
    Returns a clean JSON array of jobs with trust_score >= min_trust.

    Query params:
      min_trust   int    default 70
      limit       int    default 500 (max 2000)
      offset      int    default 0

    Each job follows the schema:
      { id, title, company, location, required_skills[],
        experience_level, salary_range, job_url, source,
        work_mode, trust_score }
    """
    try:
        min_trust = int(request.args.get("min_trust", 70))
        limit     = min(int(request.args.get("limit",  500)), 2000)
        offset    = int(request.args.get("offset", 0))
    except ValueError:
        return jsonify({"ok": False, "error": "min_trust, limit, offset must be integers"}), 400

    try:
        raw_jobs   = get_quality_jobs(min_trust=min_trust, limit=limit, offset=offset)
        clean_jobs = [clean_schema(j) for j in raw_jobs]
        return jsonify({
            "ok":        True,
            "count":     len(clean_jobs),
            "min_trust": min_trust,
            "data":      clean_jobs,
        }), 200
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500


@quality_bp.post("/quality/backfill")
def backfill():
    """
    Recompute trust_score for all jobs in the DB.
    Also deactivates jobs that fail validation (missing company, vague title, etc.)
    Safe to run multiple times.
    """
    try:
        result = backfill_trust_scores()
        return jsonify({"ok": True, "data": result}), 200
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500
