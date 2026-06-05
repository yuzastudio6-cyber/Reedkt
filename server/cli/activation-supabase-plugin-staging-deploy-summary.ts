import {
  readSupabasePluginStagingDeploySummary,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan'

console.log(JSON.stringify(await readSupabasePluginStagingDeploySummary(), null, 2))
