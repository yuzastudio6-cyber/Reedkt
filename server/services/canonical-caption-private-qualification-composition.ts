import type {
  CanonicalCaptionPrivateQualificationCatalogAssembly,
} from '../../src/types/canonical-caption-private-qualification-catalog'
import type {
  CanonicalCaptionPrivateQualificationCampaignController,
} from '../../src/types/canonical-caption-private-qualification-campaign'
import type {
  CanonicalCaptionPrivateInternalQualificationService,
} from '../../src/types/canonical-caption-private-internal-qualification'
import type {
  CanonicalCaptionPrivateQualificationRunController,
} from '../../src/types/canonical-caption-private-qualification-run-controller'
import type {
  CanonicalCaptionDirectVisualInspectionRepository,
} from '../../src/types/canonical-caption-direct-visual-inspection-evidence'
import type {
  CanonicalCaptionQualificationRunEvidenceAssembly,
} from '../../src/types/canonical-caption-qualification-run-evidence'
import type {
  CanonicalCaptionRealSourceInspectionAuthorityReadPortV2,
  CanonicalCaptionRealSourceInspectionBundleRepository,
  CanonicalCaptionRealSourceInspectionProjectionServiceV2,
  CanonicalCaptionRealSourceInspectionProjectionServiceV3,
} from '../../src/types/canonical-caption-real-source-inspection-projection'
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
  createCanonicalCaptionPrivateQualificationRunController,
} from './canonical-caption-private-qualification-run-controller'
import {
  createCanonicalCaptionPrivateQualificationCampaignController,
} from './canonical-caption-private-qualification-campaign-service'
import {
  createCanonicalCaptionQualificationRunEvidenceAssembly,
  createCanonicalCaptionQualificationRunEvidenceReader,
  createCanonicalCaptionQualificationRunEvidenceRepository,
} from './canonical-caption-qualification-run-evidence-reader'
import {
  createCanonicalCaptionRealSourceInspectionBundleRepository,
  createCanonicalCaptionApprovedRunInspectionAuthorityReadPort,
  createCanonicalCaptionRealSourceInspectionProjectionServiceV2,
  createCanonicalCaptionRealSourceInspectionProjectionServiceV3,
} from './canonical-caption-real-source-inspection-projection-service'
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
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V2_VERSION =
  'canonical-caption-private-qualification-composition-v2' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V3_VERSION =
  'canonical-caption-private-qualification-composition-v3' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V4_VERSION =
  'canonical-caption-private-qualification-composition-v4' as const
export const CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V5_VERSION =
  'canonical-caption-private-qualification-composition-v5' as const

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

export interface CanonicalCaptionPrivateQualificationCompositionV2
  extends Omit<CanonicalCaptionPrivateQualificationComposition,
  'schemaVersion'> {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V2_VERSION
  readonly realSourceInspectionBundleRepository:
    CanonicalCaptionRealSourceInspectionBundleRepository
  readonly realSourceInspectionProjectionService:
    CanonicalCaptionRealSourceInspectionProjectionServiceV2
  readonly tenantScopedInspectionEvidenceRequired: true
  readonly historicalInspectionReceiptAutoPromoted: false
}

export interface CanonicalCaptionPrivateQualificationCompositionV3
  extends Omit<CanonicalCaptionPrivateQualificationCompositionV2,
  'schemaVersion' | 'realSourceInspectionProjectionService'> {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V3_VERSION
  readonly realSourceInspectionProjectionService:
    CanonicalCaptionRealSourceInspectionProjectionServiceV3
  readonly canonicalApprovedRunAuthorityAdapterMounted: true
  readonly exactOriginalSourceBindingRequired: true
}

export interface CanonicalCaptionPrivateQualificationCompositionV4
  extends Omit<CanonicalCaptionPrivateQualificationCompositionV3,
  'schemaVersion'> {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V4_VERSION
  readonly approvedRunController:
    CanonicalCaptionPrivateQualificationRunController
  readonly inspectionToRunEvidenceMounted: true
}

export interface CanonicalCaptionPrivateQualificationCompositionV5
  extends Omit<CanonicalCaptionPrivateQualificationCompositionV4,
  'schemaVersion'> {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V5_VERSION
  readonly campaignController:
    CanonicalCaptionPrivateQualificationCampaignController
  readonly multiRunCampaignToTerminalProjectionMounted: true
}

