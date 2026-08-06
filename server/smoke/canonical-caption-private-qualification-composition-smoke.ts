import assert from 'node:assert/strict'

import type { ServiceContext } from '../types'
import type { CanonicalCaptionBrollEvidenceRepository } from
  '../services/canonical-caption-broll-support-service'
import {
  createCanonicalCaptionPrivateQualificationComposition,
  createCanonicalCaptionPrivateQualificationCompositionV2,
  createCanonicalCaptionPrivateQualificationCompositionV3,
  createCanonicalCaptionPrivateQualificationCompositionV4,
  createCanonicalCaptionPrivateQualificationCompositionV5,
} from '../services/canonical-caption-private-qualification-composition'
import {
  createCanonicalCaptionRealSourceInspectionAuthorityReadPortV2,
} from '../services/canonical-caption-real-source-inspection-projection-service'
import type { CanonicalCaptionSoundSyncEvidenceRepository } from
  '../services/canonical-caption-soundsync-support-service'
import type { CanonicalCaptionTrackAllEvidenceRepository } from
  '../services/canonical-caption-track-all-support-service'
import type { CanonicalCaptionTranscriptEvidenceRepository } from
  '../services/canonical-caption-transcript-support-service'
import type { CanonicalCaptionVisualIntelligenceEvidenceRepository } from
  '../services/canonical-caption-visual-intelligence-support-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import type { CanonicalSpecialistSupportResumeRepository } from
  '../services/canonical-specialist-support-resume-service'

let checks = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  checks += 1
}

function objectPort(): CanonicalCreateOnlyJsonObjectPort {
  const objects = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      const prior = objects.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only conflict')
        return 'already_exists'
      }
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = objects.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

const supportResumeRepository = {
  async rereadCallResultPair() { return null },
  async rereadAuthenticatedOwnerProjection() { return null },
  async rereadResumeRecordByResumedCall() { return null },
} as unknown as CanonicalSpecialistSupportResumeRepository
const transcriptEvidenceRepository = {
  async findExactForExecution() { return null },
} as unknown as CanonicalCaptionTranscriptEvidenceRepository
const visualIntelligenceEvidenceRepository = {
  async rereadBySupportRequestRef() { return null },
} as unknown as CanonicalCaptionVisualIntelligenceEvidenceRepository
const trackAllEvidenceRepository = {
  async rereadBySupportRequestRef() { return null },
} as unknown as CanonicalCaptionTrackAllEvidenceRepository
const soundSyncEvidenceRepository = {
  async rereadEvidenceRecord() { return null },
} as unknown as CanonicalCaptionSoundSyncEvidenceRepository
const brollEvidenceRepository = {
  async rereadEvidenceRecord() { return null },
} as unknown as CanonicalCaptionBrollEvidenceRepository
const context = {
  env: { localStorageRoot: '/private-fixture-never-read' },
} as unknown as ServiceContext

const composition = createCanonicalCaptionPrivateQualificationComposition({
  context,
  objectPort: objectPort(),
  supportResumeRepository,
  transcriptEvidenceRepository,
  visualIntelligenceEvidenceRepository,
  trackAllEvidenceRepository,
  soundSyncEvidenceRepository,
  brollEvidenceRepository,
  prefix: 'private-internal/caption-qualification-composition-smoke',
})
const realSourceInspectionAuthorityReadPort =
  createCanonicalCaptionRealSourceInspectionAuthorityReadPortV2(
    async () => null)
const compositionV2 =
  createCanonicalCaptionPrivateQualificationCompositionV2({
    context,
    objectPort: objectPort(),
    supportResumeRepository,
    transcriptEvidenceRepository,
    visualIntelligenceEvidenceRepository,
    trackAllEvidenceRepository,
    soundSyncEvidenceRepository,
    brollEvidenceRepository,
    realSourceInspectionAuthorityReadPort,
    prefix: 'private-internal/caption-qualification-composition-v2-smoke',
  })
