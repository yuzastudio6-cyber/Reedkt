import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_CLASS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_VERSION,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_LOCATOR_VERSION,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_READER_VERSION,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ATTEMPT_EVIDENCE_SOURCE_CLASSES,
  type LivingFrameControlledIllustrationActualCostAttribution,
  type LivingFrameControlledIllustrationActualCostAttributionDraft,
  type LivingFrameControlledIllustrationActualCostAuthorityBoundary,
  type LivingFrameControlledIllustrationActualCostLocator,
  type LivingFrameControlledIllustrationActualCostScope,
} from '../../src/types/living-frame-controlled-illustration-actual-cost-attribution'
import type {
  CanonicalLivingFrameControlledIllustrationCapabilityId,
  CanonicalLivingFrameControlledIllustrationCostComponentId,
} from '../../src/types/living-frame-controlled-illustration-estimate-basis'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  privateWorkerResourceUsageCostEvidenceSchema,
  type PrivateWorkerResourceUsageCostEvidence,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import {
  verifyLivingFrameControlledIllustrationOperationPreflight,
} from './living-frame-controlled-illustration-operation-preflight'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const GPU_CAPABILITY_IDS = Object.freeze([
  'comfyui_execution_host',
  'comfyui_controlnet_aux_preprocessing',
  'controlnet_conditioning',
  'ipadapter_reference_conditioning',
  'peft_lora_adapter_loading',
] as const satisfies readonly CanonicalLivingFrameControlledIllustrationCapabilityId[])
const AURAFACE_CAPABILITY_IDS = Object.freeze([
  'auraface_identity_measurement',
] as const satisfies readonly CanonicalLivingFrameControlledIllustrationCapabilityId[])

const COMFYUI_TOOL_ID = 'comfyui'
const COMFYUI_OPERATION_ID =
  'tool.comfyui.generate_controlled_image.v1'
const AURAFACE_CANDIDATE_TOOL_ID = 'transformers'
const AURAFACE_CANDIDATE_OPERATION_ID =
  'tool.transformers.measure_auraface_identity_continuity.v1'

const locatorSchema = z.object({
  schemaVersion: z.literal(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_LOCATOR_VERSION,
  ),
  serverOwnedLocatorId: z.string().regex(SAFE_ID),
}).strict()

const scopeSchema = z.object({
  ownerUserId: z.string().regex(SAFE_ID),
  workspaceId: z.string().regex(SAFE_ID),
  projectId: z.string().regex(SAFE_ID),
  editSessionId: z.string().regex(SAFE_ID),
  approvedPlanSnapshotId: z.string().regex(SAFE_ID),
  approvedPlanSnapshotHashSha256: z.string().regex(SHA256),
  packageRecordId: z.string().regex(SAFE_ID),
  packageHashSha256: z.string().regex(SHA256),
}).strict()

const reuseSchema = z.object({
  reuseId: z.string().regex(SAFE_ID),
  order: z.number().int().nonnegative().max(10_000),
  costComponentId: z.enum([
    'shared_controlled_illustration_gpu_host',
    'auraface_cpu_continuity_measurement',
  ]),
  capabilityIds: z.array(z.enum([
    'comfyui_execution_host',
    'comfyui_controlnet_aux_preprocessing',
    'controlnet_conditioning',
    'ipadapter_reference_conditioning',
    'peft_lora_adapter_loading',
    'auraface_identity_measurement',
  ])).min(1).max(6),
  reusedAssetId: z.string().regex(SAFE_ID),
  reusedAssetHashSha256: z.string().regex(SHA256),
  sourceAttemptEvidenceId: z.string().regex(SAFE_ID),
  sourceAttemptEvidenceHashSha256: z.string().regex(SHA256),
  approvedReuseDecisionDigestSha256: z.string().regex(SHA256),
  newWorkerAttemptCreated: z.literal(false),
}).strict()

