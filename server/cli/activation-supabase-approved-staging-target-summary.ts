import {
  readSupabaseApprovedStagingTargetSummary,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-report'

console.log(JSON.stringify(readSupabaseApprovedStagingTargetSummary(), null, 2))
