"""
connection.py
─────────────
Thread-safe PostgreSQL connection pool using psycopg2.
Reads DATABASE_URL from environment (falls back to individual vars).
"""

import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

_pool: pool.ThreadedConnectionPool | None = None


def _get_dsn() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    return (
        f"host={os.getenv('DB_HOST', '127.0.0.1')} "
        f"port={os.getenv('DB_PORT', '5435')} "
        f"dbname={os.getenv('DB_NAME', 'hirenext')} "
        f"user={os.getenv('DB_USER', 'hirenext')} "
        f"password={os.getenv('DB_PASSWORD', 'hirenext123')}"
    )


def get_pool() -> pool.ThreadedConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        _pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=_get_dsn(),
        )
    return _pool


def get_conn():
    """Borrow a connection from the pool."""
    return get_pool().getconn()


def release_conn(conn):
    """Return a connection to the pool."""
    get_pool().putconn(conn)


def execute(sql: str, params=None, fetch: str = "none"):
    """
    Convenience helper for one-shot queries.
    fetch: "one" | "all" | "none"
    Returns RealDictRow(s) or None.
    """
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            conn.commit()
            if fetch == "one":
                return cur.fetchone()
            if fetch == "all":
                return cur.fetchall()
            return None
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)
