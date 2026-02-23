#!/usr/bin/env python3
"""
Inspect values stored in the SQLite database.

Examples:
  python view_database.py
  python view_database.py --table users
  python view_database.py --limit 5
  python view_database.py --table feedback_answers --limit 50
"""

import argparse
import json
import os
import sqlite3
import sys
from typing import Iterable


DB_PATH = os.path.join(os.path.dirname(__file__), "feedback.db")


def get_tables(conn: sqlite3.Connection) -> list[str]:
    rows = conn.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
        """
    ).fetchall()
    return [row["name"] for row in rows]


def print_rows(table: str, rows: Iterable[sqlite3.Row]) -> None:
    print(f"\n--- {table} ---")
    count = 0
    for row in rows:
        count += 1
        print(json.dumps(dict(row), ensure_ascii=True, default=str))
    if count == 0:
        print("(no rows)")


def table_row_count(conn: sqlite3.Connection, table: str) -> int:
    return conn.execute(f'SELECT COUNT(*) AS c FROM "{table}"').fetchone()["c"]


def inspect_table(conn: sqlite3.Connection, table: str, limit: int) -> None:
    total = table_row_count(conn, table)
    print(f"\nTable: {table} | total rows: {total}")
    rows = conn.execute(f'SELECT * FROM "{table}" LIMIT ?', (limit,)).fetchall()
    print_rows(table, rows)
    if total > limit:
        print(f"... showing first {limit} of {total} rows")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="View values in feedback.db")
    parser.add_argument("--table", help="Inspect only one table name")
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maximum rows to show per table (default: 20)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.limit <= 0:
        print("Error: --limit must be a positive integer.")
        return 1

    if not os.path.exists(DB_PATH):
        print(f"Error: database file not found: {DB_PATH}")
        return 1

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        tables = get_tables(conn)
        if not tables:
            print("No tables found in the database.")
            return 0

        if args.table:
            if args.table not in tables:
                print(
                    f"Error: table '{args.table}' not found. Available tables: {', '.join(tables)}"
                )
                return 1
            inspect_table(conn, args.table, args.limit)
            return 0

        print("Tables found:")
        for table in tables:
            total = table_row_count(conn, table)
            print(f"- {table}: {total} rows")

        for table in tables:
            inspect_table(conn, table, args.limit)
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