const compositionV3 =
  createCanonicalCaptionPrivateQualificationCompositionV3({
    context,
    objectPort: objectPort(),
    supportResumeRepository,
    transcriptEvidenceRepository,
    visualIntelligenceEvidenceRepository,
    trackAllEvidenceRepository,
    soundSyncEvidenceRepository,
    brollEvidenceRepository,
    prefix: 'private-internal/caption-qualification-composition-v3-smoke',
  })
const compositionV4 =
  createCanonicalCaptionPrivateQualificationCompositionV4({
    context,
    objectPort: objectPort(),
    supportResumeRepository,
    transcriptEvidenceRepository,
    visualIntelligenceEvidenceRepository,
    trackAllEvidenceRepository,
    soundSyncEvidenceRepository,
    brollEvidenceRepository,
    prefix: 'private-internal/caption-qualification-composition-v4-smoke',
  })
const compositionV5 =
  createCanonicalCaptionPrivateQualificationCompositionV5({
    context,
    objectPort: objectPort(),
    supportResumeRepository,
    transcriptEvidenceRepository,
    visualIntelligenceEvidenceRepository,
    trackAllEvidenceRepository,
    soundSyncEvidenceRepository,
    brollEvidenceRepository,
    prefix: 'private-internal/caption-qualification-composition-v5-smoke',
  })

check(composition.schemaVersion ===
  'canonical-caption-private-qualification-composition-v1',
'The private qualification composition must expose one versioned root.')
check(composition.runEvidenceAssembly.schemaVersion ===
  'canonical-caption-qualification-run-evidence-assembly-v2',
'The composition must mount exact approved-run evidence assembly.')
check(composition.directVisualInspectionRepository.schemaVersion ===
  'canonical-caption-direct-visual-inspection-repository-v1',
'The composition must mount its create-only direct visual-inspection store.')
check(composition.catalogAssembly.schemaVersion ===
  'canonical-caption-private-qualification-catalog-assembly-v1',
'The composition must mount the multi-run 41-job catalog assembly.')
check(composition.qualificationService.schemaVersion ===
  'canonical-caption-private-internal-qualification-service-v1',
'The composition must mount the final private qualification service.')
check(composition.multipleApprovedRunsRequired
  && !composition.oneAllFeatureEditFabricated
  && !composition.callerSuppliedEvidenceAccepted
  && !composition.browserLocalCompletionAccepted,
'The composition must require several canonical runs without caller evidence.')
check(!composition.centralOrchestraImplemented
  && !composition.directPeerDispatchPerformedByCaption
  && !composition.operationOrRuntimeAuthorityGrantedToCaption
  && !composition.providerOrModelAuthorityGrantedToCaption,
'The qualification composition must not become an Orchestra or runtime owner.')
check(!composition.assetMutationAuthorityGrantedToCaption
  && !composition.finalQaApprovalAuthorityGrantedToCaption
  && !composition.creditOrBillingAuthorityGrantedToCaption
  && !composition.publicDeliveryAuthorityGrantedToCaption
  && !composition.productionAuthorityGrantedToCaption,
'The composition must preserve every external authority boundary.')
check(compositionV2.schemaVersion ===
  'canonical-caption-private-qualification-composition-v2',
'The V2 composition must preserve V1 and add the scoped inspection mount.')
check(compositionV2.realSourceInspectionBundleRepository.schemaVersion ===
  'canonical-caption-real-source-inspection-bundle-read-port-v2'
  && compositionV2.realSourceInspectionBundleRepository.repositoryVersion ===
    'canonical-caption-real-source-inspection-bundle-repository-v1',
'The V2 composition must mount one tenant-scoped create-only receipt store.')
check(compositionV2.realSourceInspectionProjectionService.schemaVersion ===
  'canonical-caption-real-source-inspection-projection-service-v2'
  && compositionV2.tenantScopedInspectionEvidenceRequired
  && !compositionV2.historicalInspectionReceiptAutoPromoted,
'The V2 composition must project only fresh, tenant-scoped approved evidence.')
check(compositionV3.schemaVersion ===
  'canonical-caption-private-qualification-composition-v3'
  && compositionV3.realSourceInspectionProjectionService.schemaVersion ===
    'canonical-caption-real-source-inspection-projection-service-v3',
'The V3 composition must mount the canonical approved-run projection lane.')
check(compositionV3.canonicalApprovedRunAuthorityAdapterMounted
  && compositionV3.exactOriginalSourceBindingRequired
  && compositionV3.realSourceInspectionProjectionService
    .exactOriginalSourceBindingRequired
  && !compositionV3.historicalInspectionReceiptAutoPromoted,
'The active composition must bind one exact approved source without promotion.')
check(compositionV4.schemaVersion ===
  'canonical-caption-private-qualification-composition-v4'
  && compositionV4.approvedRunController.schemaVersion ===
    'canonical-caption-private-qualification-run-controller-v1'
  && compositionV4.inspectionToRunEvidenceMounted,
'The V4 composition must mount inspection-to-run evidence reconciliation.')
check(compositionV4.approvedRunController
  .closedCaptionDirectInspectionReceiptRequired
  && compositionV4.approvedRunController.exactApprovedRunRereadRequired
  && !compositionV4.approvedRunController.incompleteRunPromotionAllowed,
'The run controller must wait rather than promote incomplete evidence.')
check(compositionV5.schemaVersion ===
  'canonical-caption-private-qualification-composition-v5'
  && compositionV5.campaignController.schemaVersion ===
    'canonical-caption-private-qualification-campaign-controller-v1'
  && compositionV5.multiRunCampaignToTerminalProjectionMounted,
'The V5 composition must mount the bounded multi-run qualification campaign.')
check(compositionV5.campaignController.exactCatalogRunSetRequired
  && compositionV5.campaignController.multipleApprovedSnapshotsRequired
  && !compositionV5.campaignController.oneAllFeatureEditAllowed
  && !compositionV5.campaignController.incompleteRunOrCatalogPromotionAllowed
  && compositionV5.campaignController.privateInternalQualificationHarnessOnly,
'The campaign must remain a bounded internal harness and fail closed.')

