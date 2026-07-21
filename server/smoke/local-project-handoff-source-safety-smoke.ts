import assert from 'node:assert/strict'

import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from '../../src/lib/approved-edit-execution-package-client'
import type { PrivateEditDecisionManifestVerification } from '../../src/lib/private-edit-decision-manifest-verification'

const projectScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}

const storage = new Map<string, string>()

;(globalThis as { window?: unknown }).window = {
  localStorage: {
    get length() {
      return storage.size
    },
    clear() {
      storage.clear()
    },
    getItem(key: string) {
      return storage.get(key) ?? null
    },
    key(index: number) {
      return [...storage.keys()][index] ?? null
    },
    removeItem(key: string) {
      storage.delete(key)
    },
    setItem(key: string, value: string) {
      storage.set(key, value)
    },
  },
}

const {
  createLocalInternalProjectHandoff,
  createLocalSourceSetFingerprint,
  getLocalInternalProjectHandoff,
  privateReviewMatchesCurrentSourceSet,
  saveLocalInternalProjectHandoff,
  updateLocalInternalProjectHandoff,
} = await import('../../src/lib/local-project-handoff')

const validSourceAsset: ApprovedEditExecutionUploadedMediaSourceAssetClientInput = {
  mediaAssetId: 'media-asset-valid-001',
  storageObjectRecordId: 'storage-object-valid-001',
  sourceSequenceItemId: 'source-sequence-valid-001',
  uploadedClipId: 'uploaded-clip-valid-001',
  uploadedOrder: 1,
  storageProvider: 'local_private',
  storageBucket: 'source-media',
  storagePath: 'private/source/project/01-uploaded-clip-valid-001.mp4',
  fileName: '01-uploaded-clip-valid-001.mp4',
  mimeType: 'video/mp4',
  byteSize: 4096,
  checksumSha256: 'a'.repeat(64),
  privateArtifact: true,
  publicUrl: null,
  signedUrl: null,
}

const validFingerprint = createLocalSourceSetFingerprint([validSourceAsset])
assert.ok(validFingerprint, 'Durable private uploaded source assets should produce a source-set fingerprint.')

const validVerification: PrivateEditDecisionManifestVerification = {
  manifestVersion: 'private-internal-edit-decision-manifest-v1',
  approvedPlanSnapshotId: 'approved-snapshot-valid-001',
  renderPreviewAssemblyId: 'render-preview-valid-001',
  creditReservationId: 'credit-reservation-valid-001',
  finalRenderArtifactId: 'final-render-valid-001',
  approvedEditContextReady: true,
  approvedEditContext: {
    projectId: 'project-valid-001',
    editSessionId: 'edit-session-valid-001',
    goalSummary: 'Create a clean professional uploaded-source edit.',
    editLevel: 'pro',
    editingCategory: 'storytelling',
    aspectRatio: '9:16',
    creditEstimateTotalCredits: 12,
    segmentCount: 1,
    operationCount: 1,
    professionalSkillTrace: null,
    planningContextTrace: null,
  },
  sourceMediaAssetCount: 1,
  clipDecisionCount: 1,
  sourceOrderPreserved: true,
  uploadedOrderMonotonic: true,
  sourceMediaCoverageComplete: true,
  sourceChecksumCoverageComplete: true,
  sourceStorageIdentityCoverageComplete: true,
  processedPrivateArtifactTraceComplete: true,
  processedArtifactCount: 1,
  processedArtifactIds: ['processed-artifact-valid-001'],
  firstAppearanceSourceMediaAssetIds: [validSourceAsset.mediaAssetId],
  firstAppearanceUploadedOrders: [1],
  privateCaptionPackageAttached: true,
  professionalLayerCounts: {
    reviewOverlays: 1,
    captionOverlays: 1,
    transitionPolish: 1,
    visualPolish: 1,
    finalTiming: 1,
    audioPolish: 1,
  },
  verifiedAt: '2026-07-06T12:00:00.000Z',
}

