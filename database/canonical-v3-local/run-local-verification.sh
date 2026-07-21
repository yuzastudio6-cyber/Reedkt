#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
DATABASE_URL="${REEDITPRO_CANONICAL_V3_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:57432/postgres}"
SUPABASE_BIN="${SUPABASE_BIN:-$(command -v supabase)}"
PSQL_BIN="${PSQL_BIN:-$(command -v psql)}"

if [[ ! "${DATABASE_URL}" =~ ^postgres(ql)?://[^@]+@(127\.0\.0\.1|localhost):57432/postgres([?].*)?$ ]]; then
  echo "Refusing non-local canonical V3 database URL." >&2
  exit 64
fi
if [[ -z "${SUPABASE_BIN}" || -z "${PSQL_BIN}" ]]; then
  echo "Supabase CLI and psql are required." >&2
  exit 69
fi

unset SUPABASE_ACCESS_TOKEN
export REEDITPRO_CANONICAL_V3_DATABASE_URL="${DATABASE_URL}"
export PSQL_BIN

if ! "${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" status >/dev/null 2>&1; then
  "${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" start >/dev/null
fi

"${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" db reset --local --no-seed

for test_file in \
  "${SCRIPT_DIR}/tests/001_two_user_two_workspace_rls.sql" \
  "${SCRIPT_DIR}/tests/002_edit_reference_v6_lifecycle_rpc.sql" \
  "${SCRIPT_DIR}/tests/003_edit_reference_v6_recovery_and_cost.sql" \
  "${SCRIPT_DIR}/tests/004_schema_security_invariants.sql"
do
  "${PSQL_BIN}" "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 -f "${test_file}"
done

npx --no-install tsx "${REPOSITORY_ROOT}/server/smoke/edit-reference-local-supabase-rpc-adapter-smoke.ts"
node "${SCRIPT_DIR}/verify.mjs"

echo "PASS canonical-v3-local verification"