export interface CanonicalCaptionPrivateQualificationCompositionInput {
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
}

export function createCanonicalCaptionPrivateQualificationComposition(
  input: CanonicalCaptionPrivateQualificationCompositionInput,
): CanonicalCaptionPrivateQualificationComposition {
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

export function createCanonicalCaptionPrivateQualificationCompositionV2(
  input: CanonicalCaptionPrivateQualificationCompositionInput & {
    readonly realSourceInspectionAuthorityReadPort:
      CanonicalCaptionRealSourceInspectionAuthorityReadPortV2
  },
): CanonicalCaptionPrivateQualificationCompositionV2 {
  const prefix = input.prefix
    ?? 'private-internal/captions-specialist/v1/qualification-composition'
  const base = createCanonicalCaptionPrivateQualificationComposition(input)
  const realSourceInspectionBundleRepository =
    createCanonicalCaptionRealSourceInspectionBundleRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/real-source-inspection-bundles`,
    })
  const realSourceInspectionProjectionService =
    createCanonicalCaptionRealSourceInspectionProjectionServiceV2({
      bundleReadPort: realSourceInspectionBundleRepository,
      authorityReadPort: input.realSourceInspectionAuthorityReadPort,
      evidenceRepository: base.directVisualInspectionRepository,
    })
  return Object.freeze({
    ...base,
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V2_VERSION,
    realSourceInspectionBundleRepository,
    realSourceInspectionProjectionService,
    tenantScopedInspectionEvidenceRequired: true,
    historicalInspectionReceiptAutoPromoted: false,
  })
}

export function createCanonicalCaptionPrivateQualificationCompositionV3(
  input: CanonicalCaptionPrivateQualificationCompositionInput,
): CanonicalCaptionPrivateQualificationCompositionV3 {
  const prefix = input.prefix
    ?? 'private-internal/captions-specialist/v1/qualification-composition'
  const base = createCanonicalCaptionPrivateQualificationComposition(input)
  const realSourceInspectionBundleRepository =
    createCanonicalCaptionRealSourceInspectionBundleRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/real-source-inspection-bundles`,
    })
  const realSourceInspectionProjectionService =
    createCanonicalCaptionRealSourceInspectionProjectionServiceV3({
      bundleReadPort: realSourceInspectionBundleRepository,
      authorityReadPort:
        createCanonicalCaptionApprovedRunInspectionAuthorityReadPort(
          input.context),
      evidenceRepository: base.directVisualInspectionRepository,
    })
  return Object.freeze({
    ...base,
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V3_VERSION,
    realSourceInspectionBundleRepository,
    realSourceInspectionProjectionService,
    tenantScopedInspectionEvidenceRequired: true,
    historicalInspectionReceiptAutoPromoted: false,
    canonicalApprovedRunAuthorityAdapterMounted: true,
    exactOriginalSourceBindingRequired: true,
  })
}

export function createCanonicalCaptionPrivateQualificationCompositionV4(
  input: CanonicalCaptionPrivateQualificationCompositionInput,
): CanonicalCaptionPrivateQualificationCompositionV4 {
  const base = createCanonicalCaptionPrivateQualificationCompositionV3(input)
  return Object.freeze({
    ...base,
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V4_VERSION,
    approvedRunController:
      createCanonicalCaptionPrivateQualificationRunController({
        inspectionBundleRepository:
          base.realSourceInspectionBundleRepository,
        inspectionProjectionService:
          base.realSourceInspectionProjectionService,
        runEvidenceAssembly: base.runEvidenceAssembly,
      }),
    inspectionToRunEvidenceMounted: true,
  })
}

export function createCanonicalCaptionPrivateQualificationCompositionV5(
  input: CanonicalCaptionPrivateQualificationCompositionInput,
): CanonicalCaptionPrivateQualificationCompositionV5 {
  const base = createCanonicalCaptionPrivateQualificationCompositionV4(input)
  return Object.freeze({
    ...base,
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_COMPOSITION_V5_VERSION,
    campaignController:
      createCanonicalCaptionPrivateQualificationCampaignController({
        approvedRunController: base.approvedRunController,
        qualificationService: base.qualificationService,
      }),
    multiRunCampaignToTerminalProjectionMounted: true,
  })
}
