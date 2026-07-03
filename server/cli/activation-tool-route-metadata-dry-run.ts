import {
  forbiddenConfirmationFragments,
  summarizeToolRouteMetadataDryRun,
  writeToolRouteMetadataDryRunArtifacts,
} from '../activation/tool-route-metadata-dry-run'

const execute = process.argv.includes('--execute')
const metadataOnly = process.argv.includes('--metadata-only')

const required = [
  'REEDITPRO_CONFIRM_TOOL_ROUTE_METADATA_DRY_RUN_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_DRY_RUN_APPROVAL_PACKET',
  'REEDITPRO_CONFIRM_TOOL_STUDY_0_SOURCE_OF_TRUTH_COMPLETED',
  'REEDITPRO_CONFIRM_ROUTE_UNLOCK_READINESS_CHECK',
  'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_FIXTURE_DESIGN',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_METADATA_ONLY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
]

if (!execute) {
  console.log(summarizeToolRouteMetadataDryRun())
  process.exit(0)
}

if (!metadataOnly) {
  throw new Error('Use --metadata-only. This dry-run cannot execute routes, tools, workers, providers, Supabase writes, GCS uploads, or runtime paths.')
}

const missing = required.filter((name) => process.env[name] !== 'true')
if (missing.length) throw new Error(`Missing required confirmations: ${missing.join(', ')}`)

const forbidden = Object.entries(process.env)
  .filter(([name, value]) => name.startsWith('REEDITPRO_CONFIRM_') && value === 'true' && !required.includes(name))
  .map(([name]) => name)
  .filter((name) => forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)))
if (forbidden.length) throw new Error(`Forbidden confirmations set: ${forbidden.join(', ')}`)

const reports = writeToolRouteMetadataDryRunArtifacts()
console.log(summarizeToolRouteMetadataDryRun(reports))
