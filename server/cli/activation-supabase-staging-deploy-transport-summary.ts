import {
  readSupabaseStagingDeployTransportSummary,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

console.log(JSON.stringify(await readSupabaseStagingDeployTransportSummary(), null, 2))
