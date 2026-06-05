import {
  executeSupabasePluginStagingVerify,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-supabase-plugin-deploy-plan'

const result = await executeSupabasePluginStagingVerify()
console.log(JSON.stringify(result.reports.schemaVerifyReport, null, 2))
process.exit(result.exitCode)
