import { createHash } from 'node:crypto'

import {
  CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import { ApiError } from '../errors/api-error'
import {
  verifyCanonicalLivingFrameMotionSpec,
} from '../living-frame/canonical-living-frame-motion'
import { readPrivateFileIfExistsWithinRoot } from '../security/private-local-persistence'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { stableAuthorityStringify } from './private-edit-authority-store'

const AUTHORITY_ARTIFACT_SCHEMA_VERSION = 'canonical-authority-validation-artifact-v1'
const AUTHORITY_PROFILES = {
  authority_validation_evidence: {
    validationProfile: 'snapshot',
    runnerClass: 'canonical_authority_validation_runner_v1',
    assetRole: 'qa',
  },
  source_trim_validation_evidence: {
    validationProfile: 'source_trim',
    runnerClass: 'canonical_source_trim_validation_runner_v1',
    assetRole: 'qa',
  },
  living_frame_remotion_layer_manifest: {
    validationProfile: 'living_frame_layer',
    runnerClass: 'canonical_living_frame_layer_manifest_runner_v1',
    assetRole: 'processed',
  },
} as const
const MAXIMUM_AUTHORITY_ARTIFACT_BYTES = 1024 * 1024
const REQUIRED_CHECK_IDS = [
  'approved_snapshot_manifest_integrity',
  'plan_estimate_work_graph_hash_integrity',
  'planning_preference_brief_binding_integrity',
  'source_media_manifest_integrity',
  'planned_asset_manifest_integrity',
  'execution_package_integrity',
  'funded_reservation_active',
  'exact_root_work_item_and_expected_output',
  'opaque_worker_execution_fence_started',
] as const

export interface VerifiedCanonicalInternalAuthorityArtifact {
  sha256: string
  byteLength: number
  privateObjectIdentityHash: string
  semanticReportHash: string
  leaseId: string
  immutableLeaseHash: string
  leaseAttemptNumber: number
  executionAttemptId: string
  runnerClass:
    | 'canonical_authority_validation_runner_v1'
    | 'canonical_source_trim_validation_runner_v1'
    | 'canonical_living_frame_layer_manifest_runner_v1'
}

/**
 * Re-opens and semantically verifies the private authority-validation object.
 * Dependency readiness alone intentionally carries only an opaque object hash;
 * this verifier converts that hash back into the one server-owned, safe path
 * used by the internal runner and refuses missing, replaced, or malformed bytes.
 */
export async function verifyCanonicalInternalAuthorityArtifact(input: {
  localStorageRoot: string
  artifact: PersistedArtifactResult
}): Promise<VerifiedCanonicalInternalAuthorityArtifact> {
  const { artifact } = input
  const profile = AUTHORITY_PROFILES[
    artifact.lineage.artifactType as keyof typeof AUTHORITY_PROFILES
  ]
  if (
    !profile ||
    artifact.identity.expectedAssetId !== artifact.lineage.assetId ||
    artifact.identity.jobId === '' ||
    artifact.lineage.assetRole !== profile.assetRole ||
    artifact.lineage.contentType !== 'application/json' ||
    artifact.content.contentType !== 'application/json' ||
    artifact.content.byteLength <= 0 ||
    artifact.content.byteLength > MAXIMUM_AUTHORITY_ARTIFACT_BYTES ||
    artifact.storageIdentity.storageKind !== 'private_local_test' ||
    artifact.placeholder.isPlaceholder ||
    artifact.evidenceClass !== 'private_internal_test_attested' ||
    artifact.liveRuntimeEligible !== false ||
    artifact.actualRunEvidence.state !== 'actual_run_evidence_placeholder' ||
    artifact.actualRunEvidence.runnerClass !== profile.runnerClass ||
    artifact.actualRunEvidence.actualRunVerified !== false ||
    artifact.actualRunEvidence.toolIds.length !== 0 ||
    artifact.actualRunEvidence.providerRoute !== undefined
  ) {
    throw invalidArtifact('Private canonical authority artifact record is not an exact internal-runner result.')
  }

  const privateObjectIdentityHash = artifact.storageIdentity.opaqueObjectIdentityHash
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: canonicalInternalAuthorityArtifactRelativePath(privateObjectIdentityHash),
  })
  if (
    !bytes ||
    bytes.byteLength !== artifact.content.byteLength ||
    sha256Bytes(bytes) !== artifact.content.sha256
  ) {
    throw invalidArtifact('Private canonical authority artifact bytes are missing or no longer match authority.')
  }

  const report = parseSemanticReport(bytes, profile.validationProfile)
  const identity = asRecord(report.identity)
  const authorityHashes = asRecord(report.authorityHashes)
  const executionFence = asRecord(report.executionFence)
  if (
    identity.workspaceId !== artifact.identity.workspaceId ||
    identity.projectId !== artifact.identity.projectId ||
    identity.editSessionId !== artifact.identity.editSessionId ||
    identity.snapshotId !== artifact.identity.snapshotId ||
    identity.jobId !== artifact.identity.jobId ||
    identity.approvedWorkItemId !== artifact.lineage.approvedWorkItemId ||
    identity.expectedAssetId !== artifact.identity.expectedAssetId ||
    authorityHashes.snapshotHash !== artifact.lineage.snapshotHash ||
    authorityHashes.approvedAssetManifestHash !== artifact.lineage.approvedAssetManifestHash ||
    authorityHashes.jobAuthorityHash !== artifact.lineage.jobAuthorityHash ||
    typeof executionFence.leaseId !== 'string' ||
    typeof executionFence.immutableLeaseHash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(executionFence.immutableLeaseHash) ||
    !Number.isInteger(executionFence.leaseAttemptNumber) ||
    Number(executionFence.leaseAttemptNumber) <= 0 ||
    executionFence.executionAttemptId !== artifact.actualRunEvidence.executionAttemptId ||
    executionFence.runnerClass !== profile.runnerClass
  ) {
    throw invalidArtifact('Private canonical authority artifact semantic lineage is inconsistent.')
  }

  return {
    sha256: artifact.content.sha256,
    byteLength: artifact.content.byteLength,
    privateObjectIdentityHash,
    semanticReportHash: sha256Text(stableAuthorityStringify(report)),
    leaseId: executionFence.leaseId,
    immutableLeaseHash: executionFence.immutableLeaseHash,
    leaseAttemptNumber: Number(executionFence.leaseAttemptNumber),
    executionAttemptId: artifact.actualRunEvidence.executionAttemptId,
    runnerClass: profile.runnerClass,
  }
}

