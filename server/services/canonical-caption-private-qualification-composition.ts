import type {
  CanonicalCaptionPrivateQualificationCatalogAssembly,
} from '../../src/types/canonical-caption-private-qualification-catalog'
import type {
  CanonicalCaptionPrivateInternalQualificationService,
} from '../../src/types/canonical-caption-private-internal-qualification'
import type {
  CanonicalCaptionDirectVisualInspectionRepository,
} from '../../src/types/canonical-caption-direct-visual-inspection-evidence'
import type {
  CanonicalCaptionQualificationRunEvidenceAssembly,
} from '../../src/types/canonical-caption-qualification-run-evidence'
import type { ServiceContext } from '../types'
import type { CanonicalCaptionBrollEvidenceRepository } from
  './canonical-caption-broll-support-service'
import {
  createCanonicalCaptionDirectVisualInspectionRepository,
} from './canonical-caption-direct-visual-inspection-evidence-service'
import {
  createCanonicalCaptionPrivateQualificationCatalogAssembly,
  createCanonicalCaptionPrivateQualificationCatalogRepository,
  createCanonicalCaptionPrivateQualificationCatalogSource,
} from './canonical-caption-private-qualification-catalog-service'
import {
  createCanonicalCaptionPrivateInternalQualificationRepository,
  createCanonicalCaptionPrivateInternalQualificationService,
} from './canonical-caption-private-internal-qualification-service'
import {
  createCanonicalCaptionQualificationRunEvidenceAssembly,
  createCanonicalCaptionQualificationRunEvidenceReader,
  createCanonicalCaptionQualificationRunEvidenceRepository,
} from './canonical-caption-qualification-run-evidence-reader'
import type { CanonicalCaptionSoundSyncEvidenceRepository } from
  './canonical-caption-soundsync-support-service'
import type { CanonicalCaptionTrackAllEvidenceRepository } from
  './canonical-caption-track-all-support-service'
import type { CanonicalCaptionTranscriptEvidenceRepository } from
  './canonical-caption-transcript-support-service'
import type { CanonicalCaptionVisualIntelligenceEvidenceRepository } from
  './canonical-caption-visual-intelligence-support-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import type { CanonicalSpecialistSupportResumeRepository } from
  './canonical-specialist-support-resume-service'

export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_VERSION =
  'canonical-caption-private-qualification-composition-v1' as const

/**
 * Private qualification composition only. It reads existing canonical owners,
 * records exact approved Caption runs, aggregates several real runs, and emits
 * the private-internal release record. It owns no editing or provider runtime.
 */
export interface CanonicalCaptionPrivateQualificationComposition {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_VERSION
  readonly runEvidenceAssembly:
    CanonicalCaptionQualificationRunEvidenceAssembly
  readonly directVisualInspectionRepository:
    CanonicalCaptionDirectVisualInspectionRepository
  readonly catalogAssembly:
    CanonicalCaptionPrivateQualificationCatalogAssembly
  readonly qualificationService:
    CanonicalCaptionPrivateInternalQualificationService
  readonly multipleApprovedRunsRequired: true
  readonly oneAllFeatureEditFabricated: false
  readonly callerSuppliedEvidenceAccepted: false
  readonly browserLocalCompletionAccepted: false
  readonly centralOrchestraImplemented: false
  readonly directPeerDispatchPerformedByCaption: false
  readonly operationOrRuntimeAuthorityGrantedToCaption: false
  readonly providerOrModelAuthorityGrantedToCaption: false
  readonly assetMutationAuthorityGrantedToCaption: false
  readonly finalQaApprovalAuthorityGrantedToCaption: false
  readonly creditOrBillingAuthorityGrantedToCaption: false
  readonly publicDeliveryAuthorityGrantedToCaption: false
  readonly productionAuthorityGrantedToCaption: false
}

export function createCanonicalCaptionPrivateQualificationComposition(input: {
  readonly context: ServiceContext
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly supportResumeRepository:
    CanonicalSpecialistSupportResumeRepository
  readonly transcriptEvidenceRepository:
    CanonicalCaptionTranscriptEvidenceRepository
  readonly visualIntelligenceEvidenceRepository:
    CanonicalCaptionVisualIntelligenceEvidenceRepository
  readonly trackAllEvidenceRepository:
    CanonicalCaptionTrackAllEvidenceRepository
  readonly soundSyncEvidenceRepository:
    CanonicalCaptionSoundSyncEvidenceRepository
  readonly brollEvidenceRepository:
    CanonicalCaptionBrollEvidenceRepository
  readonly prefix?: string
}): CanonicalCaptionPrivateQualificationComposition {
  const prefix = input.prefix
    ?? 'private-internal/captions-specialist/v1/qualification-composition'
  const runEvidenceRepository =
    createCanonicalCaptionQualificationRunEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/runs`,
    })
  const directVisualInspectionRepository =
    createCanonicalCaptionDirectVisualInspectionRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/direct-visual-inspection`,
    })
  const runEvidenceAssembly =
    createCanonicalCaptionQualificationRunEvidenceAssembly({
      sourceReadPort: createCanonicalCaptionQualificationRunEvidenceReader({
        context: input.context,
        supportResumeRepository: input.supportResumeRepository,
        transcriptEvidenceRepository: input.transcriptEvidenceRepository,
        visualIntelligenceEvidenceRepository:
          input.visualIntelligenceEvidenceRepository,
        trackAllEvidenceRepository: input.trackAllEvidenceRepository,
        soundSyncEvidenceRepository: input.soundSyncEvidenceRepository,
        brollEvidenceRepository: input.brollEvidenceRepository,
        directVisualInspectionRepository,
      }),
      repository: runEvidenceRepository,
    })
  const catalogAssembly =
    createCanonicalCaptionPrivateQualificationCatalogAssembly({
      sourceReadPort: createCanonicalCaptionPrivateQualificationCatalogSource({
        runEvidenceRepository,
      }),
      repository: createCanonicalCaptionPrivateQualificationCatalogRepository({
        objectPort: input.objectPort,
        prefix: `${prefix}/catalogs`,
      }),
    })
  const qualificationService =
    createCanonicalCaptionPrivateInternalQualificationService({
      catalogReadPort: catalogAssembly.evidenceReadPort,
      repository:
        createCanonicalCaptionPrivateInternalQualificationRepository({
          objectPort: input.objectPort,
          prefix: `${prefix}/releases`,
        }),
    })
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_VERSION,
    runEvidenceAssembly,
    directVisualInspectionRepository,
    catalogAssembly,
    qualificationService,
    multipleApprovedRunsRequired: true,
    oneAllFeatureEditFabricated: false,
    callerSuppliedEvidenceAccepted: false,
    browserLocalCompletionAccepted: false,
    centralOrchestraImplemented: false,
    directPeerDispatchPerformedByCaption: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    providerOrModelAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  })
}
