import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceDeterministicTool,
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePlanningEvidenceAdmission,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type { StorageAdapter } from '../storage/storage-types'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import type {
  CanonicalSourceLedProfessionalContentAnalysisSource,
} from './canonical-source-led-professional-content-analysis-port'
import {
  canonicalSourceLedTranscriptEvidenceSchema,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceVisualIntelligencePlanningAdmissionPort,
  CanonicalVisualIntelligenceSourceTranscriptResult,
} from './canonical-source-visual-intelligence-analysis-contract'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import type {
  VisualIntelligenceAdmissionVerificationPort,
  VisualIntelligenceEvidencePreparationPort,
  VisualIntelligencePreparedEvidence,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import type {
  VisualIntelligenceAccountEffectiveCostOwner,
} from '../visual-intelligence/visual-intelligence-account-effective-cost-owner'
import {
  assertAdmittedVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
  type VisualIntelligenceRuntimeRelease,
} from '../visual-intelligence/visual-intelligence-runtime-release'
import {
  createVisualIntelligenceEvidenceRef,
  parseVisualIntelligenceRequest,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'

export const CANONICAL_SOURCE_VISUAL_INTELLIGENCE_OWNER_VERSION =
  'canonical-source-visual-intelligence-owner-v1' as const

const DEFAULT_PREFIX = 'private/visual-intelligence/v1/source-owner-inputs'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u
const GCS_URI = /^gs:\/\/[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]\/[^?#\\]+$/u

export interface CanonicalSourceVisualIntelligenceAuthorityRereadPort {
  reread(input: {
    readonly requestId: string
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly analysisRunId: string
    readonly sourceSequenceItemId: string
    readonly mediaAssetId: string
    readonly source: CanonicalSourceLedProfessionalContentAnalysisSource
  }): Promise<
    | {
        readonly status: 'blocked'
        readonly blockerCode: string
      }
    | {
        readonly status: 'admitted'
        readonly authenticatedPrincipalRef: VisualIntelligenceEvidenceRef
        readonly workspaceAuthorizationRef: VisualIntelligenceEvidenceRef
        readonly analysisAllowanceRef: VisualIntelligenceEvidenceRef
        readonly retentionPolicyRef: VisualIntelligenceEvidenceRef
        readonly privacyPolicyRef: VisualIntelligenceEvidenceRef
        readonly exactScopeRereadVerified: true
        readonly globalKillSwitchOpen: false
        readonly providerKillSwitchOpen: false
      }
  >
}

/**
 * Production source-authority bridge. The authenticated source-planning route
 * has already resolved the private upload authority; this bridge independently
 * rereads the exact immutable GCS generation and hashes its bytes before a
 * provider admission can be persisted. It never returns a signed URL or media
 * bytes and it cannot authorize timeline work.
 */
export function createCanonicalSourceVisualIntelligenceGcsAuthorityRereadPort(
  input: {
    readonly storageAdapter: StorageAdapter
    readonly runtimeRelease: VisualIntelligenceRuntimeRelease
  },
): CanonicalSourceVisualIntelligenceAuthorityRereadPort {
  const release = assertAdmittedVisualIntelligenceRuntimeRelease(
    input.runtimeRelease,
  )
  if (input.storageAdapter.mode !== 'gcs') {
    throw notReady('visual_intelligence_source_authority_requires_gcs')
  }
  const port: CanonicalSourceVisualIntelligenceAuthorityRereadPort = {
    async reread(value) {
      const sourceAuthority = value.source.managedApiAuthority
      if (
        !sourceAuthority
        || sourceAuthority.ownerUserId !== value.ownerUserId
        || value.source.sourceSequenceItemId !== value.sourceSequenceItemId
        || value.source.mediaAssetId !== value.mediaAssetId
        || value.source.storageBucket !== sourceAuthority.storageBucket
        || value.source.storagePath !== sourceAuthority.storagePath
        || sourceAuthority.contentType !== 'video/mp4'
      ) return {
        status: 'blocked' as const,
        blockerCode: 'visual_intelligence_source_scope_authority_mismatch',
      }
      const metadata = await input.storageAdapter.verifyUploadedObject({
        bucketName: sourceAuthority.storageBucket,
        objectPath: sourceAuthority.storagePath,
        expectedSizeBytes: value.source.byteLength,
        checksumSha256: value.source.checksumSha256,
        cleanupOnMismatch: false,
      })
      if (
        !metadata.exists
        || metadata.integrityVerified !== true
        || metadata.checksumSource !== 'server_computed_bytes'
        || metadata.generation !== sourceAuthority.storageGeneration
        || metadata.etag !== sourceAuthority.storageEtag
        || metadata.mimeType !== sourceAuthority.contentType
        || metadata.sizeBytes !== value.source.byteLength
        || metadata.checksumSha256 !== value.source.checksumSha256
      ) return {
        status: 'blocked' as const,
        blockerCode: 'visual_intelligence_source_exact_generation_reread_failed',
      }
      const scope = {
        requestId: value.requestId,
        ownerUserId: value.ownerUserId,
        workspaceId: value.workspaceId,
        projectId: value.projectId,
        editSessionId: value.editSessionId,
        analysisRunId: value.analysisRunId,
        sourceSequenceItemId: value.sourceSequenceItemId,
        mediaAssetId: value.mediaAssetId,
        sourceAnalysisConsentRef: sourceAuthority.sourceAnalysisConsentRef,
        finalizedMediaAuthorityRef: sourceAuthority.finalizedMediaAuthorityRef,
      }
      return {
        status: 'admitted' as const,
        authenticatedPrincipalRef: createVisualIntelligenceEvidenceRef(
          `vi-principal-${digest(scope).slice(7, 39)}`,
          { ownerUserId: value.ownerUserId, scope },
        ),
        workspaceAuthorizationRef: createVisualIntelligenceEvidenceRef(
          `vi-workspace-auth-${digest(scope).slice(7, 39)}`,
          { workspaceId: value.workspaceId, projectId: value.projectId, scope },
        ),
        analysisAllowanceRef: sourceAuthority.sourceAnalysisConsentRef,
        retentionPolicyRef: createVisualIntelligenceEvidenceRef(
          `vi-retention-${digest(scope).slice(7, 39)}`,
          {
            scope,
            providerPrivacyRetentionReviewRef:
              release.providerPrivacyRetentionReviewRef,
            privateReportOnly: true,
          },
        ),
        privacyPolicyRef: createVisualIntelligenceEvidenceRef(
          `vi-privacy-${digest(scope).slice(7, 39)}`,
          {
            scope,
            providerPrivacyRetentionReviewRef:
              release.providerPrivacyRetentionReviewRef,
            publicMediaUrlAllowed: false,
            sourceBytesMayBePersistedByProviderAdapter: false,
          },
        ),
        exactScopeRereadVerified: true as const,
        globalKillSwitchOpen: false as const,
        providerKillSwitchOpen: false as const,
      }
    },
  }
  return Object.freeze(port)
}

export interface CanonicalSourceVisualIntelligenceGpuEvidencePort {
  prepare(input: {
    readonly requestId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly analysisRunId: string
    readonly source: CanonicalSourceLedProfessionalContentAnalysisSource
    readonly transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult
  }): Promise<VisualIntelligencePreparedEvidence>
}

export interface CanonicalSourceVisualIntelligenceOwner {
  readonly runtimeReleaseRef: VisualIntelligenceEvidenceRef
  readonly planningAdmissionPort:
    CanonicalSourceVisualIntelligencePlanningAdmissionPort
  readonly admissionVerificationPort:
    VisualIntelligenceAdmissionVerificationPort
  readonly evidencePreparationPort:
    VisualIntelligenceEvidencePreparationPort
}

interface SourceOwnerRecord {
  readonly schemaVersion: 'canonical-source-visual-intelligence-owner-input-v1'
  readonly ownerVersion:
    typeof CANONICAL_SOURCE_VISUAL_INTELLIGENCE_OWNER_VERSION
  readonly requestId: string
  readonly idempotencyKey: string
  readonly scope: {
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly approvedSnapshotId: null
  }
  readonly analysisRunId: string
  readonly sourceIdentity: {
    readonly sourceSequenceItemId: string
    readonly mediaAssetId: string
    readonly checksumSha256: string
    readonly byteLength: number
    readonly durationFrames: number
    readonly storageBucket: string
    readonly storagePath: string
    readonly storageGeneration: string
    readonly storageEtag: string
    readonly contentType: 'video/mp4'
    readonly finalizedMediaAuthorityRef: VisualIntelligenceEvidenceRef
    readonly finalizedStorageObjectAuthorityRef:
      VisualIntelligenceEvidenceRef
    readonly sourceProbeAuthorityRef: VisualIntelligenceEvidenceRef
  }
  readonly transcriptAuthorityRef: VisualIntelligenceEvidenceRef
  readonly admission: VisualIntelligencePlanningEvidenceAdmission
  readonly prepared: VisualIntelligencePreparedEvidence
  readonly reportPersistenceAllowed: true
  readonly directTimelineMutationAllowed: false
  readonly providerCredentialPersisted: false
  readonly publicMediaUrlPersisted: false
  readonly sourceBytesPersisted: false
  readonly recordDigestSha256: string
}

export function createCanonicalSourceVisualIntelligenceOwner(input: {
  readonly authorityRereadPort:
    CanonicalSourceVisualIntelligenceAuthorityRereadPort
  readonly gpuEvidencePort: CanonicalSourceVisualIntelligenceGpuEvidencePort
  readonly costOwner: VisualIntelligenceAccountEffectiveCostOwner
  readonly runtimeRelease: VisualIntelligenceRuntimeRelease
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSourceVisualIntelligenceOwner {
  const release = assertAdmittedVisualIntelligenceRuntimeRelease(
    input.runtimeRelease,
  )
  const releaseRef = visualIntelligenceRuntimeReleaseRef(release)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  validateDependencies(input)

  const planningAdmissionPortImplementation:
  CanonicalSourceVisualIntelligencePlanningAdmissionPort = {
    async admit(value) {
      validatePlanningInput(value)
      const objectPath = pathFor(prefix, value.requestId)
      const existing = await readRecord(input.objectPort, objectPath)
      if (existing) {
        const record = parseRecord(existing)
        requireSamePlanningInput(record, value)
        return record.admission
      }
      const sourceAuthority = value.source.managedApiAuthority!
      const authority = await input.authorityRereadPort.reread({
        requestId: value.requestId,
        ownerUserId: sourceAuthority.ownerUserId,
        workspaceId: value.workspaceId,
        projectId: value.projectId,
        editSessionId: value.editSessionId,
        analysisRunId: value.analysisRunId,
        sourceSequenceItemId: value.source.sourceSequenceItemId,
        mediaAssetId: value.source.mediaAssetId,
        source: value.source,
      })
      if (authority.status !== 'admitted') {
        throw notReady(authority.blockerCode)
      }
      const durationSeconds = Math.ceil(
        value.source.durationFrames
          * sourceAuthority.fpsDenominator
          / sourceAuthority.fpsNumerator,
      )
      const estimatedInputTokenCount = Math.min(
        1_048_576,
        Math.max(1, durationSeconds * 320 + 5_000),
      )
      const costPreflight = await input.costOwner.createPreflight({
        requestId: value.requestId,
        maximumInputTokenCount: 1_048_576,
        maximumOutputAndThinkingTokenCount: 65_536,
        estimatedInputTokenCount,
        estimatedOutputAndThinkingTokenCount: 16_384,
      })
      if (
        refKey(costPreflight.accountEffectiveRateAuthorityRef)
          !== refKey(release.accountEffectivePricingAuthorityRef)
        || costPreflight.publicListPriceUsedAsSettlementAuthority
      ) throw notReady('visual_intelligence_release_rate_authority_mismatch')
      const prepared = await input.gpuEvidencePort.prepare(value)
      validatePreparedEvidence(value, prepared)
      const admission: VisualIntelligencePlanningEvidenceAdmission = {
        mode: 'planning_evidence',
        authenticatedPrincipalRef: authority.authenticatedPrincipalRef,
        workspaceAuthorizationRef: authority.workspaceAuthorizationRef,
        finalizedSourceAuthorityRefs: [
          sourceAuthority.finalizedMediaAuthorityRef,
        ],
        sourceChecksumSetRef: createVisualIntelligenceEvidenceRef(
          `vi-source-checksum-${digest(value.requestId).slice(7)}`,
          [{
            mediaAssetId: value.source.mediaAssetId,
            checksumSha256: value.source.checksumSha256,
          }],
        ),
        analysisAllowanceRef: authority.analysisAllowanceRef,
        costPreflight,
        retentionPolicyRef: authority.retentionPolicyRef,
        privacyPolicyRef: authority.privacyPolicyRef,
        providerReleaseRef: releaseRef,
        globalKillSwitchOpen: false,
        providerKillSwitchOpen: false,
        reportPersistenceAllowed: true,
        timelineMutationAllowed: false,
        editingWorkerExecutionAllowed: false,
        generationAllowed: false,
        renderAllowed: false,
        exportAllowed: false,
        deliveryAllowed: false,
      }
      const scope = {
        ownerUserId: sourceAuthority.ownerUserId,
        workspaceId: value.workspaceId,
        projectId: value.projectId,
        editSessionId: value.editSessionId,
        approvedSnapshotId: null,
      } as const
      const sourceIdentity = {
        sourceSequenceItemId: value.source.sourceSequenceItemId,
        mediaAssetId: value.source.mediaAssetId,
        checksumSha256: value.source.checksumSha256,
        byteLength: value.source.byteLength,
        durationFrames: value.source.durationFrames,
        storageBucket: sourceAuthority.storageBucket,
        storagePath: sourceAuthority.storagePath,
        storageGeneration: sourceAuthority.storageGeneration,
        storageEtag: sourceAuthority.storageEtag,
        contentType: sourceAuthority.contentType,
        finalizedMediaAuthorityRef:
          sourceAuthority.finalizedMediaAuthorityRef,
        finalizedStorageObjectAuthorityRef:
          sourceAuthority.finalizedStorageObjectAuthorityRef,
        sourceProbeAuthorityRef: sourceAuthority.sourceProbeAuthorityRef,
      }
      const recordWithoutDigest = {
        schemaVersion:
          'canonical-source-visual-intelligence-owner-input-v1' as const,
        ownerVersion: CANONICAL_SOURCE_VISUAL_INTELLIGENCE_OWNER_VERSION,
        requestId: value.requestId,
        idempotencyKey: value.idempotencyKey,
        scope,
        analysisRunId: value.analysisRunId,
        sourceIdentity,
        transcriptAuthorityRef:
          value.transcriptResult.transcriptAuthorityRef,
        admission,
        prepared,
        reportPersistenceAllowed: true as const,
        directTimelineMutationAllowed: false as const,
        providerCredentialPersisted: false as const,
        publicMediaUrlPersisted: false as const,
        sourceBytesPersisted: false as const,
      }
      const record: SourceOwnerRecord = {
        ...recordWithoutDigest,
        recordDigestSha256: digest(recordWithoutDigest),
      }
      await persistRecord(input.objectPort, objectPath, record)
      const reread = parseRecord(requireRecord(
        await readRecord(input.objectPort, objectPath),
      ))
      requireSamePlanningInput(reread, value)
      if (!same(record, reread)) {
        throw conflict('visual_intelligence_source_owner_reread_mismatch')
      }
      return reread.admission
    },
  }
  const planningAdmissionPort = Object.freeze(
    planningAdmissionPortImplementation,
  )

  const admissionVerificationPortImplementation:
  VisualIntelligenceAdmissionVerificationPort = {
    async verifyAndRereadExact(untrustedRequest) {
      const request = parseVisualIntelligenceRequest(untrustedRequest)
      const raw = await readRecord(input.objectPort, pathFor(
        prefix,
        request.requestId,
      ))
      if (!raw) return {
        status: 'blocked',
        blockerCode: 'visual_intelligence_source_owner_record_missing',
      }
      const record = parseRecord(raw)
      if (
        record.idempotencyKey !== request.idempotencyKey
        || !same(record.scope, request.scope)
        || !same(record.admission, request.admission)
        || refKey(request.admission.providerReleaseRef) !== refKey(releaseRef)
        || request.sourceArtifacts.length !== 1
        || request.comparisonArtifacts.length !== 0
        || !sourceArtifactMatchesRecord(request, record)
        || request.requiredEvidenceRefs.length !== 2
        || !containsRef(request.requiredEvidenceRefs,
          record.sourceIdentity.sourceProbeAuthorityRef)
        || !containsRef(request.requiredEvidenceRefs,
          record.transcriptAuthorityRef)
      ) return {
        status: 'blocked',
        blockerCode: 'visual_intelligence_source_owner_request_mismatch',
      }
      return {
        status: 'admitted',
        admissionRef: admissionRef(record),
        providerReleaseRef: releaseRef,
        exactScopeRereadVerified: true,
        exactArtifactAuthorityRereadVerified: true,
        exactCostPreflightRereadVerified: true,
        killSwitchesVerifiedClosed: true,
        retentionPrivacyVerified: true,
      }
    },
  }
  const admissionVerificationPort = Object.freeze(
    admissionVerificationPortImplementation,
  )

  const evidencePreparationPortImplementation:
  VisualIntelligenceEvidencePreparationPort = {
    async prepare(value) {
      const request = parseVisualIntelligenceRequest(value.request)
      const record = parseRecord(requireRecord(await readRecord(
        input.objectPort,
        pathFor(prefix, request.requestId),
      )))
      if (
        refKey(value.admissionRef) !== refKey(admissionRef(record))
        || !same(record.admission, request.admission)
        || !sourceArtifactMatchesRecord(request, record)
      ) throw notReady('visual_intelligence_source_prepared_evidence_mismatch')
      validatePreparedEvidenceAgainstRequest(request, record.prepared)
      return deepClone(record.prepared)
    },
  }
  const evidencePreparationPort = Object.freeze(
    evidencePreparationPortImplementation,
  )

  return Object.freeze({
    runtimeReleaseRef: releaseRef,
    planningAdmissionPort,
    admissionVerificationPort,
    evidencePreparationPort,
  })
}

function validatePlanningInput(value: {
  requestId: string
  idempotencyKey: string
  workspaceId: string
  projectId: string
  editSessionId: string
  analysisRunId: string
  source: CanonicalSourceLedProfessionalContentAnalysisSource
  transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult
}): void {
  const authority = value.source.managedApiAuthority
  const parsedTranscript = canonicalSourceLedTranscriptEvidenceSchema.safeParse(
    value.transcriptResult.transcript,
  )
  if (
    !safeId(value.requestId)
    || !safeId(value.idempotencyKey)
    || !safeId(value.workspaceId)
    || !safeId(value.projectId)
    || !safeId(value.editSessionId)
    || !safeId(value.analysisRunId)
    || !authority
    || !safeId(value.source.sourceSequenceItemId)
    || !safeId(value.source.mediaAssetId)
    || value.source.storageProvider !== 'google_cloud_storage'
    || !RAW_SHA256.test(value.source.checksumSha256)
    || !Number.isSafeInteger(value.source.byteLength)
    || value.source.byteLength < 1
    || !Number.isSafeInteger(value.source.durationFrames)
    || value.source.durationFrames < 1
    || !safeId(authority.ownerUserId)
    || authority.storageBucket !== value.source.storageBucket
    || authority.storagePath !== value.source.storagePath
    || authority.contentType !== 'video/mp4'
    || !/^[1-9][0-9]{0,30}$/u.test(authority.storageGeneration)
    || !authority.storageEtag
    || !Number.isSafeInteger(authority.width)
    || authority.width < 1
    || !Number.isSafeInteger(authority.height)
    || authority.height < 1
    || !Number.isSafeInteger(authority.fpsNumerator)
    || authority.fpsNumerator < 1
    || !Number.isSafeInteger(authority.fpsDenominator)
    || authority.fpsDenominator < 1
    || authority.frameCount !== value.source.durationFrames
    || (authority.hasAudio
      !== (authority.audioProbe.disposition === 'verified_audio_stream'))
    || ![
      authority.finalizedMediaAuthorityRef,
      authority.finalizedStorageObjectAuthorityRef,
      authority.sourceBindingManifestCandidateRef,
      authority.sourceProbeAuthorityRef,
      authority.providerMediaReadAuthorityRef,
      authority.sourceAnalysisConsentRef,
      authority.platformAnalysisCostCapRef,
      value.transcriptResult.transcriptAuthorityRef,
    ].every(validEvidenceRef)
    || value.transcriptResult.schemaVersion !==
      'canonical-visual-intelligence-source-transcript-result-v1'
    || !parsedTranscript.success
    || value.transcriptResult.transcriptAuthorityRef.contentHash !==
      `sha256:${parsedTranscript.data.transcriptDigestSha256}`
    || parsedTranscript.data.transcriptDigestSha256 !==
      digest(parsedTranscript.data.segments).slice(7)
    || parsedTranscript.data.coverage.coverageDigestSha256 !==
      digest(omitCoverageDigest(parsedTranscript.data.coverage)).slice(7)
    || parsedTranscript.data.coverage.coveredStartFrame !== 0
    || parsedTranscript.data.coverage.coveredEndFrameExclusive !==
      value.source.durationFrames
    || !parsedTranscript.data.coverage.completeAudioTimelineProcessed
    || !parsedTranscript.data.coverage.embeddedInstructionDetectionRequired
    || !sourceTranscriptExecutionIsValid(value, parsedTranscript.data.status)
    || value.transcriptResult.execution.transcriptRereadVerified !== true
    || value.transcriptResult.execution.completeAudioTimelineProcessed !== true
    || value.transcriptResult.execution.cpuInferenceFallbackUsed !== false
    || value.transcriptResult.execution.runtimeDownloadPerformed !== false
  ) throw notReady('visual_intelligence_source_owner_input_invalid')
}

function omitCoverageDigest(
  value: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const payload = { ...value }
  Reflect.deleteProperty(payload, 'coverageDigestSha256')
  return payload
}

function sourceTranscriptExecutionIsValid(
  value: Parameters<
    CanonicalSourceVisualIntelligencePlanningAdmissionPort['admit']
  >[0],
  transcriptStatus: 'completed' | 'no_speech',
): boolean {
  const execution = value.transcriptResult.execution
  const authority = value.source.managedApiAuthority!
  const policy = createCanonicalQualityFirstUserTriggeredGpuPolicy()
  const refs = [
    execution.primaryAttemptReceiptRef,
    execution.completedAttemptReceiptRef,
    execution.completedRuntimeReleaseRef,
    execution.fallbackAdmissionRef,
    ...execution.attemptCostEvidenceRefs,
  ].filter((ref): ref is VisualIntelligenceEvidenceRef => ref !== null)
  if (
    execution.executionOwner !==
      'canonical_quality_first_source_transcript_router'
    || execution.routePolicyDigestSha256 !== `sha256:${policy.policyHash}`
    || refs.some((ref) => !validEvidenceRef(ref))
    || new Set(execution.attemptCostEvidenceRefs.map(refKey)).size !==
      execution.attemptCostEvidenceRefs.length
    || execution.cpuInferenceFallbackUsed
    || !execution.completeAudioTimelineProcessed
    || execution.runtimeDownloadPerformed
    || execution.rawAudioPersisted
    || !execution.transcriptRereadVerified
    || execution.customerCreditMutated
    || execution.systemFailureChargedToCustomer
    || execution.unapprovedOverageChargedToCustomer
  ) return false
  if (execution.sourceAudioDisposition ===
    'transcribed_on_nvidia_a100_80gb_primary') {
    return authority.hasAudio
      && transcriptStatus === 'completed'
      && execution.routeProfileId ===
        'quality_a100_80gb_user_triggered_heavy_job_v1'
      && execution.acceleratorClass === 'nvidia_a100_80gb'
      && execution.primaryAttemptOutcome === 'completed'
      && execution.fallbackAttemptOutcome === 'not_attempted'
      && execution.primaryAttemptTerminalFailureClass === null
      && execution.primaryAttemptReceiptRef !== null
      && execution.completedAttemptReceiptRef !== null
      && refKey(execution.primaryAttemptReceiptRef) ===
        refKey(execution.completedAttemptReceiptRef)
      && execution.completedRuntimeReleaseRef !== null
      && execution.fallbackAdmissionRef === null
      && execution.attemptCostEvidenceRefs.length === 1
      && execution.gpuAccelerationUsed
      && execution.modelBytesPinnedBeforeExecution
  }
  if (execution.sourceAudioDisposition ===
    'transcribed_on_nvidia_l4_classified_fallback') {
    return authority.hasAudio
      && transcriptStatus === 'completed'
      && execution.routeProfileId ===
        'quality_l4_user_triggered_heavy_fallback_job_v1'
      && execution.acceleratorClass === 'nvidia_l4'
      && execution.primaryAttemptOutcome === 'not_started_terminal'
      && execution.fallbackAttemptOutcome === 'completed'
      && execution.primaryAttemptTerminalFailureClass !== null
      && policy.fallbackAdmission.allowedPrimaryFailureClasses.includes(
        execution.primaryAttemptTerminalFailureClass,
      )
      && execution.primaryAttemptReceiptRef !== null
      && execution.completedAttemptReceiptRef !== null
      && refKey(execution.primaryAttemptReceiptRef) !==
        refKey(execution.completedAttemptReceiptRef)
      && execution.completedRuntimeReleaseRef !== null
      && execution.fallbackAdmissionRef !== null
      && execution.attemptCostEvidenceRefs.length === 2
      && execution.gpuAccelerationUsed
      && execution.modelBytesPinnedBeforeExecution
  }
  return execution.sourceAudioDisposition === 'verified_no_audio_stream'
    && !authority.hasAudio
    && transcriptStatus === 'no_speech'
    && execution.routeProfileId === null
    && execution.acceleratorClass === null
    && execution.primaryAttemptOutcome === 'not_required_no_audio'
    && execution.fallbackAttemptOutcome === 'not_attempted'
    && execution.primaryAttemptTerminalFailureClass === null
    && execution.primaryAttemptReceiptRef === null
    && execution.completedAttemptReceiptRef === null
    && execution.completedRuntimeReleaseRef === null
    && execution.fallbackAdmissionRef === null
    && execution.attemptCostEvidenceRefs.length === 0
    && !execution.gpuAccelerationUsed
    && !execution.modelBytesPinnedBeforeExecution
}

function validatePreparedEvidence(
  value: Parameters<
    CanonicalSourceVisualIntelligenceGpuEvidencePort['prepare']
  >[0],
  prepared: VisualIntelligencePreparedEvidence,
): void {
  const authority = value.source.managedApiAuthority!
  const expectedUri = `gs://${authority.storageBucket}/${authority.storagePath}`
  const media = prepared.privateMediaInputs[0]
  const tools = new Map(prepared.toolExecutionEvidence.map((item) => [
    item.tool,
    item,
  ]))
  const l4Required: VisualIntelligenceDeterministicTool[] = [
    'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv',
  ]
  if (
    prepared.privateMediaInputs.length !== 1
    || !media
    || media.artifactId !== value.source.mediaAssetId
    || media.gcsUri !== expectedUri
    || !GCS_URI.test(media.gcsUri)
    || hasForbiddenControlCharacter(media.gcsUri)
    || media.contentType !== 'video/mp4'
    || media.checksumSha256 !== value.source.checksumSha256
    || media.exactGenerationRereadVerified !== true
    || prepared.transcriptVersion === null
    || prepared.coveragePlan.requestedRanges.length !== 1
    || prepared.coveragePlan.requestedRanges[0]!.startFrame !== 0
    || prepared.coveragePlan.requestedRanges[0]!.endFrameExclusive
      !== value.source.durationFrames
    || !prepared.coveragePlan.completeRequestedRangeCoverage
    || prepared.coveragePlan.incompleteRanges.length !== 0
    || prepared.coveragePlan.everyTimelineFrameInspected
    || prepared.coveragePlan.completeTimePixelInspectionClaimAllowed
    || l4Required.some((tool) => {
      const execution = tools.get(tool)
      return !execution
        || execution.executionClass !== 'l4_gpu_standard'
        || execution.substantiveCpuExecutionUsed !== false
        || execution.sourceArtifactChecksumBound !== true
    })
    || (authority.hasAudio && (() => {
      const transcript = tools.get('faster_whisper')
      return !transcript
        || (transcript.executionClass !== 'a100_80gb_gpu_heavy'
          && transcript.executionClass !== 'l4_gpu_standard')
        || transcript.substantiveCpuExecutionUsed !== false
        || transcript.sourceArtifactChecksumBound !== true
    })())
  ) throw notReady('visual_intelligence_source_gpu_evidence_invalid')
  const refs = new Set(prepared.deterministicEvidence.map((item) =>
    refKey(item.evidenceRef)))
  if (
    !refs.has(refKey(authority.sourceProbeAuthorityRef))
    || !refs.has(refKey(value.transcriptResult.transcriptAuthorityRef))
  ) throw notReady('visual_intelligence_source_required_evidence_missing')
}

function validatePreparedEvidenceAgainstRequest(
  request: VisualIntelligenceRequest,
  prepared: VisualIntelligencePreparedEvidence,
): void {
  const media = prepared.privateMediaInputs[0]
  const source = request.sourceArtifacts[0]
  if (
    prepared.privateMediaInputs.length !== 1
    || !media
    || !source
    || media.artifactId !== source.artifactId
    || media.contentType !== source.contentType
    || media.checksumSha256 !== source.checksumSha256
    || request.requiredEvidenceRefs.some((required) =>
      !prepared.deterministicEvidence.some((actual) =>
        refKey(actual.evidenceRef) === refKey(required)))
  ) throw notReady('visual_intelligence_source_prepared_request_mismatch')
}

function requireSamePlanningInput(
  record: SourceOwnerRecord,
  value: Parameters<
    CanonicalSourceVisualIntelligencePlanningAdmissionPort['admit']
  >[0],
): void {
  const authority = value.source.managedApiAuthority!
  if (
    record.requestId !== value.requestId
    || record.idempotencyKey !== value.idempotencyKey
    || record.scope.ownerUserId !== authority.ownerUserId
    || record.scope.workspaceId !== value.workspaceId
    || record.scope.projectId !== value.projectId
    || record.scope.editSessionId !== value.editSessionId
    || record.analysisRunId !== value.analysisRunId
    || record.sourceIdentity.sourceSequenceItemId
      !== value.source.sourceSequenceItemId
    || record.sourceIdentity.mediaAssetId !== value.source.mediaAssetId
    || record.sourceIdentity.checksumSha256 !== value.source.checksumSha256
    || record.sourceIdentity.storageGeneration !== authority.storageGeneration
    || record.sourceIdentity.storageEtag !== authority.storageEtag
    || refKey(record.transcriptAuthorityRef)
      !== refKey(value.transcriptResult.transcriptAuthorityRef)
  ) throw conflict('visual_intelligence_source_owner_idempotency_conflict')
}

function sourceArtifactMatchesRecord(
  request: VisualIntelligenceRequest,
  record: SourceOwnerRecord,
): boolean {
  const source = request.sourceArtifacts[0]
  return Boolean(
    source
    && source.artifactId === record.sourceIdentity.mediaAssetId
    && source.checksumSha256 === record.sourceIdentity.checksumSha256
    && source.byteLength === record.sourceIdentity.byteLength
    && source.durationFrames === record.sourceIdentity.durationFrames
    && refKey(source.finalizedMediaAuthorityRef)
      === refKey(record.sourceIdentity.finalizedMediaAuthorityRef)
    && refKey(source.immutableStorageObjectAuthorityRef)
      === refKey(record.sourceIdentity.finalizedStorageObjectAuthorityRef)
    && refKey(source.mediaProbeEvidenceRef)
      === refKey(record.sourceIdentity.sourceProbeAuthorityRef),
  )
}

function admissionRef(record: SourceOwnerRecord): VisualIntelligenceEvidenceRef {
  return createVisualIntelligenceEvidenceRef(
    `vi-admission-${digest(record.requestId).slice(7)}`,
    {
      requestId: record.requestId,
      analysisRunId: record.analysisRunId,
      sourceIdentity: record.sourceIdentity,
      transcriptAuthorityRef: record.transcriptAuthorityRef,
      admission: record.admission,
      preparedEvidenceRef: record.prepared.preparedEvidenceRef,
    },
  )
}

function parseRecord(value: unknown): SourceOwnerRecord {
  if (!isPlainRecord(value)) {
    throw conflict('visual_intelligence_source_owner_record_invalid')
  }
  const keys = [
    'schemaVersion', 'ownerVersion', 'requestId', 'idempotencyKey', 'scope',
    'analysisRunId', 'sourceIdentity', 'transcriptAuthorityRef', 'admission',
    'prepared', 'reportPersistenceAllowed', 'directTimelineMutationAllowed',
    'providerCredentialPersisted', 'publicMediaUrlPersisted',
    'sourceBytesPersisted', 'recordDigestSha256',
  ]
  if (
    Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || value.schemaVersion !==
      'canonical-source-visual-intelligence-owner-input-v1'
    || value.ownerVersion !== CANONICAL_SOURCE_VISUAL_INTELLIGENCE_OWNER_VERSION
    || value.reportPersistenceAllowed !== true
    || value.directTimelineMutationAllowed !== false
    || value.providerCredentialPersisted !== false
    || value.publicMediaUrlPersisted !== false
    || value.sourceBytesPersisted !== false
    || typeof value.recordDigestSha256 !== 'string'
    || value.recordDigestSha256 !== digest(omitRecordDigest(value))
  ) throw conflict('visual_intelligence_source_owner_record_invalid')
  return value as unknown as SourceOwnerRecord
}

async function persistRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > 16 * 1024 * 1024) {
    throw conflict('visual_intelligence_source_owner_record_size_invalid')
  }
  await port.createOnly({
    objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<unknown | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > 16 * 1024 * 1024) {
    throw conflict('visual_intelligence_source_owner_record_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('visual_intelligence_source_owner_record_json_invalid')
  }
}

function omitRecordDigest(value: Record<string, unknown>): unknown {
  const payload = { ...value }
  Reflect.deleteProperty(payload, 'recordDigestSha256')
  return payload
}

function pathFor(prefix: string, requestId: string): string {
  return `${prefix}/${digest(requestId).slice(7)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw notReady('visual_intelligence_source_owner_prefix_invalid')
  return normalized
}

function containsRef(
  refs: readonly VisualIntelligenceEvidenceRef[],
  target: VisualIntelligenceEvidenceRef,
): boolean {
  return refs.some((ref) => refKey(ref) === refKey(target))
}

function validateDependencies(input: {
  authorityRereadPort: CanonicalSourceVisualIntelligenceAuthorityRereadPort
  gpuEvidencePort: CanonicalSourceVisualIntelligenceGpuEvidencePort
  costOwner: VisualIntelligenceAccountEffectiveCostOwner
  objectPort: CanonicalCreateOnlyJsonObjectPort
}): void {
  if (
    !input.authorityRereadPort
    || typeof input.authorityRereadPort.reread !== 'function'
    || !input.gpuEvidencePort
    || typeof input.gpuEvidencePort.prepare !== 'function'
    || !input.costOwner
    || typeof input.costOwner.createPreflight !== 'function'
    || typeof input.costOwner.settleAccountEffectiveUsage !== 'function'
    || !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw notReady('visual_intelligence_source_owner_dependencies_invalid')
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isPlainRecord(value)) {
    throw conflict('visual_intelligence_source_owner_record_missing')
  }
  return value
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function deepClone<T>(value: T): T {
  return JSON.parse(visualIntelligenceCanonicalJson(value)) as T
}

function safeId(value: unknown): value is string {
  return typeof value === 'string'
    && SAFE_ID.test(value)
    && !value.includes('..')
}

function hasForbiddenControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function validEvidenceRef(
  value: unknown,
): value is VisualIntelligenceEvidenceRef {
  if (!isPlainRecord(value)) return false
  const keys = ['id', 'version', 'contentHash']
  return Reflect.ownKeys(value).length === keys.length
    && keys.every((key) => Object.hasOwn(value, key))
    && safeId(value.id)
    && Number.isSafeInteger(value.version)
    && Number(value.version) > 0
    && typeof value.contentHash === 'string'
    && PREFIXED_SHA256.test(value.contentHash)
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceCanonicalJson(left)
    === visualIntelligenceCanonicalJson(right)
}

function digest(value: unknown): string {
  return visualIntelligenceDigest(value)
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The canonical source Visual Intelligence owner is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The canonical source Visual Intelligence owner rejected conflicting evidence.',
    409,
    { requiredGate },
  )
}
