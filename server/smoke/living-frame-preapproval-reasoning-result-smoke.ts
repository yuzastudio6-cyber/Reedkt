import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  bindLivingFrameCanonicalPlanning,
} from '../../src/lib/living-frame'
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
import {
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_LOCATOR_VERSION,
  type LivingFrameControlledSemanticReasoningResult,
} from '../../src/types/living-frame-preapproval-reasoning-result'
import type { ServiceContext } from '../types'
import {
  aggregateReasoningModelAttemptCostsV2,
  createLivingFrameControlledInternalBudgetAdmission,
  createPrePlanEditReferenceStudyChatReasoningAuthority,
  createPrePlanLivingFrameSemanticReasoningAuthority,
  createReasoningModelAttemptCostEvidenceV2,
  reasoningModelRateCardIdentityDigest,
  validatePrePlanLivingFrameSemanticReasoningAuthority,
  validatePrePlanReasoningWorkloadAuthority,
  type PrePlanEditReferenceStudyChatReasoningAuthority,
  type PrePlanLivingFrameSemanticReasoningAuthority,
  type ReasoningModelAttemptCostEvidenceV2,
  type ReasoningModelFxSnapshot,
  type ReasoningModelTokenUsage,
} from '../reasoning-model-cost'
import {
  createCanonicalReasoningRouteAttemptLifecycleEvidence,
  createCanonicalReasoningRunReceipt,
  validateCanonicalReasoningRunReceipt,
  type CanonicalReasoningRouteAttemptLifecycleEvidence,
  type CanonicalReasoningRunReceipt,
} from '../reasoning-model-execution/canonical-reasoning-run-receipt'
import {
  canonicalLivingFramePreapprovalInputReaderResultSchema,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_RESULT_VERSION,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_REQUEST_VERSION,
  type CanonicalLivingFramePreapprovalInputReaderResult,
} from '../validation/canonical-living-frame-preapproval-input-authority-schemas'
import {
  canonicalLivingFrameControlledSemanticReasoningResultSchema,
  canonicalLivingFramePreapprovalReasoningResultBindingSchema,
  canonicalLivingFramePreapprovalReasoningResultReaderResultSchema,
  canonicalLivingFramePreapprovalReasoningResultRequestSchema,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_RESULT_VERSION,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_REQUEST_VERSION,
} from '../validation/canonical-living-frame-preapproval-reasoning-result-schemas'
import {
  canonicalPlanComponentsSchema,
  type CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  canonicalPlanningHandoffResponseSchema,
  type CanonicalPlanningHandoffResponse,
} from '../validation/canonical-planning-handoff-schemas'
import {
  bindCanonicalLivingFramePlanningEvidence,
  CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION,
  PRIVATE_LIVING_FRAME_PLANNING_EVIDENCE_RESULT_VERSION,
  type CanonicalLivingFramePlanningEvidenceReaderPort,
  type PrivateLivingFramePlanningEvidenceReaderResult,
} from '../services/canonical-living-frame-planning-evidence-service'
import {
  bindCanonicalLivingFramePreapprovalInputAuthority,
  type CanonicalLivingFramePreapprovalInputReaderPort,
} from '../services/canonical-living-frame-preapproval-input-authority-service'
import {
  bindCanonicalLivingFramePreapprovalReasoningResult,
  createCanonicalLivingFramePreapprovalReasoningResultReader,
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_AUTHORITY_BOUNDARY,
} from '../services/canonical-living-frame-preapproval-reasoning-result-service'
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
} from '../services/private-edit-authority-store'
import {
  resolvedPlanningInputAuthorityBindingSchema,
} from '../validation/planning-input-authority-binding-schemas'
import {
  EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION,
  hashEditReferenceStudyChatReasoningRequest,
  type EditReferenceStudyChatReasoningRequest,
} from '../edit-references/edit-reference-study-chat-reasoning-contract'
import {
  createEditReferenceStudyChatReasoningRunReceipt,
} from '../edit-references/edit-reference-study-chat-reasoning-run-receipt'

const WORKSPACE_ID = 'workspace-living-frame-result-smoke'
const PROJECT_ID = 'project-living-frame-result-smoke'
const EDIT_SESSION_ID = 'edit-living-frame-result-smoke'
const USER_ID = 'user-living-frame-result-smoke'
const SOURCE_SEQUENCE_ITEM_ID = 'source-living-frame-result-1'
const MEDIA_ASSET_ID = 'media-living-frame-result-1'
const SOURCE_CHECKSUM = digest('living-frame-result-source-bytes')
const EVIDENCE_LOCATOR_ID =
  'private-living-frame-result-evidence-locator'
const RESULT_LOCATOR_ID =
  'private-living-frame-semantic-result-locator'
const OBSERVATION_ID = 'observation-living-frame-result-layout'

const plannerInput: PlannerInput = {
  projectName: 'Living Frame preapproval reasoning result smoke',
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
    fileName: 'controlled-result-source.mp4',
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
const visualReaderResult =
  createVisualEvidenceReaderResult(visualFixture)
const visualReader = createVisualEvidenceReader(() => visualReaderResult)
const inputReaderResult = createInputReaderResult({ handoff, components })
const inputReader = createInputReader(() => inputReaderResult)
const context = {
  env: {} as ServiceContext['env'],
  clients: { admin: null, public: null },
  requestId: 'living-frame-preapproval-result-smoke',
  auth: { userId: USER_ID, isMockUser: true },
} satisfies ServiceContext
const planningEvidenceLocator = {
  schemaVersion:
    'canonical-living-frame-planning-evidence-locator-v1' as const,
  serverOwnedLocatorId: EVIDENCE_LOCATOR_ID,
}
const preapprovalRequest = {
  schemaVersion:
    CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_REQUEST_VERSION,
  purpose: 'bind_living_frame_preapproval_input_authority' as const,
  workspaceId: WORKSPACE_ID,
  projectId: PROJECT_ID,
  editSessionId: EDIT_SESSION_ID,
  handoffId: handoff.handoffId,
  planningEvidenceLocator,
}
const preapprovalAuthority =
  await bindCanonicalLivingFramePreapprovalInputAuthority({
    context,
    request: preapprovalRequest,
    inputReader,
    planningEvidenceReader: visualReader,
  })
const planningEvidence =
  await bindCanonicalLivingFramePlanningEvidence({
    locator: planningEvidenceLocator,
    canonicalContext: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      components,
    },
    reader: visualReader,
  })