export function canonicalInternalAuthorityArtifactRelativePath(identityHash: string): string {
  if (!/^[a-f0-9]{64}$/.test(identityHash)) {
    throw invalidArtifact('Private canonical authority artifact object identity is invalid.')
  }
  return [
    'canonical-internal-authority-results',
    'private-v1',
    identityHash.slice(0, 2),
    `${identityHash}.json`,
  ].join('/')
}

function parseSemanticReport(
  bytes: Buffer,
  expectedProfile: 'snapshot' | 'source_trim' | 'living_frame_layer',
): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalidArtifact('Private canonical authority artifact is not valid JSON.')
  }
  const report = asRecord(parsed)
  const checks = Array.isArray(report.checks) ? report.checks : []
  const receivedCheckIds = checks.map((check) => {
    const record = asRecord(check)
    if (record.status !== 'passed' || typeof record.checkId !== 'string') {
      throw invalidArtifact('Private canonical authority artifact contains a failed or malformed check.')
    }
    return record.checkId
  })
  if (
    report.schemaVersion !== AUTHORITY_ARTIFACT_SCHEMA_VERSION ||
    report.source !== 'immutable_canonical_edit_authority' ||
    report.valid !== true ||
    report.validationProfile !== expectedProfile ||
    (expectedProfile === 'snapshot' &&
      (report.sourceTrim !== null ||
        report.livingFrameLayer !== null)) ||
    (expectedProfile === 'source_trim' &&
      (!validSourceTrimReport(report.sourceTrim) ||
        report.livingFrameLayer !== null)) ||
    (expectedProfile === 'living_frame_layer' &&
      (report.sourceTrim !== null ||
        !validLivingFrameLayerReport(report.livingFrameLayer))) ||
    stableAuthorityStringify(receivedCheckIds) !== stableAuthorityStringify(REQUIRED_CHECK_IDS)
  ) {
    throw invalidArtifact('Private canonical authority artifact failed semantic verification.')
  }
  return report
}

