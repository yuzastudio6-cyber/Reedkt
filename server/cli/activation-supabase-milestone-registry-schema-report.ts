import {
  SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR,
  writeSupabaseMilestoneRegistrySchemaArtifacts,
} from '../activation/supabase-milestone-registry-schema'

await writeSupabaseMilestoneRegistrySchemaArtifacts()

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR,
  reportsWritten: true,
}, null, 2))
