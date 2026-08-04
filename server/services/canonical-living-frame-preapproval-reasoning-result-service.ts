import type {
  LivingFramePlanningEvidenceBinding,
} from '../../src/types/living-frame-planning-evidence'
import {
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
} from '../../src/lib/reasoning-model-routing-contract'
import {
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_SOURCE,
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_VERSION,
  type LivingFramePreapprovalReasoningResultAuthorityBoundary,
  type LivingFramePreapprovalReasoningResultBinding,
} from '../../src/types/living-frame-preapproval-reasoning-result'
import { ApiError } from '../errors/api-error'
import {
  createPrePlanLivingFrameSemanticReasoningAuthority,
  validateLivingFrameControlledInternalBudgetAdmission,
  type PrePlanLivingFrameSemanticReasoningAuthority,
} from '../reasoning-model-cost'
import {
  validateCanonicalReasoningRunReceipt,
  type CanonicalReasoningRunReceipt,
} from '../reasoning-model-execution/canonical-reasoning-run-receipt'
import type { ServiceContext } from '../types'
import {
  canonicalLivingFramePreapprovalInputReaderResultSchema,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION,
  type CanonicalLivingFramePreapprovalInputReaderResult,
} from '../validation/canonical-living-frame-preapproval-input-authority-schemas'
import {
  canonicalLivingFrameControlledSemanticReasoningResultSchema,
  canonicalLivingFramePreapprovalReasoningResultBindingSchema,
  canonicalLivingFramePreapprovalReasoningResultReaderResultSchema,
  canonicalLivingFramePreapprovalReasoningResultRequestSchema,
  CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_VERSION,
  type CanonicalLivingFrameControlledSemanticReasoningResult,
  type CanonicalLivingFramePreapprovalReasoningResultReaderResult,
} from '../validation/canonical-living-frame-preapproval-reasoning-result-schemas'
import {
  bindCanonicalLivingFramePlanningEvidence,
  type CanonicalLivingFramePlanningEvidenceReaderPort,
} from './canonical-living-frame-planning-evidence-service'
import {
  bindCanonicalLivingFramePreapprovalInputAuthority,
  type CanonicalLivingFramePreapprovalInputReaderPort,
} from './canonical-living-frame-preapproval-input-authority-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export interface CanonicalLivingFramePreapprovalReasoningResultReaderPort {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_VERSION
  readonly sourceAuthority:
    'controlled_living_frame_reasoning_result_fixture_reader'
  readonly evidenceClass:
    'process_bound_controlled_reasoning_result_reader'
  readonly promotionAllowed: false
  readonly productionReady: false
  readByServerOwnedLocator(input: {
    readonly serverOwnedLocatorId: string
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly expectedHandoffId: string
    readonly expectedPreapprovalInputAuthorityDigestSha256: string
  }): Promise<unknown>
}

export interface CreateCanonicalLivingFramePreapprovalReasoningResultReaderInput {
  readonly readByServerOwnedLocator:
    CanonicalLivingFramePreapprovalReasoningResultReaderPort[
      'readByServerOwnedLocator'
    ]
}

export interface BindCanonicalLivingFramePreapprovalReasoningResultInput {
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
  readonly resultReader:
    | CanonicalLivingFramePreapprovalReasoningResultReaderPort
    | null
    | undefined
}

const controlledResultReaderCapabilities = new WeakSet<object>()