const attemptAttributionSchema = z.object({
  order: z.number().int().nonnegative().max(10_000),
  evidenceClass: z.enum([
    'private_injected_observed_usage_test',
    'private_embedded_observed_usage_test',
    'canonical_backend_observed_usage_unreleased',
  ]),
  costComponentId: z.enum([
    'shared_controlled_illustration_gpu_host',
    'auraface_cpu_continuity_measurement',
  ]),
  capabilityIds: reuseSchema.shape.capabilityIds,
  evidenceId: z.string().regex(SAFE_ID),
  evidenceHashSha256: z.string().regex(SHA256),
  executionAttemptId: z.string().regex(SAFE_ID),
  approvedWorkItemId: z.string().regex(SAFE_ID),
  attemptOrdinal: z.number().int().positive().max(10),
  operation: z.object({
    canonicalToolId: z.string().regex(SAFE_ID),
    operationId: z.string().regex(SAFE_ID),
    operationProfileHashSha256: z.string().regex(SHA256),
  }).strict(),
  observedUsage: z.object({
    wallTimeMilliseconds:
      z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    allocatedVcpuMilliseconds:
      z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    allocatedMemoryMibMilliseconds:
      z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    allocatedGpuMilliseconds:
      z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    observedGpuActiveMilliseconds:
      z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    networkEgressBytes:
      z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  }).strict(),
  rateCard: z.object({
    rateCardVersion: z.string().regex(SAFE_ID),
    rateCardDigestSha256: z.string().regex(SHA256),
    rateAuthorityClass: z.literal(
      'mock_safe_placeholder_not_cloud_invoice',
    ),
    officialCloudRateApproved: z.literal(false),
    invoiceReconciled: z.literal(false),
  }).strict(),
  actualInternalCostMicros:
    z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  outcome: z.enum(['completed', 'failed', 'unknown']),
  failureCategory: z.enum([
    'none',
    'provider_error',
    'reeditpro_error',
    'validation_error',
    'timeout',
    'cancelled',
    'unknown',
  ]),
  failedOrUnknownAttemptCostRetained: z.literal(true),
  serviceFeeIncluded: z.literal(false),
  customerBillabilityDecisionPresent: z.literal(false),
  customerCreditAllocationPresent: z.literal(false),
}).strict()

const reuseAttributionSchema = reuseSchema.extend({
  incrementalInternalCostMicros: z.literal(0),
  originalAttemptCostErased: z.literal(false),
  customerBillabilityDecisionPresent: z.literal(false),
  customerCreditAllocationPresent: z.literal(false),
}).strict()

