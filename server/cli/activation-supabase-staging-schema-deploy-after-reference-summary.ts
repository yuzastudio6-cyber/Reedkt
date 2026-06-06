import {
  readSupabaseStagingSchemaAfterReferenceSummary,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-schema-after-reference'

console.log(JSON.stringify(await readSupabaseStagingSchemaAfterReferenceSummary(), null, 2))
