import type { SkillContractRef } from
  '../../src/types/orchestra-skill-contracts'
import type { ServiceContext } from '../types'
import {
  parseCaptionCanonicalTrackAllEvidenceRecordAny,
} from '../captions-specialist/caption-canonical-track-all-evidence-read'
import {
  createCanonicalCaptionTrackAllEvidenceRepositoryV3,
} from '../services/canonical-caption-track-all-support-service'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'
import {
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'
import type {
  CanonicalCaptionSupportResumeRequirement,
} from './canonical-caption-broll-approved-execution-harness'
import {
  createCaptionTrackAllContractFixtureResolution,
} from './captions-specialist-authenticated-owner-fixtures'

export const CANONICAL_CAPTION_TRACK_ALL_STRUCTURAL_SUPPORT_FIXTURE_VERSION =
  'canonical-caption-track-all-structural-support-fixture-v1' as const

/**
 * Persists a closed, source-only Track All support projection so the approved
 * execution campaign can exercise the canonical sequential-resume mechanics.
 * It does not run SAM, OpenCV, Kornia, a GPU, or private visual review and must
 * never be counted as Track All qualification evidence.
 */
export async function injectCanonicalCaptionTrackAllStructuralSupport(input: {
  readonly context: ServiceContext
  readonly requirement: CanonicalCaptionSupportResumeRequirement
}) {
  if (input.requirement.supportRequestRefs.length !== 1
    || input.requirement.supportRequestRefs[0]?.targetSkillKey !==
      'track_all') {
    throw new Error(
      'Structural Caption Track All fixture accepts exactly one Track All request.',
    )
  }
  if (input.context.auth?.userId !== input.requirement.ownerUserId) {
    throw new Error(
      'Structural Caption Track All fixture rejected crossed actor authority.',
    )
  }
  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: input.context.env.localStorageRoot,
  })
  const supportRepository =
    createCanonicalSpecialistSupportResumeRepository({
      objectPort,
      prefix: [
        'private-internal/captions-specialist/v1',
        input.requirement.ownerUserId,
        input.requirement.workspaceId,
      ].join('/'),
    })
  const pair = await supportRepository.rereadCallResultPair({
    callRef: input.requirement.originalCallRef,
  })
  if (!pair
    || pair.call.canonicalScope.ownerUserId !== input.requirement.ownerUserId
    || pair.call.canonicalScope.workspaceId !==
      input.requirement.workspaceId) {
    throw new Error(
      'Structural Caption Track All fixture could not reread the exact canonical call.',
    )
  }
  const selected = input.requirement.supportRequestRefs[0]
  const selectedRef: SkillContractRef = {
    id: selected.id,
    version: selected.version,
    contentHash: selected.contentHash,
  }
  const request = pair.result.supportRequests.find((candidate) =>
    candidate.requestId === selectedRef.id
    && candidate.schemaVersion === selectedRef.version
    && candidate.requestDigestSha256 === selectedRef.contentHash)
  if (!request || request.targetSkillKey !== 'track_all') {
    throw new Error(
      'Structural Caption Track All fixture could not reread the selected request.',
    )
  }
  const resolution = createCaptionTrackAllContractFixtureResolution({
    stepNumber: 1,
    currentCall: pair.call,
    currentResult: pair.result,
    selectedSupportRequest: request,
  })
  if (resolution.injectedSupportArtifactRefs.length !== 1
    || resolution.runtimeEvidence.canonicalTrackAllEvidenceRecord ===
      undefined) {
    throw new Error(
      'Structural Caption Track All fixture did not produce one closed record.',
    )
  }
  const rawRecord = resolution.runtimeEvidence
    .canonicalTrackAllEvidenceRecord
  const record = parseCaptionCanonicalTrackAllEvidenceRecordAny(rawRecord)
  if (record.supportRequestRef.id !== selectedRef.id
    || record.supportRequestRef.version !== selectedRef.version
    || record.supportRequestRef.contentHash !== selectedRef.contentHash
    || record.originalCallRef.id !== pair.call.callId
    || record.originalCallRef.version !== pair.call.schemaVersion
    || record.originalCallRef.contentHash !== pair.call.callDigestSha256) {
    throw new Error(
      'Structural Caption Track All record crossed call or request lineage.',
    )
  }
  await supportRepository.persistAuthenticatedOwnerProjectionCreateOnly({
    projection: record.authenticatedOwnerProjection,
  })
  const evidenceRepository =
    createCanonicalCaptionTrackAllEvidenceRepositoryV3({ objectPort })
  await evidenceRepository.persistCreateOnly({ record })
  const [projectionReread, evidenceReread] = await Promise.all([
    supportRepository.rereadAuthenticatedOwnerProjection({
      supportRequestRef: selectedRef,
    }),
    evidenceRepository.rereadBySupportRequestRef({
      supportRequestRef: selectedRef,
    }),
  ])
  if (!projectionReread
    || projectionReread.projectionDigestSha256 !==
      record.authenticatedOwnerProjection.projectionDigestSha256
    || !evidenceReread
    || evidenceReread.recordDigestSha256 !== record.recordDigestSha256) {
    throw new Error(
      'Structural Caption Track All evidence did not reconcile exactly.',
    )
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_TRACK_ALL_STRUCTURAL_SUPPORT_FIXTURE_VERSION,
    evidenceRecordRef: Object.freeze({
      id: record.recordId,
      version: record.schemaVersion,
      contentHash: record.recordDigestSha256,
    }),
    projectionRef: Object.freeze({
      id: projectionReread.projectionId,
      version: projectionReread.schemaVersion,
      contentHash: projectionReread.projectionDigestSha256,
    }),
    resumeOwnedByCanonicalCaptionExecution: true as const,
    structuralFixtureOnly: true as const,
    liveGpuOrModelExecutionPerformed: false as const,
    actualSam31ExecutionClaimedByThisFixture: false as const,
    privateQualificationEvidence: false as const,
    completeTimePrivateVisualReviewEvidence: false as const,
    finalQaEvidence: false as const,
    publicOrProductionAuthorityGranted: false as const,
  })
}
