"""
routes/scrape.py
────────────────
POST /scrape   — trigger the full pipeline (scrape → extract → store)
GET  /stats    — DB stats (total jobs, coverage, breakdown)
"""

from flask import Blueprint, request, jsonify
from app.services.pipeline import run_pipeline, TECH_SEARCH_TERMS
from app.db.jobs_repo import get_stats

scrape_bp = Blueprint("scrape", __name__)


@scrape_bp.post("/scrape")
def scrape():
    """
    Body (all optional):
      {
        "search_terms": ["python developer", "react developer"],
        "locations":    ["Bangalore", "Remote"],
        "results_per_query": 15,
        "sources": ["indeed", "glassdoor"]
      }
    """
    body = request.get_json(silent=True) or {}

    result = run_pipeline(
        search_terms       = body.get("search_terms"),
        locations          = body.get("locations"),
        results_per_query  = int(body.get("results_per_query", 20)),
        sources            = body.get("sources"),
    )

    status = 200 if result["inserted"] > 0 else 207
    return jsonify({"ok": True, "data": result}), status


@scrape_bp.get("/stats")
def stats():
    """Return DB statistics for the stored jobs."""
    try:
        data = get_stats()
        return jsonify({"ok": True, "data": data}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@scrape_bp.get("/search-terms")
def search_terms():
    """Return the list of built-in tech search terms."""
    return jsonify({"ok": True, "data": TECH_SEARCH_TERMS}), 200
