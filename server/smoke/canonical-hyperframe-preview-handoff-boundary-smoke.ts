import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { TimelineManifest } from '../../src/backend/contracts/timeline-manifest-contracts'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  buildCanonicalHyperframePreviewHandoffBoundary,
  CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_EVIDENCE_KEY,
  CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_OPERATION_ID,
  validateCanonicalHyperframePreviewHandoffBoundary,
  type CanonicalHyperframePreviewHandoffAuthority,
  type CanonicalHyperframePreviewHandoffBoundary,
} from '../workers/timeline/canonical-hyperframe-preview-handoff-boundary'
import { listCompleteProfessionalToolOperationSpecs } from '../tool-execution/core-registry-operations/core-registry-operation-specs'

const digest = (value: string) => sha256AuthorityValue({ value })

const timelineManifest: TimelineManifest = {
  id: 'timeline-hyperframe-boundary-smoke',
  workspaceId: 'workspace-hyperframe-boundary-smoke',
  projectId: 'project-hyperframe-boundary-smoke',
  editPlanId: 'plan-hyperframe-boundary-smoke',
  approvedSnapshotId: 'snapshot-hyperframe-boundary-smoke',
  mediaAssetId: 'media-hyperframe-boundary-smoke',
  version: 'approved-timeline-v1',
  timelineFormat: 'reeditpro_timeline',
  durationSeconds: 12,
  clips: [
    {
      id: 'clip-hyperframe-1',
      sourceMediaAssetId: 'media-hyperframe-boundary-smoke',
      sourceRange: { startSeconds: 3, endSeconds: 8, startFrame: 90, endFrame: 240 },
      timelineRange: { startSeconds: 0, endSeconds: 5, startFrame: 0, endFrame: 150 },
      trackId: 'video-main',
      metadata: {
        reason: 'private editorial reason must not be projected',
        rawChat: 'private chat must not be projected',
        providerPayload: 'private provider payload must not be projected',
      },
    },
    {
      id: 'clip-hyperframe-2',
      sourceMediaAssetId: 'media-hyperframe-boundary-smoke',
      sourceRange: { startSeconds: 15, endSeconds: 22, startFrame: 450, endFrame: 660 },
      timelineRange: { startSeconds: 5, endSeconds: 12, startFrame: 150, endFrame: 360 },
      trackId: 'video-main',
      metadata: { reason: 'another private editorial reason' },
    },
  ],
  audioLayers: [],
  captionLayers: [],
  overlayLayers: [],
  maskLayers: [],
  colorOperations: [],
  renderNotes: ['private render note must not be projected'],
  sourceReferences: [{
    storageBucketPurpose: 'source_media',
    storageObjectPath: 'workspaces/private/source-secret.mp4',
    sourceOfTruth: true,
  }],
  createdAt: '2026-07-21T12:00:00.000Z',
}

const authority: CanonicalHyperframePreviewHandoffAuthority = {
  authorityClass: 'server_derived_approved_timeline_handoff_contract',
  evidenceClass: 'source_verified_static_boundary_contract_only',
  workspaceId: timelineManifest.workspaceId,
  projectId: timelineManifest.projectId,
  editSessionId: 'edit-hyperframe-boundary-smoke',
  approvedPlanSnapshotId: timelineManifest.approvedSnapshotId,
  approvedPlanSnapshotHash: digest('approved-snapshot'),
  approvedExecutionPackageId: 'package-hyperframe-boundary-smoke',
  approvedExecutionPackageHash: digest('approved-package'),
  confirmedFrameAuthorityId: 'frame-hyperframe-boundary-smoke',
  confirmedFrameAuthorityRevision: 3,
  confirmedFrameAuthorityHash: digest('confirmed-frame'),
  masterTimingPlanId: 'timing-hyperframe-boundary-smoke',
  masterTimingPlanVersion: 4,
  masterTimingPlanHash: digest('master-timing'),
  privateTimelineArtifactId: 'artifact-hyperframe-boundary-smoke',
  privateTimelineArtifactHash: digest('private-timeline-artifact'),
  privateTimelineQaReceiptId: 'qa-hyperframe-boundary-smoke',
  privateTimelineQaReceiptHash: digest('private-timeline-qa'),
  timelineQaPassed: true,
  approvedSnapshotRepositoryReadbackVerified: false,
  productionPersistenceVerified: false,
}

const input = {
  authority,
  timelineManifest,
  timelineManifestHash: sha256AuthorityValue(timelineManifest),
}
const first = buildCanonicalHyperframePreviewHandoffBoundary(input)
const replay = buildCanonicalHyperframePreviewHandoffBoundary(input)

