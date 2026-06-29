import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  gpacMp4boxApprovedCommandTemplateIds,
  summarizeGpacMp4boxMockWorkerBoundary,
  validateGpacMp4boxMockWorkerEnvelope,
} from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'
import type { GpacMp4boxMockWorkerJobEnvelope } from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const now = new Date('2026-06-28T00:00:00.000Z').toISOString()
const commandTemplateId = 'mp4box_add_generated_subtitle_only_v1'

const baseEnvelope: GpacMp4boxMockWorkerJobEnvelope = {
  lane: 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
  approvedSnapshotRef: { id: 'approved-snapshot-gpac-smoke', status: 'approved' },
  approvalRecordRef: { id: 'approval-record-gpac-smoke', status: 'approved' },
  jobRef: { id: 'job-gpac-smoke', status: 'planned' },
  workerLeaseRef: { id: 'lease-gpac-smoke', status: 'active', leaseStatus: 'active' },
  routeIdempotencyKey: buildGpacMp4boxMockWorkerRouteIdempotencyKey({
    workspaceId: 'workspace-smoke',
    projectId: 'project-smoke',
    approvedSnapshotId: 'approved-snapshot-gpac-smoke',
    jobId: 'job-gpac-smoke',
    commandTemplateId,
  }),
  sourceSequenceMapRef: { id: 'source-sequence-map-gpac-smoke', status: 'approved' },
  compiledIntentRef: { id: 'compiled-intent-gpac-smoke', status: 'approved' },
  modelRoutingPolicyRef: { id: 'model-routing-policy-gpac-smoke', status: 'approved' },
  qaPolicyRef: {
    id: 'qa-policy-gpac-smoke',
    requiredChecks: ['manifest_integrity', 'checksum_match', 'mp4box_stdout_bounded', 'cleanup_verified'],
    blocksPreview: true,
    blocksFinalExport: true,
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gpac-smoke',
    sourceClass: 'generated_fixture',
    storageObjectPath: 'workspaces/workspace-smoke/projects/project-smoke/private/fixture.srt',
    checksumSha256: 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8',
    byteCount: 73,
    sourceOfTruth: true,
    privateArtifact: true,
  },
  privateArtifactManifestRef: {
    id: 'private-artifact-manifest-gpac-smoke',
    storageObjectPrefix: 'workspaces/workspace-smoke/projects/project-smoke/private/gpac-mp4box/',
    expectedOutputFileNames: ['generated-synthetic-subtitle-only.mp4', 'qa-report.json', 'manifest.json'],
    expectedChecksumAlgorithm: 'sha256',
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
  },
  privateArtifactChecksumRef: { id: 'checksum-gpac-smoke', status: 'planned' },
  toolRuntimePolicyRef: { id: 'tool-runtime-policy-gpac-smoke', status: 'approved' },
  gpacMp4boxWorkerContractRef: { id: 'worker-contract-gpac-smoke', status: 'approved' },
  gpacMp4boxRouteContractRef: { id: 'route-contract-gpac-smoke', status: 'approved' },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gpac-smoke',
    status: 'approved',
    cleanupStatus: 'cleanup_required',
    tempArtifactScope: 'worker_temp_only',
  },
  auditRecordRef: { id: 'audit-record-gpac-smoke', status: 'planned' },
  commandTemplateId,
  createdAt: now,
  executionMode: 'mock_contract_only',
  runtimeExecution: false,
  workerExecution: false,
  routeExecution: false,
}

const validation = validateGpacMp4boxMockWorkerEnvelope(baseEnvelope)
check(validation.ok, validation.sanitizedSummary)
check(gpacMp4boxApprovedCommandTemplateIds.includes(commandTemplateId), 'Command template allowlist should include the smoke template.')
check(summarizeGpacMp4boxMockWorkerBoundary().join('\n').includes('No route execution'), 'Boundary summary must preserve no-execution language.')

const missingSnapshot = validateGpacMp4boxMockWorkerEnvelope({
  ...baseEnvelope,
  approvedSnapshotRef: { id: '', status: 'planned' },
})
check(missingSnapshot.blockers.includes('blocked_missing_approved_snapshot'), 'Missing approved snapshot should block.')

const signedUrl = validateGpacMp4boxMockWorkerEnvelope({
  ...baseEnvelope,
  privateInputManifestRef: {
    ...baseEnvelope.privateInputManifestRef,
    storageObjectPath: 'https://storage.example/signed?X-Goog-Signature=abc',
  },
})
check(signedUrl.blockers.includes('blocked_public_or_signed_artifact_attempt'), 'Signed URL input should block.')

const noLease = validateGpacMp4boxMockWorkerEnvelope({
  ...baseEnvelope,
  workerLeaseRef: { id: 'lease-gpac-smoke', status: 'planned', leaseStatus: 'planned' },
})
check(noLease.blockers.includes('blocked_worker_lease_unavailable'), 'Inactive worker lease should block.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'valid_mock_worker_envelope_passes',
    'command_template_allowlist_present',
    'boundary_summary_preserves_no_execution',
    'missing_approved_snapshot_blocks',
    'signed_url_input_blocks',
    'inactive_worker_lease_blocks',
  ],
  commandTemplates: gpacMp4boxApprovedCommandTemplateIds,
}, null, 2))
