import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)


def create_app():
    app = Flask(__name__)

    # Allow requests from Node.js backend + local dev
    CORS(app, origins=[
        os.getenv("ALLOWED_ORIGIN", "http://localhost:5000"),
        "http://localhost:3000",
    ])

    # ── Blueprints ────────────────────────────────────────────────
    from app.routes.jobs    import jobs_bp
    from app.routes.scrape  import scrape_bp
    from app.routes.search  import search_bp

    app.register_blueprint(jobs_bp)
    app.register_blueprint(scrape_bp)
    app.register_blueprint(search_bp)

    # ── Health check ─────────────────────────────────────────────
    @app.get("/health")
    def health():
        from app.db.connection import get_pool
        db_ok = False
        try:
            get_pool()
            db_ok = True
        except Exception:
            pass
        return jsonify({
            "status":  "ok",
            "service": "careerpilot-python",
            "db":      "connected" if db_ok else "unavailable",
        })

    # ── Global error handler ─────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"ok": False, "error": "Route not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"ok": False, "error": "Internal server error"}), 500

    return app
