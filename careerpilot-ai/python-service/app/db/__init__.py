"""
Run schema.sql once on startup to create tables and indexes if they don't exist.
Safe to call repeatedly — all DDL uses IF NOT EXISTS.
"""
import logging
import os
from pathlib import Path

log = logging.getLogger(__name__)

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def init_db():
    from app.db.connection import get_conn, release_conn
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA_PATH.read_text())
        conn.commit()
        log.info("[db] Schema initialised (tables/indexes created if missing)")
    except Exception as e:
        conn.rollback()
        log.error(f"[db] Schema init failed: {e}")
        raise
    finally:
        release_conn(conn)
