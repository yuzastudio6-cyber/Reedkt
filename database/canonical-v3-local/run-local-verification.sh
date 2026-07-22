#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
DATABASE_URL="${REEDITPRO_CANONICAL_V3_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:57432/postgres}"
SUPABASE_BIN="${SUPABASE_BIN:-$(command -v supabase)}"
PSQL_BIN="${PSQL_BIN:-$(command -v psql)}"
JQ_BIN="${JQ_BIN:-$(command -v jq)}"

if [[ ! "${DATABASE_URL}" =~ ^postgres(ql)?://[^@]+@(127\.0\.0\.1|localhost):57432/postgres([?].*)?$ ]]; then
  echo "Refusing non-local canonical V3 database URL." >&2
  exit 64
fi
if [[ -z "${SUPABASE_BIN}" || -z "${PSQL_BIN}" || -z "${JQ_BIN}" ]]; then
  echo "Supabase CLI, psql, and jq are required." >&2
  exit 69
fi

unset SUPABASE_ACCESS_TOKEN
export REEDITPRO_CANONICAL_V3_DATABASE_URL="${DATABASE_URL}"
export PSQL_BIN
BROWSER_STORAGE_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/reeditpro-canonical-v3-browser.XXXXXX")"
chmod 700 "${BROWSER_STORAGE_ROOT}"

if ! "${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" status >/dev/null 2>&1; then
  "${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" start >/dev/null
fi

cleanup() {
  unset REEDITPRO_CANONICAL_V3_API_URL REEDITPRO_CANONICAL_V3_ANON_KEY \
    REEDITPRO_CANONICAL_V3_JWT_SECRET REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY
  rm -rf -- "${BROWSER_STORAGE_ROOT}"
  "${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" db reset --local --no-seed \
    >/dev/null 2>&1 || true
}
trap cleanup EXIT

"${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" db reset --local --no-seed

for test_file in \
  "${SCRIPT_DIR}/tests/001_two_user_two_workspace_rls.sql" \
  "${SCRIPT_DIR}/tests/002_edit_reference_v6_lifecycle_rpc.sql" \
  "${SCRIPT_DIR}/tests/003_edit_reference_v6_recovery_and_cost.sql" \
  "${SCRIPT_DIR}/tests/004_schema_security_invariants.sql" \
  "${SCRIPT_DIR}/tests/005_exact_edit_atomic_apply.sql" \
  "${SCRIPT_DIR}/tests/006_exact_edit_apply_authority_read.sql" \
  "${SCRIPT_DIR}/tests/007_canonical_exact_edit_planning_authority.sql" \
  "${SCRIPT_DIR}/tests/008_edit_reference_application_preparation.sql" \
  "${SCRIPT_DIR}/tests/010_edit_reference_domain_library_study_rpcs.sql" \
  "${SCRIPT_DIR}/tests/011_edit_reference_domain_v2_receipt_and_security.sql"
do
  "${PSQL_BIN}" "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 -f "${test_file}"
done

npx --no-install tsx "${REPOSITORY_ROOT}/server/smoke/edit-reference-local-supabase-rpc-adapter-smoke.ts"

LOCAL_STATUS_JSON="$("${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" status --output json 2>/dev/null)"
export REEDITPRO_CANONICAL_V3_API_URL="$(
  printf '%s' "${LOCAL_STATUS_JSON}" | "${JQ_BIN}" -er '.API_URL'
)"
export REEDITPRO_CANONICAL_V3_ANON_KEY="$(
  printf '%s' "${LOCAL_STATUS_JSON}" | "${JQ_BIN}" -er '.ANON_KEY'
)"
export REEDITPRO_CANONICAL_V3_JWT_SECRET="$(
  printf '%s' "${LOCAL_STATUS_JSON}" | "${JQ_BIN}" -er '.JWT_SECRET'
)"
export REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY="$(
  printf '%s' "${LOCAL_STATUS_JSON}" | "${JQ_BIN}" -er '.SERVICE_ROLE_KEY'
)"
if [[ "${REEDITPRO_CANONICAL_V3_API_URL}" != 'http://127.0.0.1:57431' ]]; then
  echo "Refusing non-canonical local PostgREST origin." >&2
  exit 64
fi
npx --no-install tsx "${SCRIPT_DIR}/setup-local-auth-users.ts"
"${PSQL_BIN}" "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 \
  -f "${SCRIPT_DIR}/tests/_fixture.sql"
npx --no-install tsx \
  "${REPOSITORY_ROOT}/server/smoke/canonical-distributed-pre-plan-study-local-postgres-smoke.ts"
npx --no-install tsx \
  "${REPOSITORY_ROOT}/server/smoke/edit-reference-canonical-v3-local-long-form-runtime-port-smoke.ts"
"${PSQL_BIN}" "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 \
  -f "${SCRIPT_DIR}/tests/013_canonical_distributed_pre_plan_study_rpc_postconditions.sql"
npx --no-install tsx \
  "${REPOSITORY_ROOT}/server/smoke/edit-reference-local-supabase-application-preparation-smoke.ts"
npx --no-install tsx "${REPOSITORY_ROOT}/server/smoke/edit-reference-local-supabase-http-rpc-smoke.ts"
npx --no-install tsx \
  "${REPOSITORY_ROOT}/server/smoke/edit-reference-local-supabase-domain-repository-smoke.ts"
PLAYWRIGHT_EDIT_REFERENCE_V3_STORAGE_ROOT="${BROWSER_STORAGE_ROOT}" \
  npx --no-install playwright test --config \
  "${REPOSITORY_ROOT}/tests/e2e/playwright.edit-reference-canonical-v3-local.config.ts"
"${PSQL_BIN}" "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 \
  -f "${SCRIPT_DIR}/tests/012_edit_reference_domain_lifecycle_postconditions.sql"

"${SCRIPT_DIR}/run-local-recovery-verification.sh"

node "${SCRIPT_DIR}/verify.mjs"

echo "PASS canonical-v3-local verification"
