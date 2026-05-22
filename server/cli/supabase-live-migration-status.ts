import { loadRuntimeEnv } from '../config/env'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { checkSupabaseLiveMigrationStatus } from '../supabase/live-migration-status'

const env = loadRuntimeEnv(process.env)
const result = await checkSupabaseLiveMigrationStatus(env, createSupabaseAdminClient(env))
console.log(JSON.stringify(result, null, 2))
if (!result.ok && result.status !== 'skipped') process.exitCode = 1
