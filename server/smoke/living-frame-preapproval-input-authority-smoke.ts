import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  bindLivingFrameCanonicalPlanning,
} from '../../src/lib/living-frame'
import {
  createLivingFrameSemanticSceneProposalJsonSchema,
  createLivingFrameSemanticReasoningRequest,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-contract'
import {
  createLivingFrameSemanticReasoningRequestFixtureDrafts,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-fixtures'
import {
  createProfessionalSkillPlan,
} from '../../src/lib/professional-skills'
import {
  buildProfessionalExportCreditCoverage,
} from '../../src/lib/professional-export-policy'
import {
  calculatePrivateGcpVisualCoverageDigest,
  createPrivateGcpVisualUnderstandingPlan,
  finalizePrivateGcpVisualEvidencePackage,
} from '../../src/lib/private-gcp-visual-understanding-contract'
import type {
  PrivateGcpVisualCoverageManifest,
  PrivateGcpVisualEvidencePackage,
  PrivateGcpVisualObservation,
  PrivateGcpVisualServerReadinessEvidence,
  PrivateGcpVisualUnderstandingPlan,
} from '../../src/types/private-gcp-visual-understanding'
import type { PlannerInput } from '../../src/types/reeditpro'
import type {
  LivingFramePreapprovalInputAuthority,
} from '../../src/types/living-frame-preapproval-input-authority'
import type { ServiceContext } from '../types'
import {
  createCanonicalLivingFrameProviderNeutralPayload,
  verifyCanonicalLivingFrameProviderNeutralPayload,
  verifyCanonicalLivingFrameSemanticReasoningAdmission,
} from '../living-frame/canonical-living-frame-semantic-reasoning-admission'
import {
  CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_BOUNDARY,
  verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation,
} from '../living-frame/canonical-living-frame-preapproval-reasoning-attempt-reservation'
import {
  CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_REQUEST_MATERIAL_BOUNDARY,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_SYSTEM_INSTRUCTION,
  compileCanonicalLivingFramePreapprovalKimiRequestMaterial,
  verifyCanonicalLivingFramePreapprovalKimiRequestMaterial,
} from '../living-frame/canonical-living-frame-preapproval-kimi-request-material'
import {
  verifyCanonicalLivingFramePreapprovalReasoningRun,
} from '../living-frame/canonical-living-frame-preapproval-reasoning-lifecycle'
import {
  PrivateCanonicalLivingFramePreapprovalReasoningAttemptRepository,
} from '../living-frame/private-canonical-living-frame-preapproval-reasoning-attempt-repository'
import {
  PrivateCanonicalLivingFramePreapprovalReasoningRepository,
} from '../living-frame/private-canonical-living-frame-preapproval-reasoning-repository'
import {
  createCanonicalPreapprovalModelDataRequestClassification,
  createCanonicalPreapprovalModelRouteDataAssurance,
  createCanonicalPreapprovalPolicyEvidence,
  createCanonicalPreapprovalProjectModelDataPolicy,
  createCanonicalPreapprovalRouteDataAssuranceBinding,
} from '../model-data-assurance/canonical-preapproval-route-data-assurance-contract'
import {
  PrivateCanonicalPreapprovalRouteDataAssuranceRepository,
} from '../model-data-assurance/private-canonical-preapproval-route-data-assurance-repository'
import {
  createReasoningModelAttemptCostEvidenceV2,
  createPrePlanEditReferenceStudyChatReasoningAuthority,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
  validatePrePlanEditReferenceStudyChatReasoningAuthority,
} from '../reasoning-model-cost'
import {
  createCanonicalSourceSpeechEvidencePackage,
} from '../source-speech-evidence/canonical-source-speech-evidence-contract'
import {
  PrivateCanonicalSourceSpeechEvidenceRepository,
} from '../source-speech-evidence/private-canonical-source-speech-evidence-repository'
import {
  canonicalLivingFramePreapprovalInputAuthoritySchema,
  canonicalLivingFramePreapprovalInputReaderResultSchema,
  canonicalLivingFramePreapprovalInputRequestSchema,
  canonicalSharedPreapprovalAuthorityEnvelopeSchema,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_RESULT_VERSION,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_REQUEST_VERSION,
  CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
  type CanonicalLivingFramePreapprovalInputReaderResult,
} from '../validation/canonical-living-frame-preapproval-input-authority-schemas'
import {
  canonicalPlanComponentsSchema,
  type CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  canonicalPlanningHandoffResponseSchema,
  type CanonicalPlanningHandoffResponse,
} from '../validation/canonical-planning-handoff-schemas'
import {
  CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION,
  PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION,
  type CanonicalLivingFramePlanningEvidenceReaderPort,
  type PrivateLivingFramePlanningEvidenceReaderResult,
} from '../services/canonical-living-frame-planning-evidence-service'
import {
  bindCanonicalLivingFramePreapprovalInputAuthority,
  LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_BOUNDARY,
  type CanonicalLivingFramePreapprovalInputReaderPort,
} from '../services/canonical-living-frame-preapproval-input-authority-service'
import {
  bindCanonicalLivingFrameSemanticReasoningAdmission,
  canonicalLivingFrameSemanticAdmissionRequestSchema,
  CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_REQUEST_VERSION,
} from '../services/canonical-living-frame-semantic-reasoning-admission-service'
import {
  canonicalLivingFramePreapprovalReasoningAttemptReserveRequestSchema,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVE_REQUEST_VERSION,
  reserveCanonicalLivingFramePreapprovalReasoningAttempt,
} from '../services/canonical-living-frame-preapproval-reasoning-attempt-service'
import {
  canonicalLivingFramePreapprovalReasoningPrepareRequestSchema,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_PREPARE_REQUEST_VERSION,
  prepareCanonicalLivingFramePreapprovalReasoningRun,
} from '../services/canonical-living-frame-preapproval-reasoning-lifecycle-service'
import {
  canonicalPlanningHandoffId,
} from '../services/private-canonical-planning-handoff-store'
import {
  planningInputAuthorityExpectationFromResolvedBinding,
} from '../services/planning-input-authority-binding-service'
import {
  PLANNING_PREFERENCE_INSTRUCTION_PRIORITY,
} from '../services/planning-preference-application-authority-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  resolvedPlanningInputAuthorityBindingSchema,
} from '../validation/planning-input-authority-binding-schemas'

const WORKSPACE_ID = 'workspace-living-frame-preapproval-smoke'
const PROJECT_ID = 'project-living-frame-preapproval-smoke'
const EDIT_SESSION_ID = 'edit-living-frame-preapproval-smoke'
const SOURCE_SEQUENCE_ITEM_ID = 'source-living-frame-preapproval-1'
const MEDIA_ASSET_ID = 'media-living-frame-preapproval-1'
const SOURCE_CHECKSUM = digest('living-frame-preapproval-source-bytes')
const LOCATOR_ID = 'private-living-frame-preapproval-evidence-locator'
const USER_ID = 'user-living-frame-preapproval-smoke'

const plannerInput: PlannerInput = {
  projectName: 'Living Frame preapproval input authority smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  frameTemplateType: 'horizontal_wide_frame',
  editingCategory: 'education_explainer',
  workflowType: 'education_explainer',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'premium',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions:
    'Use Living Frame storytelling for the central explanation.',
  creditPreference: 'balanced',
  clips: [{
    id: SOURCE_SEQUENCE_ITEM_ID,
    uploadedOrder: 1,
    fileName: 'controlled-preapproval-source.mp4',
    duration: '0:10',
    detectedType: 'talking_head',
    sourceOrderLocked: true,
  }],
}

const professionalSkillPlan = createProfessionalSkillPlan({ plannerInput })
const componentsWithoutLivingFrame = createCanonicalComponents()
const livingFrameBinding = await bindLivingFrameCanonicalPlanning({
  professionalSkillPlan,
  components: componentsWithoutLivingFrame,
})
assert.ok(livingFrameBinding.livingFrame)
const components = canonicalPlanComponentsSchema.parse({
  ...componentsWithoutLivingFrame,
  livingFrame: livingFrameBinding.livingFrame,
})
const handoff = createCanonicalHandoff(components)
const visualFixture = createVisualEvidenceFixture()
const visualReader = createVisualEvidenceReader(
  createVisualEvidenceReaderResult(visualFixture),
)
const readerResult = createInputReaderResult({ handoff, components })
let inputReadCount = 0
const inputReader = createInputReader(() => {
  inputReadCount += 1
  return readerResult
})
const context = {
  env: {} as ServiceContext['env'],
  clients: { admin: null, public: null },
  requestId: 'living-frame-preapproval-input-smoke',
  auth: {
    userId: USER_ID,
    isMockUser: true,
  },
} satisfies ServiceContext
const request = {
  schemaVersion:
    CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_REQUEST_VERSION,
  purpose: 'bind_living_frame_preapproval_input_authority' as const,
  workspaceId: WORKSPACE_ID,
  projectId: PROJECT_ID,
  editSessionId: EDIT_SESSION_ID,
  handoffId: handoff.handoffId,
  planningEvidenceLocator: {
    schemaVersion:
      'canonical-living-frame-planning-evidence-locator-v1' as const,
    serverOwnedLocatorId: LOCATOR_ID,
  },
}

const authority = await bindCanonicalLivingFramePreapprovalInputAuthority({
  context,
  request,
  inputReader,
  planningEvidenceReader: visualReader,
})

assert.equal(inputReadCount, 2)
assert.equal(authority.authorityClass, 'living_frame_preapproval_input')
assert.equal(authority.workflowContext.kind, 'ordinary_edit_video')
assert.equal(authority.workflowContext.motionProductionContext, null)
assert.equal(authority.identity.handoffId, handoff.handoffId)
assert.equal(authority.lineage.handoffHashSha256, handoff.handoffHash)
assert.equal(
  authority.lineage.canonicalPlanComponentsHashSha256,
  handoff.canonicalPlanComponentsHash,
)
assert.equal(
  authority.lineage.livingFrameComponentDigestSha256,
  livingFrameBinding.livingFrame.contractDigestSha256,
)
assert.equal(authority.evidence.sourceMode, 'uploaded_media')
assert.equal(authority.evidence.sourceEvidenceCount, 1)
assert.equal(authority.evidence.evidenceReReadByServer, true)
assert.equal(authority.evidence.selectedSceneAuthority, false)
assert.deepEqual(authority.reasoning.orderedRouteIds, [
  'kimi_k3_primary',
  'qwen_3_7_fallback',
  'deepseek_v4_pro_fallback',
])
assert.equal(authority.reasoning.providerTransportAuthorized, false)
assert.equal(authority.reasoning.providerCallMade, false)
assert.equal(authority.reasoning.oldKimiToGptFallbackAllowed, false)
assert.equal(authority.reasoning.qwen25VlReasoningRouteAllowed, false)
assert.equal(authority.reasoning.mediaProviderOperationAllowed, false)
assert.equal(
  authority.internalCost.rateCardVersion,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
)
assert.equal(
  authority.internalCost.maximumAuthorizedInternalCostMicros,
  '5000000',
)
assert.equal(authority.internalCost.actualAttemptReceiptProvided, false)
assert.equal(authority.internalCost.actualAttemptCostKnown, false)
assert.equal(authority.internalCost.futureDurableAttemptEvidenceRequired, true)
assert.deepEqual(
  authority.authorityBoundary,
  LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_BOUNDARY,
)
assert.equal(
  authority.authorityDigestSha256,
  authorityDigest(authority),
)
assert.equal(
  canonicalLivingFramePreapprovalInputAuthoritySchema.safeParse(authority)
    .success,
  true,
)

const serializedAuthority = JSON.stringify(authority)
for (const forbiddenKey of [
  'rawChat',
  'rawTranscript',
  'sourceFileName',
  'signedUrl',
  'credential',
  'apiKey',
  'providerAttemptId',
  'reasoningRunId',
  'jobId',
  'queueId',
  'workItem',
  'toolId',
  'toolRoute',
  'approvedAt',
  'snapshotId',
  'creditReservationId',
  'walletId',
  'customerPrice',
  'serviceFeeAmount',
]) {
  assert.equal(
    serializedAuthority.includes(`"${forbiddenKey}"`),
    false,
    `Living Frame preapproval authority must not expose ${forbiddenKey}.`,
  )
}

for (const injectedField of [
  'providerRoute',
  'providerModel',
  'providerOperationId',
  'qwen25VlOperationId',
  'gptFallbackRoute',
  'allGreen',
  'approved',
  'providerAttemptReceipt',
  'customerCredits',
  'serviceFee',
  'toolId',
  'queueId',
  'rawTranscript',
]) {
  assert.equal(
    canonicalLivingFramePreapprovalInputRequestSchema.safeParse({
      ...request,
      [injectedField]: true,
    }).success,
    false,
    `Caller input must not admit ${injectedField}.`,
  )
}

await assert.rejects(
  bindCanonicalLivingFramePreapprovalInputAuthority({
    context,
    request,
    inputReader: null,
    planningEvidenceReader: visualReader,
  }),
  /server-injected current planning-input reader/,
)
await assert.rejects(
  bindCanonicalLivingFramePreapprovalInputAuthority({
    context,
    request,
    inputReader: {
      schemaVersion:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION,
      sourceAuthority:
        'canonical_private_current_planning_handoff_reader',
      evidenceClass:
        'controlled_private_current_handoff_and_components_reader',
      productionReady: false,
      allGreen: true,
    } as never,
    planningEvidenceReader: visualReader,
  }),
  /server-injected current planning-input reader/,
)
await assert.rejects(
  bindCanonicalLivingFramePreapprovalInputAuthority({
    context,
    request,
    inputReader: createInputReader(() => ({
      ...readerResult,
      identity: {
        ...readerResult.identity,
        workspaceId: 'workspace-wrong-preapproval',
      },
    })),
    planningEvidenceReader: visualReader,
  }),
  /another scope or handoff/,
)
await assert.rejects(
  bindCanonicalLivingFramePreapprovalInputAuthority({
    context,
    request,
    inputReader: createInputReader(() => ({
      ...readerResult,
      handoff: {
        ...readerResult.handoff,
        handoffHash: digest('forged-handoff-hash'),
      },
    })),
    planningEvidenceReader: visualReader,
  }),
  /handoff or component lineage failed integrity verification/,
)
await assert.rejects(
  bindCanonicalLivingFramePreapprovalInputAuthority({
    context,
    request,
    inputReader: createInputReader(() => ({
      ...readerResult,
      publicationStatus: 'published',
    })),
    planningEvidenceReader: visualReader,
  }),
  /reader result is invalid/,
)
await assert.rejects(
  bindCanonicalLivingFramePreapprovalInputAuthority({
    context,
    request,
    inputReader: createInputReader(() => ({
      ...readerResult,
      internalCostExpectation: {
        ...readerResult.internalCostExpectation,
        rateCardVersion: 'obsolete-reasoning-rate-card',
      },
    })),
    planningEvidenceReader: visualReader,
  }),
  /does not match the current reasoning rate-card identity/,
)

let racingReadCount = 0
await assert.rejects(
  bindCanonicalLivingFramePreapprovalInputAuthority({
    context,
    request,
    inputReader: createInputReader(() => {
      racingReadCount += 1
      if (racingReadCount === 1) return readerResult
      return {
        ...readerResult,
        internalCostExpectation: {
          ...readerResult.internalCostExpectation,
          budgetExpectationId:
            'living-frame-preapproval-budget-expectation-raced',
        },
      }
    }),
    planningEvidenceReader: visualReader,
  }),
  /changed while evidence was being re-read/,
)

assert.equal(
  canonicalLivingFramePreapprovalInputAuthoritySchema.safeParse({
    ...authority,
    authorityDigestSha256: digest('forged-authority'),
    authorityBoundary: Object.fromEntries(
      Object.keys(authority.authorityBoundary).map((key) => [key, true]),
    ),
    productionReady: true,
  }).success,
  false,
)
assert.equal(
  canonicalLivingFramePreapprovalInputAuthoritySchema.safeParse({
    ...authority,
    authorityDigestSha256: digest('forged-authority-digest-only'),
  }).success,
  false,
  'A structurally valid authority with a forged digest must fail closed.',
)
assert.notEqual(
  authority.authorityDigestSha256,
  authorityDigest({
    ...authority,
    reasoning: {
      ...authority.reasoning,
      orderedRouteIds: [
        'qwen_3_7_fallback',
        'kimi_k3_primary',
        'deepseek_v4_pro_fallback',
      ],
    },
  } as never),
)
assert.equal(
  canonicalLivingFramePreapprovalInputAuthoritySchema.safeParse({
    ...authority,
    workflowContext: {
      kind: 'motion_storytelling_optional_context',
      motionProductionContext: {
        productionId: 'foreign-motion-production',
        authorityHashSha256: digest('foreign-motion-authority'),
        sourceProposalDigestSha256: digest('foreign-motion-source-proposal'),
        sourceArtifactApprovalSnapshotId: 'foreign-motion-snapshot',
      },
    },
  }).success,
  false,
  'Motion context cannot be mixed into ordinary uploaded-source authority.',
)

const editReferenceAuthorityResult =
  createPrePlanEditReferenceStudyChatReasoningAuthority({
    workspaceId: WORKSPACE_ID,
    actorUserId: USER_ID,
    editReferenceId: 'reference-living-frame-cross-lane-smoke',
    studySessionId: 'study-living-frame-cross-lane-smoke',
    studyRevision: 1,
    reasoningRequestDigestSha256:
      digest('edit-reference-reasoning-request'),
    approvedUsageEstimateId:
      'edit-reference-usage-estimate-cross-lane-smoke',
    internalCostBudgetId:
      'edit-reference-internal-budget-cross-lane-smoke',
    immutableRateCardSnapshotId:
      'edit-reference-rate-card-cross-lane-smoke',
    maximumAuthorizedInternalCostMicros: '5000000',
  })
if (!editReferenceAuthorityResult.ok) {
  throw new Error(editReferenceAuthorityResult.error.message)
}
const editReferenceAuthority = editReferenceAuthorityResult.data
const editReferenceBytesBefore = JSON.stringify(editReferenceAuthority)
const editReferenceEnvelope =
  canonicalSharedPreapprovalAuthorityEnvelopeSchema.parse({
    schemaVersion:
      CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
    authorityLane: 'edit_reference_study_chat_v6',
    authority: editReferenceAuthority,
  })
assert.equal(
  JSON.stringify(editReferenceEnvelope.authority),
  editReferenceBytesBefore,
  'Shared discrimination must preserve Edit Reference V6 authority byte-for-byte.',
)
assert.equal(
  validatePrePlanEditReferenceStudyChatReasoningAuthority(
    editReferenceAuthority,
  ).ok,
  true,
)
assert.equal(
  canonicalSharedPreapprovalAuthorityEnvelopeSchema.safeParse({
    schemaVersion:
      CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
    authorityLane: 'living_frame_preapproval_v1',
    authority,
  }).success,
  true,
)
assert.equal(
  canonicalSharedPreapprovalAuthorityEnvelopeSchema.safeParse({
    schemaVersion:
      CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
    authorityLane: 'edit_reference_study_chat_v6',
    authority,
  }).success,
  false,
  'Living Frame authority cannot cross into the Edit Reference lane.',
)
assert.equal(
  canonicalSharedPreapprovalAuthorityEnvelopeSchema.safeParse({
    schemaVersion:
      CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
    authorityLane: 'living_frame_preapproval_v1',
    authority,
    editReferenceAuthority,
  }).success,
  false,
  'Mixed-lane authority envelopes must fail closed.',
)

assert.equal(
  canonicalLivingFramePreapprovalInputReaderResultSchema.safeParse({
    ...readerResult,
    providerAttemptReceipt: {
      evidenceClass: 'released_live_provider_receipt',
      attemptCostMicros: 1,
    },
  }).success,
  false,
)

const semanticAdmissionEvidence =
  await exerciseCanonicalSemanticReasoningAdmission()

console.log(JSON.stringify({
  schemaVersion: authority.schemaVersion,
  authorityClass: authority.authorityClass,
  workflowContext: authority.workflowContext.kind,
  routeIds: authority.reasoning.orderedRouteIds,
  exactHandoffBound: true,
  deferredLivingFrameBound: true,
  planningEvidenceReRead: true,
  internalCostCeilingExpectationBound: true,
  actualAttemptReceiptMinted: false,
  oldKimiGptRejected: true,
  qwen25VlAndMediaProviderReasoningRejected: true,
  crossLaneAuthorityRejected: true,
  editReferenceV6PreservedByteForByte: true,
  staleOrRacingInputRejected: true,
  currentSourceSpeechEvidenceBound:
    semanticAdmissionEvidence.currentSourceSpeechEvidenceBound,
  actualProviderNeutralPayloadDigestBound:
    semanticAdmissionEvidence.actualProviderNeutralPayloadDigestBound,
  currentRouteDataAssuranceBound:
    semanticAdmissionEvidence.currentRouteDataAssuranceBound,
  providerEnvelopeStillRequired:
    semanticAdmissionEvidence.providerEnvelopeStillRequired,
  crossOwnerEvidenceRejected:
    semanticAdmissionEvidence.crossOwnerEvidenceRejected,
  missingSpeechSegmentRejected:
    semanticAdmissionEvidence.missingSpeechSegmentRejected,
  blockedRouteAssuranceRejected:
    semanticAdmissionEvidence.blockedRouteAssuranceRejected,
  exactSemanticPayloadPrepared:
    semanticAdmissionEvidence.exactSemanticPayloadPrepared,
  restartSafePreparedRunPersisted:
    semanticAdmissionEvidence.restartSafePreparedRunPersisted,
  idempotentPreparedRunReplay:
    semanticAdmissionEvidence.idempotentPreparedRunReplay,
  restartSafeAttemptReservationPersisted:
    semanticAdmissionEvidence
      .restartSafeAttemptReservationPersisted,
  idempotentAttemptReservationReplay:
    semanticAdmissionEvidence.idempotentAttemptReservationReplay,
  providerSubmissionAuthorityStillWithheld:
    semanticAdmissionEvidence
      .providerSubmissionAuthorityStillWithheld,
  attemptReservationTamperingRejected:
    semanticAdmissionEvidence.attemptReservationTamperingRejected,
  providerSpecificRequestMaterialCompiled:
    semanticAdmissionEvidence
      .providerSpecificRequestMaterialCompiled,
  providerApiContractAndModelRevisionStillUnqualified:
    semanticAdmissionEvidence
      .providerApiContractAndModelRevisionStillUnqualified,
  kimiRequestMaterialTamperingRejected:
    semanticAdmissionEvidence.kimiRequestMaterialTamperingRejected,
  providerTransportStillUnauthorized:
    semanticAdmissionEvidence.providerTransportStillUnauthorized,
  preparedRunTamperingRejected:
    semanticAdmissionEvidence.preparedRunTamperingRejected,
  allRuntimeAndCommercialAuthoritiesClosed: true,
  productionReady: false,
}))

async function exerciseCanonicalSemanticReasoningAdmission(): Promise<{
  readonly currentSourceSpeechEvidenceBound: true
  readonly actualProviderNeutralPayloadDigestBound: true
  readonly currentRouteDataAssuranceBound: true
  readonly providerEnvelopeStillRequired: true
  readonly crossOwnerEvidenceRejected: true
  readonly missingSpeechSegmentRejected: true
  readonly blockedRouteAssuranceRejected: true
  readonly exactSemanticPayloadPrepared: true
  readonly restartSafePreparedRunPersisted: true
  readonly idempotentPreparedRunReplay: true
  readonly restartSafeAttemptReservationPersisted: true
  readonly idempotentAttemptReservationReplay: true
  readonly providerSubmissionAuthorityStillWithheld: true
  readonly attemptReservationTamperingRejected: true
  readonly providerSpecificRequestMaterialCompiled: true
  readonly providerApiContractAndModelRevisionStillUnqualified: true
  readonly kimiRequestMaterialTamperingRejected: true
  readonly providerTransportStillUnauthorized: true
  readonly preparedRunTamperingRejected: true
}> {
  const root = await mkdtemp(
    join(tmpdir(), 'reeditpro-lf-semantic-admission-'),
  )
  const blockedRouteRoot = await mkdtemp(
    join(tmpdir(), 'reeditpro-lf-semantic-admission-blocked-'),
  )
  const sourceSpeechRepository =
    new PrivateCanonicalSourceSpeechEvidenceRepository()
  const routeDataAssuranceRepository =
    new PrivateCanonicalPreapprovalRouteDataAssuranceRepository()
  const sourceSpeechRepositoryScope = {
    localStorageRoot: root,
    ownerUserId: USER_ID,
    workspaceId: WORKSPACE_ID,
  }
  const routeDataAssuranceRepositoryScope = {
    localStorageRoot: root,
    ownerUserId: USER_ID,
    workspaceId: WORKSPACE_ID,
  }
  const speechSegmentId = 'speech-segment-lf-semantic-admission-1'
  try {
    const sourceSpeechPackage =
      createCanonicalSourceSpeechEvidencePackage({
        status: 'available_for_preapproval_reasoning',
        sourceMode: 'uploaded_media',
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        editSessionId: EDIT_SESSION_ID,
        sourceSequenceDigestSha256:
          authority.lineage.sourceSequenceDigestSha256,
        evidenceSnapshotId:
          'source-speech-lf-semantic-admission-snapshot',
        evidenceRevision: 1,
        ideaFirstAuthorityDigestSha256: null,
        evidenceRecords: [{
          sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
          mediaAssetId: MEDIA_ASSET_ID,
          uploadedOrder: 1,
          sourceChecksumSha256: SOURCE_CHECKSUM,
          evidenceStatus: 'verified_speech',
          sourceAudioArtifact: {
            artifactId: 'source-audio-lf-semantic-admission',
            contentSha256:
              digest('source-audio-lf-semantic-admission'),
            contentType: 'audio/wav',
            byteLength: 480_000,
          },
          sourceAudioExtractionEvidenceDigestSha256:
            digest('source-audio-extraction-lf-semantic-admission'),
          transcriptArtifact: {
            artifactId: 'transcript-lf-semantic-admission',
            contentSha256:
              digest('transcript-lf-semantic-admission'),
            contentType: 'application/json',
            byteLength: 12_000,
          },
          wordTimestampArtifact: {
            artifactId: 'word-timestamps-lf-semantic-admission',
            contentSha256:
              digest('word-timestamps-lf-semantic-admission'),
            contentType: 'application/json',
            byteLength: 22_000,
          },
          transcriptionRuntime: {
            toolId: 'faster_whisper',
            modelWeightManifestId:
              'faster-whisper-approved-gpu-model-v1',
            modelName: 'faster-whisper approved multilingual model',
            modelRevisionSha256:
              digest('faster-whisper-model-lf-semantic-admission'),
            executionPlacement: 'google_cloud_run_gpu',
            device: 'cuda',
            cpuFallbackUsed: false,
            modelDownloadDuringRun: false,
            customerCreditReservationUsed: false,
            internalAnalysisBudgetAuthorityDigestSha256:
              digest('source-speech-budget-lf-semantic-admission'),
            executionEvidenceDigestSha256:
              digest('source-speech-execution-lf-semantic-admission'),
          },
          transcriptQa: {
            status: 'passed',
            transcriptAlignmentPassed: true,
            humanReviewRequired: false,
            blockingIssueCount: 0,
            qaEvidenceDigestSha256:
              digest('source-speech-qa-lf-semantic-admission'),
          },
          transcriptProjectionPolicy: {
            projectionClass:
              'bounded_redacted_untrusted_source_transcript',
            sourceInstructionAuthority: false,
            rawTranscriptIncluded: false,
            sensitiveValueRedactionApplied: true,
            browserShareable: false,
          },
          speechAbsenceEvidenceDigestSha256: null,
          languageCode: 'en-US',
          coverageStartMilliseconds: 0,
          coverageEndMillisecondsExclusive: 10_000,
          confidenceBasisPoints: 9_250,
          segments: [{
            segmentId: speechSegmentId,
            order: 1,
            startMilliseconds: 0,
            endMillisecondsExclusive: 9_800,
            text:
              'The speaker explains why a restrained illustrative visual supports this moment.',
            confidenceBasisPoints: 9_300,
          }],
        }],
      })
    const sourceSpeechPersistence =
      await sourceSpeechRepository.save({
        scope: sourceSpeechRepositoryScope,
        package: sourceSpeechPackage,
      })

    const semanticRequest = await createSemanticReasoningRequest({
      authority,
      speechSegmentId,
    })
    const providerNeutralPayload =
      await createCanonicalLivingFrameProviderNeutralPayload({
        preapprovalInputAuthority: authority,
        semanticRequest,
        sourceSpeechEvidence: sourceSpeechPackage,
      })
    const routeDataAssurance = createRouteDataAssurance({
      requestDigestSha256:
        providerNeutralPayload.payloadDigestSha256,
      trainingUseState: 'prohibited_by_contract',
    })
    const routePersistence =
      await routeDataAssuranceRepository.save({
        scope: routeDataAssuranceRepositoryScope,
        package: routeDataAssurance,
      })
    const admissionRequest = {
      schemaVersion:
        CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_REQUEST_VERSION,
      purpose:
        'bind_current_living_frame_semantic_request_to_shared_evidence' as const,
      preapprovalInputRequest: request,
      semanticRequest,
      sourceSpeechEvidenceLocator: sourceSpeechPersistence.locator,
      routeDataAssuranceLocator: routePersistence.locator,
    }
    const admission =
      await bindCanonicalLivingFrameSemanticReasoningAdmission({
        context,
        request: admissionRequest,
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
      })
    assert.equal(admission.status, 'ready_for_provider_envelope')
    assert.equal(
      admission.providerNeutralPayload.sourceSpeechProjection
        .sourceSpeechEvidencePackageDigestSha256,
      sourceSpeechPackage.contractDigestSha256,
    )
    assert.equal(
      admission.providerNeutralPayload.sourceSpeechProjection
        .selectedSegments[0]?.segmentId,
      speechSegmentId,
    )
    assert.equal(
      admission.providerNeutralPayload.sourceSpeechProjection
        .rawTranscriptIncluded,
      false,
    )
    assert.equal(
      admission.providerNeutralPayload.sourceSpeechProjection
        .sourceInstructionAuthority,
      false,
    )
    assert.equal(
      admission.routeDataAssurance.requestDigestSha256,
      admission.providerNeutralPayload.payloadDigestSha256,
    )
    assert.equal(
      admission.routeDataAssurance.providerEnvelopeDigestSha256,
      null,
    )
    assert.equal(
      admission.authorityBoundary.providerTransportAuthority,
      false,
    )
    assert.equal(admission.authorityBoundary.selectedSceneAuthority, false)
    assert.equal(admission.authorityBoundary.customerCreditAuthority, false)
    assert.equal(admission.authorityBoundary.productionReady, false)
    assert.equal(
      verifyCanonicalLivingFrameSemanticReasoningAdmission(admission)
        .contractDigestSha256,
      admission.contractDigestSha256,
    )
    assert.throws(
      () => verifyCanonicalLivingFrameSemanticReasoningAdmission({
        ...admission,
        authorityBoundary: Object.fromEntries(
          Object.keys(admission.authorityBoundary)
            .map((key) => [key, true]),
        ),
      }),
    )
    const {
      payloadDigestSha256: _payloadDigestSha256,
      ...providerNeutralPayloadDraft
    } = admission.providerNeutralPayload
    void _payloadDigestSha256
    const forgedPayloadDraft = {
      ...providerNeutralPayloadDraft,
      sourceRequestBlockersFulfilled: [
        'shared_route_data_assurance_required',
      ],
    }
    assert.throws(
      () => verifyCanonicalLivingFrameProviderNeutralPayload({
        ...forgedPayloadDraft,
        payloadDigestSha256:
          sha256AuthorityValue(forgedPayloadDraft),
      }),
      /provider_neutral_payload_invalid/,
      'A correctly re-digested speech payload cannot drop its fulfilled speech-evidence blocker.',
    )
    const {
      contractDigestSha256: _admissionDigestSha256,
      ...admissionDraft
    } = admission
    void _admissionDigestSha256
    const forgedAdmissionDraft = {
      ...admissionDraft,
      routeDataAssurance: {
        ...admission.routeDataAssurance,
        requestDigestSha256:
          digest('forged-route-payload-binding'),
      },
    }
    assert.throws(
      () => verifyCanonicalLivingFrameSemanticReasoningAdmission({
        ...forgedAdmissionDraft,
        contractDigestSha256:
          sha256AuthorityValue(forgedAdmissionDraft),
      }),
      /semantic_reasoning_admission_invalid/,
      'A correctly re-digested admission cannot detach route assurance from the actual payload.',
    )
    for (const injectedField of [
      'rawTranscript',
      'providerId',
      'providerEnvelope',
      'providerCredential',
      'reasoningRunId',
      'selectedScene',
      'approved',
      'workItem',
      'toolId',
      'queueId',
      'customerCredits',
      'runtime',
    ]) {
      assert.equal(
        canonicalLivingFrameSemanticAdmissionRequestSchema.safeParse({
          ...admissionRequest,
          [injectedField]: true,
        }).success,
        false,
        `Semantic admission caller input must reject ${injectedField}.`,
      )
    }

    const reasoningRepository =
      new PrivateCanonicalLivingFramePreapprovalReasoningRepository()
    const reasoningRepositoryScope = {
      localStorageRoot: root,
      ownerUserId: USER_ID,
      workspaceId: WORKSPACE_ID,
    }
    const prepareRequest = {
      schemaVersion:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_PREPARE_REQUEST_VERSION,
      purpose:
        'prepare_current_living_frame_semantic_reasoning_run' as const,
      semanticAdmissionRequest: admissionRequest,
    }
    const prepared =
      await prepareCanonicalLivingFramePreapprovalReasoningRun({
        context,
        request: prepareRequest,
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        reasoningRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
        reasoningRepository,
      })
    assert.equal(
      prepared.run.state,
      'prepared_awaiting_transport_admission',
    )
    assert.equal(
      prepared.run.workloadAuthority.authorityClass,
      'pre_plan_living_frame_semantic_reasoning_prepared',
    )
    assert.equal(
      prepared.run.workloadAuthority.reasoningRequestDigestSha256,
      admission.providerNeutralPayload.payloadDigestSha256,
      'Prepared reasoning must bind the complete semantic payload rather than the old metadata expectation.',
    )
    assert.notEqual(
      prepared.run.workloadAuthority.reasoningRequestDigestSha256,
      authority.reasoning.requestDigestSha256,
      'The complete provider-neutral payload digest must remain distinct from the old preapproval metadata digest.',
    )
    assert.equal(
      prepared.run.preparedProviderEnvelope.route.routeId,
      'kimi_k3_primary',
    )
    assert.equal(
      prepared.run.preparedProviderEnvelope.route.exactProviderModelId,
      'kimi-k3',
    )
    assert.equal(
      prepared.run.preparedProviderEnvelope.canonicalBindings
        .outputJsonSchemaDigestSha256,
      sha256AuthorityValue(
        createLivingFrameSemanticSceneProposalJsonSchema(),
      ),
    )
    assert.deepEqual(prepared.run.attemptRecords, [])
    assert.equal(prepared.run.activeAttemptId, null)
    assert.equal(
      prepared.run.preparedProviderEnvelope
        .providerTransportAuthorized,
      false,
    )
    assert.equal(
      prepared.run.preparedProviderEnvelope.providerCallMade,
      false,
    )
    assert.equal(
      prepared.run.preparedProviderEnvelope.credentialReadMade,
      false,
    )
    assert.equal(
      prepared.run.authorityBoundary.providerAttemptAuthority,
      false,
    )
    assert.equal(
      prepared.run.authorityBoundary.reasoningResultAuthority,
      false,
    )
    const forbiddenPreparedAttempt =
      createReasoningModelAttemptCostEvidenceV2({
        workloadAuthority: prepared.run.workloadAuthority,
        reasoningRunId: prepared.run.reasoningRunId,
        attemptId:
          prepared.run.preparedProviderEnvelope.attemptId,
        attemptOrdinal: 1,
        routeId: 'kimi_k3_primary',
        routeAuthorizationDigestSha256:
          prepared.run.preparedProviderEnvelope.route
            .routeAuthorizationDigestSha256,
        idempotencyKeyDigestSha256:
          prepared.run.preparedProviderEnvelope.oneUseSubmission
            .idempotencyKeyDigestSha256,
        requestPayloadHashSha256:
          prepared.run.workloadAuthority
            .reasoningRequestDigestSha256,
        providerUsageEvidenceHashSha256:
          digest('forbidden-prepared-attempt-usage'),
        entryFallbackTrigger: null,
        terminalOutcome: 'unknown_reconciliation_required',
        terminalFallbackTrigger: null,
        usage: null,
        recordedAt: new Date().toISOString(),
      })
    assert.equal(forbiddenPreparedAttempt.ok, false)
    if (!forbiddenPreparedAttempt.ok) {
      assert.equal(
        forbiddenPreparedAttempt.error.code,
        'prepared_living_frame_attempt_forbidden',
      )
    }
    assert.equal(
      prepared.run.persistence.restartSafeSingleHost,
      true,
    )
    assert.equal(
      prepared.run.persistence.distributedDurability,
      false,
    )
    assert.equal(prepared.persistence.disposition, 'created')
    assert.equal(prepared.persistence.remoteMutationMade, false)
    assert.equal(prepared.preparedRunReReadByServer, true)

    const replay =
      await prepareCanonicalLivingFramePreapprovalReasoningRun({
        context,
        request: prepareRequest,
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        reasoningRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
        reasoningRepository,
      })
    assert.equal(replay.persistence.disposition, 'idempotent_replay')
    assert.equal(
      replay.run.recordDigestSha256,
      prepared.run.recordDigestSha256,
    )
    const restartReread =
      await new PrivateCanonicalLivingFramePreapprovalReasoningRepository()
        .readByServerOwnedLocator({
          scope: reasoningRepositoryScope,
          locator: prepared.locator,
        })
    assert.equal(
      restartReread.recordDigestSha256,
      prepared.run.recordDigestSha256,
    )
    await assert.rejects(
      reasoningRepository.readByServerOwnedLocator({
        scope: {
          ...reasoningRepositoryScope,
          ownerUserId: 'user-foreign-lf-preapproval-reasoning',
        },
        locator: prepared.locator,
      }),
      /not found/,
    )
    const reasoningScopeHash = sha256AuthorityValue({
      ownerUserId: USER_ID,
      workspaceId: WORKSPACE_ID,
    })
    const reasoningLocatorHash = sha256AuthorityValue(
      prepared.locator.serverOwnedLocatorId,
    )
    const currentPointerPath = join(
      root,
      'canonical-living-frame-preapproval-reasoning',
      'scopes',
      reasoningScopeHash,
      'locators',
      reasoningLocatorHash,
      'current.json',
    )
    const originalPointer = await readFile(
      currentPointerPath,
      'utf8',
    )
    const corruptedPointer = JSON.parse(originalPointer) as
      Record<string, unknown>
    corruptedPointer.recordDigestSha256 =
      digest('corrupted-prepared-run-pointer')
    await writeFile(
      currentPointerPath,
      `${JSON.stringify(corruptedPointer)}\n`,
      'utf8',
    )
    await assert.rejects(
      reasoningRepository.readByServerOwnedLocator({
        scope: reasoningRepositoryScope,
        locator: prepared.locator,
      }),
      /stale or invalid/,
      'Checksum-protected prepared-run pointers must reject local corruption.',
    )
    await writeFile(currentPointerPath, originalPointer, 'utf8')
    for (const injectedField of [
      'providerId',
      'providerEnvelope',
      'providerCredential',
      'reasoningRunId',
      'attemptId',
      'providerTransportAuthorized',
      'approvedPlanSnapshotId',
      'creditReservationId',
      'customerCredits',
      'workItem',
      'queueId',
      'runtime',
    ]) {
      assert.equal(
        canonicalLivingFramePreapprovalReasoningPrepareRequestSchema
          .safeParse({
            ...prepareRequest,
            [injectedField]: true,
          }).success,
        false,
        `Prepared-run caller input must reject ${injectedField}.`,
      )
    }

    const {
      envelopeDigestSha256: _envelopeDigestSha256,
      ...providerEnvelopeDraft
    } = prepared.run.preparedProviderEnvelope
    void _envelopeDigestSha256
    const detachedEnvelopeDraft = {
      ...providerEnvelopeDraft,
      canonicalBindings: {
        ...providerEnvelopeDraft.canonicalBindings,
        providerNeutralPayloadDigestSha256:
          digest('detached-provider-neutral-payload'),
      },
    }
    const detachedEnvelope = {
      ...detachedEnvelopeDraft,
      envelopeDigestSha256:
        sha256AuthorityValue(detachedEnvelopeDraft),
    }
    const {
      recordDigestSha256: _recordDigestSha256,
      ...preparedRunDraft
    } = prepared.run
    void _recordDigestSha256
    const detachedRunDraft = {
      ...preparedRunDraft,
      preparedProviderEnvelope: detachedEnvelope,
    }
    assert.throws(
      () => verifyCanonicalLivingFramePreapprovalReasoningRun({
        ...detachedRunDraft,
        recordDigestSha256:
          sha256AuthorityValue(detachedRunDraft),
      }),
      /provider_envelope_invalid/,
      'A correctly re-digested provider envelope cannot detach from the exact semantic payload.',
    )
    const gptEnvelopeDraft = {
      ...providerEnvelopeDraft,
      route: {
        ...providerEnvelopeDraft.route,
        routeId: 'gpt_fallback',
        provider: 'openai',
        exactProviderModelId: 'gpt-5',
      },
    }
    const gptRunDraft = {
      ...preparedRunDraft,
      preparedProviderEnvelope: {
        ...gptEnvelopeDraft,
        envelopeDigestSha256:
          sha256AuthorityValue(gptEnvelopeDraft),
      },
    }
    assert.throws(
      () => verifyCanonicalLivingFramePreapprovalReasoningRun({
        ...gptRunDraft,
        recordDigestSha256: sha256AuthorityValue(gptRunDraft),
      }),
      'The old Kimi-to-GPT route cannot enter a prepared run.',
    )
    const transportEnvelopeDraft = {
      ...providerEnvelopeDraft,
      providerTransportAuthorized: true,
      providerCallMade: true,
      credentialReadMade: true,
    }
    const transportRunDraft = {
      ...preparedRunDraft,
      preparedProviderEnvelope: {
        ...transportEnvelopeDraft,
        envelopeDigestSha256:
          sha256AuthorityValue(transportEnvelopeDraft),
      },
    }
    assert.throws(
      () => verifyCanonicalLivingFramePreapprovalReasoningRun({
        ...transportRunDraft,
        recordDigestSha256:
          sha256AuthorityValue(transportRunDraft),
      }),
      'A prepared run cannot forge provider transport, call, or credential authority.',
    )
    const attemptRunDraft = {
      ...preparedRunDraft,
      attemptRecords: [{
        attemptId: 'forged-attempt',
        state: 'completed',
      }],
      activeAttemptId: 'forged-attempt',
      finalResultDigestSha256:
        digest('forged-preapproval-reasoning-result'),
    }
    assert.throws(
      () => verifyCanonicalLivingFramePreapprovalReasoningRun({
        ...attemptRunDraft,
        recordDigestSha256:
          sha256AuthorityValue(attemptRunDraft),
      }),
      'Prepared persistence cannot mint provider attempt or result evidence.',
    )
    const promotedRunDraft = {
      ...preparedRunDraft,
      promotionAllowed: true,
      productionReady: true,
      authorityBoundary: Object.fromEntries(
        Object.keys(preparedRunDraft.authorityBoundary)
          .map((key) => [key, true]),
      ),
    }
    assert.throws(
      () => verifyCanonicalLivingFramePreapprovalReasoningRun({
        ...promotedRunDraft,
        recordDigestSha256:
          sha256AuthorityValue(promotedRunDraft),
      }),
      'A re-signed all-green prepared-run packet must fail closed.',
    )

    const attemptRepository =
      new PrivateCanonicalLivingFramePreapprovalReasoningAttemptRepository()
    const attemptRepositoryScope = {
      localStorageRoot: root,
      ownerUserId: USER_ID,
      workspaceId: WORKSPACE_ID,
    }
    const attemptReserveRequest = {
      schemaVersion:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVE_REQUEST_VERSION,
      purpose:
        'reserve_current_living_frame_reasoning_attempt_without_transport' as const,
      preparedRunLocator: prepared.locator,
      semanticAdmissionRequest: admissionRequest,
    }
    const reserved =
      await reserveCanonicalLivingFramePreapprovalReasoningAttempt({
        context,
        request: attemptReserveRequest,
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        reasoningRepositoryScope,
        attemptRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
        reasoningRepository,
        attemptRepository,
      })
    assert.equal(
      reserved.reservation.state,
      'reserved_transport_qualification_required',
    )
    assert.equal(
      reserved.reservation.canonicalBindings
        .preparedRunRecordDigestSha256,
      prepared.run.recordDigestSha256,
    )
    assert.equal(
      reserved.reservation.canonicalBindings
        .providerNeutralPayloadDigestSha256,
      admission.providerNeutralPayload.payloadDigestSha256,
    )
    assert.equal(
      reserved.reservation.attemptControl.attemptId,
      prepared.run.preparedProviderEnvelope.attemptId,
    )
    assert.equal(
      reserved.reservation.attemptControl.routeId,
      'kimi_k3_primary',
    )
    assert.equal(
      reserved.reservation.attemptControl
        .submissionAuthorityState,
      'not_issued',
    )
    assert.equal(
      reserved.reservation.attemptControl.providerSubmissionCount,
      0,
    )
    assert.equal(
      reserved.reservation.providerRequest.state,
      'not_created',
    )
    assert.equal(
      reserved.reservation.providerRequest
        .providerCallMayHaveOccurred,
      false,
    )
    assert.equal(
      reserved.reservation.lifecycle.checkbackState,
      'not_scheduled',
    )
    assert.equal(
      reserved.reservation.lifecycle.fallbackState,
      'not_authorized',
    )
    assert.equal(
      reserved.reservation.internalCost.attemptCostState,
      'not_incurred',
    )
    assert.equal(
      reserved.reservation.internalCost
        .attemptCostEvidenceDigestSha256,
      null,
    )
    assert.deepEqual(
      reserved.reservation.authorityBoundary,
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_BOUNDARY,
    )
    assert.equal(
      reserved.reservation.authorityBoundary
        .attemptReservationAuthority,
      true,
    )
    assert.equal(
      reserved.reservation.authorityBoundary
        .providerRequestReservationAuthority,
      false,
    )
    assert.equal(
      reserved.reservation.authorityBoundary
        .providerTransportAuthority,
      false,
    )
    assert.equal(
      reserved.reservation.authorityBoundary
        .providerAttemptCostAuthority,
      false,
    )
    assert.equal(reserved.persistence.disposition, 'created')
    assert.equal(reserved.attemptReservationCreated, true)
    assert.equal(reserved.providerRequestCreated, false)
    assert.equal(
      reserved.providerSubmissionAuthorityIssued,
      false,
    )
    assert.equal(reserved.providerCallMade, false)
    assert.equal(reserved.credentialReadMade, false)
    assert.equal(reserved.providerCheckbackScheduled, false)
    assert.equal(reserved.fallbackAuthorized, false)
    assert.equal(reserved.providerAttemptCostCreated, false)
    assert.equal(reserved.reasoningResultCreated, false)
    assert.equal(reserved.productionReady, false)

    const kimiRequestMaterial =
      compileCanonicalLivingFramePreapprovalKimiRequestMaterial({
        preparedRun: prepared.run,
        attemptReservation: reserved.reservation,
      })
    assert.equal(
      kimiRequestMaterial.state,
      'compiled_provider_api_and_model_revision_unqualified',
    )
    assert.equal(
      kimiRequestMaterial.internalRequestMaterial.route.routeId,
      'kimi_k3_primary',
    )
    assert.equal(
      kimiRequestMaterial.internalRequestMaterial.route
        .exactProviderModelId,
      'kimi-k3',
    )
    assert.equal(
      kimiRequestMaterial.internalRequestMaterial
        .providerApiContractVersion,
      null,
    )
    assert.equal(
      kimiRequestMaterial.internalRequestMaterial
        .providerModelRevision,
      null,
    )
    assert.equal(
      kimiRequestMaterial.internalRequestMaterial.messages[0].content,
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_SYSTEM_INSTRUCTION,
    )
    assert.equal(
      kimiRequestMaterial.internalRequestMaterial.messages[1]
        .content.payloadDigestSha256,
      admission.providerNeutralPayload.payloadDigestSha256,
    )
    assert.equal(
      kimiRequestMaterial.internalRequestMaterial.responseContract
        .jsonSchemaDigestSha256,
      prepared.run.preparedProviderEnvelope.canonicalBindings
        .outputJsonSchemaDigestSha256,
    )
    assert.deepEqual(
      kimiRequestMaterial.internalRequestMaterial.tools,
      [],
    )
    assert.equal(
      kimiRequestMaterial.providerSpecificMaterialCompiled,
      true,
    )
    assert.equal(
      kimiRequestMaterial
        .currentSourceAuthorityRereadAtTransportRequired,
      true,
    )
    assert.equal(
      kimiRequestMaterial.providerApiRequestBodyCreated,
      false,
    )
    assert.equal(
      kimiRequestMaterial.providerApiContractQualified,
      false,
    )
    assert.equal(
      kimiRequestMaterial.providerModelRevisionQualified,
      false,
    )
    assert.equal(
      kimiRequestMaterial.providerSubmissionAuthorityIssued,
      false,
    )
    assert.equal(kimiRequestMaterial.providerCallMade, false)
    assert.equal(kimiRequestMaterial.credentialReadMade, false)
    assert.equal(kimiRequestMaterial.requestMaterialPersisted, false)
    assert.equal(
      kimiRequestMaterial.requestMaterialBrowserShareable,
      false,
    )
    assert.deepEqual(
      kimiRequestMaterial.authorityBoundary,
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_REQUEST_MATERIAL_BOUNDARY,
    )
    assert.equal(
      kimiRequestMaterial.authorityBoundary
        .currentSourceAuthorityAtTransport,
      false,
    )
    const kimiMaterialReplay =
      compileCanonicalLivingFramePreapprovalKimiRequestMaterial({
        preparedRun: prepared.run,
        attemptReservation: reserved.reservation,
      })
    assert.equal(
      kimiMaterialReplay.recordDigestSha256,
      kimiRequestMaterial.recordDigestSha256,
    )
    const {
      recordDigestSha256: _kimiMaterialDigest,
      ...kimiMaterialDraft
    } = kimiRequestMaterial
    void _kimiMaterialDigest
    const detachedInternalMaterial = {
      ...kimiMaterialDraft.internalRequestMaterial,
      messages: [
        kimiMaterialDraft.internalRequestMaterial.messages[0],
        {
          ...kimiMaterialDraft.internalRequestMaterial.messages[1],
          content: {
            ...kimiMaterialDraft.internalRequestMaterial.messages[1]
              .content,
            payloadDigestSha256:
              digest('detached-kimi-request-material-payload'),
          },
        },
      ],
    }
    const detachedKimiMaterialDraft = {
      ...kimiMaterialDraft,
      internalRequestMaterial: detachedInternalMaterial,
      internalRequestMaterialByteLength: Buffer.byteLength(
        stableAuthorityStringify(detachedInternalMaterial),
        'utf8',
      ),
      internalRequestMaterialDigestSha256:
        sha256AuthorityValue(detachedInternalMaterial),
    }
    assert.throws(
      () =>
        verifyCanonicalLivingFramePreapprovalKimiRequestMaterial({
          material: {
            ...detachedKimiMaterialDraft,
            recordDigestSha256:
              sha256AuthorityValue(detachedKimiMaterialDraft),
          },
          preparedRun: prepared.run,
          attemptReservation: reserved.reservation,
        }),
      /kimi_request_material_invalid/,
      'A correctly re-digested Kimi request material cannot detach from the current provider-neutral payload.',
    )
    const qualifiedKimiMaterialDraft = {
      ...kimiMaterialDraft,
      internalRequestMaterial: {
        ...kimiMaterialDraft.internalRequestMaterial,
        providerApiContractVersion:
          'unreviewed-live-api-contract-v1',
        providerModelRevision: 'unreviewed-live-model-revision',
        providerModelAggregateSha256:
          digest('unreviewed-live-model-aggregate'),
        providerCredential: 'forged-credential',
      },
      providerApiRequestBodyCreated: true,
      providerApiContractQualified: true,
      providerModelRevisionQualified: true,
      providerRequestRecordCreated: true,
      providerSubmissionAuthorityIssued: true,
      providerCallMade: true,
      credentialReadMade: true,
      promotionAllowed: true,
      productionReady: true,
      authorityBoundary: Object.fromEntries(
        Object.keys(kimiMaterialDraft.authorityBoundary)
          .map((key) => [key, true]),
      ),
    }
    assert.throws(
      () =>
        verifyCanonicalLivingFramePreapprovalKimiRequestMaterial({
          material: {
            ...qualifiedKimiMaterialDraft,
            recordDigestSha256:
              sha256AuthorityValue(qualifiedKimiMaterialDraft),
          },
          preparedRun: prepared.run,
          attemptReservation: reserved.reservation,
        }),
      'Request material cannot fabricate API qualification, a model revision, credentials, submission, provider-call, or production authority.',
    )

    const reservationReplay =
      await reserveCanonicalLivingFramePreapprovalReasoningAttempt({
        context,
        request: attemptReserveRequest,
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        reasoningRepositoryScope,
        attemptRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
        reasoningRepository,
        attemptRepository,
      })
    assert.equal(
      reservationReplay.persistence.disposition,
      'idempotent_replay',
    )
    assert.equal(
      reservationReplay.reservation.recordDigestSha256,
      reserved.reservation.recordDigestSha256,
    )
    const reservationRestartReread =
      await new PrivateCanonicalLivingFramePreapprovalReasoningAttemptRepository()
        .readByServerOwnedLocator({
          scope: attemptRepositoryScope,
          locator: reserved.locator,
        })
    assert.equal(
      reservationRestartReread.recordDigestSha256,
      reserved.reservation.recordDigestSha256,
    )
    await assert.rejects(
      attemptRepository.readByServerOwnedLocator({
        scope: {
          ...attemptRepositoryScope,
          ownerUserId:
            'user-foreign-lf-preapproval-attempt',
        },
        locator: reserved.locator,
      }),
      /not found/,
      'Attempt reservations must remain owner scoped.',
    )
    await assert.rejects(
      reserveCanonicalLivingFramePreapprovalReasoningAttempt({
        context,
        request: attemptReserveRequest,
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        reasoningRepositoryScope,
        attemptRepositoryScope: {
          ...attemptRepositoryScope,
          ownerUserId:
            'user-foreign-lf-attempt-reservation-scope',
        },
        sourceSpeechRepository,
        routeDataAssuranceRepository,
        reasoningRepository,
        attemptRepository,
      }),
      /stale or inconsistent/,
      'The service must reject a cross-owner attempt repository before any write.',
    )
    const attemptLocatorHash = sha256AuthorityValue(
      reserved.locator.serverOwnedLocatorId,
    )
    const attemptPointerPath = join(
      root,
      'canonical-living-frame-preapproval-reasoning-attempts',
      'scopes',
      reasoningScopeHash,
      'locators',
      attemptLocatorHash,
      'current.json',
    )
    const originalAttemptPointer = await readFile(
      attemptPointerPath,
      'utf8',
    )
    const corruptedAttemptPointer =
      JSON.parse(originalAttemptPointer) as Record<string, unknown>
    corruptedAttemptPointer.attemptId =
      'lf-preplan-attempt-corrupted'
    await writeFile(
      attemptPointerPath,
      `${JSON.stringify(corruptedAttemptPointer)}\n`,
      'utf8',
    )
    await assert.rejects(
      attemptRepository.readByServerOwnedLocator({
        scope: attemptRepositoryScope,
        locator: reserved.locator,
      }),
      /stale or invalid/,
      'Checksum-protected attempt pointers must reject local corruption.',
    )
    await writeFile(
      attemptPointerPath,
      originalAttemptPointer,
      'utf8',
    )
    for (const injectedField of [
      'attemptId',
      'routeId',
      'provider',
      'providerModel',
      'providerRequest',
      'providerCredential',
      'submissionAuthority',
      'providerCallAuthorized',
      'checkback',
      'fallback',
      'costEvidence',
      'approvedPlanSnapshotId',
      'creditReservationId',
      'workItem',
      'queueId',
      'runtime',
    ]) {
      assert.equal(
        canonicalLivingFramePreapprovalReasoningAttemptReserveRequestSchema
          .safeParse({
            ...attemptReserveRequest,
            [injectedField]: true,
          }).success,
        false,
        `Attempt reservation caller input must reject ${injectedField}.`,
      )
    }
    const {
      recordDigestSha256: _reservationDigest,
      ...reservationDraft
    } = reserved.reservation
    void _reservationDigest
    const detachedReservationDraft = {
      ...reservationDraft,
      canonicalBindings: {
        ...reservationDraft.canonicalBindings,
        providerNeutralPayloadDigestSha256:
          digest('detached-attempt-reservation-payload'),
      },
    }
    assert.throws(
      () =>
        verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation({
          ...detachedReservationDraft,
          recordDigestSha256:
            sha256AuthorityValue(detachedReservationDraft),
        }),
      /attempt_reservation_invalid/,
      'A correctly re-digested attempt reservation cannot detach from its submission key and request payload.',
    )
    const gptReservationDraft = {
      ...reservationDraft,
      attemptControl: {
        ...reservationDraft.attemptControl,
        routeId: 'gpt_fallback',
        provider: 'openai',
        exactProviderModelId: 'gpt-5',
      },
    }
    assert.throws(
      () =>
        verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation({
          ...gptReservationDraft,
          recordDigestSha256:
            sha256AuthorityValue(gptReservationDraft),
        }),
      'The old Kimi-to-GPT route cannot enter an attempt reservation.',
    )
    const issuedReservationDraft = {
      ...reservationDraft,
      attemptControl: {
        ...reservationDraft.attemptControl,
        submissionAuthorityState: 'issued',
        providerSubmissionCount: 1,
        submissionAuthorityConsumed: true,
      },
      providerRequest: {
        ...reservationDraft.providerRequest,
        providerRequestRecordId: 'forged-provider-request',
        state: 'submitted',
        providerCallMayHaveOccurred: true,
      },
      internalCost: {
        ...reservationDraft.internalCost,
        attemptCostState: 'metered',
        attemptCostEvidenceDigestSha256:
          digest('forged-attempt-cost'),
      },
    }
    assert.throws(
      () =>
        verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation({
          ...issuedReservationDraft,
          recordDigestSha256:
            sha256AuthorityValue(issuedReservationDraft),
        }),
      'A reservation cannot mint submission, provider request, or attempt-cost authority.',
    )
    const promotedReservationDraft = {
      ...reservationDraft,
      promotionAllowed: true,
      productionReady: true,
      authorityBoundary: Object.fromEntries(
        Object.keys(reservationDraft.authorityBoundary)
          .map((key) => [key, true]),
      ),
    }
    assert.throws(
      () =>
        verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation({
          ...promotedReservationDraft,
          recordDigestSha256:
            sha256AuthorityValue(promotedReservationDraft),
        }),
      'A re-signed all-green attempt reservation must fail closed.',
    )

    await assert.rejects(
      bindCanonicalLivingFrameSemanticReasoningAdmission({
        context,
        request: admissionRequest,
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope: {
          ...sourceSpeechRepositoryScope,
          ownerUserId: 'user-foreign-lf-semantic-admission',
        },
        routeDataAssuranceRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
      }),
      /stale or inconsistent/,
    )
    await assert.rejects(
      bindCanonicalLivingFrameSemanticReasoningAdmission({
        context,
        request: {
          ...admissionRequest,
          semanticRequest: {
            ...semanticRequest,
            contractDigestSha256:
              digest('tampered-lf-semantic-request'),
          },
        },
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
      }),
      /stale or inconsistent/,
    )

    const missingSegmentRequest =
      await createSemanticReasoningRequest({
        authority,
        speechSegmentId: 'speech-segment-not-in-current-package',
      })
    await assert.rejects(
      bindCanonicalLivingFrameSemanticReasoningAdmission({
        context,
        request: {
          ...admissionRequest,
          semanticRequest: missingSegmentRequest,
        },
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
      }),
      /stale or inconsistent/,
    )

    const wrongRouteDataAssurance = createRouteDataAssurance({
      requestDigestSha256:
        digest('wrong-provider-neutral-payload'),
      trainingUseState: 'prohibited_by_contract',
    })
    const wrongRoutePersistence =
      await routeDataAssuranceRepository.save({
        scope: routeDataAssuranceRepositoryScope,
        package: wrongRouteDataAssurance,
      })
    await assert.rejects(
      bindCanonicalLivingFrameSemanticReasoningAdmission({
        context,
        request: {
          ...admissionRequest,
          routeDataAssuranceLocator: wrongRoutePersistence.locator,
        },
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
      }),
      /stale or inconsistent/,
    )

    const blockedRepository =
      new PrivateCanonicalPreapprovalRouteDataAssuranceRepository()
    const blockedRouteDataAssuranceRepositoryScope = {
      ...routeDataAssuranceRepositoryScope,
      localStorageRoot: blockedRouteRoot,
    }
    const blockedRouteDataAssurance = createRouteDataAssurance({
      requestDigestSha256:
        providerNeutralPayload.payloadDigestSha256,
      trainingUseState: 'permitted',
    })
    const blockedRoutePersistence = await blockedRepository.save({
      scope: blockedRouteDataAssuranceRepositoryScope,
      package: blockedRouteDataAssurance,
    })
    await assert.rejects(
      bindCanonicalLivingFrameSemanticReasoningAdmission({
        context,
        request: {
          ...admissionRequest,
          routeDataAssuranceLocator: blockedRoutePersistence.locator,
        },
        inputReader,
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope:
          blockedRouteDataAssuranceRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository: blockedRepository,
      }),
      /not ready/,
    )

    let raceReadCount = 0
    await assert.rejects(
      bindCanonicalLivingFrameSemanticReasoningAdmission({
        context,
        request: admissionRequest,
        inputReader: createInputReader(() => {
          raceReadCount += 1
          if (raceReadCount <= 3) return readerResult
          return {
            ...readerResult,
            internalCostExpectation: {
              ...readerResult.internalCostExpectation,
              budgetExpectationId:
                'living-frame-semantic-admission-raced-budget',
            },
          }
        }),
        planningEvidenceReader: visualReader,
        sourceSpeechRepositoryScope,
        routeDataAssuranceRepositoryScope,
        sourceSpeechRepository,
        routeDataAssuranceRepository,
      }),
      /changed during the current-state reread/,
    )

    return {
      currentSourceSpeechEvidenceBound: true,
      actualProviderNeutralPayloadDigestBound: true,
      currentRouteDataAssuranceBound: true,
      providerEnvelopeStillRequired: true,
      crossOwnerEvidenceRejected: true,
      missingSpeechSegmentRejected: true,
      blockedRouteAssuranceRejected: true,
      exactSemanticPayloadPrepared: true,
      restartSafePreparedRunPersisted: true,
      idempotentPreparedRunReplay: true,
      restartSafeAttemptReservationPersisted: true,
      idempotentAttemptReservationReplay: true,
      providerSubmissionAuthorityStillWithheld: true,
      attemptReservationTamperingRejected: true,
      providerSpecificRequestMaterialCompiled: true,
      providerApiContractAndModelRevisionStillUnqualified: true,
      kimiRequestMaterialTamperingRejected: true,
      providerTransportStillUnauthorized: true,
      preparedRunTamperingRejected: true,
    }
  } finally {
    await Promise.all([
      rm(root, { recursive: true, force: true }),
      rm(blockedRouteRoot, { recursive: true, force: true }),
    ])
  }
}

async function createSemanticReasoningRequest(input: {
  readonly authority: LivingFramePreapprovalInputAuthority
  readonly speechSegmentId: string
}) {
  const draft =
    createLivingFrameSemanticReasoningRequestFixtureDrafts().musashi
  return createLivingFrameSemanticReasoningRequest({
    ...draft,
    workflowContext: input.authority.workflowContext,
    canonicalBindings: {
      ...draft.canonicalBindings,
      workspaceId: input.authority.identity.workspaceId,
      projectId: input.authority.identity.projectId,
      editSessionId: input.authority.identity.editSessionId,
      handoffId: input.authority.identity.handoffId,
      preapprovalInputAuthorityDigestSha256:
        input.authority.authorityDigestSha256,
      visualEvidenceBindingDigestSha256:
        input.authority.lineage.planningEvidenceBindingDigestSha256,
    },
    semanticPayload: {
      ...draft.semanticPayload,
      evidence: {
        ...draft.semanticPayload.evidence,
        visualEvidenceBindingDigestSha256:
          input.authority.lineage.planningEvidenceBindingDigestSha256,
        evidenceReferences:
          draft.semanticPayload.evidence.evidenceReferences.map(
            (reference) => ({
              ...reference,
              sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
            }),
          ),
      },
      segmentContexts: draft.semanticPayload.segmentContexts.map(
        (segmentContext) => ({
          ...segmentContext,
          sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
          sourceSegmentRefId: input.speechSegmentId,
        }),
      ),
    },
  })
}

function createRouteDataAssurance(input: {
  readonly requestDigestSha256: string
  readonly trainingUseState: 'prohibited_by_contract' | 'permitted'
}) {
  const evaluatedAt = new Date().toISOString()
  const verifiedAt = new Date(
    Date.parse(evaluatedAt) - 24 * 60 * 60 * 1_000,
  ).toISOString()
  const expiresAt = new Date(
    Date.parse(evaluatedAt) + 30 * 24 * 60 * 60 * 1_000,
  ).toISOString()
  const regionId = 'verified-controlled-processing-region'
  const verifiedEvidence = (label: string) =>
    createCanonicalPreapprovalPolicyEvidence({
      state: 'verified_current',
      evidenceReferenceId: `${label}-evidence`,
      evidenceDigestSha256: digest(`${label}-evidence`),
      verifiedAt,
      expiresAt,
    })
  const projectPolicy =
    createCanonicalPreapprovalProjectModelDataPolicy({
      policyId: 'lf-semantic-admission-project-policy',
      policyVersion: 'lf-semantic-admission-policy-v1',
      organizationPolicyId:
        'lf-semantic-admission-organization-policy',
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      sensitivity: 'internal',
      permittedProviderIds: [
        'moonshot_ai',
        'alibaba_cloud_model_studio',
        'deepseek',
      ],
      allowedProcessingRegions: [regionId],
      retentionRequirement: 'contractual_no_training',
      trainingUseRestriction: 'prohibited',
      confidentialSourceRule: 'allow_verified_provider',
      humanLikenessRule: 'verified_consent_required',
      minorLikenessRule: 'verified_guardian_consent_required',
      organizationPolicyEvidence:
        verifiedEvidence('lf-semantic-admission-organization-policy'),
      projectPolicyEvidence:
        verifiedEvidence('lf-semantic-admission-project-policy'),
      decidedAt: verifiedAt,
    })
  const requestClassification =
    createCanonicalPreapprovalModelDataRequestClassification({
      classificationId:
        'lf-semantic-admission-request-classification',
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      requestDigestSha256: input.requestDigestSha256,
      requestedUse: 'edit_planning',
      confidentialSourceState: 'not_present',
      humanLikenessState: 'not_present',
      minorLikenessState: 'not_present',
      rightsSafetyState: 'approved',
      factSafetyState: 'not_applicable',
      classificationEvidenceDigestSha256:
        digest(
          `lf-semantic-admission-classification-${input.requestDigestSha256}`,
        ),
      classifiedAt: verifiedAt,
    })
  const routeAssurances = ([
    'kimi_k3_primary',
    'qwen_3_7_fallback',
    'deepseek_v4_pro_fallback',
  ] as const).map((routeId) =>
    createCanonicalPreapprovalModelRouteDataAssurance({
      assuranceId: `${routeId}-lf-semantic-admission-assurance`,
      routeId,
      selectedProcessingRegion: regionId,
      maximumSensitivity: 'restricted',
      retentionCommitment:
        'contractual_no_training_verified',
      trainingUseState: input.trainingUseState,
      confidentialSourceHandling: 'contractually_permitted',
      humanLikenessHandling: 'consent_bound_permitted',
      minorLikenessHandling:
        'guardian_consent_bound_permitted',
      assuranceEvidence:
        verifiedEvidence(`${routeId}-lf-semantic-admission`),
    }),
  )
  return createCanonicalPreapprovalRouteDataAssuranceBinding({
    evidenceSnapshotId:
      `lf-semantic-admission-route-snapshot-${
        input.trainingUseState
      }`,
    evidenceRevision: 1,
    evaluatedAt,
    projectPolicy,
    requestClassification,
    routeAssurances,
  })
}

function createInputReader(
  resultFactory: () => unknown,
): CanonicalLivingFramePreapprovalInputReaderPort {
  return {
    schemaVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION,
    sourceAuthority:
      'canonical_private_current_planning_handoff_reader',
    evidenceClass:
      'controlled_private_current_handoff_and_components_reader',
    productionReady: false,
    async readCurrentHandoffAndComponents(input) {
      assert.deepEqual(input.expectedScope, {
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        editSessionId: EDIT_SESSION_ID,
      })
      assert.equal(input.expectedHandoffId, handoff.handoffId)
      return resultFactory()
    },
  }
}

function createInputReaderResult(input: {
  handoff: CanonicalPlanningHandoffResponse
  components: CanonicalPlanComponentsInput
}): CanonicalLivingFramePreapprovalInputReaderResult {
  return canonicalLivingFramePreapprovalInputReaderResultSchema.parse({
    schemaVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_RESULT_VERSION,
    sourceAuthority:
      'canonical_private_current_planning_handoff_reader',
    evidenceClass:
      'controlled_private_current_handoff_and_components_reader',
    productionReady: false,
    identity: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      currentHandoffId: input.handoff.handoffId,
    },
    publicationStatus: 'unpublished',
    handoff: input.handoff,
    canonicalPlanComponents: input.components,
    internalCostExpectation: {
      policyVersion:
        'living-frame-preapproval-internal-cost-ceiling-v1-2026-07-26',
      budgetExpectationId:
        'living-frame-preapproval-budget-expectation-smoke',
      evidenceClass:
        'controlled_non_promotable_internal_cost_ceiling_expectation',
      rateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
      denomination: 'normalized_usd_micros',
      maximumAuthorizedInternalCostMicros: '5000000',
      actualAttemptReceiptProvided: false,
      actualAttemptCostKnown: false,
      providerInvoiceReconciled: false,
      futureDurableAttemptEvidenceRequired: true,
      customerPriceCalculated: false,
      customerCreditsCalculated: false,
      customerChargeCreated: false,
      walletMutationMade: false,
      serviceFeeIncluded: false,
    },
  })
}

