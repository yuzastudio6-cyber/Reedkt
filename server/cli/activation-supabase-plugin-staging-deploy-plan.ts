import {
  getSupabasePluginStagingDeployPlan,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan'

console.log(JSON.stringify(getSupabasePluginStagingDeployPlan(), null, 2))