const authorityBoundarySchema = z.object({
  controlledInternalCostAttributionOnly: z.literal(true),
  officialRateAuthority: z.literal(false),
  invoiceAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  customerBillabilityAuthority: z.literal(false),
  serviceFeeAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  reservationAuthority: z.literal(false),
  walletAuthority: z.literal(false),
  refundAuthority: z.literal(false),
  settlementAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workItemAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  operationRegistryAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const attributionDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_CLASS,
  ),
  attributionId: z.string().regex(SAFE_ID),
  canonicalScope: scopeSchema,
  sourceBindings: z.object({
    attemptEvidenceSourceClass: z.enum(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_ATTEMPT_EVIDENCE_SOURCE_CLASSES,
    ),
    operationPreflightDigestSha256: z.string().regex(SHA256),
    approvedLineageBindingDigestSha256: z.string().regex(SHA256),
    selectedSceneAdmissionDigestSha256: z.string().regex(SHA256),
    estimateProjectionDigestSha256: z.string().regex(SHA256),
    workGraphProjectionDigestSha256: z.string().regex(SHA256),
  }).strict(),
  attemptAttributions:
    z.array(attemptAttributionSchema).max(1_000),
  exactReuseAttributions:
    z.array(reuseAttributionSchema).max(1_000),
  aggregate: z.object({
    completedAttemptCount: z.number().int().nonnegative().max(1_000),
    failedAttemptCount: z.number().int().nonnegative().max(1_000),
    unknownAttemptCount: z.number().int().nonnegative().max(1_000),
    exactReuseCount: z.number().int().nonnegative().max(1_000),
    sharedGpuHostAttemptCount:
      z.number().int().nonnegative().max(1_000),
    auraFaceCpuMeasurementAttemptCount:
      z.number().int().nonnegative().max(1_000),
    totalObservedAttemptInternalCostMicros:
      z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    exactReuseIncrementalInternalCostMicros: z.literal(0),
    sharedGpuHostChargedOncePerObservedAttempt: z.literal(true),
    capabilityIdsAreAttributionNotIndependentCharges: z.literal(true),
    auraFaceCostSeparatedFromGpuHost: z.literal(true),
    failedAndUnknownAttemptCostRetained: z.literal(true),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES.length,
  ),
  authorityBoundary: authorityBoundarySchema,
  existingCanonicalEstimateRemainsAuthority: z.literal(true),
  existingCanonicalSettlementRemainsAuthority: z.literal(true),
  callerSuppliedCostAccepted: z.literal(false),
  customerChargeCalculated: z.literal(false),
  settlementEventCreated: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const attributionSchema = attributionDraftSchema.extend({
  attributionDigestSha256: z.string().regex(SHA256),
}).strict()

const readerResultSchema = z.object({
  sourceAuthority: z.enum([
    'controlled_living_frame_actual_cost_fixture_reader',
    'canonical_private_worker_resource_usage_repository',
  ]),
  evidenceClass: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ATTEMPT_EVIDENCE_SOURCE_CLASSES,
  ),
  productionReady: z.literal(false),
  canonicalScope: scopeSchema,
  operationPreflight: z.unknown(),
  attemptEvidence: z.array(
    privateWorkerResourceUsageCostEvidenceSchema,
  ).max(1_000),
  exactReuseEvidence: z.array(reuseSchema).max(1_000),
}).strict().superRefine((value, context) => {
  if (
    value.attemptEvidence.length === 0
    && value.exactReuseEvidence.length === 0
  ) {
    context.addIssue({
      code: 'custom',
      message: 'At least one attempt or exact reuse is required.',
    })
  }
  const fixtureSource =
    value.sourceAuthority ===
      'controlled_living_frame_actual_cost_fixture_reader'
    && value.evidenceClass ===
      'controlled_non_promotable_attempt_cost_source'
  const repositorySource =
    value.sourceAuthority ===
      'canonical_private_worker_resource_usage_repository'
    && value.evidenceClass ===
      'canonical_private_attempt_cost_repository_unreleased'
  if (!fixtureSource && !repositorySource) {
    context.addIssue({
      code: 'custom',
      message: 'Actual-cost reader source authority and evidence class are inconsistent.',
    })
  }
  const acceptedEvidenceClasses = fixtureSource
    ? new Set(['private_injected_observed_usage_test'])
    : new Set([
        'private_embedded_observed_usage_test',
        'canonical_backend_observed_usage_unreleased',
      ])
  if (value.attemptEvidence.some((evidence) =>
    !acceptedEvidenceClasses.has(evidence.evidenceClass))) {
    context.addIssue({
      code: 'custom',
      message: 'Attempt evidence class does not match its server reader authority.',
    })
  }
})

const AUTHORITY_BOUNDARY:
  LivingFrameControlledIllustrationActualCostAuthorityBoundary =
  Object.freeze({
    controlledInternalCostAttributionOnly: true,
    officialRateAuthority: false,
    invoiceAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    customerBillabilityAuthority: false,
    serviceFeeAuthority: false,
    estimateAuthority: false,
    approvalAuthority: false,
    reservationAuthority: false,
    walletAuthority: false,
    refundAuthority: false,
    settlementAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    dispatchAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameControlledIllustrationActualCostReaderPort {
  readonly schemaVersion:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_READER_VERSION
  readonly sourceAuthority:
    | 'controlled_living_frame_actual_cost_fixture_reader'
    | 'canonical_private_worker_resource_usage_repository'
  readonly evidenceClass:
    | 'process_bound_controlled_attempt_cost_reader'
    | 'process_bound_canonical_attempt_cost_repository_reader'
  readonly productionReady: false
  readCurrentByServerOwnedLocator(
    locator: LivingFrameControlledIllustrationActualCostLocator,
  ): Promise<unknown>
}

const admittedReaders = new WeakSet<object>()

export function createLivingFrameControlledIllustrationActualCostReader(
  readCurrentByServerOwnedLocator:
    LivingFrameControlledIllustrationActualCostReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): LivingFrameControlledIllustrationActualCostReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw blocked('A process-bound actual-cost reader is required.')
  }
  const reader = Object.freeze({
    schemaVersion:
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_READER_VERSION,
    sourceAuthority:
      'controlled_living_frame_actual_cost_fixture_reader' as const,
    evidenceClass:
      'process_bound_controlled_attempt_cost_reader' as const,
    productionReady: false as const,
    readCurrentByServerOwnedLocator:
      readCurrentByServerOwnedLocator.bind(undefined),
  })
  admittedReaders.add(reader)
  return reader
}

export function createLivingFrameControlledIllustrationCanonicalActualCostReader(
  readCurrentByServerOwnedLocator:
    LivingFrameControlledIllustrationActualCostReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): LivingFrameControlledIllustrationActualCostReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw blocked('A process-bound canonical actual-cost repository reader is required.')
  }
  const reader = Object.freeze({
    schemaVersion:
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_READER_VERSION,
    sourceAuthority:
      'canonical_private_worker_resource_usage_repository' as const,
    evidenceClass:
      'process_bound_canonical_attempt_cost_repository_reader' as const,
    productionReady: false as const,
    readCurrentByServerOwnedLocator:
      readCurrentByServerOwnedLocator.bind(undefined),
  })
  admittedReaders.add(reader)
  return reader
}