function createCanonicalHandoff(
  canonicalPlanComponents: CanonicalPlanComponentsInput,
): CanonicalPlanningHandoffResponse {
  const planningInputBinding = createPlanningInputBinding()
  const planningInputAuthority =
    planningInputAuthorityExpectationFromResolvedBinding(
      planningInputBinding,
    )
  const sourceBinding = {
    sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
    mediaAssetId: MEDIA_ASSET_ID,
    uploadedOrder: 1,
    required: true,
    uploadIntentId: 'upload-intent-living-frame-preapproval-smoke',
    storageObjectRecordId:
      'storage-object-living-frame-preapproval-smoke',
    storageProvider: 'local_private' as const,
    mimeType: 'video/mp4',
    sizeBytes: 10_000_000,
    checksumSha256: SOURCE_CHECKSUM,
    storageIdentityHash:
      digest('living-frame-preapproval-storage-identity'),
    bindingHash: digest('living-frame-preapproval-source-binding'),
  }
  const sourceCandidate = {
    schemaVersion:
      'private-source-binding-manifest-candidate-v1' as const,
    authorityStatus: 'unapproved_manifest_candidate' as const,
    executionAuthorized: false as const,
    approvedSnapshotMutated: false as const,
    noRuntimeSideEffects: true as const,
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    uploadPurpose: 'source_media' as const,
    authorityRevision: 1,
    authorityChecksumSha256:
      digest('living-frame-preapproval-source-authority'),
    sourceSequenceHash:
      sha256AuthorityValue(canonicalPlanComponents.sourceSequence),
    bindings: [sourceBinding],
    requiredBindingCount: 1,
    candidateHash: digest('living-frame-preapproval-source-candidate'),
  }
  const withoutHash = {
    schemaVersion: 'canonical-planning-handoff-response-v1' as const,
    source: 'canonical_planning_handoff_service' as const,
    identity: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
    },
    canonicalPlanComponentsHash:
      sha256AuthorityValue(canonicalPlanComponents),
    sourceBindingManifestCandidate: sourceCandidate,
    sourceMediaAuthority: {
      authorityRevision: sourceCandidate.authorityRevision,
      authorityChecksumSha256:
        sourceCandidate.authorityChecksumSha256,
      sourceSequenceHash: sourceCandidate.sourceSequenceHash,
      candidateHash: sourceCandidate.candidateHash,
    },
    planningInputAuthority,
    resolvedPlanningInputAuthority: planningInputBinding,
    readiness: {
      sourceAuthorityMode: 'finalized_uploaded_media' as const,
      finalizedSourceMediaVerified: true as const,
      ideaFirstStorytellingAuthorityVerified: false as const,
      exactEditPreferencesVerified: true as const,
      preferenceApplicationVerified: true as const,
      editBriefVerified: true as const,
      outputFrameAndCleanupVerified: true as const,
      readyForCanonicalPlanPublication: true as const,
    },
    noPlanPublished: true as const,
    noSnapshotCreated: true as const,
    noCreditReservation: true as const,
    noToolExecution: true as const,
    noProviderCall: true as const,
    noRender: true as const,
    testOnly: true as const,
  }
  const handoffHash = sha256AuthorityValue(withoutHash)
  return canonicalPlanningHandoffResponseSchema.parse({
    ...withoutHash,
    handoffHash,
    handoffId: canonicalPlanningHandoffId(handoffHash),
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      createOnly: true,
      checksumProtected: true,
      contentAddressed: true,
      distributed: false,
      productionAuthority: false,
    },
  })
}

