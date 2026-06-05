import {
  executeSupabaseStagingTargetProofVerify,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-target-proof'

const result = await executeSupabaseStagingTargetProofVerify()
console.log(JSON.stringify(result.reports.schemaVerifyAfterTargetProofReport, null, 2))
process.exit(result.exitCode)
