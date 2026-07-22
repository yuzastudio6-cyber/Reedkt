#!/usr/bin/env bash
set -euo pipefail

umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
DATABASE_URL="${REEDITPRO_CANONICAL_V3_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:57432/postgres}"
SUPABASE_BIN="${SUPABASE_BIN:-$(command -v supabase)}"
PSQL_BIN="${PSQL_BIN:-$(command -v psql)}"
DOCKER_BIN="${DOCKER_BIN:-$(command -v docker)}"
SHASUM_BIN="${SHASUM_BIN:-$(command -v shasum)}"
JQ_BIN="${JQ_BIN:-$(command -v jq)}"
DATABASE_CONTAINER="supabase_db_reeditpro-canonical-v3-local"
RUNTIME_DIR="${SCRIPT_DIR}/.recovery-runtime"
ARCHIVE_PATH="${RUNTIME_DIR}/canonical-v3-data.dump"
TOC_PATH="${RUNTIME_DIR}/archive-toc.txt"
ACTUAL_TABLES_PATH="${RUNTIME_DIR}/actual-data-tables.txt"
EXPECTED_TABLES_PATH="${SCRIPT_DIR}/expected-recovery-data-tables.txt"

if [[ ! "${DATABASE_URL}" =~ ^postgres(ql)?://[^@]+@(127\.0\.0\.1|localhost):57432/postgres([?].*)?$ ]]; then
  echo "Refusing non-local canonical V3 recovery database URL." >&2
  exit 64
fi
if [[ -z "${SUPABASE_BIN}" || -z "${PSQL_BIN}" || -z "${DOCKER_BIN}" \
  || -z "${SHASUM_BIN}" || -z "${JQ_BIN}" ]]; then
  echo "Supabase CLI, psql, Docker, shasum, and jq are required." >&2
  exit 69
fi
if [[ -e "${RUNTIME_DIR}" || -L "${RUNTIME_DIR}" ]]; then
  echo "Refusing stale or linked recovery runtime directory: ${RUNTIME_DIR}" >&2
  exit 73
fi

unset SUPABASE_ACCESS_TOKEN
mkdir "${RUNTIME_DIR}"

cleanup_resources() {
  local reset_status=0
  local removal_status=0

  unset REEDITPRO_CANONICAL_V3_API_URL REEDITPRO_CANONICAL_V3_ANON_KEY \
    REEDITPRO_CANONICAL_V3_JWT_SECRET REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY

  "${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" db reset --local --no-seed \
    >/dev/null 2>&1 || reset_status="$?"
  for artifact in "${ARCHIVE_PATH}" "${TOC_PATH}" "${ACTUAL_TABLES_PATH}"; do
    if [[ -f "${artifact}" && ! -L "${artifact}" ]]; then
      rm "${artifact}" || removal_status="$?"
    fi
  done
  if [[ -d "${RUNTIME_DIR}" && ! -L "${RUNTIME_DIR}" ]]; then
    rmdir "${RUNTIME_DIR}" || removal_status="$?"
  elif [[ -e "${RUNTIME_DIR}" || -L "${RUNTIME_DIR}" ]]; then
    removal_status=74
  fi

  if [[ "${reset_status}" -ne 0 ]]; then
    echo "Canonical local database cleanup reset failed." >&2
  fi
  if [[ "${removal_status}" -ne 0 ]]; then
    echo "Canonical recovery runtime cleanup failed closed." >&2
  fi
  if [[ "${reset_status}" -ne 0 ]]; then return "${reset_status}"; fi
  return "${removal_status}"
}

cleanup_on_exit() {
  local script_status="$?"
  local cleanup_status=0

  trap - EXIT
  if cleanup_resources; then :; else cleanup_status="$?"; fi
  if [[ "${script_status}" -ne 0 ]]; then exit "${script_status}"; fi
  exit "${cleanup_status}"
}
trap cleanup_on_exit EXIT

if ! "${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" status >/dev/null 2>&1; then
  "${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" start >/dev/null
fi
if ! "${DOCKER_BIN}" inspect "${DATABASE_CONTAINER}" >/dev/null 2>&1; then
  echo "Canonical local database container is unavailable." >&2
  exit 69
fi
SERVER_VERSION="$(${DOCKER_BIN} exec "${DATABASE_CONTAINER}" \
  psql --username=postgres --dbname=postgres -X -At -c 'show server_version_num')"
if [[ ! "${SERVER_VERSION}" =~ ^15[0-9]{4}$ ]]; then
  echo "Canonical recovery requires the matching PostgreSQL 15 container tools." >&2
  exit 65
fi

"${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" db reset --local --no-seed
"${PSQL_BIN}" "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 \
  -f "${SCRIPT_DIR}/tests/_recovery_seed.sql"

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
  echo "Refusing non-canonical local PostgREST origin for recovery proof." >&2
  exit 64
fi
npx --no-install tsx \
  "${REPOSITORY_ROOT}/server/smoke/canonical-distributed-media-ingest-local-postgres-smoke.ts"
npx --no-install tsx \
  "${REPOSITORY_ROOT}/server/smoke/canonical-distributed-pre-plan-study-local-postgres-smoke.ts"

BEFORE_DIGEST="$(${PSQL_BIN} "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 \
  -f "${SCRIPT_DIR}/tests/_recovery_state_digest.sql" | tr -d '[:space:]')"
if [[ ! "${BEFORE_DIGEST}" =~ ^[a-f0-9]{64}$ ]]; then
  echo "Canonical pre-backup state digest is invalid." >&2
  exit 65
fi

"${DOCKER_BIN}" exec "${DATABASE_CONTAINER}" pg_dump \
  --username=postgres --dbname=postgres --format=custom --data-only \
  --no-owner --no-privileges --table=auth.users --table='public.*' \
  > "${ARCHIVE_PATH}"
if [[ ! -s "${ARCHIVE_PATH}" || -L "${ARCHIVE_PATH}" ]]; then
  echo "Canonical recovery archive was not created safely." >&2
  exit 74
fi
ARCHIVE_SHA256="$(${SHASUM_BIN} -a 256 "${ARCHIVE_PATH}" | awk '{print $1}')"
if [[ ! "${ARCHIVE_SHA256}" =~ ^[a-f0-9]{64}$ ]]; then
  echo "Canonical recovery archive checksum is invalid." >&2
  exit 65
fi

"${DOCKER_BIN}" exec -i "${DATABASE_CONTAINER}" pg_restore --list \
  < "${ARCHIVE_PATH}" > "${TOC_PATH}"
awk '$4 == "TABLE" && $5 == "DATA" { print $6 "." $7 }' \
  "${TOC_PATH}" | sort > "${ACTUAL_TABLES_PATH}"
if ! cmp -s "${EXPECTED_TABLES_PATH}" "${ACTUAL_TABLES_PATH}"; then
  echo "Canonical recovery archive table set does not match the reviewed contract." >&2
  diff -u "${EXPECTED_TABLES_PATH}" "${ACTUAL_TABLES_PATH}" >&2 || true
  exit 65
fi
ARCHIVE_ENTRY_COUNT="$(awk 'NF && $1 !~ /^;/ { count += 1 } END { print count + 0 }' "${TOC_PATH}")"
EXPECTED_ENTRY_COUNT="$(wc -l < "${EXPECTED_TABLES_PATH}" | tr -d '[:space:]')"
if [[ "${ARCHIVE_ENTRY_COUNT}" != "${EXPECTED_ENTRY_COUNT}" ]]; then
  echo "Canonical recovery archive contains unreviewed non-data entries." >&2
  exit 65
fi

"${SUPABASE_BIN}" --workdir "${SCRIPT_DIR}" db reset --local --no-seed
"${DOCKER_BIN}" exec -i "${DATABASE_CONTAINER}" pg_restore \
  --username=postgres --dbname=postgres --exit-on-error --single-transaction \
  --data-only --no-owner --no-privileges < "${ARCHIVE_PATH}"

AFTER_DIGEST="$(${PSQL_BIN} "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 \
  -f "${SCRIPT_DIR}/tests/_recovery_state_digest.sql" | tr -d '[:space:]')"
