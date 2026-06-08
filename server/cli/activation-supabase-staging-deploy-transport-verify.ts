import {
  executeSupabaseStagingDeployTransportVerify,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

const result = await executeSupabaseStagingDeployTransportVerify()
console.log(JSON.stringify({
  schemaVerify: result.reports.schemaVerifyAfterTransportReport,
  rlsVerify: result.reports.rlsVerifyAfterTransportReport,
}, null, 2))
process.exit(result.exitCode)
