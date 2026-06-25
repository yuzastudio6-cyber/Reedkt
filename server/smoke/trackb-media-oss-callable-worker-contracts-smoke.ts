import {
  TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS,
  TRACKB_MEDIA_OSS_TOOL_IDS,
  assertTrackBMediaOssToolCallPayloadIsGated,
  buildTrackBMediaOssFailClosedResponse,
} from '../../src/backend/contracts/trackb-media-oss-tool-call-contracts'
import { TRACKB_MEDIA_OSS_TOOL_CALL_API_ROUTES } from '../../src/backend/api/routes/trackb-media-oss-tool-call-api-routes'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const now = new Date().toISOString()
const goodPayload = {
  toolId: 'opencolorio' as const,
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  mediaAssetId: 'media-smoke',
  approvedSnapshotId: 'approved-snapshot-smoke',
  editPlanId: 'edit-plan-smoke',
  idempotencyKey: 'trackb-media-oss-smoke',
  creditReservationId: 'credit-reservation-smoke',
  privateInputArtifacts: [{
    artifactId: 'artifact-smoke',
    artifactType: 'color_analysis_json' as const,
    storageBucketPurpose: 'analysis_artifacts' as const,
    storageObjectPath: 'workspaces/workspace-smoke/projects/project-smoke/analysis/color.json',
    isPrivate: true as const,
    sourceOfTruth: true as const,
  }],
  requestedRecipeId: 'trackb-color-image-proof-smoke',
  requiredQualityGateIds: ['qa-gate-smoke'],
  fallbackPolicyId: 'trackb-fallback-smoke',
  resultSchemaVersion: 'trackb-media-oss-tool-call-result.v1' as const,
  dryRunOnly: true as const,
  executionEnabled: false as const,
  requestedAt: now,
}

assertTrackBMediaOssToolCallPayloadIsGated(goodPayload)

assert(TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS.length === TRACKB_MEDIA_OSS_TOOL_IDS.length, 'Every Track B tool needs one callable worker contract.')
assert(TRACKB_MEDIA_OSS_TOOL_CALL_API_ROUTES.length === 3, 'Track B route metadata should expose validate, queue, and status routes.')

for (const route of TRACKB_MEDIA_OSS_TOOL_CALL_API_ROUTES) {
  assert(route.status === 'disabled', `${route.id} must stay disabled until beta readiness rerun.`)
  assert(route.runtimeMode === 'backend_required', `${route.id} must remain backend-required.`)
}

for (const contract of TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS) {
  assert(contract.executionEnabled === false, `${contract.toolId} execution must remain disabled.`)
  assert(contract.requiresApprovedSnapshotId, `${contract.toolId} must require approved snapshot linkage.`)
  assert(contract.requiresCreditReservationId, `${contract.toolId} must require credit reservation linkage.`)
  assert(contract.requiresPrivateArtifactReferences, `${contract.toolId} must require private artifact refs.`)
}

let blockedUnsafePayload = false
try {
  assertTrackBMediaOssToolCallPayloadIsGated({
    ...goodPayload,
    executionEnabled: true,
  } as typeof goodPayload)
} catch {
  blockedUnsafePayload = true
}

assert(blockedUnsafePayload, 'Execution-enabled payloads must fail closed.')

const failClosed = buildTrackBMediaOssFailClosedResponse('opencolorio')
assert(failClosed.ok === false && failClosed.statusCode === 423, 'Fail-closed response should block calls.')

console.log(JSON.stringify({
  ok: true,
  toolCount: TRACKB_MEDIA_OSS_TOOL_IDS.length,
  routeCount: TRACKB_MEDIA_OSS_TOOL_CALL_API_ROUTES.length,
  decision: failClosed.decision,
  nextPrompt: failClosed.nextPrompt,
}))
