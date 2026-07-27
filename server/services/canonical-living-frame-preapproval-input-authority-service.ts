import type {
  LivingFramePreapprovalInputAuthority,
  LivingFramePreapprovalInputAuthorityBoundary,
  LivingFramePreapprovalWorkflowContext,
} from '../../src/types/living-frame-preapproval-input-authority'
import {
  LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_SOURCE,
  LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_VERSION,
  LIVING_FRAME_PREAPPROVAL_REASONING_REQUEST_VERSION,
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
} from '../../src/types/living-frame-preapproval-input-authority'
import {
  REEDITPRO_REASONING_MODEL_ROUTE_CHAIN,
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
  validateReEditProReasoningModelRouteChain,
} from '../../src/lib/reasoning-model-routing-contract'
import { ApiError } from '../errors/api-error'
import {
  getReasoningModelRateCardEntry,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
} from '../reasoning-model-cost'
import type { ServiceContext } from '../types'
import {
  canonicalLivingFramePreapprovalInputAuthoritySchema,
  canonicalLivingFramePreapprovalInputReaderResultSchema,
  canonicalLivingFramePreapprovalInputRequestSchema,
  canonicalSharedPreapprovalAuthorityEnvelopeSchema,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION,
  CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
  type CanonicalLivingFramePreapprovalInputReaderResult,
} from '../validation/canonical-living-frame-preapproval-input-authority-schemas'
import {
  bindCanonicalLivingFramePlanningEvidence,
  type CanonicalLivingFramePlanningEvidenceReaderPort,
} from './canonical-living-frame-planning-evidence-service'
import {
  revalidateCanonicalLivingFramePlanningBinding,
} from './canonical-living-frame-planning-binding-service'
import {
  revalidateCanonicalMotionStudioStorytellingProductionAuthority,
} from './canonical-motion-studio-storytelling-production-authority-service'
import {
  canonicalPlanningHandoffId,
} from './private-canonical-planning-handoff-store'
import {
  planningInputAuthorityExpectationFromResolvedBinding,
} from './planning-input-authority-binding-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export interface CanonicalLivingFramePreapprovalInputReaderPort {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION
  readonly sourceAuthority:
    'canonical_private_current_planning_handoff_reader'
  readonly evidenceClass:
    'controlled_private_current_handoff_and_components_reader'
  readonly productionReady: false
  readCurrentHandoffAndComponents(input: {
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly expectedHandoffId: string
  }): Promise<unknown>
}

export interface BindCanonicalLivingFramePreapprovalInputAuthorityInput {
  readonly context: ServiceContext
  readonly request: unknown
  readonly inputReader:
    | CanonicalLivingFramePreapprovalInputReaderPort
    | null
    | undefined
  readonly planningEvidenceReader:
    | CanonicalLivingFramePlanningEvidenceReaderPort
    | null
    | undefined
}

export const LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_BOUNDARY:
  LivingFramePreapprovalInputAuthorityBoundary = Object.freeze({
    preapprovalInputOnly: true,
    liveEvidenceAuthority: false,
    reasoningRunAuthority: false,
    reasoningResultAuthority: false,
    providerTransportAuthority: false,
    providerCallAuthority: false,
    providerCredentialAuthority: false,
    providerAttemptReceiptAuthority: false,
    providerAttemptCostAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    creditReservationAuthority: false,
    walletAuthority: false,
    serviceFeeAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    toolRouteAuthority: false,
    mediaGenerationAuthority: false,
    renderAuthority: false,
    exportAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  })

