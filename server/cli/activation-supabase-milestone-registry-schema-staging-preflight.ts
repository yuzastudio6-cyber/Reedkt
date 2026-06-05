import {
  buildSupabaseMilestoneRegistrySchemaReports,
  writeSupabaseMilestoneRegistrySchemaArtifacts,
} from '../activation/supabase-milestone-registry-schema'

const reports = buildSupabaseMilestoneRegistrySchemaReports()
await writeSupabaseMilestoneRegistrySchemaArtifacts(reports)
console.log(JSON.stringify(reports.stagingPreflightReport, null, 2))
process.exit(0)