const budgetAdmissionResult =
  createLivingFrameControlledInternalBudgetAdmission({
    budgetAdmissionId:
      'living-frame-controlled-budget-admission-smoke',
    budgetExpectationId:
      preapprovalAuthority.internalCost.budgetExpectationId,
    livingFramePreapprovalInputAuthorityDigestSha256:
      preapprovalAuthority.authorityDigestSha256,
    rateCardIdentityDigestSha256:
      preapprovalAuthority.internalCost.rateCardIdentityDigestSha256,
    maximumAuthorizedInternalCostMicros:
      preapprovalAuthority.internalCost
        .maximumAuthorizedInternalCostMicros,
  })
if (!budgetAdmissionResult.ok) {
  throw new Error(budgetAdmissionResult.error.message)
}
const budgetAdmission = budgetAdmissionResult.data
const workloadAuthorityResult =
  createPrePlanLivingFrameSemanticReasoningAuthority({
    ...preapprovalAuthority.identity,
    livingFramePreapprovalInputAuthorityDigestSha256:
      preapprovalAuthority.authorityDigestSha256,
    planningEvidenceBindingDigestSha256:
      planningEvidence.contractDigestSha256,
    reasoningRequestDigestSha256:
      preapprovalAuthority.reasoning.requestDigestSha256,
    reasoningResultSchemaDigestSha256:
      preapprovalAuthority.reasoning.resultSchemaDigestSha256,
    routeContractVersion:
      'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek',
    orderedRouteIds: preapprovalAuthority.reasoning.orderedRouteIds,
    routeIdentityDigestSha256:
      preapprovalAuthority.reasoning.routeIdentityDigestSha256,
    rateCardIdentityDigestSha256:
      preapprovalAuthority.internalCost.rateCardIdentityDigestSha256,
    budgetAdmission,
  })
if (!workloadAuthorityResult.ok) {
  throw new Error(workloadAuthorityResult.error.message)
}
const workloadAuthority = workloadAuthorityResult.data
assert.equal(
  createPrePlanLivingFrameSemanticReasoningAuthority({
    ...preapprovalAuthority.identity,
    livingFramePreapprovalInputAuthorityDigestSha256:
      preapprovalAuthority.authorityDigestSha256,
    planningEvidenceBindingDigestSha256:
      planningEvidence.contractDigestSha256,
    reasoningRequestDigestSha256:
      preapprovalAuthority.reasoning.requestDigestSha256,
    reasoningResultSchemaDigestSha256:
      preapprovalAuthority.reasoning.resultSchemaDigestSha256,
    routeContractVersion:
      'motion-studio-storytelling-kimi-gpt-workload-route-v1' as never,
    orderedRouteIds: [
      'kimi_k3_primary',
      'qwen_3_7_fallback',
      'deepseek_v4_pro_fallback',
    ],
    routeIdentityDigestSha256:
      preapprovalAuthority.reasoning.routeIdentityDigestSha256,
    rateCardIdentityDigestSha256:
      preapprovalAuthority.internalCost.rateCardIdentityDigestSha256,
    budgetAdmission,
  }).ok,
  false,
  'The superseded Kimi-to-GPT workload route must fail closed.',
)
assert.equal(
  validatePrePlanLivingFrameSemanticReasoningAuthority({
    ...workloadAuthority,
    orderedRouteIds: [
      'kimi_k3_primary',
      'qwen_2_5_vl_media_analysis',
      'deepseek_v4_pro_fallback',
    ],
  } as never).ok,
  false,
  'Qwen2.5-VL cannot enter the semantic reasoning route.',
)
assert.equal(
  validatePrePlanLivingFrameSemanticReasoningAuthority({
    ...workloadAuthority,
    providerOperationId: 'media-provider-generate-video',
  } as never).ok,
  false,
  'Media-provider operations cannot enter the workload authority.',
)
assert.equal(
  validatePrePlanReasoningWorkloadAuthority({
    ...workloadAuthority,
    authorityClass: 'pre_plan_edit_reference_study_chat',
  } as never).ok,
  false,
  'Cross-lane authority objects must fail strict discriminated validation.',
)
assertBudgetBreachRejected()

const semanticResult = createSemanticResult()
assert.equal(
  canonicalLivingFrameControlledSemanticReasoningResultSchema
    .safeParse(semanticResult).success,
  true,
)
const controlledRunReceipt = createControlledLivingFrameRunReceipt({
  authority: workloadAuthority,
  finalResultDigestSha256: semanticResult.resultDigestSha256,
})
const exactReaderProjection =
  canonicalLivingFramePreapprovalReasoningResultReaderResultSchema.parse({
    schemaVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_RESULT_VERSION,
    sourceAuthority:
      'controlled_living_frame_reasoning_result_fixture_reader',
    evidenceClass:
      'controlled_non_promotable_reasoning_result_reader_projection',
    promotionAllowed: false,
    productionReady: false,
    serverOwnedLocatorId: RESULT_LOCATOR_ID,
    budgetAdmission,
    canonicalRunReceipt: controlledRunReceipt,
    semanticResult,
  })
let resultReadCount = 0
const resultReader =
  createCanonicalLivingFramePreapprovalReasoningResultReader({
    async readByServerOwnedLocator(input) {
      resultReadCount += 1
      assert.equal(input.serverOwnedLocatorId, RESULT_LOCATOR_ID)
      assert.deepEqual(input.expectedScope, {
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        editSessionId: EDIT_SESSION_ID,
      })
      assert.equal(input.expectedHandoffId, handoff.handoffId)
      assert.equal(
        input.expectedPreapprovalInputAuthorityDigestSha256,
        preapprovalAuthority.authorityDigestSha256,
      )
      return exactReaderProjection
    },
  })

const resultRequest = {
  schemaVersion:
    CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_REQUEST_VERSION,
  purpose: (
    'bind_controlled_living_frame_preapproval_reasoning_result'
  ) as const,
  workspaceId: WORKSPACE_ID,
  projectId: PROJECT_ID,
  editSessionId: EDIT_SESSION_ID,
  handoffId: handoff.handoffId,
  planningEvidenceLocator,
  reasoningResultLocator: {
    schemaVersion:
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_LOCATOR_VERSION,
    serverOwnedLocatorId: RESULT_LOCATOR_ID,
  },
}

const binding =
  await bindCanonicalLivingFramePreapprovalReasoningResult({
    context,
    request: resultRequest,
    inputReader,
    planningEvidenceReader: visualReader,
    resultReader,
  })