export async function bindCanonicalLivingFramePreapprovalInputAuthority(
  input: BindCanonicalLivingFramePreapprovalInputAuthorityInput,
): Promise<LivingFramePreapprovalInputAuthority> {
  const parsedRequest =
    canonicalLivingFramePreapprovalInputRequestSchema.safeParse(input.request)
  if (!parsedRequest.success) {
    throw validation(
      'Canonical Living Frame preapproval request is invalid.',
      'canonical_living_frame_preapproval_input_request',
    )
  }
  assertInputReader(input.inputReader)
  const request = parsedRequest.data
  const expectedScope = {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
  }
  const firstRead = parseInputReaderResult(
    await input.inputReader.readCurrentHandoffAndComponents({
      expectedScope,
      expectedHandoffId: request.handoffId,
    }),
  )
  verifyReaderResult({
    result: firstRead,
    expectedScope,
    expectedHandoffId: request.handoffId,
  })
  const components = firstRead.canonicalPlanComponents
  const livingFrame = await revalidateCanonicalLivingFramePlanningBinding({
    components,
  })
  if (
    !livingFrame
    || livingFrame.status !== 'deferred'
    || livingFrame.scenePlans.length !== 0
    || livingFrame.capabilityRequirements.length !== 0
    || livingFrame.estimateInputs.sceneCount !== 0
    || livingFrame.estimateInputs.componentCount !== 0
  ) {
    throw conflict(
      'Living Frame preapproval requires the exact deferred parent with no caller-shaped scene or capability payload.',
      'canonical_living_frame_deferred_component',
    )
  }

  const evidence = await bindCanonicalLivingFramePlanningEvidence({
    locator: request.planningEvidenceLocator,
    canonicalContext: {
      ...expectedScope,
      components,
    },
    reader: input.planningEvidenceReader,
  })

  const motionAuthority =
    await revalidateCanonicalMotionStudioStorytellingProductionAuthority({
      context: input.context,
      authority: components.motionStudioStorytellingProductionAuthority,
      expectedScope,
    })
  const workflowContext = resolveWorkflowContext(motionAuthority)
  verifyEvidenceWorkflowContext({
    workflowContext,
    evidenceSourceMode: evidence.sourceMode,
    ideaFirstAuthorityDigestSha256:
      evidence.canonicalBindings.ideaFirstAuthorityDigestSha256,
  })

  const secondRead = parseInputReaderResult(
    await input.inputReader.readCurrentHandoffAndComponents({
      expectedScope,
      expectedHandoffId: request.handoffId,
    }),
  )
  verifyReaderResult({
    result: secondRead,
    expectedScope,
    expectedHandoffId: request.handoffId,
  })
  if (
    sha256AuthorityValue(firstRead) !== sha256AuthorityValue(secondRead)
  ) {
    throw conflict(
      'Canonical Living Frame preapproval inputs changed while evidence was being re-read.',
      'canonical_living_frame_preapproval_input_race',
    )
  }

  const routeValidation = validateReEditProReasoningModelRouteChain()
  if (!routeValidation.ok || routeValidation.providerCallMade !== false) {
    throw blocked(
      'Canonical Living Frame reasoning route contract is not ready.',
      'canonical_reasoning_route_contract',
    )
  }
  const orderedRouteIds = REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.map(
    (route) => route.routeId,
  )
  if (
    stableAuthorityStringify(orderedRouteIds) !==
    stableAuthorityStringify([
      'kimi_k3_primary',
      'qwen_3_7_fallback',
      'deepseek_v4_pro_fallback',
    ])
  ) {
    throw blocked(
      'Canonical Living Frame reasoning route order is unsupported.',
      'canonical_reasoning_route_order',
    )
  }
  if (
    firstRead.internalCostExpectation.rateCardVersion !==
      REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION
  ) {
    throw conflict(
      'Living Frame internal-cost expectation does not match the current reasoning rate-card identity.',
      'canonical_reasoning_rate_card',
    )
  }

  const lineage = {
    handoffHashSha256: firstRead.handoff.handoffHash,
    canonicalPlanComponentsHashSha256:
      firstRead.handoff.canonicalPlanComponentsHash,
    planningInputBindingHashSha256:
      firstRead.handoff.resolvedPlanningInputAuthority.bindingHash,
    livingFrameComponentDigestSha256:
      livingFrame.contractDigestSha256,
    planningEvidenceBindingDigestSha256:
      evidence.contractDigestSha256,
    compiledIntentDigestSha256:
      evidence.canonicalBindings.compiledIntentDigestSha256,
    sourceSequenceDigestSha256:
      evidence.canonicalBindings.sourceSequenceDigestSha256,
    outputFrameDigestSha256:
      evidence.canonicalBindings.outputFrameDigestSha256,
    masterTimingDigestSha256:
      evidence.canonicalBindings.masterTimingDigestSha256,
    ideaFirstAuthorityDigestSha256:
      evidence.canonicalBindings.ideaFirstAuthorityDigestSha256,
  }
  const routeIdentityDigestSha256 = sha256AuthorityValue({
    contractVersion: REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    routes: REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.map((route) => ({
      routeId: route.routeId,
      routeRole: route.routeRole,
      priority: route.priority,
      provider: route.provider,
      modelRoleId: route.modelRoleId,
      exactProviderModelId: route.exactProviderModelId,
      providerBoundary: route.providerBoundary,
      structuredOutputRequired: route.structuredOutputRequired,
      nextRouteId: route.nextRouteId,
      runtimeStatus: route.runtimeStatus,
    })),
  })
  const rateCardIdentityDigestSha256 = sha256AuthorityValue({
    rateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    routeEntries: orderedRouteIds.map((routeId) =>
      getReasoningModelRateCardEntry(routeId),
    ),
  })
  const resultSchemaDigestSha256 = sha256AuthorityValue(
    livingFrameReasoningResultSchemaExpectation(),
  )
  const requestDigestSha256 = sha256AuthorityValue({
    requestContractVersion:
      LIVING_FRAME_PREAPPROVAL_REASONING_REQUEST_VERSION,
    purpose: 'propose_semantic_living_frame_decisions_preapproval_only',
    identity: {
      ...expectedScope,
      handoffId: request.handoffId,
    },
    workflowContext,
    lineage,
    evidence: {
      status: evidence.status,
      sourceMode: evidence.sourceMode,
      evidenceClass: evidence.evidenceClass,
      sourceEvidenceCount: evidence.sourceEvidenceCount,
      evidenceSetDigestSha256: evidence.evidenceSetDigestSha256,
    },
    resultSchemaVersion:
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
    resultSchemaDigestSha256,
    routeContractVersion:
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    orderedRouteIds,
    routeIdentityDigestSha256,
    internalCostExpectation: {
      policyVersion:
        firstRead.internalCostExpectation.policyVersion,
      budgetExpectationId:
        firstRead.internalCostExpectation.budgetExpectationId,
      rateCardVersion:
        firstRead.internalCostExpectation.rateCardVersion,
      rateCardIdentityDigestSha256,
      denomination:
        firstRead.internalCostExpectation.denomination,
      maximumAuthorizedInternalCostMicros:
        firstRead.internalCostExpectation
          .maximumAuthorizedInternalCostMicros,
    },
  })
  const withoutDigest = {
    schemaVersion: LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_VERSION,
    authorityClass: 'living_frame_preapproval_input' as const,
    sourceAuthority: LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_SOURCE,
    evidenceClass:
      'controlled_source_bound_preapproval_input_unreleased' as const,
    promotionAllowed: false as const,
    productionReady: false as const,
    workflowContext,
    identity: {
      ...expectedScope,
      handoffId: request.handoffId,
    },
    lineage,
    evidence: {
      status: evidence.status,
      sourceMode: evidence.sourceMode,
      evidenceClass: evidence.evidenceClass,
      sourceEvidenceCount: evidence.sourceEvidenceCount,
      evidenceSetDigestSha256: evidence.evidenceSetDigestSha256,
      evidenceReReadByServer: true as const,
      selectedSceneAuthority: false as const,
    },
    reasoning: {
      requestContractVersion:
        LIVING_FRAME_PREAPPROVAL_REASONING_REQUEST_VERSION,
      requestDigestSha256,
      resultSchemaVersion:
        LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
      resultSchemaDigestSha256,
      routeContractVersion:
        REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
      orderedRouteIds: [
        'kimi_k3_primary',
        'qwen_3_7_fallback',
        'deepseek_v4_pro_fallback',
      ] as const,
      routeIdentityDigestSha256,
      strictStructuredOutputRequired: true as const,
      semanticDecisionsOnly: true as const,
      exactFrameOutputForbidden: true as const,
      exactSoundCueOutputForbidden: true as const,
      providerTransportAuthorityState:
        'required_not_granted' as const,
      providerTransportAuthorized: false as const,
      providerCallMade: false as const,
      oldKimiToGptFallbackAllowed: false as const,
      qwen25VlReasoningRouteAllowed: false as const,
      mediaProviderOperationAllowed: false as const,
    },
    internalCost: {
      ...firstRead.internalCostExpectation,
      rateCardIdentityDigestSha256,
    },
    authorityBoundary:
      LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_BOUNDARY,
  }
  const authority = canonicalLivingFramePreapprovalInputAuthoritySchema.parse({
    ...withoutDigest,
    authorityDigestSha256: sha256AuthorityValue(withoutDigest),
  })
  canonicalSharedPreapprovalAuthorityEnvelopeSchema.parse({
    schemaVersion:
      CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
    authorityLane: 'living_frame_preapproval_v1',
    authority,
  })
  return authority
}

