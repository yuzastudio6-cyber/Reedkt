import {
  readSupabaseMilestoneRegistryStagingDeploySummary,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-verify'

console.log(JSON.stringify(await readSupabaseMilestoneRegistryStagingDeploySummary(), null, 2))
