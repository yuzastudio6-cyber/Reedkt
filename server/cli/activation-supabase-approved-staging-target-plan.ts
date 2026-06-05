import {
  getSupabaseApprovedStagingTargetPlan,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-approved-staging-target-report'

console.log(JSON.stringify(getSupabaseApprovedStagingTargetPlan(), null, 2))