export async function bindLivingFrameControlledIllustrationActualCost(
  input: {
    readonly locator: unknown
    readonly reader:
      | LivingFrameControlledIllustrationActualCostReaderPort
      | null
      | undefined
  },
): Promise<LivingFrameControlledIllustrationActualCostAttribution> {
  const locator = parseLocator(input.locator)
  assertReader(input.reader)
  const result = readerResultSchema.parse(
    await input.reader.readCurrentByServerOwnedLocator(locator),
  )
  if (
    !verifyLivingFrameControlledIllustrationOperationPreflight(
      result.operationPreflight,
    )
  ) throw invalid('The controlled-illustration operation preflight is invalid.')
  const preflight = result.operationPreflight
  const attempts = [...result.attemptEvidence]
    .sort(compareAttemptEvidence)
    .map((evidence, order) =>
      compileAttemptAttribution({
        evidence,
        order,
        scope: result.canonicalScope,
      }))
  const reuse = [...result.exactReuseEvidence]
    .sort((left, right) => left.order - right.order)
    .map((entry, order) => {
      if (entry.order !== order) {
        throw invalid('Exact-reuse evidence order is not contiguous.')
      }
      assertCapabilitySet(
        entry.costComponentId,
        entry.capabilityIds,
      )
      return Object.freeze({
        ...entry,
        incrementalInternalCostMicros: 0 as const,
        originalAttemptCostErased: false as const,
        customerBillabilityDecisionPresent: false as const,
        customerCreditAllocationPresent: false as const,
      })
    })
  assertUnique(attempts.map((entry) => entry.evidenceId))
  assertUnique(attempts.map((entry) => entry.executionAttemptId))
  assertUnique(attempts.map((entry) =>
    `${entry.approvedWorkItemId}:${entry.attemptOrdinal}`))
  assertUnique(reuse.map((entry) => entry.reuseId))

  const draft:
    LivingFrameControlledIllustrationActualCostAttributionDraft = {
      contractVersion:
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_CLASS,
      attributionId:
        `lfcost_${sha256AuthorityValue({
          locatorId: locator.serverOwnedLocatorId,
          preflightDigest:
            preflight.preflightDigestSha256,
        }).slice(0, 48)}`,
      canonicalScope: result.canonicalScope,
      sourceBindings: {
        attemptEvidenceSourceClass: result.evidenceClass,
        operationPreflightDigestSha256:
          preflight.preflightDigestSha256,
        approvedLineageBindingDigestSha256:
          preflight.lineage.approvedLineageBindingDigestSha256,
        selectedSceneAdmissionDigestSha256:
          preflight.lineage.selectedSceneAdmissionDigestSha256,
        estimateProjectionDigestSha256:
          preflight.lineage.estimateProjectionDigestSha256,
        workGraphProjectionDigestSha256:
          preflight.lineage.workGraphProjectionDigestSha256,
      },
      attemptAttributions: attempts,
      exactReuseAttributions: reuse,
      aggregate: {
        completedAttemptCount:
          attempts.filter((entry) =>
            entry.outcome === 'completed').length,
        failedAttemptCount:
          attempts.filter((entry) =>
            entry.outcome === 'failed').length,
        unknownAttemptCount:
          attempts.filter((entry) =>
            entry.outcome === 'unknown').length,
        exactReuseCount: reuse.length,
        sharedGpuHostAttemptCount:
          attempts.filter((entry) =>
            entry.costComponentId ===
              'shared_controlled_illustration_gpu_host').length,
        auraFaceCpuMeasurementAttemptCount:
          attempts.filter((entry) =>
            entry.costComponentId ===
              'auraface_cpu_continuity_measurement').length,
        totalObservedAttemptInternalCostMicros:
          safeSum(attempts.map((entry) =>
            entry.actualInternalCostMicros)),
        exactReuseIncrementalInternalCostMicros: 0,
        sharedGpuHostChargedOncePerObservedAttempt: true,
        capabilityIdsAreAttributionNotIndependentCharges: true,
        auraFaceCostSeparatedFromGpuHost: true,
        failedAndUnknownAttemptCostRetained: true,
      },
      openGateCodes: [
        ...LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES,
      ],
      authorityBoundary: AUTHORITY_BOUNDARY,
      existingCanonicalEstimateRemainsAuthority: true,
      existingCanonicalSettlementRemainsAuthority: true,
      callerSuppliedCostAccepted: false,
      customerChargeCalculated: false,
      settlementEventCreated: false,
      productionReady: false,
    }
  return Object.freeze({
    ...draft,
    attributionDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameControlledIllustrationActualCostAttribution(
  value: unknown,
): value is LivingFrameControlledIllustrationActualCostAttribution {
  const parsed = attributionSchema.safeParse(value)
  if (!parsed.success) return false
  const { attributionDigestSha256, ...draft } = parsed.data
  if (
    attributionDigestSha256 !== sha256AuthorityValue(draft)
    || stableAuthorityStringify(draft.openGateCodes)
      !== stableAuthorityStringify(
        LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES,
      )
    || stableAuthorityStringify(draft.authorityBoundary)
      !== stableAuthorityStringify(AUTHORITY_BOUNDARY)
  ) return false
  try {
    assertAttributionSemantics(draft)
    return true
  } catch {
    return false
  }
}

function compileAttemptAttribution(input: {
  evidence: PrivateWorkerResourceUsageCostEvidence
  order: number
  scope: LivingFrameControlledIllustrationActualCostScope
}) {
  const evidence = input.evidence
  assertEvidenceIntegrity(evidence)
  assertScope(evidence, input.scope)
  if (evidence.operation.kind !== 'registered_tool_operation') {
    throw invalid('Provider-operation evidence is not a controlled-illustration worker cost.')
  }
  const costComponentId = classifyOperation(evidence)
  const capabilityIds = costComponentId ===
    'shared_controlled_illustration_gpu_host'
    ? GPU_CAPABILITY_IDS
    : AURAFACE_CAPABILITY_IDS
  return Object.freeze({
    order: input.order,
    evidenceClass: evidence.evidenceClass,
    costComponentId,
    capabilityIds,
    evidenceId: evidence.evidenceId,
    evidenceHashSha256: evidence.evidenceHash,
    executionAttemptId: evidence.identity.executionAttemptId,
    approvedWorkItemId: evidence.identity.approvedWorkItemId,
    attemptOrdinal: evidence.identity.attemptOrdinal,
    operation: {
      canonicalToolId: evidence.operation.canonicalToolId,
      operationId: evidence.operation.operationId,
      operationProfileHashSha256:
        evidence.operation.operationProfileHash,
    },
    observedUsage: {
      wallTimeMilliseconds:
        evidence.resourceUsage.wallTimeMilliseconds,
      allocatedVcpuMilliseconds:
        evidence.resourceUsage.allocatedVcpuMilliseconds,
      allocatedMemoryMibMilliseconds:
        evidence.resourceUsage.allocatedMemoryMibMilliseconds,
      allocatedGpuMilliseconds:
        evidence.resourceUsage.allocatedGpuMilliseconds,
      observedGpuActiveMilliseconds:
        evidence.resourceUsage.observedGpuActiveMilliseconds,
      networkEgressBytes:
        evidence.resourceUsage.networkEgressBytes,
    },
    rateCard: {
      rateCardVersion:
        evidence.infrastructureCost.rateCardVersion,
      rateCardDigestSha256:
        evidence.infrastructureCost.rateCardDigest,
      rateAuthorityClass:
        evidence.infrastructureCost.rateAuthorityClass,
      officialCloudRateApproved: false as const,
      invoiceReconciled: false as const,
    },
    actualInternalCostMicros:
      evidence.infrastructureCost.actualInternalCostMicros,
    outcome: evidence.outcome.state,
    failureCategory: evidence.outcome.failureCategory,
    failedOrUnknownAttemptCostRetained: true as const,
    serviceFeeIncluded: false as const,
    customerBillabilityDecisionPresent: false as const,
    customerCreditAllocationPresent: false as const,
  })
}

function classifyOperation(
  evidence: PrivateWorkerResourceUsageCostEvidence,
): CanonicalLivingFrameControlledIllustrationCostComponentId {
  const operation = evidence.operation
  if (operation.kind !== 'registered_tool_operation') {
    throw invalid('A registered tool operation is required.')
  }
  if (
    operation.canonicalToolId === COMFYUI_TOOL_ID
    && operation.operationId === COMFYUI_OPERATION_ID
    && evidence.resourceUsage.allocatedGpuCount === 1
  ) return 'shared_controlled_illustration_gpu_host'
  if (
    operation.canonicalToolId === AURAFACE_CANDIDATE_TOOL_ID
    && operation.operationId === AURAFACE_CANDIDATE_OPERATION_ID
    && evidence.resourceUsage.allocatedGpuCount === 0
  ) return 'auraface_cpu_continuity_measurement'
  throw invalid('Attempt evidence does not match an admitted controlled-illustration cost component.')
}

function assertEvidenceIntegrity(
  evidence: PrivateWorkerResourceUsageCostEvidence,
): void {
  const parsed =
    privateWorkerResourceUsageCostEvidenceSchema.safeParse(evidence)
  if (!parsed.success) throw invalid('Attempt cost evidence is invalid.')
  const { evidenceHash, ...payload } = parsed.data
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw invalid('Attempt cost evidence digest changed.')
  }
  if (
    parsed.data.readiness.productionReady
    || parsed.data.readiness.productionRateAuthority
    || parsed.data.commercialBoundary.customerPriceIncluded
    || parsed.data.commercialBoundary.customerCreditsIncluded
    || parsed.data.commercialBoundary.serviceFeeIncluded
  ) throw invalid('Only non-promotable internal attempt evidence is accepted.')
}

function assertScope(
  evidence: PrivateWorkerResourceUsageCostEvidence,
  scope: LivingFrameControlledIllustrationActualCostScope,
): void {
  const identity = evidence.identity
  if (
    identity.ownerUserId !== scope.ownerUserId
    || identity.workspaceId !== scope.workspaceId
    || identity.projectId !== scope.projectId
    || identity.editSessionId !== scope.editSessionId
    || identity.approvedPlanSnapshotId !==
      scope.approvedPlanSnapshotId
    || identity.approvedPlanSnapshotHash !==
      scope.approvedPlanSnapshotHashSha256
    || identity.packageRecordId !== scope.packageRecordId
    || identity.packageHash !== scope.packageHashSha256
  ) throw invalid('Attempt cost evidence scope or approved lineage changed.')
}

function assertCapabilitySet(
  componentId:
    CanonicalLivingFrameControlledIllustrationCostComponentId,
  capabilityIds:
    readonly CanonicalLivingFrameControlledIllustrationCapabilityId[],
): void {
  const expected = componentId ===
    'shared_controlled_illustration_gpu_host'
    ? GPU_CAPABILITY_IDS
    : AURAFACE_CAPABILITY_IDS
  if (
    stableAuthorityStringify(capabilityIds)
    !== stableAuthorityStringify(expected)
  ) throw invalid('Exact-reuse capability attribution changed.')
}

function assertAttributionSemantics(
  draft: z.infer<typeof attributionDraftSchema>,
): void {
  draft.attemptAttributions.forEach((entry, order) => {
    if (entry.order !== order) {
      throw invalid('Attempt attribution order changed.')
    }
    assertCapabilitySet(
      entry.costComponentId,
      entry.capabilityIds,
    )
  })
  const acceptedEvidenceClasses =
    draft.sourceBindings.attemptEvidenceSourceClass ===
      'controlled_non_promotable_attempt_cost_source'
      ? new Set(['private_injected_observed_usage_test'])
      : new Set([
          'private_embedded_observed_usage_test',
          'canonical_backend_observed_usage_unreleased',
        ])
  if (draft.attemptAttributions.some((entry) =>
    !acceptedEvidenceClasses.has(entry.evidenceClass))) {
    throw invalid('Attempt attribution evidence source changed.')
  }
  draft.exactReuseAttributions.forEach((entry, order) => {
    if (entry.order !== order) {
      throw invalid('Exact-reuse attribution order changed.')
    }
    assertCapabilitySet(
      entry.costComponentId,
      entry.capabilityIds,
    )
  })
  assertUnique(draft.attemptAttributions.map((entry) => entry.evidenceId))
  assertUnique(draft.attemptAttributions.map((entry) =>
    entry.executionAttemptId))
  assertUnique(draft.exactReuseAttributions.map((entry) => entry.reuseId))
  const attempts = draft.attemptAttributions
  const expectedAggregate = {
    completedAttemptCount:
      attempts.filter((entry) => entry.outcome === 'completed').length,
    failedAttemptCount:
      attempts.filter((entry) => entry.outcome === 'failed').length,
    unknownAttemptCount:
      attempts.filter((entry) => entry.outcome === 'unknown').length,
    exactReuseCount: draft.exactReuseAttributions.length,
    sharedGpuHostAttemptCount:
      attempts.filter((entry) =>
        entry.costComponentId ===
          'shared_controlled_illustration_gpu_host').length,
    auraFaceCpuMeasurementAttemptCount:
      attempts.filter((entry) =>
        entry.costComponentId ===
          'auraface_cpu_continuity_measurement').length,
    totalObservedAttemptInternalCostMicros:
      safeSum(attempts.map((entry) =>
        entry.actualInternalCostMicros)),
    exactReuseIncrementalInternalCostMicros: 0,
    sharedGpuHostChargedOncePerObservedAttempt: true,
    capabilityIdsAreAttributionNotIndependentCharges: true,
    auraFaceCostSeparatedFromGpuHost: true,
    failedAndUnknownAttemptCostRetained: true,
  } as const
  if (
    stableAuthorityStringify(draft.aggregate)
    !== stableAuthorityStringify(expectedAggregate)
  ) throw invalid('Actual-cost attribution aggregate changed.')
}

function compareAttemptEvidence(
  left: PrivateWorkerResourceUsageCostEvidence,
  right: PrivateWorkerResourceUsageCostEvidence,
): number {
  return (
    left.identity.approvedWorkItemId.localeCompare(
      right.identity.approvedWorkItemId,
    )
    || left.identity.attemptOrdinal - right.identity.attemptOrdinal
    || left.identity.executionAttemptId.localeCompare(
      right.identity.executionAttemptId,
    )
  )
}

function assertUnique(values: readonly string[]): void {
  if (new Set(values).size !== values.length) {
    throw invalid('Actual-cost or reuse identity is duplicated.')
  }
}

function safeSum(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0)
  if (!Number.isSafeInteger(total) || total < 0) {
    throw invalid('Observed attempt cost total is invalid.')
  }
  return total
}

function parseLocator(
  locator: unknown,
): LivingFrameControlledIllustrationActualCostLocator {
  const parsed = locatorSchema.safeParse(locator)
  if (!parsed.success) throw invalid('Actual-cost locator is invalid.')
  return parsed.data
}

function assertReader(
  reader:
    | LivingFrameControlledIllustrationActualCostReaderPort
    | null
    | undefined,
): asserts reader is LivingFrameControlledIllustrationActualCostReaderPort {
  if (
    !reader
    || !admittedReaders.has(reader)
    || reader.schemaVersion !==
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_READER_VERSION
    || reader.productionReady !== false
    || typeof reader.readCurrentByServerOwnedLocator !== 'function'
  ) throw blocked('A process-bound actual-cost reader is required.')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    planningOnly: true,
    productionReady: false,
  })
}

function blocked(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    planningOnly: true,
    productionReady: false,
  })
}