assert.equal(resultReadCount, 2)
assert.equal(
  binding.evidenceClass,
  'controlled_non_promotable_reasoning_result_binding',
)
assert.equal(binding.overallDecision, 'candidates_proposed')
assert.equal(binding.decisions.length, 2)
assert.equal(binding.decisions[0]?.decisionKind, 'semantic_candidate')
assert.equal(binding.decisions[1]?.decisionKind, 'rejected_candidate')
assert.equal(binding.reasoningResultReReadByServer, true)
assert.equal(binding.controlledRunSummary.terminalState, 'completed')
assert.equal(binding.controlledRunSummary.attemptCount, 3)
assert.equal(binding.controlledRunSummary.failedAttemptCount, 2)
assert.equal(binding.controlledRunSummary.failedAttemptCostRetained, true)
assert.equal(
  binding.controlledRunSummary.withinAuthorizedInternalCostCeiling,
  true,
)
assert.deepEqual(
  binding.authorityBoundary,
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_AUTHORITY_BOUNDARY,
)
assert.equal(
  canonicalLivingFramePreapprovalReasoningResultBindingSchema
    .safeParse(binding).success,
  true,
)
assert.equal(
  binding.canonicalBindings.semanticResultDigestSha256,
  semanticResult.resultDigestSha256,
)
assert.equal(
  binding.canonicalBindings.canonicalReasoningRunReceiptDigestSha256,
  controlledRunReceipt.receiptDigestSha256,
)

const serializedBinding = JSON.stringify(binding)
for (const forbiddenKey of [
  'rawChat',
  'rawTranscript',
  'sourceFileName',
  'signedUrl',
  'credential',
  'apiKey',
  'provider',
  'exactProviderModelId',
  'routeIds',
  'toolId',
  'toolRoute',
  'jobId',
  'queueId',
  'workItem',
  'startFrame',
  'endFrameExclusive',
  'soundCue',
  'snapshotId',
  'approvedAt',
  'creditReservationId',
  'customerPrice',
  'serviceFeeAmount',
  'scenePlans',
  'capabilityRequirements',
]) {
  assert.equal(
    serializedBinding.includes(`"${forbiddenKey}"`),
    false,
    `Reasoning-result binding must not expose ${forbiddenKey}.`,
  )
}

for (const injectedField of [
  'rawChat',
  'rawTranscript',
  'providerRoute',
  'providerModel',
  'providerOperationId',
  'toolId',
  'queueId',
  'approved',
  'allGreen',
  'customerCredits',
  'serviceFee',
  'scenePlans',
  'capabilityRequirements',
  'startFrame',
  'soundCue',
]) {
  assert.equal(
    canonicalLivingFramePreapprovalReasoningResultRequestSchema.safeParse({
      ...resultRequest,
      [injectedField]: true,
    }).success,
    false,
    `Caller request must not admit ${injectedField}.`,
  )
}

await assert.rejects(
  bindCanonicalLivingFramePreapprovalReasoningResult({
    context,
    request: resultRequest,
    inputReader,
    planningEvidenceReader: visualReader,
    resultReader: null,
  }),
  /process-bound controlled result-reader capability/,
)
await assert.rejects(
  bindCanonicalLivingFramePreapprovalReasoningResult({
    context,
    request: resultRequest,
    inputReader,
    planningEvidenceReader: visualReader,
    resultReader: JSON.parse(JSON.stringify({
      ...resultReader,
      allGreen: true,
      productionReady: true,
    })) as never,
  }),
  /process-bound controlled result-reader capability/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    serverOwnedLocatorId: 'foreign-result-locator',
  }),
  /another server-owned locator/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    promotionAllowed: true,
    productionReady: true,
  }),
  /invalid projection/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    budgetAdmission: {
      ...budgetAdmission,
      maximumAuthorizedInternalCostMicros: '1',
    },
  }),
  /invalid projection/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    canonicalRunReceipt: {
      ...controlledRunReceipt,
      terminalState: 'unknown_reconciliation_required',
    },
  }),
  /invalid projection/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    semanticResult: {
      ...semanticResult,
      resultDigestSha256: digest('forged-semantic-result'),
    },
  }),
  /invalid projection/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    semanticResult: {
      ...semanticResult,
      decisions: semanticResult.decisions.map((decision) => ({
        ...decision,
        evidenceReferences: [{
          kind: 'source_visual_observation',
          sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
          observationId: 'unknown-observation',
          evidenceSetDigestSha256:
            planningEvidence.evidenceSetDigestSha256,
        }],
      })),
      resultDigestSha256: digest('replaced-below'),
    },
  }, true),
  /unknown source observation/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    semanticResult: semanticResultWithUnsafeSummary(
      'https://example.com/raw-instruction',
    ),
  }),
  /invalid projection/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    semanticResult: rehashSemanticResult({
      ...semanticResult,
      decisions: [
        { ...semanticResult.decisions[0]!, order: 1 },
        { ...semanticResult.decisions[1]!, order: 0 },
      ],
    }),
  }),
  /invalid projection/,
)
await assert.rejects(
  bindWithReaderProjection({
    ...exactReaderProjection,
    semanticResult: rehashSemanticResult({
      ...semanticResult,
      overallDecision: 'deliberate_non_use',
    }),
  }),
  /invalid projection/,
)

let racingResultReadCount = 0
const racingReader =
  createCanonicalLivingFramePreapprovalReasoningResultReader({
    async readByServerOwnedLocator() {
      racingResultReadCount += 1
      if (racingResultReadCount === 1) return exactReaderProjection
      return {
        ...exactReaderProjection,
        serverOwnedLocatorId: RESULT_LOCATOR_ID,
        semanticResult: createDeliberateNonUseResult(),
      }
    },
  })
await assert.rejects(
  bindCanonicalLivingFramePreapprovalReasoningResult({
    context,
    request: resultRequest,
    inputReader,
    planningEvidenceReader: visualReader,
    resultReader: racingReader,
  }),
  /changed during server revalidation|does not match its exact/,
)

assertEditReferenceByteIdentity()

console.log(JSON.stringify({
  contractVersion: binding.contractVersion,
  evidenceClass: binding.evidenceClass,
  semanticCandidatesRemainUnselected: true,
  planningEvidenceRevalidated: true,
  currentHandoffRevalidated: true,
  resultReRead: true,
  exactRouteAndRateCardBound: true,
  controlledBudgetAdmissionBound: true,
  failedAttemptCostRetained: true,
  completedReceiptRequiredForResultDigest: true,
  processBoundReaderRequired: true,
  oldKimiGptAndMediaReasoningRoutesImpossible: true,
  editReferenceReceiptByteIdentityPreserved: true,
  allRuntimeAndCommercialAuthoritiesClosed: true,
  productionReady: false,
}))