if [[ "${AFTER_DIGEST}" != "${BEFORE_DIGEST}" ]]; then
  echo "Canonical recovery state digest changed after restore." >&2
  exit 65
fi

"${PSQL_BIN}" "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 \
  -f "${SCRIPT_DIR}/tests/009_recovery_restore_assertions.sql"
"${PSQL_BIN}" "${DATABASE_URL}" -X -q -v ON_ERROR_STOP=1 \
  -f "${SCRIPT_DIR}/tests/014_canonical_distributed_media_ingest_rpc_postconditions.sql"

trap - EXIT
cleanup_status=0
if cleanup_resources; then :; else cleanup_status="$?"; fi
if [[ "${cleanup_status}" -ne 0 ]]; then exit "${cleanup_status}"; fi

printf '{\n'
printf '  "status": "passed",\n'
printf '  "scope": "canonical_v3_local_only",\n'
printf '  "archiveSha256": "%s",\n' "${ARCHIVE_SHA256}"
printf '  "stateDigestSha256": "%s",\n' "${AFTER_DIGEST}"
printf '  "restoredDataTableCount": %s,\n' "${EXPECTED_ENTRY_COUNT}"
printf '  "remoteMutationAllowed": false,\n'
printf '  "productionAuthority": false\n'
printf '}\n'