assert.deepEqual(replay, first)
assert.ok(Object.isFrozen(first))
assert.equal(validateCanonicalHyperframePreviewHandoffBoundary(first), first)
assert.equal(first.operationId, CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_OPERATION_ID)
assert.equal(first.evidenceKey, CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_EVIDENCE_KEY)
assert.equal(first.handoff.clips.length, 2)
assert.deepEqual(first.handoff.clips.map((clip) => clip.label), ['Approved clip 1', 'Approved clip 2'])
assert.equal(first.boundaries.externalHyperframesRuntimeInvoked, false)
assert.equal(first.boundaries.browserExecutionAuthorized, false)
assert.equal(first.boundaries.finalRenderOrExportAuthorized, false)
assert.equal(first.readiness.privateInternalBoundaryContractReady, true)
assert.equal(first.readiness.privateInternalRunnerReady, false)
assert.equal(first.readiness.privateInternalEndToEndReady, false)
assert.equal(first.readiness.privateInternalJobAdapterReady, false)
assert.equal(first.readiness.productionImageQualified, false)
assert.equal(first.readiness.deployedReleaseQualified, false)
assert.equal(first.readiness.productionReady, false)

const projection = JSON.stringify(first.handoff)
for (const forbidden of [
  'private editorial reason',
  'private chat',
  'private provider payload',
  'private render note',
  'source-secret.mp4',
  'workspaces/private',
]) {
  assert.ok(!projection.includes(forbidden), `Browser-safe handoff projected ${forbidden}.`)
}

const hyperframeSpec = listCompleteProfessionalToolOperationSpecs()
  .find((spec) => spec.canonicalToolId === 'hyperframe')
assert.ok(hyperframeSpec)
assert.equal(hyperframeSpec.allowedOperationIds[0], first.operationId)
assert.equal(hyperframeSpec.policyBlocks.length, 0)
assert.equal(hyperframeSpec.workerRuntime.runtimeClass, 'not_assignable_policy_blocked')

expectRejected(() => buildCanonicalHyperframePreviewHandoffBoundary({
  ...input,
  timelineManifestHash: digest('wrong-timeline'),
}), /timeline manifest hash is invalid/i)
expectRejected(() => buildCanonicalHyperframePreviewHandoffBoundary({
  ...input,
  authority: { ...authority, workspaceId: 'workspace-cross-tenant' },
}), /timeline scope does not match/i)
expectRejected(() => buildCanonicalHyperframePreviewHandoffBoundary({
  ...input,
  authority: { ...authority, timelineQaPassed: false as never },
}), /requires passed private timeline QA/i)
expectRejected(() => buildCanonicalHyperframePreviewHandoffBoundary({
  ...input,
  authority: { ...authority, approvedSnapshotRepositoryReadbackVerified: true as never },
}), /cannot claim live repository or production authority/i)
expectRejected(() => buildCanonicalHyperframePreviewHandoffBoundary({
  ...input,
  timelineManifest: { ...timelineManifest, id: '../unsafe-preview-id' },
  timelineManifestHash: sha256AuthorityValue({ ...timelineManifest, id: '../unsafe-preview-id' }),
}), /timelineManifest\.id must be a bounded opaque identifier/i)
expectRejected(() => buildCanonicalHyperframePreviewHandoffBoundary({
  ...input,
  timelineManifest: {
    ...timelineManifest,
    clips: [
      timelineManifest.clips[0]!,
      {
        ...timelineManifest.clips[1]!,
        timelineRange: { startSeconds: 4, endSeconds: 11 },
      },
    ],
  },
  timelineManifestHash: sha256AuthorityValue({
    ...timelineManifest,
    clips: [
      timelineManifest.clips[0]!,
      {
        ...timelineManifest.clips[1]!,
        timelineRange: { startSeconds: 4, endSeconds: 11 },
      },
    ],
  }),
}), /ordered without timeline overlap/i)

const tampered = structuredClone(first) as CanonicalHyperframePreviewHandoffBoundary
tampered.handoff.clips[0]!.label = 'Tampered clip'
expectRejected(
  () => validateCanonicalHyperframePreviewHandoffBoundary(tampered),
  /content hash is invalid/i,
)

const source = await readFile(resolve(
  'server/workers/timeline/canonical-hyperframe-preview-handoff-boundary.ts',
), 'utf8')
for (const forbiddenRuntime of [
  'node:child_process',
  'docker run',
  'docker build',
  'fetch(',
  'createClient(',
  '@hyperframes/',
]) {
  assert.ok(!source.includes(forbiddenRuntime), `Boundary source unexpectedly contains ${forbiddenRuntime}.`)
}

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'canonical-hyperframe-preview-handoff-boundary-smoke-v1',
  status: 'approved_timeline_boundary_contract_verified_external_runtime_and_release_blocked',
  evidenceKey: CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_EVIDENCE_KEY,
  receiptHash: first.receiptHash,
  checks: [
    'exact_hyperframe_operation_identity_matches_non_assignable_registry_boundary',
    'approved_snapshot_package_frame_timing_private_timeline_and_qa_digests_bound',
    'timeline_scope_hash_duration_ranges_and_order_fail_closed',
    'deterministic_read_only_browser_safe_projection_verified',
    'private_paths_raw_chat_reasoning_provider_and_commercial_fields_not_projected',
    'external_hyperframes_runtime_browser_execution_render_export_and_release_not_authorized',
    CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_EVIDENCE_KEY,
  ],
}, null, 2))

function expectRejected(run: () => unknown, pattern: RegExp): void {
  assert.throws(run, pattern)
}