async function bindWithReaderProjection(
  projection: unknown,
  rehashResult = false,
) {
  let resolvedProjection = projection
  if (
    rehashResult
    && projection
    && typeof projection === 'object'
    && 'semanticResult' in projection
  ) {
    const updatedSemanticResult = rehashSemanticResult(
      (projection as typeof exactReaderProjection).semanticResult,
    )
    resolvedProjection = {
      ...projection,
      semanticResult: updatedSemanticResult,
      canonicalRunReceipt: createControlledLivingFrameRunReceipt({
        authority: workloadAuthority,
        finalResultDigestSha256:
          updatedSemanticResult.resultDigestSha256,
      }),
    }
  }
  const reader =
    createCanonicalLivingFramePreapprovalReasoningResultReader({
      async readByServerOwnedLocator() {
        return resolvedProjection
      },
    })
  return bindCanonicalLivingFramePreapprovalReasoningResult({
    context,
    request: resultRequest,
    inputReader,
    planningEvidenceReader: visualReader,
    resultReader: reader,
  })
}

function createSemanticResult():
  LivingFrameControlledSemanticReasoningResult {
  return rehashSemanticResult({
    schemaVersion:
      'living-frame-preapproval-reasoning-result-expectation-v1',
    resultClass:
      'controlled_living_frame_semantic_reasoning_result_fixture',
    evidenceClass:
      'controlled_non_promotable_semantic_reasoning_result',
    promotionAllowed: false,
    productionReady: false,
    identity: {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      editSessionId: EDIT_SESSION_ID,
      handoffId: handoff.handoffId,
    },
    livingFramePreapprovalInputAuthorityDigestSha256:
      preapprovalAuthority.authorityDigestSha256,
    planningEvidenceBindingDigestSha256:
      planningEvidence.contractDigestSha256,
    reasoningRequestDigestSha256:
      preapprovalAuthority.reasoning.requestDigestSha256,
    reasoningResultSchemaDigestSha256:
      preapprovalAuthority.reasoning.resultSchemaDigestSha256,
    overallDecision: 'candidates_proposed',
    decisions: [{
      decisionId: 'living-frame-semantic-candidate-1',
      order: 0,
      decisionKind: 'semantic_candidate',
      reasonCode:
        'explanation_benefits_from_in_frame_visualization',
      derivedSummary:
        'Build the geographic explanation beside the speaker while preserving face and gesture priority.',
      evidenceReferences: [{
        kind: 'source_visual_observation',
        sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
        observationId: OBSERVATION_ID,
        evidenceSetDigestSha256:
          planningEvidence.evidenceSetDigestSha256,
      }],
      mode: 'living_a_roll',
      narrativePurpose: 'establish_geography',
      visualVerb: 'reveal',
      importance: 'important',
      sourceTruthMode: 'exact_geography_verification_required',
    }, {
      decisionId: 'living-frame-rejected-candidate-1',
      order: 1,
      decisionKind: 'rejected_candidate',
      reasonCode: 'simpler_treatment_preferred',
      derivedSummary:
        'Reject a full takeover because the source composition can carry a restrained in-frame explanation.',
      evidenceReferences: [{
        kind: 'source_visual_observation',
        sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
        observationId: OBSERVATION_ID,
        evidenceSetDigestSha256:
          planningEvidence.evidenceSetDigestSha256,
      }],
      mode: 'hybrid_expansion',
      narrativePurpose: 'establish_geography',
      visualVerb: 'expand',
      importance: 'support',
      sourceTruthMode: 'exact_geography_verification_required',
    }],
    selectedSceneAuthority: false,
    exactFrameAuthority: false,
    exactSoundCueAuthority: false,
    customerEstimateAuthority: false,
    providerOrToolSelectionAuthority: false,
    approvalOrRuntimeAuthority: false,
    resultDigestSha256: digest('placeholder'),
  })
}

function createDeliberateNonUseResult():
  LivingFrameControlledSemanticReasoningResult {
  return rehashSemanticResult({
    ...createSemanticResult(),
    overallDecision: 'deliberate_non_use',
    decisions: [{
      decisionId: 'living-frame-deliberate-non-use',
      order: 0,
      decisionKind: 'deliberate_non_use',
      reasonCode: 'emotional_face_priority',
      derivedSummary:
        'Keep the speaker unobstructed because emotional delivery is the primary visual.',
      evidenceReferences: [{
        kind: 'source_visual_observation',
        sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
        observationId: OBSERVATION_ID,
        evidenceSetDigestSha256:
          planningEvidence.evidenceSetDigestSha256,
      }],
    }],
  })
}

function semanticResultWithUnsafeSummary(
  unsafeSummary: string,
): LivingFrameControlledSemanticReasoningResult {
  return rehashSemanticResult({
    ...semanticResult,
    decisions: semanticResult.decisions.map((decision, index) => (
      index === 0
        ? { ...decision, derivedSummary: unsafeSummary }
        : decision
    )),
  })
}

function rehashSemanticResult(
  input: LivingFrameControlledSemanticReasoningResult,
): LivingFrameControlledSemanticReasoningResult {
  const {
    resultDigestSha256: _resultDigestSha256,
    ...withoutDigest
  } = input
  void _resultDigestSha256
  return {
    ...withoutDigest,
    resultDigestSha256: sha256AuthorityValue(withoutDigest),
  }
}

function createControlledLivingFrameRunReceipt(input: {
  authority: PrePlanLivingFrameSemanticReasoningAuthority
  finalResultDigestSha256: string
}): CanonicalReasoningRunReceipt<
  PrePlanLivingFrameSemanticReasoningAuthority
