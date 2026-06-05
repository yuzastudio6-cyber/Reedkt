import {
  readTrackBMetadataRouteDryRunSummary,
  writeTrackBMetadataRouteDryRunArtifacts,
} from '../activation/track-b-metadata-route-dry-run'

const requiredConfirmations = [
  'REEDITPRO_CONFIRM_TRACK_B_METADATA_ROUTE_DRY_RUN',
  'REEDITPRO_CONFIRM_TRACK_B_METADATA_ROUTE_DRY_RUN_EXECUTE',
] as const

const forbiddenConfirmations = [
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS',
  'REEDITPRO_CONFIRM_SERVICE_ROLE_SECRET_ACCESS',
  'REEDITPRO_CONFIRM_PROVIDER_SECRET_ACCESS',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_ACCESS',
  'REEDITPRO_CONFIRM_DUCKDB_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_POLARS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_HYBRID_COMPUTE_LIVE_ROUTE',
  'REEDITPRO_CONFIRM_LOCAL_WORKER_SIDECAR_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
] as const

if (process.argv.includes('--execute')) {
  const missing = requiredConfirmations.filter((name) => process.env[name] !== 'true')
  const forbidden = forbiddenConfirmations.filter((name) => process.env[name] === 'true')
  if (missing.length > 0 || forbidden.length > 0) {
    console.error(JSON.stringify({
      status: 'blocked',
      blocker: missing.length > 0 ? 'missing_required_confirmation' : 'forbidden_confirmation_set',
      missing,
      forbidden,
    }, null, 2))
    process.exit(1)
  }
}

await writeTrackBMetadataRouteDryRunArtifacts()

console.log(JSON.stringify(readTrackBMetadataRouteDryRunSummary(), null, 2))