function createPlanningInputBinding() {
  const values = {
    editLevel: 'pro' as const,
    workflowType: 'education_explainer' as const,
    cleanupPreference: 'balanced_cleanup' as const,
    visualPreference: 'balanced_visual_mix' as const,
    moodStyle: 'premium' as const,
    creditPreference: 'balanced' as const,
    targetPlatform: 'youtube' as const,
  }
  const withoutHash = {
    schemaVersion:
      'canonical-planning-input-authority-binding-v1' as const,
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    exactEditPreference: {
      recordRevision: 1,
      preferenceRevision: 1,
      planningInputRevision: 1,
      preferenceFingerprintSha256:
        digest('living-frame-preapproval-preference'),
      values,
      effectiveValues: values,
      instructionSource: 'current_edit_preferences' as const,
      explicitChatOverrideKeys: [],
      explicitChatOverrides: {},
      instructionHash:
        digest('living-frame-preapproval-preference-instruction'),
      baseline: {
        preferenceSnapshotId:
          'living-frame-preapproval-preference-snapshot',
        persistenceSource: 'server_defaults' as const,
        provenance: 'server_default_preferences' as const,
      },
      sourcePreparationEvidenceHash:
        digest('living-frame-preapproval-source-preparation'),
      sourceCandidateHash:
        digest('living-frame-preapproval-source-candidate'),
      frameConfirmationId:
        'living-frame-preapproval-frame-confirmation',
      confirmedAspectRatio: '16:9' as const,
      lifecyclePhase: 'planning' as const,
      locked: false,
    },
    preferenceApplication: {
      status: 'not_selected' as const,
      applicationVersion: 0 as const,
      applicationHash:
        digest('living-frame-preapproval-no-preference-application'),
    },
    editBrief: {
      status: 'not_used' as const,
      deterministicHash:
        digest('living-frame-preapproval-no-edit-brief'),
    },
    instructionPriority: [...PLANNING_PREFERENCE_INSTRUCTION_PRIORITY],
    noRuntimeSideEffects: true as const,
  }
  return resolvedPlanningInputAuthorityBindingSchema.parse({
    ...withoutHash,
    bindingHash: sha256AuthorityValue(withoutHash),
  })
}