const validPrivateReviewMetadata = {
  byteSize: 8192,
  manifestVerified: true,
  sourceSetFingerprint: validFingerprint,
  editDecisionManifestVerification: validVerification,
  reviewDecision: 'accepted_for_internal_testing' as const,
  renderPreviewAssemblyId: validVerification.renderPreviewAssemblyId,
  creditReservationId: validVerification.creditReservationId,
  privateInternalDownloadPath: '/v1/edit-executions/private-internal-downloads/private-internal-download-valid-001/file',
  privateInternalManifestPath: '/v1/edit-executions/private-internal-downloads/private-internal-download-valid-001/manifest',
  privateInternalDownloadDeliveryId: 'private-internal-download-valid-001',
  finalDeliveryQaReviewId: 'final-delivery-qa-valid-001',
  finalRenderExecutionId: 'final-render-execution-valid-001',
  finalRenderReadinessReviewId: 'final-render-readiness-valid-001',
  finalRenderArtifactId: validVerification.finalRenderArtifactId,
  finalRenderSha256: 'b'.repeat(64),
  expectedReviewVideoMetadata: {
    durationSeconds: 2,
    width: 640,
    height: 360,
  },
  reviewVideoMetadata: {
    playable: true as const,
    durationSeconds: 2,
    width: 640,
    height: 360,
    verifiedAt: '2026-07-06T12:01:00.000Z',
  },
  professionalEditQaSummary: {
    privateInternalQaReady: true,
    editDecisionManifestReady: true,
    editDecisionManifestArtifactReady: true,
    audioPolishApplied: true,
    visualPolishApplied: true,
    approvedReviewOverlayCount: 1,
    approvedCaptionOverlayCount: 1,
    approvedTransitionPolishCount: 1,
    approvedVisualPolishCount: 1,
    approvedFinalTimingCount: 1,
    approvedFinalTimelineDurationSeconds: 2,
    privateCaptionArtifactCount: 1,
    privateCaptionFormats: ['srt'],
    visualPolishToolId: 'mock_visual_polish',
  },
  adapterGateSummary: {
    status: 'ready_for_adapter_dry_run_and_readiness',
    executionMode: 'private_internal_dry_run_and_local_fallback',
    requestedActivityCount: 3,
    resolvedActivityCount: 3,
    readyActivityCount: 3,
    blockedActivityCount: 0,
    editActivityCount: 2,
    readinessCheckCount: 1,
    toolsExecutedCount: 0,
    fullToolExecutionReady: false as const,
    privateFallbackReviewOnly: true as const,
    privateRenderIntegrationStatus: 'backend_adapter_worker_artifacts_partially_integrated_for_private_render',
    privateRenderIntegrationReady: true,
    privateRenderIntegratedActivityCount: 2,
    backendIntegrationCandidateCount: 3,
    backendIntegrationPendingActivityCount: 1,
    backendIntegrationBlockedActivityCount: 1,
    backendIntegrationBlockers: ['One advanced activity still needs backend runtime evidence.'],
    clientReadinessHintsTrusted: false as const,
    serverSourceTruthRequiredForFullExecution: true as const,
    frontendExecutionAllowed: false as const,
    productReady: false as const,
    userFacingSummary: 'Internal preparation is ready without exposing tool names.',
    activityGroups: [
      {
        id: 'audio_preparation',
        label: 'Audio preparation',
        resolvedActivityCount: 2,
        integratedActivityCount: 1,
        pendingActivityCount: 1,
        status: 'partial' as const,
        userFacingSummary: 'Audio preparation has 1 approved check attached and 1 still waiting for backend evidence.',
      },
      {
        id: 'private_review_packaging',
        label: 'Private review package',
        resolvedActivityCount: 1,
        integratedActivityCount: 1,
        pendingActivityCount: 0,
        status: 'ready' as const,
        userFacingSummary: 'Private review package is attached to this private review.',
      },
    ],
  },
  updatedAt: '2026-07-06T12:02:00.000Z',
}

