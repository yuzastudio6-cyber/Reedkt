import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_DECISIONS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_PLACEMENTS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_CLASS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_VERSION,
  type LivingFrameControlledIllustrationCapabilityDecision,
  type LivingFrameControlledIllustrationCapabilityExpectation,
  type LivingFrameControlledIllustrationCapabilityKey,
  type LivingFrameControlledIllustrationCapabilityPlacement,
  type LivingFrameControlledIllustrationOperationAuthorityBoundary,
  type LivingFrameControlledIllustrationOperationIssue,
  type LivingFrameControlledIllustrationOperationIssueCode,
  type LivingFrameControlledIllustrationOperationPreflight,
  type LivingFrameControlledIllustrationOperationPreflightDraft,
} from '../../src/types/living-frame-controlled-illustration-operation-preflight'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u

const INPUT_KEYS = [
  'preflightId',
  'approvedLineageBindingDigestSha256',
  'selectedSceneAdmissionDigestSha256',
  'componentAssetIntentDigestSha256',
  'outputFrameExpectationDigestSha256',
  'masterTimingExpectationDigestSha256',
  'controlledIllustrationQualificationDigestSha256',
  'controlledIllustrationSourceObservationDigestSha256',
  'estimateProjectionDigestSha256',
  'workGraphProjectionDigestSha256',
] as const

const EXPECTED_CAPABILITY_CONTRACT = {
  comfyui: {
    placement: 'shared_gpu_host',
    decision: 'required',
  },
  comfyui_controlnet_aux: {
    placement: 'external_control_image_preparation',
    decision: 'conditional',
  },
  controlnet: {
    placement: 'gpu_host_model_conditioning',
    decision: 'conditional',
  },
  ip_adapter: {
    placement: 'gpu_host_reference_conditioning',
    decision: 'conditional',
  },
  peft_lora: {
    placement: 'gpu_host_adapter_loading',
    decision: 'conditional',
  },
  auraface: {
    placement: 'post_generation_cpu_continuity_qa',
    decision: 'conditional',
  },
} as const satisfies Readonly<
  Record<
    LivingFrameControlledIllustrationCapabilityKey,
    {
      readonly placement:
        LivingFrameControlledIllustrationCapabilityPlacement
      readonly decision:
        LivingFrameControlledIllustrationCapabilityDecision
    }
  >
>

const AUTHORITY_BOUNDARY:
  LivingFrameControlledIllustrationOperationAuthorityBoundary =
  Object.freeze({
    planningAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    dispatchAuthority: false,
    modelArtifactAuthority: false,
    assetManifestAuthority: false,
    actualCostAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const inputSchema = z.object({
  preflightId: z.string().regex(SAFE_ID),
  approvedLineageBindingDigestSha256: z.string().regex(SHA256),
  selectedSceneAdmissionDigestSha256: z.string().regex(SHA256),
  componentAssetIntentDigestSha256: z.string().regex(SHA256),
  outputFrameExpectationDigestSha256: z.string().regex(SHA256),
  masterTimingExpectationDigestSha256: z.string().regex(SHA256),
  controlledIllustrationQualificationDigestSha256: z.string().regex(SHA256),
  controlledIllustrationSourceObservationDigestSha256:
    z.string().regex(SHA256),
  estimateProjectionDigestSha256: z.string().regex(SHA256),
  workGraphProjectionDigestSha256: z.string().regex(SHA256),
}).strict()

const capabilityExpectationSchema = z.object({
  capabilityKey: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS,
  ),
  order: z.number().int().min(0).max(5),
  placement: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_PLACEMENTS,
  ),
  decision: z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_DECISIONS,
  ),
  separateProductionToolIdentityExpected: z.literal(false),
  installed: z.literal(false),
  artifactQualified: z.literal(false),
  runtimeQualified: z.literal(false),
  dispatchable: z.literal(false),
}).strict()

const authorityBoundarySchema = z.object(
  Object.fromEntries(
    Object.keys(AUTHORITY_BOUNDARY).map((key) => [
      key,
      z.literal(false),
    ]),
  ) as Record<
    keyof LivingFrameControlledIllustrationOperationAuthorityBoundary,
    z.ZodLiteral<false>
  >,
).strict()

const preflightDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_CLASS,
  ),
  preflightId: z.string().regex(SAFE_ID),
  lineage: z.object({
    approvedLineageBindingDigestSha256: z.string().regex(SHA256),
    selectedSceneAdmissionDigestSha256: z.string().regex(SHA256),
    componentAssetIntentDigestSha256: z.string().regex(SHA256),
    outputFrameExpectationDigestSha256: z.string().regex(SHA256),
    masterTimingExpectationDigestSha256: z.string().regex(SHA256),
    controlledIllustrationQualificationDigestSha256:
      z.string().regex(SHA256),
    controlledIllustrationSourceObservationDigestSha256:
      z.string().regex(SHA256),
    estimateProjectionDigestSha256: z.string().regex(SHA256),
    workGraphProjectionDigestSha256: z.string().regex(SHA256),
  }).strict(),
  capabilityExpectations:
    z.array(capabilityExpectationSchema).length(6),
  operationExpectation: z.object({
    expectedCanonicalToolId: z.literal('comfyui'),
    expectedCanonicalOperationId: z.literal(
      'tool.comfyui.generate_controlled_image.v1',
    ),
    expectedWorkItemType: z.literal('generate_image_asset'),
    expectedWorkerType: z.literal('gpu_ai_worker'),
    expectedAccelerator: z.literal('nvidia_l4'),
    expectedGpuCount: z.literal(1),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkModelFetchAllowed: z.literal(false),
    oneSharedGpuHostLifetime: z.literal(true),
    auraFaceRunsInsideGpuHost: z.literal(false),
    canonicalToolIdentityRegistered: z.literal(false),
    canonicalOperationRegistered: z.literal(false),
    workItemProjected: z.literal(false),
    privateDispatchAdmitted: z.literal(false),
  }).strict(),
  costBinding: z.object({
    estimateCostComponentId: z.literal(
      'shared_controlled_illustration_gpu_host',
    ),
    estimateCapabilityGroup: z.literal(
      'shared_controlled_illustration_runtime',
    ),
    sharedGpuHostPricedOnce: z.literal(true),
    auraFaceSeparateCpuMeasurementConditional: z.literal(true),
    plannedUsageIsActualCostEvidence: z.literal(false),
    failedAndUnknownAttemptCostRetentionRequired: z.literal(true),
    customerCreditCalculationDelegatedToCanonicalEstimate: z.literal(true),
    actualCostDelegatedToCanonicalAttemptCostEvidence: z.literal(true),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES.length,
  ),
  authorityBoundary: authorityBoundarySchema,
  executableOperationPresent: z.literal(false),
  workItemPresent: z.literal(false),
  dispatchGrantPresent: z.literal(false),
  modelArtifactMountPresent: z.literal(false),
  actualAttemptReceiptPresent: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const preflightSchema = preflightDraftSchema.extend({
  preflightDigestSha256: z.string().regex(SHA256),
}).strict()

export type CreateLivingFrameControlledIllustrationOperationPreflightInput =
  z.infer<typeof inputSchema>

export class LivingFrameControlledIllustrationOperationPreflightError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledIllustrationOperationIssue[]

  constructor(
    issues: readonly LivingFrameControlledIllustrationOperationIssue[],
  ) {
    super(
      'Living Frame controlled-illustration operation preflight failed.',
    )
    this.name =
      'LivingFrameControlledIllustrationOperationPreflightError'
    this.issues = issues
  }
}