assert.throws(() => createCanonicalCaptionPrivateQualificationComposition({
  context,
  objectPort: objectPort(),
  supportResumeRepository: {} as CanonicalSpecialistSupportResumeRepository,
  transcriptEvidenceRepository,
  visualIntelligenceEvidenceRepository,
  trackAllEvidenceRepository,
  soundSyncEvidenceRepository,
  brollEvidenceRepository,
}))
checks += 1

assert.throws(() => createCanonicalCaptionPrivateQualificationCompositionV2({
  context,
  objectPort: objectPort(),
  supportResumeRepository,
  transcriptEvidenceRepository,
  visualIntelligenceEvidenceRepository,
  trackAllEvidenceRepository,
  soundSyncEvidenceRepository,
  brollEvidenceRepository,
  realSourceInspectionAuthorityReadPort: {
    schemaVersion:
      'canonical-caption-real-source-inspection-authority-read-port-v2',
    sourceAuthority: 'canonical_backend_approved_caption_run_authority',
    callerSuppliedAuthorityAccepted: false,
    async readExact() { return null },
  },
}))
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical_caption_private_qualification_composition',
  status: 'passed',
  checks,
  sourceOnly: true,
  actualPrivateEvidenceRead: false,
  tenantScopedRealSourceInspectionProjectionMounted: true,
  canonicalApprovedRunAuthorityAdapterMounted: true,
  inspectionToRunEvidenceMounted: true,
  exactOriginalSourceBindingRequired: true,
  historicalInspectionReceiptAutoPromoted: false,
  multipleApprovedRunsRequired: true,
  oneAllFeatureEditFabricated: false,
  centralOrchestraImplemented: false,
  runtimeAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