const validHandoff = createLocalInternalProjectHandoff({
  category: 'storytelling',
  now: new Date('2026-07-06T12:00:00.000Z'),
  projectName: 'Valid Private Source',
  workspaceId: projectScope.workspaceId,
})
saveLocalInternalProjectHandoff(projectScope, {
  ...validHandoff,
  stage: 'internal_edit_complete',
  sourceFileCount: 1,
  sourceMediaAssets: [validSourceAsset],
  sourceSetFingerprint: validFingerprint,
  approvedSnapshotId: validVerification.approvedPlanSnapshotId,
  privateReview: validPrivateReviewMetadata,
})

const restoredValidHandoff = getLocalInternalProjectHandoff(projectScope, validHandoff.projectId)
assert.equal(restoredValidHandoff?.stage, 'internal_edit_complete')
assert.equal(restoredValidHandoff?.sourceMediaAssets?.length, 1)
assert.equal(restoredValidHandoff?.sourceMediaAssets?.[0]?.storageObjectRecordId, 'storage-object-valid-001')
assert.equal(restoredValidHandoff?.sourceMediaAssets?.[0]?.storageBucket, 'source-media')
assert.equal(restoredValidHandoff?.privateReview?.manifestVerified, true)
assert.equal(restoredValidHandoff?.privateReview?.editDecisionManifestVerification?.approvedEditContextReady, true)
assert.equal(restoredValidHandoff?.privateReview?.reviewVideoMetadata?.playable, true)
assert.equal(restoredValidHandoff?.privateReview?.professionalEditQaSummary?.privateInternalQaReady, true)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.executionMode, 'private_internal_dry_run_and_local_fallback')
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.toolsExecutedCount, 0)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.privateFallbackReviewOnly, true)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.privateRenderIntegrationStatus, 'backend_adapter_worker_artifacts_partially_integrated_for_private_render')
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.privateRenderIntegrationReady, true)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.privateRenderIntegratedActivityCount, 2)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.backendIntegrationCandidateCount, 3)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.backendIntegrationPendingActivityCount, 1)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.backendIntegrationBlockedActivityCount, 1)
assert.deepEqual(restoredValidHandoff?.privateReview?.adapterGateSummary?.backendIntegrationBlockers, ['One advanced activity still needs backend runtime evidence.'])
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.clientReadinessHintsTrusted, false)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.serverSourceTruthRequiredForFullExecution, true)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.productReady, false)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.activityGroups?.length, 2)
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.activityGroups?.[0]?.label, 'Audio preparation')
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.activityGroups?.[0]?.status, 'partial')
assert.equal(restoredValidHandoff?.privateReview?.adapterGateSummary?.activityGroups?.[1]?.label, 'Private review package')
assert.equal(/librosa|pydub|gpac|mkvtoolnix/i.test(JSON.stringify(restoredValidHandoff?.privateReview?.adapterGateSummary?.activityGroups ?? [])), false)
assert.equal(privateReviewMatchesCurrentSourceSet(restoredValidHandoff), true)

assert.equal(createLocalSourceSetFingerprint([{ ...validSourceAsset, storageProvider: 'local_mock' } as unknown as ApprovedEditExecutionUploadedMediaSourceAssetClientInput]), undefined)
assert.equal(createLocalSourceSetFingerprint([{ ...validSourceAsset, byteSize: 0 }]), undefined)
assert.equal(createLocalSourceSetFingerprint([{ ...validSourceAsset, checksumSha256: undefined }]), undefined)
assert.equal(
  createLocalSourceSetFingerprint([{ ...validSourceAsset, storageBucket: 'https://storage.example.com/source-media' } as unknown as ApprovedEditExecutionUploadedMediaSourceAssetClientInput]),
  undefined,
)
assert.equal(
  createLocalSourceSetFingerprint([{ ...validSourceAsset, signedUrl: 'https://storage.example.com/signed' } as unknown as ApprovedEditExecutionUploadedMediaSourceAssetClientInput]),
  undefined,
)

