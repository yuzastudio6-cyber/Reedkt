import { summarizeToolRouteDryRunApproval, writeToolRouteDryRunApprovalArtifacts } from '../activation/tool-route-dry-run-approval'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')

const required = [
  'REEDITPRO_CONFIRM_TOOL_ROUTE_DRY_RUN_APPROVAL_PACKET',
  'REEDITPRO_CONFIRM_TOOL_STUDY_0_SOURCE_OF_TRUTH_COMPLETED',
  'REEDITPRO_CONFIRM_ROUTE_UNLOCK_READINESS_CHECK',
  'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_FIXTURE_DESIGN',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_METADATA_ONLY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
]

if (!execute) {
  console.log(summarizeToolRouteDryRunApproval())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --metadata-only. This packet cannot execute routes, tools, workers, providers, Supabase writes, or runtime paths.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) =>
    [
      'TOOL_ROUTE_EXECUTION',
      'WORKER_EXECUTION',
      'PROVIDER_CALLS',
      'MEDIA_PROCESSING',
      'AUDIO_PROCESSING',
      'RENDER_EXPORT',
      'IMAGE_GENERATION',
      'IMAGE_EDITING',
      'BROWSER_CAPTURE',
      'MAP_RENDERING',
      'SUPABASE_METADATA_WRITE',
      'SUPABASE_PRODUCTION_SQL',
      'GCS_UPLOAD',
      'PUBLIC_ARTIFACTS',
      'SIGNED_URL_DELIVERY',
      'PRODUCTION_WRITE',
      'EXTERNAL_BETA_UNLOCK',
      'PAID_PRODUCTION_UNLOCK',
      'DEPENDENCY_MUTATION',
      'RAW_PROMPT_EXECUTION',
      'GITHUB_PR_MERGE',
      'SECRET_PAYLOAD_PRINT',
    ].some((fragment) => name.includes(fragment))
  )
if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeToolRouteDryRunApprovalArtifacts()
console.log(summarizeToolRouteDryRunApproval(reports))