export async function readCurrentCanonicalLivingFramePreapprovalInputState(
  input: {
    readonly reader:
      | CanonicalLivingFramePreapprovalInputReaderPort
      | null
      | undefined
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly expectedHandoffId: string
  },
): Promise<CanonicalLivingFramePreapprovalInputReaderResult> {
  assertInputReader(input.reader)
  const request = Object.freeze({
    expectedScope: Object.freeze({ ...input.expectedScope }),
    expectedHandoffId: input.expectedHandoffId,
  })
  const firstRead = parseInputReaderResult(
    await input.reader.readCurrentHandoffAndComponents(request),
  )
  verifyReaderResult({
    result: firstRead,
    expectedScope: input.expectedScope,
    expectedHandoffId: input.expectedHandoffId,
  })
  const secondRead = parseInputReaderResult(
    await input.reader.readCurrentHandoffAndComponents(request),
  )
  verifyReaderResult({
    result: secondRead,
    expectedScope: input.expectedScope,
    expectedHandoffId: input.expectedHandoffId,
  })
  if (
    sha256AuthorityValue(firstRead) !== sha256AuthorityValue(secondRead)
  ) {
    throw conflict(
      'Canonical Living Frame preapproval inputs changed during the current-state reread.',
      'canonical_living_frame_preapproval_input_race',
    )
  }
  return structuredClone(firstRead)
}