function validLivingFrameLayerReport(value: unknown): boolean {
  const report = asRecord(value)
  const component = asRecord(report.component)
  const motionSpec = report.motionSpec
  return (
    report.schemaVersion ===
      CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION &&
    validSha256(report.selectedSceneBindingDigestSha256) &&
    validSha256(report.timingBindingDigestSha256) &&
    validIdentity(report.sceneId) &&
    validIdentity(report.layerId) &&
    Number.isSafeInteger(report.startFrame) &&
    Number(report.startFrame) >= 0 &&
    Number.isSafeInteger(report.endFrameExclusive) &&
    Number(report.endFrameExclusive) > Number(report.startFrame) &&
    Number.isSafeInteger(report.outputWidth) &&
    Number(report.outputWidth) >= 1 &&
    Number(report.outputWidth) <= 4_096 &&
    Number.isSafeInteger(report.outputHeight) &&
    Number(report.outputHeight) >= 1 &&
    Number(report.outputHeight) <= 4_096 &&
    report.fit === 'fill' &&
    report.opacity === 1 &&
    report.compositionPolicy ===
      CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY &&
    report.captionPlaneRemainsAboveLivingFrame === true &&
    verifyCanonicalLivingFrameMotionSpec(motionSpec) &&
    motionSpec.sceneId === report.sceneId &&
    motionSpec.sceneStartFrame === report.startFrame &&
    motionSpec.sceneEndFrameExclusive ===
      report.endFrameExclusive &&
    motionSpec.sourceBindings
      .selectedSceneBindingDigestSha256 ===
      report.selectedSceneBindingDigestSha256 &&
    motionSpec.sourceBindings
      .timingBindingDigestSha256 ===
      report.timingBindingDigestSha256 &&
    validIdentity(component.workItemKey) &&
    validIdentity(component.dependencyJobId) &&
    validIdentity(component.outputKey) &&
    validIdentity(component.expectedAssetId) &&
    component.artifactType === 'living_frame_component_rgba_png' &&
    component.contentType === 'image/png' &&
    validIdentity(component.artifactId) &&
    Number.isSafeInteger(component.artifactVersion) &&
    Number(component.artifactVersion) > 0 &&
    validSha256(component.contentSha256) &&
    validIdentity(component.qaEvaluationId) &&
    validIdentity(component.reconciliationId) &&
    validIdentity(component.executionAttemptId) &&
    validSha256(component.sourceLeaseImmutableHash)
  )
}

function validSourceTrimReport(value: unknown): boolean {
  const report = asRecord(value)
  const sourceIds = Array.isArray(report.sourceSequenceItemIds) ? report.sourceSequenceItemIds : []
  const decisionIds = Array.isArray(report.sourceCleanupDecisionIds) ? report.sourceCleanupDecisionIds : []
  const decisions = Array.isArray(report.decisions) ? report.decisions : []
  if (
    report.status !== 'confirmed' || sourceIds.length < 1 ||
    !sourceIds.every((id) => typeof id === 'string') ||
    decisionIds.length < 1 || !decisionIds.every((id) => typeof id === 'string') ||
    new Set(decisionIds).size !== decisionIds.length || report.decisionCount !== decisionIds.length ||
    decisions.length !== decisionIds.length || report.meaningPreservationValidated !== true ||
    report.unresolvedUserReview !== false
  ) return false
  return decisions.every((value, index) => {
    const decision = asRecord(value)
    return decision.decisionId === decisionIds[index] &&
      typeof decision.sourceSequenceItemId === 'string' && sourceIds.includes(decision.sourceSequenceItemId) &&
      Number.isSafeInteger(decision.startFrame) && Number(decision.startFrame) >= 0 &&
      Number.isSafeInteger(decision.endFrameExclusive) &&
      Number(decision.endFrameExclusive) > Number(decision.startFrame) &&
      typeof decision.reasonHash === 'string' && /^[a-f0-9]{64}$/.test(decision.reasonHash) &&
      ['passed', 'warning'].includes(String(decision.meaningPreservationStatus)) &&
      ['not_required', 'resolved'].includes(String(decision.userReviewStatus))
  })
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidArtifact('Private canonical authority artifact has an invalid object shape.')
  }
  return value as Record<string, unknown>
}

function validSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function validIdentity(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value) &&
    !value.includes('..')
}

function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalidArtifact(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_internal_authority_artifact_integrity',
  })
}