function createCanonicalComponents(): CanonicalPlanComponentsInput {
  return canonicalPlanComponentsSchema.parse({
    compiledIntent: {
      goalSummary:
        'Use Living Frame after current source evidence is available.',
    },
    professionalEditingDirective: {
      mustFollowRules: [
        'Preserve source meaning and documentary truth.',
      ],
    },
    confirmedSettings: {
      aspectRatio: '16:9',
      outputFrame: { width: 3_840, height: 2_160, fps: 30 },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage:
        buildProfessionalExportCreditCoverage({
          durationSeconds: 10,
          outputFps: 30,
          approvedAspectRatio: '16:9',
        }),
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'pro',
      targetPlatform: 'youtube',
      preferenceSnapshotId:
        'living-frame-preapproval-preference-snapshot',
      preferenceRevision: 1,
      preferencePlanningInputRevision: 1,
      preferenceFingerprintSha256:
        digest('living-frame-preapproval-preference'),
    },
    sourceSequence: [{
      sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
      mediaAssetId: MEDIA_ASSET_ID,
      uploadedOrder: 1,
      checksumSha256: SOURCE_CHECKSUM,
      required: true,
    }],
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'balanced_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: 'cleanup-living-frame-preapproval-source',
        sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: 300,
        reason: 'Preserve the complete controlled source fixture.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
    masterTimingPlan: {
      id: 'master-timing-living-frame-preapproval',
      status: 'ready',
      timingBase: { fps: 30, totalFrames: 300 },
      totalFrames: 300,
    },
    captionVisualCueTimingPlan: { status: 'synced' },
    soundSyncTransitionTimingPlan: {
      status: 'not_needed',
      speechPriority: true,
    },
    timingValidationPlan: {
      overallStatus: 'passed',
      approvalBlocked: false,
    },
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 30,
      totalFrames: 300,
    },
    segments: [{
      segmentId: 'segment-living-frame-preapproval-1',
      startFrame: 0,
      endFrameExclusive: 300,
      operationIds: ['operation-living-frame-preapproval-1'],
    }],
    visualAssetPlan: { status: 'not_needed' },
    colorPipelinePlan: { status: 'not_provided' },
    rendererPlan: {
      renderer: 'remotion',
      frameOwnedByRenderer: true,
    },
    toolStrategyPlan: { toolIds: [] },
    qaPlan: { checks: [] },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: { unapprovedFallbackAllowed: false },
  })
}

