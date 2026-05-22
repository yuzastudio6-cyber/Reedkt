import { loadRuntimeEnv } from '../config/env'
import { checkSupabaseLiveEnv } from '../supabase/live-env-readiness'

const env = loadRuntimeEnv(process.env)
const result = checkSupabaseLiveEnv(env, process.env)
console.log(JSON.stringify(result, null, 2))
if (!result.ok && result.status !== 'skipped') process.exitCode = 1
