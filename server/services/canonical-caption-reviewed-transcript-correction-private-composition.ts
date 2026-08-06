import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCaptionReviewedCorrectionOwnerService,
  createCanonicalCaptionReviewedCorrectionOwnerServiceV2,
  createCanonicalCaptionReviewedCorrectionRepository,
  type CanonicalCaptionReviewedCorrectionEvidenceReadPort,
  type CanonicalCaptionReviewedCorrectionOwnerService,
  type CanonicalCaptionReviewedCorrectionOwnerServiceV2,
  type CanonicalCaptionReviewedCorrectionRepository,
} from './canonical-caption-reviewed-transcript-correction'
import {
  createCanonicalCaptionTranscriptEvidenceRepository,
  type CanonicalCaptionApprovedSnapshotReadPort,
  type CanonicalCaptionTranscriptEvidenceRepository,
} from './canonical-caption-transcript-support-service'
import type {
  CanonicalSourceTranscriptOrchestraReadPort,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'

export const CANONICAL_CAPTION_REVIEWED_CORRECTION_PRIVATE_COMPOSITION_VERSION =
  'canonical-caption-reviewed-transcript-correction-private-composition-v1' as const

export interface CanonicalCaptionReviewedCorrectionPrivateComposition {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_REVIEWED_CORRECTION_PRIVATE_COMPOSITION_VERSION
  readonly transcriptRepository:
    CanonicalCaptionTranscriptEvidenceRepository
  readonly correctionRepository:
    CanonicalCaptionReviewedCorrectionRepository
  readonly ownerV1: CanonicalCaptionReviewedCorrectionOwnerService
  readonly ownerV2: CanonicalCaptionReviewedCorrectionOwnerServiceV2
  readonly approvedWorkMutationMounted: false
  readonly callerSuppliedTranscriptAccepted: false
  readonly directPeerDispatchMounted: false
  readonly providerOrRuntimeAuthorityGranted: false
  readonly timingOrAssetMutationAuthorityGranted: false
  readonly finalQaApprovalAuthorityGranted: false
  readonly billingAuthorityGranted: false
  readonly publicDeliveryAuthorityGranted: false
  readonly productionAuthorityGranted: false
}

/**
 * One private composition root for reviewed transcript correction. It reuses
 * the canonical transcript repository and source/approved-snapshot read ports;
 * it cannot mutate approved work or start transcription, review, or media
 * execution. Callers may invoke V2 only after the independent review artifacts
 * already exist behind the admitted evidence read port.
 */
export function createCanonicalCaptionReviewedCorrectionPrivateComposition(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly approvedSnapshotReadPort: CanonicalCaptionApprovedSnapshotReadPort
    readonly sourceTranscriptReadPort:
      CanonicalSourceTranscriptOrchestraReadPort
    readonly evidenceReadPort:
      CanonicalCaptionReviewedCorrectionEvidenceReadPort
    readonly prefix?: string
    readonly transcriptPrefix?: string
    readonly now?: () => Date
  },
): CanonicalCaptionReviewedCorrectionPrivateComposition {
  const prefix = input.prefix
    ?? 'private/orchestra/v1/caption-reviewed-transcript-correction'
  const transcriptRepository =
    createCanonicalCaptionTranscriptEvidenceRepository({
      objectPort: input.objectPort,
      prefix: input.transcriptPrefix,
    })
  const correctionRepository =
    createCanonicalCaptionReviewedCorrectionRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/owner`,
    })
  const ownerV1 = createCanonicalCaptionReviewedCorrectionOwnerService({
    approvedSnapshotReadPort: input.approvedSnapshotReadPort,
    evidenceReadPort: input.evidenceReadPort,
    transcriptRepository,
    correctionRepository,
    now: input.now,
  })
  const ownerV2 = createCanonicalCaptionReviewedCorrectionOwnerServiceV2({
    ownerService: ownerV1,
    approvedSnapshotReadPort: input.approvedSnapshotReadPort,
    sourceTranscriptReadPort: input.sourceTranscriptReadPort,
    transcriptRepository,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REVIEWED_CORRECTION_PRIVATE_COMPOSITION_VERSION,
    transcriptRepository,
    correctionRepository,
    ownerV1,
    ownerV2,
    approvedWorkMutationMounted: false,
    callerSuppliedTranscriptAccepted: false,
    directPeerDispatchMounted: false,
    providerOrRuntimeAuthorityGranted: false,
    timingOrAssetMutationAuthorityGranted: false,
    finalQaApprovalAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}