function verifyReaderResult(input: {
  result: CanonicalLivingFramePreapprovalInputReaderResult
  expectedScope: {
    workspaceId: string
    projectId: string
    editSessionId: string
  }
  expectedHandoffId: string
}): void {
  const { result, expectedScope, expectedHandoffId } = input
  if (
    result.identity.workspaceId !== expectedScope.workspaceId
    || result.identity.projectId !== expectedScope.projectId
    || result.identity.editSessionId !== expectedScope.editSessionId
    || result.identity.currentHandoffId !== expectedHandoffId
    || result.handoff.identity.workspaceId !== expectedScope.workspaceId
    || result.handoff.identity.projectId !== expectedScope.projectId
    || result.handoff.identity.editSessionId !== expectedScope.editSessionId
    || result.handoff.handoffId !== expectedHandoffId
  ) {
    throw conflict(
      'Canonical Living Frame preapproval reader returned another scope or handoff.',
      'canonical_living_frame_preapproval_scope',
    )
  }
  const {
    handoffHash,
    handoffId,
    persistence: _persistence,
    ...handoffHashInput
  } = result.handoff
  void _persistence
  if (
    handoffHash !== sha256AuthorityValue(handoffHashInput)
    || handoffId !== canonicalPlanningHandoffId(handoffHash)
    || result.handoff.canonicalPlanComponentsHash !==
      sha256AuthorityValue(result.canonicalPlanComponents)
  ) {
    throw conflict(
      'Canonical Living Frame preapproval handoff or component lineage failed integrity verification.',
      'canonical_living_frame_preapproval_handoff_integrity',
    )
  }
  const planningBinding =
    result.handoff.resolvedPlanningInputAuthority
  if (
    planningBinding.workspaceId !== expectedScope.workspaceId
    || planningBinding.projectId !== expectedScope.projectId
    || planningBinding.editSessionId !== expectedScope.editSessionId
    || stableAuthorityStringify(
      planningInputAuthorityExpectationFromResolvedBinding(planningBinding),
    ) !== stableAuthorityStringify(result.handoff.planningInputAuthority)
  ) {
    throw conflict(
      'Canonical Living Frame preapproval planning-input authority is inconsistent.',
      'canonical_living_frame_preapproval_planning_input',
    )
  }
}