export const LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_AUTHORITY_BOUNDARY:
  LivingFramePreapprovalReasoningResultAuthorityBoundary =
  Object.freeze({
    controlledPlanningProjectionOnly: true,
    liveEvidenceAuthority: false,
    releasedReasoningRunAuthority: false,
    reasoningResultAuthority: false,
    providerTransportAuthority: false,
    providerCallAuthority: false,
    providerCredentialAuthority: false,
    providerAttemptReceiptAuthority: false,
    providerAttemptCostAuthority: false,
    selectedSceneAuthority: false,
    componentPlanAuthority: false,
    capabilityPlanAuthority: false,
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

export function createCanonicalLivingFramePreapprovalReasoningResultReader(
  input: CreateCanonicalLivingFramePreapprovalReasoningResultReaderInput,
): CanonicalLivingFramePreapprovalReasoningResultReaderPort {
  if (typeof input.readByServerOwnedLocator !== 'function') {
    throw blocked(
      'Controlled Living Frame reasoning result reader requires a process-bound read capability.',
      'living_frame_reasoning_result_reader_capability',
    )
  }
  const reader = Object.freeze({
    schemaVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_VERSION,
    sourceAuthority: (
      'controlled_living_frame_reasoning_result_fixture_reader'
    ) as const,
    evidenceClass:
      'process_bound_controlled_reasoning_result_reader' as const,
    promotionAllowed: false as const,
    productionReady: false as const,
    readByServerOwnedLocator:
      input.readByServerOwnedLocator.bind(undefined),
  })
  controlledResultReaderCapabilities.add(reader)
  return reader
}

export async function bindCanonicalLivingFramePreapprovalReasoningResult(
  input: BindCanonicalLivingFramePreapprovalReasoningResultInput,
): Promise<LivingFramePreapprovalReasoningResultBinding> {
  const parsedRequest =
    canonicalLivingFramePreapprovalReasoningResultRequestSchema.safeParse(
      input.request,
    )
  if (!parsedRequest.success) {
    throw validation(
      'Canonical Living Frame reasoning-result request is invalid.',
      'canonical_living_frame_reasoning_result_request',
    )
  }
  assertInputReader(input.inputReader)
  assertResultReader(input.resultReader)
  const request = parsedRequest.data
  const expectedScope = {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
  }

  const firstAuthority =
    await bindCanonicalLivingFramePreapprovalInputAuthority({
      context: input.context,
      request: {
        schemaVersion:
          'canonical-living-frame-preapproval-input-request-v1',
        purpose: 'bind_living_frame_preapproval_input_authority',
        ...expectedScope,
        handoffId: request.handoffId,
        planningEvidenceLocator: request.planningEvidenceLocator,
      },
      inputReader: input.inputReader,
      planningEvidenceReader: input.planningEvidenceReader,
    })
  const firstCurrent = await readCurrentContext({
    reader: input.inputReader,
    expectedScope,
    expectedHandoffId: request.handoffId,
    expectedAuthority: firstAuthority,
  })
  const firstEvidence = await bindCanonicalLivingFramePlanningEvidence({
    locator: request.planningEvidenceLocator,
    canonicalContext: {
      ...expectedScope,
      components: firstCurrent.canonicalPlanComponents,
    },
    reader: input.planningEvidenceReader,
  })
  verifyEvidenceLineage(firstAuthority, firstEvidence)

  const firstResult = parseResultReaderResult(
    await input.resultReader.readByServerOwnedLocator({
      serverOwnedLocatorId:
        request.reasoningResultLocator.serverOwnedLocatorId,
      expectedScope,
      expectedHandoffId: request.handoffId,
      expectedPreapprovalInputAuthorityDigestSha256:
        firstAuthority.authorityDigestSha256,
    }),
  )
  const firstVerified = verifyControlledResult({
    readerResult: firstResult,
    expectedLocatorId:
      request.reasoningResultLocator.serverOwnedLocatorId,
    preapprovalAuthority: firstAuthority,
    evidence: firstEvidence,
  })

  const secondAuthority =
    await bindCanonicalLivingFramePreapprovalInputAuthority({
      context: input.context,
      request: {
        schemaVersion:
          'canonical-living-frame-preapproval-input-request-v1',
        purpose: 'bind_living_frame_preapproval_input_authority',
        ...expectedScope,
        handoffId: request.handoffId,
        planningEvidenceLocator: request.planningEvidenceLocator,
      },
      inputReader: input.inputReader,
      planningEvidenceReader: input.planningEvidenceReader,
    })
  const secondCurrent = await readCurrentContext({
    reader: input.inputReader,
    expectedScope,
    expectedHandoffId: request.handoffId,
    expectedAuthority: secondAuthority,
  })
  const secondEvidence = await bindCanonicalLivingFramePlanningEvidence({
    locator: request.planningEvidenceLocator,
    canonicalContext: {
      ...expectedScope,
      components: secondCurrent.canonicalPlanComponents,
    },
    reader: input.planningEvidenceReader,
  })
  verifyEvidenceLineage(secondAuthority, secondEvidence)
  const secondResult = parseResultReaderResult(
    await input.resultReader.readByServerOwnedLocator({
      serverOwnedLocatorId:
        request.reasoningResultLocator.serverOwnedLocatorId,
      expectedScope,
      expectedHandoffId: request.handoffId,
      expectedPreapprovalInputAuthorityDigestSha256:
        secondAuthority.authorityDigestSha256,
    }),
  )
  const secondVerified = verifyControlledResult({
    readerResult: secondResult,
    expectedLocatorId:
      request.reasoningResultLocator.serverOwnedLocatorId,
    preapprovalAuthority: secondAuthority,
    evidence: secondEvidence,
  })

  if (
    firstAuthority.authorityDigestSha256 !==
      secondAuthority.authorityDigestSha256
    || firstEvidence.contractDigestSha256 !==
      secondEvidence.contractDigestSha256
    || sha256AuthorityValue(firstResult) !==
      sha256AuthorityValue(secondResult)
    || firstVerified.workloadAuthority.authorityDigestSha256 !==
      secondVerified.workloadAuthority.authorityDigestSha256
  ) {
    throw conflict(
      'Canonical Living Frame reasoning inputs or controlled result changed during server revalidation.',
      'canonical_living_frame_reasoning_result_race',
    )
  }

  const receipt = firstVerified.runReceipt
  const result = firstVerified.semanticResult
  const withoutDigest = {
    contractVersion:
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_VERSION,
    contractSource:
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_SOURCE,
    evidenceClass:
      'controlled_non_promotable_reasoning_result_binding' as const,
    promotionAllowed: false as const,
    productionReady: false as const,
    workflowContext: firstAuthority.workflowContext,
    identity: { ...firstAuthority.identity },
    canonicalBindings: {
      livingFramePreapprovalInputAuthorityDigestSha256:
        firstAuthority.authorityDigestSha256,
      planningEvidenceBindingDigestSha256:
        firstEvidence.contractDigestSha256,
      reasoningRequestDigestSha256:
        firstAuthority.reasoning.requestDigestSha256,
      reasoningResultSchemaDigestSha256:
        firstAuthority.reasoning.resultSchemaDigestSha256,
      routeIdentityDigestSha256:
        firstAuthority.reasoning.routeIdentityDigestSha256,
      rateCardIdentityDigestSha256:
        firstAuthority.internalCost.rateCardIdentityDigestSha256,
      internalCostBudgetAdmissionDigestSha256:
        firstResult.budgetAdmission.admissionDigestSha256,
      workloadAuthorityDigestSha256:
        firstVerified.workloadAuthority.authorityDigestSha256,
      canonicalReasoningRunReceiptDigestSha256:
        receipt.receiptDigestSha256,
      semanticResultDigestSha256:
        result.resultDigestSha256,
    },
    overallDecision: result.overallDecision,
    decisions: result.decisions.map((decision) => ({
      ...decision,
      evidenceReferences: decision.evidenceReferences.map(
        (reference) => ({ ...reference }),
      ),
    })),
    reasoningResultReReadByServer: true as const,
    controlledRunSummary: {
      evidenceClass:
        'controlled_non_promotable_reasoning_run_summary' as const,
      terminalState: 'completed' as const,
      attemptCount: receipt.costAggregate.attemptCount,
      failedAttemptCount:
        receipt.costAggregate.failedAttemptCount,
      completedAttemptCount: 1 as const,
      unknownAttemptCount: 0 as const,
      failedAttemptCostRetained: true as const,
      normalizedUsdCostMicros:
        receipt.costAggregate.normalizedUsdCostMicros!,
      withinAuthorizedInternalCostCeiling: true as const,
      providerCallsMadeByBindingService: false as const,
      customerPriceCalculated: false as const,
      customerCreditsCalculated: false as const,
      serviceFeeIncluded: false as const,
    },
    authorityBoundary:
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_AUTHORITY_BOUNDARY,
  }
  return canonicalLivingFramePreapprovalReasoningResultBindingSchema.parse({
    ...withoutDigest,
    contractDigestSha256: sha256AuthorityValue(withoutDigest),
  })
}

function verifyControlledResult(input: {
  readerResult:
    CanonicalLivingFramePreapprovalReasoningResultReaderResult
  expectedLocatorId: string
  preapprovalAuthority: Awaited<
    ReturnType<
      typeof bindCanonicalLivingFramePreapprovalInputAuthority
    >
  >
  evidence: LivingFramePlanningEvidenceBinding
}): {
  workloadAuthority: PrePlanLivingFrameSemanticReasoningAuthority
  runReceipt: CanonicalReasoningRunReceipt<
    PrePlanLivingFrameSemanticReasoningAuthority
  >
  semanticResult: CanonicalLivingFrameControlledSemanticReasoningResult
} {
  const {
    readerResult,
    expectedLocatorId,
    preapprovalAuthority,
    evidence,
  } = input
  if (readerResult.serverOwnedLocatorId !== expectedLocatorId) {
    throw conflict(
      'Controlled Living Frame reasoning result belongs to another server-owned locator.',
      'canonical_living_frame_reasoning_result_locator',
    )
  }
  const budget =
    validateLivingFrameControlledInternalBudgetAdmission(
      readerResult.budgetAdmission,
    )
  if (!budget.ok) {
    throw conflict(
      'Controlled Living Frame internal-budget admission is invalid.',
      'canonical_living_frame_reasoning_budget_admission',
    )
  }
  if (
    budget.data.budgetExpectationId !==
      preapprovalAuthority.internalCost.budgetExpectationId
    || budget.data.livingFramePreapprovalInputAuthorityDigestSha256 !==
      preapprovalAuthority.authorityDigestSha256
    || budget.data.rateCardVersion !==
      preapprovalAuthority.internalCost.rateCardVersion
    || budget.data.rateCardIdentityDigestSha256 !==
      preapprovalAuthority.internalCost.rateCardIdentityDigestSha256
    || budget.data.maximumAuthorizedInternalCostMicros !==
      preapprovalAuthority.internalCost
        .maximumAuthorizedInternalCostMicros
    || preapprovalAuthority.reasoning.routeContractVersion !==
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION
  ) {
    throw conflict(
      'Controlled Living Frame internal-budget admission does not match the exact preapproval expectation.',
      'canonical_living_frame_reasoning_budget_lineage',
    )
  }

  const workloadAuthority =
    createPrePlanLivingFrameSemanticReasoningAuthority({
      ...preapprovalAuthority.identity,
      livingFramePreapprovalInputAuthorityDigestSha256:
        preapprovalAuthority.authorityDigestSha256,
      planningEvidenceBindingDigestSha256:
        evidence.contractDigestSha256,
      reasoningRequestDigestSha256:
        preapprovalAuthority.reasoning.requestDigestSha256,
      reasoningResultSchemaDigestSha256:
        preapprovalAuthority.reasoning.resultSchemaDigestSha256,
      routeContractVersion:
        REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
      orderedRouteIds:
        preapprovalAuthority.reasoning.orderedRouteIds,
      routeIdentityDigestSha256:
        preapprovalAuthority.reasoning.routeIdentityDigestSha256,
      rateCardIdentityDigestSha256:
        preapprovalAuthority.internalCost.rateCardIdentityDigestSha256,
      budgetAdmission: budget.data,
    })
  if (!workloadAuthority.ok) {
    throw conflict(
      'Controlled Living Frame reasoning workload authority could not be compiled.',
      'canonical_living_frame_reasoning_workload_authority',
    )
  }

  const runReceipt =
    readerResult.canonicalRunReceipt as CanonicalReasoningRunReceipt<
      PrePlanLivingFrameSemanticReasoningAuthority
    >
  const validatedReceipt =
    validateCanonicalReasoningRunReceipt(runReceipt)
  if (
    !validatedReceipt.ok
    || runReceipt.workloadAuthority.authorityClass !==
      'pre_plan_living_frame_semantic_reasoning'
    || runReceipt.workloadAuthority.authorityDigestSha256 !==
      workloadAuthority.data.authorityDigestSha256
    || runReceipt.terminalState !== 'completed'
    || runReceipt.finalResultDigestSha256 === null
    || runReceipt.costAggregate.completedAttemptCount !== 1
    || runReceipt.costAggregate.unknownAttemptCount !== 0
    || runReceipt.costAggregate.normalizedUsdCostMicros === null
    || !runReceipt.costAggregate
      .allAttemptCostsVerifiedAndUsdNormalized
    || !runReceipt.costAggregate
      .withinAuthorizedInternalCostCeiling
  ) {
    throw conflict(
      'Controlled Living Frame reasoning receipt is incomplete, mismatched, unknown, or over budget.',
      'canonical_living_frame_reasoning_run_receipt',
    )
  }

  const semanticResult =
    canonicalLivingFrameControlledSemanticReasoningResultSchema.parse(
      readerResult.semanticResult,
    )
  if (
    semanticResult.identity.workspaceId !==
      preapprovalAuthority.identity.workspaceId
    || semanticResult.identity.projectId !==
      preapprovalAuthority.identity.projectId
    || semanticResult.identity.editSessionId !==
      preapprovalAuthority.identity.editSessionId
    || semanticResult.identity.handoffId !==
      preapprovalAuthority.identity.handoffId
    || semanticResult.livingFramePreapprovalInputAuthorityDigestSha256 !==
      preapprovalAuthority.authorityDigestSha256
    || semanticResult.planningEvidenceBindingDigestSha256 !==
      evidence.contractDigestSha256
    || semanticResult.reasoningRequestDigestSha256 !==
      preapprovalAuthority.reasoning.requestDigestSha256
    || semanticResult.reasoningResultSchemaDigestSha256 !==
      preapprovalAuthority.reasoning.resultSchemaDigestSha256
    || semanticResult.resultDigestSha256 !==
      runReceipt.finalResultDigestSha256
  ) {
    throw conflict(
      'Controlled Living Frame semantic result does not match its exact preapproval, evidence, or completed receipt.',
      'canonical_living_frame_reasoning_result_lineage',
    )
  }
  verifySemanticEvidenceReferences({
    semanticResult,
    preapprovalAuthority,
    evidence,
  })
  return {
    workloadAuthority: workloadAuthority.data,
    runReceipt: validatedReceipt.data,
    semanticResult,
  }
}

function verifySemanticEvidenceReferences(input: {
  semanticResult: CanonicalLivingFrameControlledSemanticReasoningResult
  preapprovalAuthority: Awaited<
    ReturnType<
      typeof bindCanonicalLivingFramePreapprovalInputAuthority
    >
  >
  evidence: LivingFramePlanningEvidenceBinding
}): void {
  const { semanticResult, preapprovalAuthority, evidence } = input
  const sourceObservationIds = new Map<string, Set<string>>()
  for (const source of evidence.sourceEvidence) {
    sourceObservationIds.set(
      source.sourceSequenceItemId,
      new Set(source.observations.map(
        (observation) => observation.observationId,
      )),
    )
  }
  for (const decision of semanticResult.decisions) {
    for (const reference of decision.evidenceReferences) {
      if (
        reference.evidenceSetDigestSha256 !==
          evidence.evidenceSetDigestSha256
      ) {
        throw conflict(
          'Controlled Living Frame semantic evidence reference is stale.',
          'canonical_living_frame_reasoning_evidence_digest',
        )
      }
      if (evidence.sourceMode === 'uploaded_media') {
        if (
          reference.kind !== 'source_visual_observation'
          || !sourceObservationIds
            .get(reference.sourceSequenceItemId)
            ?.has(reference.observationId)
        ) {
          throw conflict(
            'Controlled Living Frame semantic decision cites an unknown source observation.',
            'canonical_living_frame_reasoning_source_observation',
          )
        }
        continue
      }
      if (
        reference.kind !== 'canonical_idea_first_context'
        || preapprovalAuthority.lineage
          .ideaFirstAuthorityDigestSha256 === null
        || reference.ideaFirstAuthorityDigestSha256 !==
          preapprovalAuthority.lineage
            .ideaFirstAuthorityDigestSha256
      ) {
        throw conflict(
          'Controlled Living Frame idea-first decision does not cite its exact separately verified Motion context.',
          'canonical_living_frame_reasoning_idea_first_context',
        )
      }
    }
  }
}

async function readCurrentContext(input: {
  reader: CanonicalLivingFramePreapprovalInputReaderPort
  expectedScope: {
    workspaceId: string
    projectId: string
    editSessionId: string
  }
  expectedHandoffId: string
  expectedAuthority: Awaited<
    ReturnType<
      typeof bindCanonicalLivingFramePreapprovalInputAuthority
    >
  >
}): Promise<CanonicalLivingFramePreapprovalInputReaderResult> {
  const parsed =
    canonicalLivingFramePreapprovalInputReaderResultSchema.safeParse(
      await input.reader.readCurrentHandoffAndComponents({
        expectedScope: input.expectedScope,
        expectedHandoffId: input.expectedHandoffId,
      }),
    )
  if (!parsed.success) {
    throw conflict(
      'Canonical Living Frame current planning context reader returned an invalid result.',
      'canonical_living_frame_reasoning_current_context',
    )
  }
  const result = parsed.data
  if (
    result.identity.workspaceId !== input.expectedScope.workspaceId
    || result.identity.projectId !== input.expectedScope.projectId
    || result.identity.editSessionId !==
      input.expectedScope.editSessionId
    || result.identity.currentHandoffId !== input.expectedHandoffId
    || result.handoff.handoffId !== input.expectedHandoffId
    || result.handoff.handoffHash !==
      input.expectedAuthority.lineage.handoffHashSha256
    || result.handoff.canonicalPlanComponentsHash !==
      input.expectedAuthority.lineage
        .canonicalPlanComponentsHashSha256
    || sha256AuthorityValue(result.canonicalPlanComponents) !==
      input.expectedAuthority.lineage
        .canonicalPlanComponentsHashSha256
  ) {
    throw conflict(
      'Canonical Living Frame current planning context changed or belongs to another authority.',
      'canonical_living_frame_reasoning_current_context_lineage',
    )
  }
  return result
}

function verifyEvidenceLineage(
  authority: Awaited<
    ReturnType<
      typeof bindCanonicalLivingFramePreapprovalInputAuthority
    >
  >,
  evidence: LivingFramePlanningEvidenceBinding,
): void {
  if (
    evidence.contractDigestSha256 !==
      authority.lineage.planningEvidenceBindingDigestSha256
    || evidence.evidenceSetDigestSha256 !==
      authority.evidence.evidenceSetDigestSha256
    || evidence.canonicalBindings.workspaceId !==
      authority.identity.workspaceId
    || evidence.canonicalBindings.projectId !==
      authority.identity.projectId
    || evidence.canonicalBindings.editSessionId !==
      authority.identity.editSessionId
  ) {
    throw conflict(
      'Canonical Living Frame planning evidence changed after preapproval input binding.',
      'canonical_living_frame_reasoning_evidence_lineage',
    )
  }
}

function parseResultReaderResult(
  value: unknown,
): CanonicalLivingFramePreapprovalReasoningResultReaderResult {
  const parsed =
    canonicalLivingFramePreapprovalReasoningResultReaderResultSchema
      .safeParse(value)
  if (!parsed.success) {
    throw conflict(
      'Controlled Living Frame reasoning result reader returned an invalid projection.',
      'canonical_living_frame_reasoning_result_reader_projection',
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
    || typeof reader.readCurrentHandoffAndComponents !== 'function'
  ) {
    throw blocked(
      'Canonical Living Frame reasoning-result binding requires the current planning-input reader.',
      'canonical_living_frame_reasoning_input_reader',
    )
  }
}

function assertResultReader(
  reader:
    | CanonicalLivingFramePreapprovalReasoningResultReaderPort
    | null
    | undefined,
): asserts reader is CanonicalLivingFramePreapprovalReasoningResultReaderPort {
  if (
    !reader
    || !controlledResultReaderCapabilities.has(reader)
    || reader.schemaVersion !==
      CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_VERSION
    || reader.sourceAuthority !==
      'controlled_living_frame_reasoning_result_fixture_reader'
    || reader.evidenceClass !==
      'process_bound_controlled_reasoning_result_reader'
    || reader.promotionAllowed !== false
    || reader.productionReady !== false
    || typeof reader.readByServerOwnedLocator !== 'function'
  ) {
    throw blocked(
      'Canonical Living Frame reasoning-result binding requires the process-bound controlled result-reader capability.',
      'canonical_living_frame_reasoning_result_reader',
    )
  }
}

function validation(message: string, requiredGate: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate,
    planningOnly: true,
    productionReady: false,
  })
}

function conflict(message: string, requiredGate: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate,
    planningOnly: true,
    productionReady: false,
  })
}

function blocked(message: string, requiredGate: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate,
    planningOnly: true,
    productionReady: false,
  })
}