> {
  const nativeUsage: ReasoningModelTokenUsage = {
    uncachedInputTokens: 10_000,
    cachedInputTokens: 1_000,
    cacheCreationInputTokens: 0,
    outputTokens: 1_000,
    cacheBillingMode: 'provider_native',
  }
  const qwenUsage: ReasoningModelTokenUsage = {
    ...nativeUsage,
    cacheBillingMode: 'qwen_implicit',
  }
  const kimi = createLivingFrameAttempt({
    authority: input.authority,
    routeId: 'kimi_k3_primary',
    attemptOrdinal: 1,
    entryFallbackTrigger: null,
    terminalOutcome: 'failed',
    terminalFallbackTrigger: 'provider_timeout',
    usage: nativeUsage,
    recordedAt: '2026-07-26T15:00:10.000Z',
  })
  const qwen = createLivingFrameAttempt({
    authority: input.authority,
    routeId: 'qwen_3_7_fallback',
    attemptOrdinal: 2,
    entryFallbackTrigger: 'provider_timeout',
    terminalOutcome: 'failed',
    terminalFallbackTrigger: 'malformed_structured_output',
    usage: qwenUsage,
    fxSnapshot: {
      snapshotId: 'fx-living-frame-result-smoke',
      source: 'immutable controlled FX fixture',
      sourceUrl: 'https://example.com/immutable-fx-fixture',
      observedAt: '2026-07-26T14:59:00.000Z',
      cnyToUsdMicrosPerCny: 140_000,
    },
    recordedAt: '2026-07-26T15:00:20.000Z',
  })
  const deepseek = createLivingFrameAttempt({
    authority: input.authority,
    routeId: 'deepseek_v4_pro_fallback',
    attemptOrdinal: 3,
    entryFallbackTrigger: 'malformed_structured_output',
    terminalOutcome: 'completed',
    terminalFallbackTrigger: null,
    usage: nativeUsage,
    recordedAt: '2026-07-26T15:00:30.000Z',
  })
  const reordered =
    aggregateReasoningModelAttemptCostsV2([qwen, kimi])
  assert.equal(reordered.ok, false)
  if (reordered.ok) {
    throw new Error('Reordered reasoning attempts unexpectedly passed.')
  }
  assert.equal(reordered.error.code, 'non_contiguous_route_chain')
  const duplicated =
    aggregateReasoningModelAttemptCostsV2([kimi, kimi])
  assert.equal(duplicated.ok, false)
  if (duplicated.ok) {
    throw new Error('Duplicate reasoning attempts unexpectedly passed.')
  }
  assert.equal(duplicated.error.code, 'duplicate_attempt')
  const aggregate =
    aggregateReasoningModelAttemptCostsV2([kimi, qwen, deepseek])
  if (!aggregate.ok) throw new Error(aggregate.error.message)
  assert.equal(aggregate.data.failedAttemptCount, 2)
  assert.equal(aggregate.data.failedAttemptCostRetained, true)
  assert.equal(
    aggregate.data.withinAuthorizedInternalCostCeiling,
    true,
  )
  const lifecycle = [
    createLivingFrameLifecycle(
      kimi,
      '2026-07-26T15:00:00.000Z',
      '2026-07-26T15:00:10.000Z',
      'provider_timeout',
    ),
    createLivingFrameLifecycle(
      qwen,
      '2026-07-26T15:00:11.000Z',
      '2026-07-26T15:00:20.000Z',
      'malformed_structured_output',
    ),
    createLivingFrameLifecycle(
      deepseek,
      '2026-07-26T15:00:21.000Z',
      '2026-07-26T15:00:30.000Z',
      null,
    ),
  ]
  const receipt = createCanonicalReasoningRunReceipt({
    workloadAuthority: input.authority,
    attempts: [
      { costEvidence: kimi, lifecycleEvidence: lifecycle[0]! },
      { costEvidence: qwen, lifecycleEvidence: lifecycle[1]! },
      { costEvidence: deepseek, lifecycleEvidence: lifecycle[2]! },
    ],
    finalResultDigestSha256: input.finalResultDigestSha256,
    createdAt: '2026-07-26T15:00:00.000Z',
    terminalAt: '2026-07-26T15:00:30.000Z',
  })
  if (!receipt.ok) throw new Error(receipt.error.message)
  assert.equal(validateCanonicalReasoningRunReceipt(receipt.data).ok, true)
  return receipt.data
}

function assertBudgetBreachRejected(): void {
  const constrainedAdmissionResult =
    createLivingFrameControlledInternalBudgetAdmission({
      budgetAdmissionId:
        'living-frame-constrained-budget-admission-smoke',
      budgetExpectationId:
        preapprovalAuthority.internalCost.budgetExpectationId,
      livingFramePreapprovalInputAuthorityDigestSha256:
        preapprovalAuthority.authorityDigestSha256,
      rateCardIdentityDigestSha256:
        preapprovalAuthority.internalCost.rateCardIdentityDigestSha256,
      maximumAuthorizedInternalCostMicros: '1',
    })
  if (!constrainedAdmissionResult.ok) {
    throw new Error(constrainedAdmissionResult.error.message)
  }
  const constrainedAuthorityResult =
    createPrePlanLivingFrameSemanticReasoningAuthority({
      ...preapprovalAuthority.identity,
      livingFramePreapprovalInputAuthorityDigestSha256:
        preapprovalAuthority.authorityDigestSha256,
      planningEvidenceBindingDigestSha256:
        planningEvidence.contractDigestSha256,
      reasoningRequestDigestSha256:
        preapprovalAuthority.reasoning.requestDigestSha256,
      reasoningResultSchemaDigestSha256:
        preapprovalAuthority.reasoning.resultSchemaDigestSha256,
      routeContractVersion:
        'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek',
      orderedRouteIds: preapprovalAuthority.reasoning.orderedRouteIds,
      routeIdentityDigestSha256:
        preapprovalAuthority.reasoning.routeIdentityDigestSha256,
      rateCardIdentityDigestSha256:
        preapprovalAuthority.internalCost.rateCardIdentityDigestSha256,
      budgetAdmission: constrainedAdmissionResult.data,
    })
  if (!constrainedAuthorityResult.ok) {
    throw new Error(constrainedAuthorityResult.error.message)
  }
  const overBudgetAttempt = createLivingFrameAttempt({
    authority: constrainedAuthorityResult.data,
    routeId: 'kimi_k3_primary',
    attemptOrdinal: 1,
    entryFallbackTrigger: null,
    terminalOutcome: 'completed',
    terminalFallbackTrigger: null,
    usage: {
      uncachedInputTokens: 1_000,
      cachedInputTokens: 0,
      cacheCreationInputTokens: 0,
      outputTokens: 100,
      cacheBillingMode: 'provider_native',
    },
    recordedAt: '2026-07-26T14:59:30.000Z',
  })
  const aggregate =
    aggregateReasoningModelAttemptCostsV2([overBudgetAttempt])
  assert.equal(aggregate.ok, false)
  if (aggregate.ok) {
    throw new Error('Over-budget reasoning attempt unexpectedly passed.')
  }
  assert.equal(aggregate.error.code, 'internal_cost_ceiling_exceeded')
}

function createLivingFrameAttempt(input: {
  authority: PrePlanLivingFrameSemanticReasoningAuthority
  routeId:
    | 'kimi_k3_primary'
    | 'qwen_3_7_fallback'
    | 'deepseek_v4_pro_fallback'
  attemptOrdinal: 1 | 2 | 3
  entryFallbackTrigger:
    | 'provider_timeout'
    | 'malformed_structured_output'
    | null
  terminalOutcome: 'completed' | 'failed'
  terminalFallbackTrigger:
    | 'provider_timeout'
    | 'malformed_structured_output'
    | null
  usage: ReasoningModelTokenUsage
  fxSnapshot?: ReasoningModelFxSnapshot
  recordedAt: string
}): ReasoningModelAttemptCostEvidenceV2<
  PrePlanLivingFrameSemanticReasoningAuthority