function createVisualEvidenceReader(
  result: PrivateLivingFramePlanningEvidenceReaderResult,
): CanonicalLivingFramePlanningEvidenceReaderPort {
  return {
    schemaVersion:
      CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION,
    sourceAuthority: 'private_gcp_visual_evidence_repository',
    evidenceClass: 'controlled_private_source_evidence_reader',
    productionReady: false,
    async readByServerOwnedLocator(input) {
      assert.equal(input.serverOwnedLocatorId, LOCATOR_ID)
      assert.deepEqual(input.expectedScope, {
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        editSessionId: EDIT_SESSION_ID,
      })
      return result
    },
  }
}

function createVisualEvidenceReaderResult(input: {
  plan: PrivateGcpVisualUnderstandingPlan
  evidence: PrivateGcpVisualEvidencePackage
}): PrivateLivingFramePlanningEvidenceReaderResult {
  return {
    schemaVersion: PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION,
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    records: [{
      sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
      mediaAssetId: MEDIA_ASSET_ID,
      plan: input.plan,
      evidence: input.evidence,
    }],
  }
}

function createVisualEvidenceFixture(): {
  plan: PrivateGcpVisualUnderstandingPlan
  evidence: PrivateGcpVisualEvidencePackage
} {
  const coverageWithoutDigest: Omit<
    PrivateGcpVisualCoverageManifest,
    'coverageDigestSha256'
  > = {
    policyVersion: 'private-gcp-qwen25vl-sampling-policy-v1',
    profileId: 'professional_key_moment_visual_coverage_v1',
    editLevel: 'premium',
    deterministicTechnicalCoverageComplete: true,
    sceneDetectionArtifactId:
      'living-frame-preapproval-scene-detection',
    sceneDetectionArtifactSha256:
      digest('living-frame-preapproval-scene-detection'),
    detectedSceneCount: 1,
    visuallyCoveredSceneCount: 1,
    maximumUnobservedSpanSeconds: 10,
    samplesPerBatchMaximum: 64,
    batchCount: 1,
    samples: [{
      sampleId: 'sample-living-frame-preapproval-baseline',
      sourceFrame: 0,
      reason: 'scene_representative',
      source: 'analysis_proxy_frame',
      proxyFrameChecksumSha256:
        digest('living-frame-preapproval-proxy-frame'),
      rawFramePersistenceAllowed: false,
    }],
    windows: [{
      windowId: 'window-living-frame-preapproval-baseline',
      reason: 'scene_representative',
      detectedSceneId: 'detected-scene-living-frame-preapproval-1',
      startFrame: 0,
      endFrameExclusive: 300,
      required: true,
      sampleIds: ['sample-living-frame-preapproval-baseline'],
    }],
  }
  const coverage: PrivateGcpVisualCoverageManifest = {
    ...coverageWithoutDigest,
    coverageDigestSha256:
      calculatePrivateGcpVisualCoverageDigest(coverageWithoutDigest),
  }
  const plan = createPrivateGcpVisualUnderstandingPlan({
    analysisRunId: 'analysis-run-living-frame-preapproval',
    attemptId: 'attempt-living-frame-preapproval-1',
    attemptOrdinal: 1,
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    idempotencyKey: 'living-frame-preapproval-analysis-attempt-1',
    authority: {
      phase: 'preplan_internal_source_analysis',
      authenticatedUserId: USER_ID,
      sourceStudyAuthorizationId:
        'source-study-living-frame-preapproval',
      internalAnalysisBudgetAuthorityId:
        'internal-budget-living-frame-preapproval',
      userAnalysisConsentRecordedAt: '2026-07-26T12:00:00.000Z',
      customerCreditReservationId: null,
      customerChargeAuthorized: false,
    },
    source: {
      sourceAssetId: MEDIA_ASSET_ID,
      storageBucket: 'reeditpro-private-media',
      storageObjectName:
        'workspaces/living-frame-preapproval/source/original.mp4',
      storageObjectGeneration: '123456789',
      sourceChecksumSha256: SOURCE_CHECKSUM,
      sourceByteLength: 10_000_000,
      sourceWidth: 3_840,
      sourceHeight: 2_160,
      durationFrames: 300,
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      immutableOriginal: true,
      privateObject: true,
    },
    proxy: {
      proxyAssetId: 'proxy-asset-living-frame-preapproval',
      storageBucket: 'reeditpro-private-media',
      storageObjectName:
        'workspaces/living-frame-preapproval/proxy/analysis.mp4',
      storageObjectGeneration: '123456790',
      proxyChecksumSha256:
        digest('living-frame-preapproval-proxy'),
      sourceChecksumSha256: SOURCE_CHECKSUM,
      profileId: 'professional_1080p_analysis_proxy_v2',
      width: 1_920,
      height: 1_080,
      outputColorSpace: 'bt709',
      colorTransformStatus: 'validated_rec709_sdr',
      privateObject: true,
      originalMasterPreserved: true,
    },
    checkpoint: {
      modelId: 'qwen2.5-vl-7b-instruct',
      checkpointSha256:
        digest('living-frame-preapproval-qwen-checkpoint'),
      tokenizerSha256:
        digest('living-frame-preapproval-qwen-tokenizer'),
      processorSha256:
        digest('living-frame-preapproval-qwen-processor'),
      containerImageDigest:
        `sha256:${digest('living-frame-preapproval-visual-worker')}`,
      precision: 'bf16',
      modelApprovalRecordId:
        'living-frame-preapproval-model-approval',
      licenseReviewRecordId:
        'living-frame-preapproval-license-review',
    },
    coverage,
    evidenceSchemaVersion:
      'private-gcp-qwen25vl-evidence-schema-v1',
    promptPolicyVersion:
      'private-gcp-qwen25vl-visual-prompt-policy-v1',
    serverReadiness: verifiedVisualReadinessFixture(),
  })
  const observations: PrivateGcpVisualObservation[] = [{
    observationId: 'observation-living-frame-preapproval-layout',
    startFrame: 0,
    endFrameExclusive: 300,
    evidenceSampleIds: ['sample-living-frame-preapproval-baseline'],
    category: 'layout',
    summary:
      'The speaker occupies the right side while the left side remains visually open.',
    confidenceBasisPoints: 9_200,
    userCorrectionId: null,
  }]
  const evidence = finalizePrivateGcpVisualEvidencePackage({
    plan,
    observations,
    coveredRequiredWindowIds: [
      'window-living-frame-preapproval-baseline',
    ],
    unsupportedClaimCount: 0,
    deterministicQaPassed: true,
  })
  return { plan, evidence }
}

