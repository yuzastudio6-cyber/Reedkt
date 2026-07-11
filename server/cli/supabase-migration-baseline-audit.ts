import { fileURLToPath } from 'node:url'
import { auditSupabaseMigrationDirectory } from '../supabase/migration-baseline-audit'

const migrationDirectory = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url))
const report = auditSupabaseMigrationDirectory(migrationDirectory)

console.log(JSON.stringify(report, null, 2))

if (process.argv.includes('--require-reproducible') && !report.safeToRunRawMigrationDirectory) {
  process.exitCode = 1
}
