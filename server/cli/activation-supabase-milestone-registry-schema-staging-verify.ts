import {
  executeSupabaseMilestoneRegistryStagingVerify,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-verify'

const result = await executeSupabaseMilestoneRegistryStagingVerify()
console.log(JSON.stringify(result.reports.schemaVerificationReport, null, 2))
process.exit(result.exitCode)
