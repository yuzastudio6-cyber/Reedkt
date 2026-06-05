import {
  readSupabaseStagingTargetProofSummary,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-target-proof'

console.log(JSON.stringify(await readSupabaseStagingTargetProofSummary(), null, 2))