const invalidHandoff = createLocalInternalProjectHandoff({
  category: 'storytelling',
  now: new Date('2026-07-06T12:05:00.000Z'),
  projectName: 'Invalid Mock Source',
  workspaceId: projectScope.workspaceId,
})
saveLocalInternalProjectHandoff(projectScope, {
  ...invalidHandoff,
  stage: 'internal_edit_complete',
  sourceFileCount: 1,
  sourceMediaAssets: [{ ...validSourceAsset, storageProvider: 'local_mock' } as unknown as ApprovedEditExecutionUploadedMediaSourceAssetClientInput],
  sourceSetFingerprint: 'tampered-mock-source-fingerprint',
  approvedSnapshotId: 'approved-snapshot-invalid-001',
  privateReview: {
    manifestVerified: true,
    sourceSetFingerprint: 'tampered-mock-source-fingerprint',
    editDecisionManifestVerification: validVerification,
    reviewDecision: 'accepted_for_internal_testing',
    updatedAt: '2026-07-06T12:06:00.000Z',
  },
})

const restoredInvalidHandoff = getLocalInternalProjectHandoff(projectScope, invalidHandoff.projectId)
assert.equal(restoredInvalidHandoff?.stage, 'created')
assert.equal(restoredInvalidHandoff?.sourceFileCount, 0)
assert.equal(restoredInvalidHandoff?.sourceMediaAssets, undefined)
assert.equal(restoredInvalidHandoff?.sourceSetFingerprint, undefined)
assert.equal(restoredInvalidHandoff?.approvedSnapshotId, undefined)
assert.equal(restoredInvalidHandoff?.privateReview, undefined)
assert.equal(privateReviewMatchesCurrentSourceSet(restoredInvalidHandoff), false)

const staleMissingManifestHandoff = createLocalInternalProjectHandoff({
  category: 'storytelling',
  now: new Date('2026-07-06T12:07:00.000Z'),
  projectName: 'Stale Missing Manifest Evidence',
  workspaceId: projectScope.workspaceId,
})
saveLocalInternalProjectHandoff(projectScope, {
  ...staleMissingManifestHandoff,
  stage: 'internal_edit_complete',
  sourceFileCount: 1,
  sourceMediaAssets: [validSourceAsset],
  sourceSetFingerprint: validFingerprint,
  approvedSnapshotId: validVerification.approvedPlanSnapshotId,
  privateReview: {
    manifestVerified: true,
    sourceSetFingerprint: validFingerprint,
    reviewDecision: 'accepted_for_internal_testing',
    updatedAt: '2026-07-06T12:08:00.000Z',
  },
})
const restoredStaleMissingManifestHandoff = getLocalInternalProjectHandoff(projectScope, staleMissingManifestHandoff.projectId)
assert.equal(restoredStaleMissingManifestHandoff?.stage, 'plan_approved')
assert.equal(restoredStaleMissingManifestHandoff?.privateReview?.manifestVerified, false)
assert.equal(restoredStaleMissingManifestHandoff?.privateReview?.reviewDecision, undefined)

