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

    # ── DB schema init ───────────────────────────────────────────
    try:
        from app.db import init_db
        init_db()
    except Exception as e:
        logging.warning(f"[app] DB not available at startup (will retry on first request): {e}")

    # ── Blueprints ────────────────────────────────────────────────
    from app.routes.jobs    import jobs_bp
    from app.routes.scrape  import scrape_bp
    from app.routes.search  import search_bp
    from app.routes.quality import quality_bp
    from app.routes.analyse import analyse_bp

    app.register_blueprint(jobs_bp)
    app.register_blueprint(scrape_bp)
    app.register_blueprint(quality_bp)  # before search to avoid /jobs/<id> conflict
    app.register_blueprint(search_bp)
    app.register_blueprint(analyse_bp)

    # ── Scheduler ────────────────────────────────────────────────
    try:
        from app.scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        logging.warning(f"[app] Scheduler failed to start: {e}")

    # ── Health check ─────────────────────────────────────────────
    @app.get("/health")
    def health():
        from app.db.connection import get_pool
        from app.scheduler     import get_scheduler_status
        db_ok = False
        try:
            get_pool()
            db_ok = True
        except Exception:
            pass
        return jsonify({
            "status":    "ok",
            "service":   "careerpilot-python",
            "db":        "connected" if db_ok else "unavailable",
            "scheduler": get_scheduler_status(),
        })

    # ── Global error handler ─────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"ok": False, "error": "Route not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"ok": False, "error": "Internal server error"}), 500

    return app