export function createLivingFrameControlledIllustrationOperationPreflight(
  input: CreateLivingFrameControlledIllustrationOperationPreflightInput,
): LivingFrameControlledIllustrationOperationPreflight {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    throw issue(
      hasUnknownInputKey(input) ? 'unknown_key' : 'input_invalid',
      '$',
    )
  }

  const capabilities =
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS.map(
      (capabilityKey, order) => {
        const expected = EXPECTED_CAPABILITY_CONTRACT[capabilityKey]
        return {
          capabilityKey,
          order,
          placement: expected.placement,
          decision: expected.decision,
          separateProductionToolIdentityExpected: false,
          installed: false,
          artifactQualified: false,
          runtimeQualified: false,
          dispatchable: false,
        } as const satisfies
          LivingFrameControlledIllustrationCapabilityExpectation
      },
    )

  const draft: LivingFrameControlledIllustrationOperationPreflightDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_CLASS,
    preflightId: parsed.data.preflightId,
    lineage: {
      approvedLineageBindingDigestSha256:
        parsed.data.approvedLineageBindingDigestSha256,
      selectedSceneAdmissionDigestSha256:
        parsed.data.selectedSceneAdmissionDigestSha256,
      componentAssetIntentDigestSha256:
        parsed.data.componentAssetIntentDigestSha256,
      outputFrameExpectationDigestSha256:
        parsed.data.outputFrameExpectationDigestSha256,
      masterTimingExpectationDigestSha256:
        parsed.data.masterTimingExpectationDigestSha256,
      controlledIllustrationQualificationDigestSha256:
        parsed.data.controlledIllustrationQualificationDigestSha256,
      controlledIllustrationSourceObservationDigestSha256:
        parsed.data.controlledIllustrationSourceObservationDigestSha256,
      estimateProjectionDigestSha256:
        parsed.data.estimateProjectionDigestSha256,
      workGraphProjectionDigestSha256:
        parsed.data.workGraphProjectionDigestSha256,
    },
    capabilityExpectations: capabilities,
    operationExpectation: {
      expectedCanonicalToolId: 'comfyui',
      expectedCanonicalOperationId:
        'tool.comfyui.generate_controlled_image.v1',
      expectedWorkItemType: 'generate_image_asset',
      expectedWorkerType: 'gpu_ai_worker',
      expectedAccelerator: 'nvidia_l4',
      expectedGpuCount: 1,
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkModelFetchAllowed: false,
      oneSharedGpuHostLifetime: true,
      auraFaceRunsInsideGpuHost: false,
      canonicalToolIdentityRegistered: false,
      canonicalOperationRegistered: false,
      workItemProjected: false,
      privateDispatchAdmitted: false,
    },
    costBinding: {
      estimateCostComponentId:
        'shared_controlled_illustration_gpu_host',
      estimateCapabilityGroup:
        'shared_controlled_illustration_runtime',
      sharedGpuHostPricedOnce: true,
      auraFaceSeparateCpuMeasurementConditional: true,
      plannedUsageIsActualCostEvidence: false,
      failedAndUnknownAttemptCostRetentionRequired: true,
      customerCreditCalculationDelegatedToCanonicalEstimate: true,
      actualCostDelegatedToCanonicalAttemptCostEvidence: true,
    },
    openGateCodes: [
      ...LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES,
    ],
    authorityBoundary: AUTHORITY_BOUNDARY,
    executableOperationPresent: false,
    workItemPresent: false,
    dispatchGrantPresent: false,
    modelArtifactMountPresent: false,
    actualAttemptReceiptPresent: false,
    productionReady: false,
  }

  assertSemantics(draft)
  return deepFreeze({
    ...draft,
    preflightDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameControlledIllustrationOperationPreflight(
  input: unknown,
): input is LivingFrameControlledIllustrationOperationPreflight {
  const parsed = preflightSchema.safeParse(input)
  if (!parsed.success) return false
  try {
    assertSemantics(parsed.data)
    const {
      preflightDigestSha256,
      ...draft
    } = parsed.data
    return preflightDigestSha256 === digest(draft)
  } catch {
    return false
  }
}

function assertSemantics(
  draft: LivingFrameControlledIllustrationOperationPreflightDraft,
): void {
  for (const [index, capability] of
    draft.capabilityExpectations.entries()) {
    const expectedKey =
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS[index]
    if (capability.capabilityKey !== expectedKey) {
      throw issue(
        'capability_order_invalid',
        `$.capabilityExpectations[${index}].capabilityKey`,
      )
    }
    if (capability.order !== index) {
      throw issue(
        'capability_order_invalid',
        `$.capabilityExpectations[${index}].order`,
      )
    }
    const expected = EXPECTED_CAPABILITY_CONTRACT[expectedKey]
    if (
      capability.placement !== expected.placement
      || capability.decision !== expected.decision
    ) {
      throw issue(
        'capability_contract_invalid',
        `$.capabilityExpectations[${index}]`,
      )
    }
  }

  if (
    new Set(
      draft.capabilityExpectations.map((entry) => entry.capabilityKey),
    ).size !== LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS.length
  ) throw issue('capability_set_invalid', '$.capabilityExpectations')

  if (
    draft.capabilityExpectations.filter(
      (entry) => entry.placement === 'shared_gpu_host',
    ).length !== 1
  ) throw issue('gpu_host_count_invalid', '$.capabilityExpectations')

  const auraFace = draft.capabilityExpectations.find(
    (entry) => entry.capabilityKey === 'auraface',
  )
  if (
    !auraFace
    || auraFace.placement !== 'post_generation_cpu_continuity_qa'
  ) throw issue('auraface_placement_invalid', '$.capabilityExpectations')

  if (
    JSON.stringify(draft.openGateCodes)
    !== JSON.stringify(
      LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES,
    )
  ) throw issue('gate_set_invalid', '$.openGateCodes')
}

function hasUnknownInputKey(input: unknown): boolean {
  if (!isRecord(input)) return false
  const allowed = new Set<string>(INPUT_KEYS)
  return Object.keys(input).some((key) => !allowed.has(key))
}

function issue(
  code: LivingFrameControlledIllustrationOperationIssueCode,
  path: string,
): LivingFrameControlledIllustrationOperationPreflightError {
  if (
    !LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_ISSUE_CODES
      .includes(code)
  ) throw new Error('Unknown Living Frame operation issue code.')
  return new LivingFrameControlledIllustrationOperationPreflightError([
    { code, path },
  ])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  throw issue('unsafe_input', '$')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}

