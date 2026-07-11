import { fileURLToPath } from 'node:url'
import { auditSupabaseSecurityDirectory } from '../supabase/security-audit'

const migrationDirectory = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url))
const report = auditSupabaseSecurityDirectory(migrationDirectory)

console.log(JSON.stringify(report, null, 2))

if (process.argv.includes('--require-secure') && !report.safeToTreatAsProductionSecure) {
  process.exitCode = 1
}