function verifiedVisualReadinessFixture():
  PrivateGcpVisualServerReadinessEvidence {
  return {
    source: 'server_owned_private_gcp_visual_readiness',
    executionEnvironment: 'internal',
    readinessEvidenceId:
      'controlled-living-frame-preapproval-readiness-fixture',
    readinessEvidenceSha256:
      digest('controlled-living-frame-preapproval-readiness'),
    verifiedAt: '2026-07-26T12:00:00.000Z',
    cloudRunJobResourceVerified: true,
    workerServiceAccountAndIamVerified: true,
    privateGcsGenerationBoundTransportVerified: true,
    workerImageDigestVerified: true,
    checkpointPresentInApprovedImage: true,
    modelAndLicenseApprovalVerified: true,
    canonicalQueueLeaseAndOneUseDispatchVerified: true,
    cancellationRetryAndLeaseRecoveryVerified: true,
    telemetryAndCostRateSnapshotVerified: true,
    deploymentRegionAndDataPolicyVerified: true,
    environmentGpuExecutionGateVerified: true,
  }
}

function authorityDigest(
  value: LivingFramePreapprovalInputAuthority,
): string {
  const {
    authorityDigestSha256: _authorityDigestSha256,
    ...withoutDigest
  } = value
  void _authorityDigestSha256
  return sha256AuthorityValue(withoutDigest)
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