> {
  const attemptId = `living-frame-${input.routeId}-attempt`
  const created = createReasoningModelAttemptCostEvidenceV2({
    workloadAuthority: input.authority,
    reasoningRunId: 'living-frame-controlled-reasoning-run',
    attemptId,
    attemptOrdinal: input.attemptOrdinal,
    routeId: input.routeId,
    routeAuthorizationDigestSha256:
      digest(`${attemptId}:route-authority`),
    idempotencyKeyDigestSha256:
      digest(`${attemptId}:idempotency`),
    requestPayloadHashSha256:
      input.authority.reasoningRequestDigestSha256,
    providerUsageEvidenceHashSha256:
      digest(`${attemptId}:usage`),
    entryFallbackTrigger: input.entryFallbackTrigger,
    terminalOutcome: input.terminalOutcome,
    terminalFallbackTrigger: input.terminalFallbackTrigger,
    usage: input.usage,
    ...(input.fxSnapshot ? { fxSnapshot: input.fxSnapshot } : {}),
    recordedAt: input.recordedAt,
  })
  if (!created.ok) throw new Error(created.error.message)
  return created.data
}

function createLivingFrameLifecycle(
  evidence: ReasoningModelAttemptCostEvidenceV2<
    PrePlanLivingFrameSemanticReasoningAuthority
  >,
  startedAt: string,
  terminalAt: string,
  failureCode: string | null,
): CanonicalReasoningRouteAttemptLifecycleEvidence {
  const lifecycle =
    createCanonicalReasoningRouteAttemptLifecycleEvidence({
      costEvidence: evidence,
      providerRequestRecordId: `${evidence.attemptId}-request`,
      providerRequestEvidenceDigestSha256:
        digest(`${evidence.attemptId}:request`),
      oneUseSubmissionAuthorityDigestSha256:
        digest(`${evidence.attemptId}:one-use`),
      providerObservationDigestSha256:
        digest(`${evidence.attemptId}:observation`),
      providerCheckbackRecordId: null,
      providerWorkflowRecordId: null,
      startedAt,
      terminalAt,
      sanitizedFailureCode: failureCode,
    })
  if (!lifecycle.ok) throw new Error(lifecycle.error.message)
  return lifecycle.data
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
        'living-frame-result-budget-expectation-smoke',
      evidenceClass:
        'controlled_non_promotable_internal_cost_ceiling_expectation',
      rateCardVersion:
        'reeditpro-reasoning-model-rate-card-v1-2026-07-18',
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
  const sourceBinding = {
    sourceSequenceItemId: SOURCE_SEQUENCE_ITEM_ID,
    mediaAssetId: MEDIA_ASSET_ID,
    uploadedOrder: 1,
    required: true,
    uploadIntentId: 'upload-intent-living-frame-result-smoke',
    storageObjectRecordId:
      'storage-object-living-frame-result-smoke',
    storageProvider: 'local_private' as const,
    mimeType: 'video/mp4',
    sizeBytes: 10_000_000,
    checksumSha256: SOURCE_CHECKSUM,
    storageIdentityHash:
      digest('living-frame-result-storage-identity'),
    bindingHash: digest('living-frame-result-source-binding'),
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
      digest('living-frame-result-source-authority'),
    sourceSequenceHash:
      sha256AuthorityValue(canonicalPlanComponents.sourceSequence),
    bindings: [sourceBinding],
    requiredBindingCount: 1,
    candidateHash: digest('living-frame-result-source-candidate'),
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
    planningInputAuthority:
      planningInputAuthorityExpectationFromResolvedBinding(
        planningInputBinding,
      ),
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
        digest('living-frame-result-preference'),
      values,
      effectiveValues: values,
      instructionSource: 'current_edit_preferences' as const,
      explicitChatOverrideKeys: [],
      explicitChatOverrides: {},
      instructionHash:
        digest('living-frame-result-preference-instruction'),
      baseline: {
        preferenceSnapshotId:
          'living-frame-result-preference-snapshot',
        persistenceSource: 'server_defaults' as const,
        provenance: 'server_default_preferences' as const,
      },
      sourcePreparationEvidenceHash:
        digest('living-frame-result-source-preparation'),
      sourceCandidateHash:
        digest('living-frame-result-source-candidate'),
      frameConfirmationId:
        'living-frame-result-frame-confirmation',
      confirmedAspectRatio: '16:9' as const,
      lifecyclePhase: 'planning' as const,
      locked: false,
    },
    preferenceApplication: {
      status: 'not_selected' as const,
      applicationVersion: 0 as const,
      applicationHash:
        digest('living-frame-result-no-preference-application'),
    },
    editBrief: {
      status: 'not_used' as const,
      deterministicHash:
        digest('living-frame-result-no-edit-brief'),
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
        'living-frame-result-preference-snapshot',
      preferenceRevision: 1,
      preferencePlanningInputRevision: 1,
      preferenceFingerprintSha256:
        digest('living-frame-result-preference'),
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
        decisionId: 'cleanup-living-frame-result-source',
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
      id: 'master-timing-living-frame-result',
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
      segmentId: 'segment-living-frame-result-1',
      startFrame: 0,
      endFrameExclusive: 300,
      operationIds: ['operation-living-frame-result-1'],
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
  resultFactory: () => PrivateLivingFramePlanningEvidenceReaderResult,
): CanonicalLivingFramePlanningEvidenceReaderPort {
  return {
    schemaVersion:
      CANONICAL_LIVING_FRAME_PLANNING_EVIDENCE_READER_VERSION,
    sourceAuthority: 'private_gcp_visual_evidence_repository',
    evidenceClass: 'controlled_private_source_evidence_reader',
    productionReady: false,
    async readByServerOwnedLocator(input) {
      assert.equal(
        input.serverOwnedLocatorId,
        EVIDENCE_LOCATOR_ID,
      )
      assert.deepEqual(input.expectedScope, {
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        editSessionId: EDIT_SESSION_ID,
      })
      return resultFactory()
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
      'living-frame-result-scene-detection',
    sceneDetectionArtifactSha256:
      digest('living-frame-result-scene-detection'),
    detectedSceneCount: 1,
    visuallyCoveredSceneCount: 1,
    maximumUnobservedSpanSeconds: 10,
    samplesPerBatchMaximum: 64,
    batchCount: 1,
    samples: [{
      sampleId: 'sample-living-frame-result-baseline',
      sourceFrame: 0,
      reason: 'scene_representative',
      source: 'analysis_proxy_frame',
      proxyFrameChecksumSha256:
        digest('living-frame-result-proxy-frame'),
      rawFramePersistenceAllowed: false,
    }],
    windows: [{
      windowId: 'window-living-frame-result-baseline',
      reason: 'scene_representative',
      detectedSceneId: 'detected-scene-living-frame-result-1',
      startFrame: 0,
      endFrameExclusive: 300,
      required: true,
      sampleIds: ['sample-living-frame-result-baseline'],
    }],
  }
  const coverage: PrivateGcpVisualCoverageManifest = {
    ...coverageWithoutDigest,
    coverageDigestSha256:
      calculatePrivateGcpVisualCoverageDigest(coverageWithoutDigest),
  }
  const plan = createPrivateGcpVisualUnderstandingPlan({
    analysisRunId: 'analysis-run-living-frame-result',
    attemptId: 'attempt-living-frame-result-1',
    attemptOrdinal: 1,
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    editSessionId: EDIT_SESSION_ID,
    idempotencyKey: 'living-frame-result-analysis-attempt-1',
    authority: {
      phase: 'preplan_internal_source_analysis',
      authenticatedUserId: USER_ID,
      sourceStudyAuthorizationId:
        'source-study-living-frame-result',
      internalAnalysisBudgetAuthorityId:
        'internal-budget-living-frame-result',
      userAnalysisConsentRecordedAt: '2026-07-26T12:00:00.000Z',
      customerCreditReservationId: null,
      customerChargeAuthorized: false,
    },
    source: {
      sourceAssetId: MEDIA_ASSET_ID,
      storageBucket: 'reeditpro-private-media',
      storageObjectName:
        'workspaces/living-frame-result/source/original.mp4',
      storageObjectGeneration: '223456789',
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
      proxyAssetId: 'proxy-asset-living-frame-result',
      storageBucket: 'reeditpro-private-media',
      storageObjectName:
        'workspaces/living-frame-result/proxy/analysis.mp4',
      storageObjectGeneration: '223456790',
      proxyChecksumSha256: digest('living-frame-result-proxy'),
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
        digest('living-frame-result-qwen-checkpoint'),
      tokenizerSha256:
        digest('living-frame-result-qwen-tokenizer'),
      processorSha256:
        digest('living-frame-result-qwen-processor'),
      containerImageDigest:
        `sha256:${digest('living-frame-result-visual-worker')}`,
      precision: 'bf16',
      modelApprovalRecordId:
        'living-frame-result-model-approval',
      licenseReviewRecordId:
        'living-frame-result-license-review',
    },
    coverage,
    evidenceSchemaVersion:
      'private-gcp-qwen25vl-evidence-schema-v1',
    promptPolicyVersion:
      'private-gcp-qwen25vl-visual-prompt-policy-v1',
    serverReadiness: verifiedVisualReadinessFixture(),
  })
  const observations: PrivateGcpVisualObservation[] = [{
    observationId: OBSERVATION_ID,
    startFrame: 0,
    endFrameExclusive: 300,
    evidenceSampleIds: ['sample-living-frame-result-baseline'],
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
      'window-living-frame-result-baseline',
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
      'controlled-living-frame-result-readiness-fixture',
    readinessEvidenceSha256:
      digest('controlled-living-frame-result-readiness'),
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

function assertEditReferenceByteIdentity(): void {
  const request: EditReferenceStudyChatReasoningRequest = {
    schemaVersion: EDIT_REFERENCE_STUDY_CHAT_REASONING_REQUEST_VERSION,
    workspaceId: 'workspace-reasoning-run-smoke',
    actorUserId: 'user-reasoning-run-smoke',
    editReferenceId: 'reference-reasoning-run-smoke',
    studySessionId: 'study-reasoning-run-smoke',
    expectedStudyRevision: 7,
    clientMessageDigestSha256:
      digest('client-message-reasoning-run-smoke'),
    structuredContextDigestSha256:
      digest('structured-context-reasoning-run-smoke'),
    maxContextCharacters: 32_000,
    executionScope: 'production',
    approvedUsageEstimateId:
      'study-usage-estimate-reasoning-run-smoke',
    internalCostBudgetId: 'study-cost-budget-reasoning-run-smoke',
    immutableRateCardSnapshotId:
      'rate-card-snapshot-reasoning-run-smoke',
    maximumAuthorizedInternalCostMicros: '5000000',
    rawMediaInputAllowed: false,
    rawTranscriptInputAllowed: false,
    projectChatHistoryInputAllowed: false,
    externalUrlFetchAllowed: false,
    exactReferenceWordingTransferAllowed: false,
    exactReferenceSequenceTransferAllowed: false,
    exactReferenceTimingTransferAllowed: false,
    referenceIdentityTransferAllowed: false,
    evidenceMutationAllowed: false,
    dnaMutationAllowed: false,
    approvalMutationAllowed: false,
    targetOperationCreationAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
  }
  const requestDigest =
    hashEditReferenceStudyChatReasoningRequest(request)
  const authorityResult =
    createPrePlanEditReferenceStudyChatReasoningAuthority({
      workspaceId: request.workspaceId,
      actorUserId: request.actorUserId,
      editReferenceId: request.editReferenceId,
      studySessionId: request.studySessionId,
      studyRevision: request.expectedStudyRevision,
      reasoningRequestDigestSha256: requestDigest,
      approvedUsageEstimateId: request.approvedUsageEstimateId!,
      internalCostBudgetId: request.internalCostBudgetId!,
      immutableRateCardSnapshotId:
        request.immutableRateCardSnapshotId!,
      maximumAuthorizedInternalCostMicros:
        request.maximumAuthorizedInternalCostMicros!,
    })
  if (!authorityResult.ok) {
    throw new Error(authorityResult.error.message)
  }
  assert.equal(
    authorityResult.data.authorityDigestSha256,
    '0b4b4542d148110e2c94e7908b2573c6ea32a59525d6d15b1f26c2f2ad3ed98b',
  )
  const nativeUsage: ReasoningModelTokenUsage = {
    uncachedInputTokens: 100_000,
    cachedInputTokens: 50_000,
    cacheCreationInputTokens: 0,
    outputTokens: 10_000,
    cacheBillingMode: 'provider_native',
  }
  const qwenUsage: ReasoningModelTokenUsage = {
    ...nativeUsage,
    cacheBillingMode: 'qwen_implicit',
  }
  const studyAttempts = [
    createStudyAttempt({
      authority: authorityResult.data,
      routeId: 'kimi_k3_primary',
      ordinal: 1,
      entryTrigger: null,
      outcome: 'failed',
      terminalTrigger: 'provider_timeout',
      usage: nativeUsage,
      recordedAt: '2026-07-20T16:00:10.000Z',
    }),
    createStudyAttempt({
      authority: authorityResult.data,
      routeId: 'qwen_3_7_fallback',
      ordinal: 2,
      entryTrigger: 'provider_timeout',
      outcome: 'failed',
      terminalTrigger: 'malformed_structured_output',
      usage: qwenUsage,
      fxSnapshot: {
        snapshotId: 'fx-cny-usd-study-chat-smoke-v1',
        source: 'immutable controlled FX fixture',
        sourceUrl: 'https://example.com/immutable-fx-fixture',
        observedAt: '2026-07-20T15:59:00.000Z',
        cnyToUsdMicrosPerCny: 140_000,
      },
      recordedAt: '2026-07-20T16:00:20.000Z',
    }),
    createStudyAttempt({
      authority: authorityResult.data,
      routeId: 'deepseek_v4_pro_fallback',
      ordinal: 3,
      entryTrigger: 'malformed_structured_output',
      outcome: 'completed',
      terminalTrigger: null,
      usage: nativeUsage,
      recordedAt: '2026-07-20T16:00:30.000Z',
    }),
  ] as const
  assert.equal(
    studyAttempts[0].evidenceHashSha256,
    'd136376d73df3aa2eaf29ca0c8fd837e2159e91b7a9e45eea2e7e7cea876abe5',
  )
  const lifecycle = [
    createStudyLifecycle(
      studyAttempts[0],
      '2026-07-20T16:00:00.000Z',
      '2026-07-20T16:00:10.000Z',
      'provider_timeout',
    ),
    createStudyLifecycle(
      studyAttempts[1],
      '2026-07-20T16:00:11.000Z',
      '2026-07-20T16:00:20.000Z',
      'malformed_structured_output',
    ),
    createStudyLifecycle(
      studyAttempts[2],
      '2026-07-20T16:00:21.000Z',
      '2026-07-20T16:00:30.000Z',
      null,
    ),
  ] as const
  assert.equal(
    lifecycle[0].lifecycleEvidenceDigestSha256,
    '6fcf01673929f2ac255ec0336a45f991b2fb9438a8dc2c8d676cfeb1a918e71d',
  )
  const canonical = createCanonicalReasoningRunReceipt({
    workloadAuthority: authorityResult.data,
    attempts: [
      {
        costEvidence: studyAttempts[0],
        lifecycleEvidence: lifecycle[0],
      },
      {
        costEvidence: studyAttempts[1],
        lifecycleEvidence: lifecycle[1],
      },
      {
        costEvidence: studyAttempts[2],
        lifecycleEvidence: lifecycle[2],
      },
    ],
    finalResultDigestSha256: digest('bounded-study-chat-answer'),
    createdAt: '2026-07-20T16:00:00.000Z',
    terminalAt: '2026-07-20T16:00:30.000Z',
  })
  if (!canonical.ok) throw new Error(canonical.error.message)
  assert.equal(
    canonical.data.receiptDigestSha256,
    'a49078572fa95c325bbdfe380c5b73fd658c7bfa5a2a5926e5633e7ca69d6d02',
  )
  const studyReceipt =
    createEditReferenceStudyChatReasoningRunReceipt({
      request,
      canonicalReceipt: canonical.data,
    })
  assert.equal(
    studyReceipt.receiptDigestSha256,
    'b22b56bd44051564fbf663e43333c6f5c43b604a21a588cc37225d530e9247ae',
  )
}

function createStudyAttempt(input: {
  authority: PrePlanEditReferenceStudyChatReasoningAuthority
  routeId:
    | 'kimi_k3_primary'
    | 'qwen_3_7_fallback'
    | 'deepseek_v4_pro_fallback'
  ordinal: 1 | 2 | 3
  entryTrigger:
    | 'provider_timeout'
    | 'malformed_structured_output'
    | null
  outcome: 'completed' | 'failed'
  terminalTrigger:
    | 'provider_timeout'
    | 'malformed_structured_output'
    | null
  usage: ReasoningModelTokenUsage
  fxSnapshot?: ReasoningModelFxSnapshot
  recordedAt: string
}) {
  const suffix = input.routeId.replace(/_/g, '-')
  const created = createReasoningModelAttemptCostEvidenceV2({
    workloadAuthority: input.authority,
    reasoningRunId: 'reasoning-run-study-chat-smoke',
    attemptId: `attempt-${input.ordinal}-${suffix}`,
    attemptOrdinal: input.ordinal,
    routeId: input.routeId,
    routeAuthorizationDigestSha256:
      digest(`${input.routeId}:route-authorization`),
    idempotencyKeyDigestSha256:
      digest(`${input.routeId}:idempotency`),
    requestPayloadHashSha256:
      input.authority.reasoningRequestDigestSha256,
    providerUsageEvidenceHashSha256:
      digest(`${input.routeId}:provider-usage`),
    entryFallbackTrigger: input.entryTrigger,
    terminalOutcome: input.outcome,
    terminalFallbackTrigger: input.terminalTrigger,
    usage: input.usage,
    ...(input.fxSnapshot ? { fxSnapshot: input.fxSnapshot } : {}),
    recordedAt: input.recordedAt,
  })
  if (!created.ok) throw new Error(created.error.message)
  return created.data
}

function createStudyLifecycle(
  costEvidence: ReturnType<typeof createStudyAttempt>,
  startedAt: string,
  terminalAt: string,
  failureCode: string | null,
): CanonicalReasoningRouteAttemptLifecycleEvidence {
  const created =
    createCanonicalReasoningRouteAttemptLifecycleEvidence({
      costEvidence,
      providerRequestRecordId:
        `provider-request-${costEvidence.attemptId}`,
      providerRequestEvidenceDigestSha256:
        digest(`${costEvidence.attemptId}:provider-request`),
      oneUseSubmissionAuthorityDigestSha256:
        digest(`${costEvidence.attemptId}:one-use-submission`),
      providerObservationDigestSha256:
        digest(`${costEvidence.attemptId}:provider-observation`),
      providerCheckbackRecordId: null,
      providerWorkflowRecordId: null,
      startedAt,
      terminalAt,
      sanitizedFailureCode: failureCode,
    })
  if (!created.ok) throw new Error(created.error.message)
  return created.data
}

assert.equal(
  reasoningModelRateCardIdentityDigest(),
  preapprovalAuthority.internalCost.rateCardIdentityDigestSha256,
)

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
