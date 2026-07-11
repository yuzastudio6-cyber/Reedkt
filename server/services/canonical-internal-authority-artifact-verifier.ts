import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import { readPrivateFileIfExistsWithinRoot } from '../security/private-local-persistence'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { stableAuthorityStringify } from './private-edit-authority-store'

const AUTHORITY_ARTIFACT_SCHEMA_VERSION = 'canonical-authority-validation-artifact-v1'
const AUTHORITY_RUNNER_CLASS = 'canonical_authority_validation_runner_v1'
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
  runnerClass: 'canonical_authority_validation_runner_v1'
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
  if (
    artifact.identity.expectedAssetId !== artifact.lineage.assetId ||
    artifact.identity.jobId === '' ||
    artifact.lineage.artifactType !== 'authority_validation_evidence' ||
    artifact.lineage.assetRole !== 'qa' ||
    artifact.lineage.contentType !== 'application/json' ||
    artifact.content.contentType !== 'application/json' ||
    artifact.content.byteLength <= 0 ||
    artifact.content.byteLength > MAXIMUM_AUTHORITY_ARTIFACT_BYTES ||
    artifact.storageIdentity.storageKind !== 'private_local_test' ||
    artifact.placeholder.isPlaceholder ||
    artifact.evidenceClass !== 'private_internal_test_attested' ||
    artifact.liveRuntimeEligible !== false ||
    artifact.actualRunEvidence.state !== 'actual_run_evidence_placeholder' ||
    artifact.actualRunEvidence.runnerClass !== AUTHORITY_RUNNER_CLASS ||
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

  const report = parseSemanticReport(bytes)
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
    executionFence.runnerClass !== AUTHORITY_RUNNER_CLASS
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
    runnerClass: AUTHORITY_RUNNER_CLASS,
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

function parseSemanticReport(bytes: Buffer): Record<string, unknown> {
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
    stableAuthorityStringify(receivedCheckIds) !== stableAuthorityStringify(REQUIRED_CHECK_IDS)
  ) {
    throw invalidArtifact('Private canonical authority artifact failed semantic verification.')
  }
  return report
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidArtifact('Private canonical authority artifact has an invalid object shape.')
  }
  return value as Record<string, unknown>
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
