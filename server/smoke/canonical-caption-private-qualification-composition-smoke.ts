import assert from 'node:assert/strict'

import type { ServiceContext } from '../types'
import type { CanonicalCaptionBrollEvidenceRepository } from
  '../services/canonical-caption-broll-support-service'
import {
  createCanonicalCaptionPrivateQualificationComposition,
} from '../services/canonical-caption-private-qualification-composition'
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

console.log(JSON.stringify({
  smoke: 'canonical_caption_private_qualification_composition',
  status: 'passed',
  checks,
  sourceOnly: true,
  actualPrivateEvidenceRead: false,
  multipleApprovedRunsRequired: true,
  oneAllFeatureEditFabricated: false,
  centralOrchestraImplemented: false,
  runtimeAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
