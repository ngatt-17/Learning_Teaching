import os
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cecs_app:0000@localhost:5432/cecs_ai_hub")

# Initialize connection pool
connection_pool = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=20,
    dsn=DATABASE_URL
)

@contextmanager
def get_db(user_id=None):
    """
    Context manager that yields a database connection and cursor.
    If user_id is provided, sets app.current_user_id on the session
    to enforce PostgreSQL Row-Level Security (RLS).
    """
    conn = connection_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if user_id:
                cur.execute("SET app.current_user_id = %s;", (str(user_id),))
            yield cur
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        # Reset current_user_id to prevent session leak
        try:
            with conn.cursor() as cur:
                cur.execute("RESET app.current_user_id;")
                conn.commit()
        except Exception:
            pass
        connection_pool.putconn(conn)
