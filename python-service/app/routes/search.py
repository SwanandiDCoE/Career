"""
routes/search.py
────────────────
GET  /jobs/search   — filter stored jobs by user profile
GET  /jobs/:id      — single job detail
"""

from flask import Blueprint, request, jsonify
from app.db.jobs_repo import search_jobs
from app.db.connection import execute

search_bp = Blueprint("search", __name__)


@search_bp.get("/jobs/search")
def job_search():
    """
    Query params map directly to filter keys:

      skills          comma-separated  e.g. Python,React,AWS
      keywords        string           e.g. "backend engineer"
      location        string           e.g. Bangalore
      is_remote       bool             true | false
      work_mode       string           remote | hybrid | onsite
      job_type        string           full-time | contract | internship
      experience      int              user's years of exp
      salary_min      float            minimum desired salary
      company_domain  string           fintech | SaaS | AI/ML ...
      source          string           indeed | glassdoor
      limit           int              default 50
      offset          int              default 0

    Returns:
      { ok, count, data: [job, ...] }
    """
    args = request.args

    filters: dict = {}

    if args.get("skills"):
        filters["skills"] = [s.strip() for s in args["skills"].split(",") if s.strip()]

    if args.get("keywords"):
        filters["keywords"] = args["keywords"]

    if args.get("location"):
        filters["location"] = args["location"]

    if args.get("is_remote"):
        filters["is_remote"] = args["is_remote"].lower() == "true"

    if args.get("work_mode"):
        filters["work_mode"] = args["work_mode"]

    if args.get("job_type"):
        filters["job_type"] = args["job_type"]

    if args.get("experience"):
        try:
            filters["experience"] = int(args["experience"])
        except ValueError:
            return jsonify({"ok": False, "error": "experience must be an integer"}), 400

    if args.get("salary_min"):
        try:
            filters["salary_min"] = float(args["salary_min"])
        except ValueError:
            return jsonify({"ok": False, "error": "salary_min must be a number"}), 400

    if args.get("company_domain"):
        filters["company_domain"] = args["company_domain"]

    if args.get("source"):
        filters["source"] = args["source"]

    filters["limit"]  = min(int(args.get("limit",  50)), 200)
    filters["offset"] = int(args.get("offset", 0))

    try:
        jobs = search_jobs(filters)
        return jsonify({"ok": True, "count": len(jobs), "data": jobs}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@search_bp.get("/jobs/<job_id>")
def job_detail(job_id: str):
    """Fetch a single job by UUID."""
    try:
        row = execute(
            "SELECT * FROM jobs WHERE id = %s AND is_active = TRUE",
            (job_id,), fetch="one"
        )
        if not row:
            return jsonify({"ok": False, "error": "Job not found"}), 404
        d = dict(row)
        d["id"]         = str(d["id"])
        d["scraped_at"] = d["scraped_at"].isoformat() if d.get("scraped_at") else None
        return jsonify({"ok": True, "data": d}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
