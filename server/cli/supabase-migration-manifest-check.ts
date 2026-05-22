import { checkMigrationManifest } from '../supabase/migration-manifest'

const result = await checkMigrationManifest(process.cwd())
console.log(JSON.stringify(result, null, 2))
if (!result.ok) process.exitCode = 1
