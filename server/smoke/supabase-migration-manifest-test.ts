import { checkMigrationManifest } from '../supabase/migration-manifest'

const result = await checkMigrationManifest(process.cwd())
const checks = [
  result.project === 'reeditpro' ? 'project_reeditpro' : undefined,
  result.missingFiles.length === 0 ? 'all_manifest_files_exist' : undefined,
  result.missingRequiredE2eMigrations.length === 0 ? 'e2e_migrations_present' : undefined,
  result.orderProblems.length === 0 ? 'manifest_order_valid' : undefined,
].filter(Boolean)

const ok = checks.length === 4
console.log(JSON.stringify({ ok, checks, result }, null, 2))
if (!ok) process.exitCode = 1
