#!/usr/bin/env bash
set -euo pipefail

APPLY=false
for arg in "$@"; do
  case "$arg" in
    --apply)
      APPLY=true
      ;;
    --help|-h)
      cat <<'EOF'
Usage: scripts/supabase/apply-e2e-migrations.sh [--apply]

Dry-run by default. Requires SUPABASE_PROJECT_REF so the target project is
explicit even when no migrations are applied.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MANIFEST_PATH="$ROOT_DIR/supabase/e2e-runtime-migration-manifest.json"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "SUPABASE_PROJECT_REF is required. Refusing to infer or apply a remote target." >&2
  exit 1
fi

node -e '
const fs = require("node:fs");
const path = require("node:path");
const manifestPath = process.argv[1];
const migrationsDir = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.project !== "reeditpro") {
  console.error(`Manifest project is ${manifest.project}; expected reeditpro.`);
  process.exit(1);
}
const missing = [];
console.log(`Supabase project target: ${process.env.SUPABASE_PROJECT_REF}`);
console.log(`Manifest: ${manifestPath}`);
console.log("Migration apply order:");
for (const [index, entry] of manifest.migrations.entries()) {
  const fullPath = path.join(migrationsDir, entry.file);
  if (!fs.existsSync(fullPath)) missing.push(entry.file);
  console.log(`${String(index + 1).padStart(2, "0")}. ${entry.file} - ${entry.purpose}`);
}
if (missing.length) {
  console.error(`Missing migration files: ${missing.join(", ")}`);
  process.exit(1);
}
' "$MANIFEST_PATH" "$MIGRATIONS_DIR"

if [[ "$APPLY" != "true" ]]; then
  echo "Dry run complete. Re-run with --apply to run Supabase CLI migration apply."
  exit 0
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is required for --apply but was not found on PATH." >&2
  exit 1
fi

echo "Applying migrations to explicit Supabase project ref: ${SUPABASE_PROJECT_REF}"
echo "No service-role key is read or printed by this helper."
(
  cd "$ROOT_DIR"
  supabase link --project-ref "$SUPABASE_PROJECT_REF"
  supabase db push
)
