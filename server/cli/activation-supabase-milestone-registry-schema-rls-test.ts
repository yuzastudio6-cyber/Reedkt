import {
  buildSupabaseMilestoneRegistrySchemaReports,
  writeSupabaseMilestoneRegistrySchemaArtifacts,
} from '../activation/supabase-milestone-registry-schema'

const reports = buildSupabaseMilestoneRegistrySchemaReports({ requireLocalConfirmation: true })
await writeSupabaseMilestoneRegistrySchemaArtifacts(reports)
console.log(JSON.stringify(reports.rlsTestReport, null, 2))
process.exit(reports.rlsTestReport.status === 'passed' ? 0 : 1)