const staleMissingVideoMetadataHandoff = createLocalInternalProjectHandoff({
  category: 'storytelling',
  now: new Date('2026-07-06T12:09:00.000Z'),
  projectName: 'Stale Missing Video Metadata',
  workspaceId: projectScope.workspaceId,
})
saveLocalInternalProjectHandoff(projectScope, {
  ...staleMissingVideoMetadataHandoff,
  stage: 'internal_edit_complete',
  sourceFileCount: 1,
  sourceMediaAssets: [validSourceAsset],
  sourceSetFingerprint: validFingerprint,
  approvedSnapshotId: validVerification.approvedPlanSnapshotId,
  privateReview: {
    ...validPrivateReviewMetadata,
    reviewVideoMetadata: undefined,
    updatedAt: '2026-07-06T12:10:00.000Z',
  },
})
const restoredStaleMissingVideoMetadataHandoff = getLocalInternalProjectHandoff(projectScope, staleMissingVideoMetadataHandoff.projectId)
assert.equal(restoredStaleMissingVideoMetadataHandoff?.stage, 'private_review_verified')
assert.equal(restoredStaleMissingVideoMetadataHandoff?.privateReview?.manifestVerified, true)
assert.equal(restoredStaleMissingVideoMetadataHandoff?.privateReview?.reviewDecision, undefined)
assert.equal(restoredStaleMissingVideoMetadataHandoff?.privateReview?.reviewVideoMetadata, undefined)

const staleMissingQaSummaryHandoff = createLocalInternalProjectHandoff({
  category: 'storytelling',
  now: new Date('2026-07-06T12:11:00.000Z'),
  projectName: 'Stale Missing QA Summary',
  workspaceId: projectScope.workspaceId,
})
saveLocalInternalProjectHandoff(projectScope, {
  ...staleMissingQaSummaryHandoff,
  stage: 'internal_edit_complete',
  sourceFileCount: 1,
  sourceMediaAssets: [validSourceAsset],
  sourceSetFingerprint: validFingerprint,
  approvedSnapshotId: validVerification.approvedPlanSnapshotId,
  privateReview: {
    ...validPrivateReviewMetadata,
    professionalEditQaSummary: {
      ...validPrivateReviewMetadata.professionalEditQaSummary,
      privateInternalQaReady: false,
    },
    updatedAt: '2026-07-06T12:12:00.000Z',
  },
})
const restoredStaleMissingQaSummaryHandoff = getLocalInternalProjectHandoff(projectScope, staleMissingQaSummaryHandoff.projectId)
assert.equal(restoredStaleMissingQaSummaryHandoff?.stage, 'private_review_accepted')
assert.equal(restoredStaleMissingQaSummaryHandoff?.privateReview?.manifestVerified, true)
assert.equal(restoredStaleMissingQaSummaryHandoff?.privateReview?.reviewDecision, 'accepted_for_internal_testing')
assert.equal(restoredStaleMissingQaSummaryHandoff?.privateReview?.professionalEditQaSummary?.privateInternalQaReady, false)

updateLocalInternalProjectHandoff(projectScope, validHandoff.projectId, {
  stage: 'source_uploaded',
  sourceMediaAssets: [{ ...validSourceAsset, byteSize: 0 }],
})
const restoredAfterInvalidSourceChange = getLocalInternalProjectHandoff(projectScope, validHandoff.projectId)
assert.equal(restoredAfterInvalidSourceChange?.stage, 'created')
assert.equal(restoredAfterInvalidSourceChange?.sourceMediaAssets, undefined)
assert.equal(restoredAfterInvalidSourceChange?.approvedSnapshotId, undefined)
assert.equal(restoredAfterInvalidSourceChange?.privateReview, undefined)
assert.equal(privateReviewMatchesCurrentSourceSet(restoredAfterInvalidSourceChange), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'durable_private_source_asset_fingerprint_created',
    'valid_private_review_handoff_preserved',
    'valid_private_review_handoff_preserves_storage_bucket',
    'local_mock_source_asset_fingerprint_rejected',
    'zero_byte_source_asset_fingerprint_rejected',
    'missing_checksum_source_asset_fingerprint_rejected',
    'public_storage_bucket_source_asset_fingerprint_rejected',
    'signed_url_source_asset_fingerprint_rejected',
    'invalid_saved_handoff_downgraded_to_created',
    'source_change_with_invalid_assets_clears_review_state',
    'stale_missing_manifest_review_downgraded_to_plan_approved',
    'stale_missing_video_review_downgraded_to_private_review_verified',
    'stale_missing_qa_complete_review_downgraded_to_accepted',
  ],
}))