function parseInputReaderResult(
  value: unknown,
): CanonicalLivingFramePreapprovalInputReaderResult {
  const parsed =
    canonicalLivingFramePreapprovalInputReaderResultSchema.safeParse(value)
  if (!parsed.success) {
    throw conflict(
      'Canonical Living Frame preapproval reader result is invalid.',
      'canonical_living_frame_preapproval_reader_result',
    )
  }
  return parsed.data
}

function assertInputReader(
  reader:
    | CanonicalLivingFramePreapprovalInputReaderPort
    | null
    | undefined,
): asserts reader is CanonicalLivingFramePreapprovalInputReaderPort {
  if (
    !reader
    || reader.schemaVersion !==
      CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION
    || reader.sourceAuthority !==
      'canonical_private_current_planning_handoff_reader'
    || reader.evidenceClass !==
      'controlled_private_current_handoff_and_components_reader'
    || reader.productionReady !== false
    || typeof reader.readCurrentHandoffAndComponents !== 'function'
  ) {
    throw blocked(
      'Canonical Living Frame preapproval requires the server-injected current planning-input reader.',
      'canonical_living_frame_preapproval_input_reader',
    )
  }
}

function resolveWorkflowContext(
  authority: Awaited<
    ReturnType<
      typeof revalidateCanonicalMotionStudioStorytellingProductionAuthority
    >
  >,
): LivingFramePreapprovalWorkflowContext {
  if (!authority) {
    return {
      kind: 'ordinary_edit_video',
      motionProductionContext: null,
    }
  }
  return {
    kind: 'motion_storytelling_optional_context',
    motionProductionContext: {
      productionId: authority.productionId,
      authorityHashSha256: authority.authorityHash,
      sourceProposalDigestSha256:
        authority.sourceProposal.componentProposalDigest,
      sourceArtifactApprovalSnapshotId:
        authority.sourceArtifactApprovalSnapshotId,
    },
  }
}

function verifyEvidenceWorkflowContext(input: {
  workflowContext: LivingFramePreapprovalWorkflowContext
  evidenceSourceMode: 'uploaded_media' | 'idea_first_no_uploaded_media'
  ideaFirstAuthorityDigestSha256: string | null
}): void {
  if (input.workflowContext.kind === 'ordinary_edit_video') {
    if (
      input.evidenceSourceMode !== 'uploaded_media'
      || input.ideaFirstAuthorityDigestSha256 !== null
    ) {
      throw conflict(
        'Ordinary Living Frame preapproval cannot borrow Motion source-less authority.',
        'canonical_living_frame_preapproval_workflow_context',
      )
    }
    return
  }
  if (
    input.evidenceSourceMode !== 'idea_first_no_uploaded_media'
    || input.ideaFirstAuthorityDigestSha256 !==
      input.workflowContext.motionProductionContext.authorityHashSha256
  ) {
    throw conflict(
      'Motion context must be separately reverified and match the exact idea-first evidence binding.',
      'canonical_living_frame_preapproval_motion_context',
    )
  }
}

function livingFrameReasoningResultSchemaExpectation() {
  return {
    schemaVersion:
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
    decisionKinds: [
      'semantic_candidate',
      'rejected_candidate',
      'deliberate_non_use',
      'blocked',
    ],
    requiredReasonCodes: true,
    boundedDerivedSummaries: true,
    sourceEvidenceReferencesRequired: true,
    rawChatForbidden: true,
    rawTranscriptForbidden: true,
    exactFramesForbidden: true,
    exactSoundCuesForbidden: true,
    customerEstimateForbidden: true,
    providerOrToolSelectionForbidden: true,
    executableCodeForbidden: true,
    approvalOrRuntimeAuthorityForbidden: true,
  } as const
}

function validation(message: string, requiredGate: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, { requiredGate })
}

function conflict(message: string, requiredGate: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate,
  })
}

function blocked(message: string, requiredGate: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate,
    productionReady: false,
  })
}
