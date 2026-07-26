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
import type {
  LivingFramePreapprovalInputAuthority,
} from '../../src/types/living-frame-preapproval-input-authority'
import type { ServiceContext } from '../types'
import {
  createPrePlanEditReferenceStudyChatReasoningAuthority,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
  validatePrePlanEditReferenceStudyChatReasoningAuthority,
} from '../reasoning-model-cost'
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
  allRuntimeAndCommercialAuthoritiesClosed: true,
  productionReady: false,
}))

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
  return sha256AuthorityValue(withoutDigest)
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
