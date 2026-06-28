#!/usr/bin/env bash
#
# connect.sh — open a psql connection to the LockIn Supabase DB and run whatever
# args / stdin you pass (e.g. -c "select …" or a heredoc transaction).
#
# Password resolution (option 3 — env wins, else local creds file, else app env):
#   1. $LOCKIN_DATABASE_URL (full URL incl. password) or $SUPABASE_DB_PASSWORD
#   2. credentials.env in this skill folder  (copy from credentials.env.example)
#   3. apps/web/.env.local at the repo root  (this dev machine)
#
# The password is passed via PGPASSWORD, never on the command line.
# No secret is ever written to a tracked file.

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 2. Local creds file (gitignored), if the env didn't already provide a password.
if [[ -z "${LOCKIN_DATABASE_URL:-}" && -z "${SUPABASE_DB_PASSWORD:-}" && -f "$SKILL_DIR/credentials.env" ]]; then
  set -a; . "$SKILL_DIR/credentials.env"; set +a
fi

# 3. The app's local env (only when running inside the repo on this machine).
if [[ -z "${LOCKIN_DATABASE_URL:-}" && -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  for f in "apps/web/.env.local" "$SKILL_DIR/../../../apps/web/.env.local"; do
    if [[ -f "$f" ]]; then set -a; . "$f"; set +a; break; fi
  done
fi

# Locate psql (prefer an explicit PSQL_BIN, then PATH, then Homebrew libpq).
PSQL="${PSQL_BIN:-psql}"
if ! command -v "$PSQL" >/dev/null 2>&1; then
  if [[ -x /opt/homebrew/opt/libpq/bin/psql ]]; then
    PSQL=/opt/homebrew/opt/libpq/bin/psql
  else
    echo "connect.sh: psql not found (set PSQL_BIN, or install libpq / postgresql-client)." >&2
    exit 127
  fi
fi

# Prefer a full URL if given; otherwise build one and pass the password via env.
if [[ -n "${LOCKIN_DATABASE_URL:-}" ]]; then
  exec "$PSQL" "$LOCKIN_DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "connect.sh: no DB password found." >&2
  echo "  Set SUPABASE_DB_PASSWORD or LOCKIN_DATABASE_URL, or create" >&2
  echo "  $SKILL_DIR/credentials.env from credentials.env.example." >&2
  exit 1
fi

HOST="${LOCKIN_DB_HOST:-aws-1-us-west-2.pooler.supabase.com}"
PORT="${LOCKIN_DB_PORT:-5432}"
USER="${LOCKIN_DB_USER:-postgres.hwrnevicgtnbexnsxitm}"
DB="${LOCKIN_DB_NAME:-postgres}"

export PGPASSWORD="$SUPABASE_DB_PASSWORD"
exec "$PSQL" "postgresql://${USER}@${HOST}:${PORT}/${DB}?sslmode=require" \
  -v ON_ERROR_STOP=1 "$@"
