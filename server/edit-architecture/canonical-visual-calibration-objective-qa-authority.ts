import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  APPROVED_VISUAL_CALIBRATION_CANDIDATE_OBJECTIVE_QA_PROFILE_ID,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_ID,
  type VisualCalibrationObjectiveQaScenarioKind,
} from '../tool-execution/media-binary-execution'

export const CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_PLANNING_VERSION =
  'canonical-visual-calibration-objective-qa-planning-v1' as const
export const CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION =
  'run_visual_calibration_candidate_objective_qa' as const
export const CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_OUTPUT_ROLE =
  'visual_calibration_candidate_objective_qa_report' as const
export const CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_THRESHOLD_VERSION =
  'motion-studio.visual-calibration-objective-qa-thresholds.2026-07-21.v1' as const
export const CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_COST_PROFILE_ID =
  'ffmpeg_visual_calibration_candidate_objective_qa_cpu_2vcpu_2gib_v1' as const
export const CANONICAL_VISUAL_CALIBRATION_PROVIDER_PLANNING_VERSION =
  'canonical-visual-calibration-provider-planning-v1' as const
export const CANONICAL_VISUAL_CALIBRATION_PROVIDER_PLANNING_OPERATION =
  'generate_visual_calibration_candidate_from_approved_motion_source' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)

const visualCalibrationContextSchema = z.object({
  motionStudioProductionId: identity,
  storytellingStyleAuthorityRefDigest: sha256,
  storytellingProductionAuthorityRefDigest: sha256,
  styleCalibrationPlanId: identity,
  styleCalibrationPlanVersion: z.number().int().positive().max(1_000_000),
  styleCalibrationPlanDigest: sha256,
  calibrationScenarioId: identity,
  calibrationScenarioDigest: sha256,
  referenceContractId: identity,
  referenceContractVersion: z.number().int().positive().max(1_000_000),
  referenceContractDigest: sha256,
  firstFrameAssetId: identity,
  firstFrameSha256: sha256,
  lastFrameAssetId: identity,
  lastFrameSha256: sha256,
  continuityContractId: identity,
  continuityContractVersion: z.number().int().positive().max(1_000_000),
  continuityContractDigest: sha256,
}).strict()

const providerPlanningPayloadSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_VISUAL_CALIBRATION_PROVIDER_PLANNING_VERSION,
  ),
  operationId: z.literal(
    'provider.google.generate_visual_calibration_candidate.v1',
  ),
  providerRouteId: z.literal('gemini_omni_flash'),
  expectedOutputRole: z.literal(
    'provider_visual_calibration_video_mp4',
  ),
  visualCalibrationContext: visualCalibrationContextSchema,
  visualCalibrationContextDigest: sha256,
  providerExecutionMode: z.literal('primary'),
  maximumAuthorizedProviderCostMicros: z.number().int().positive()
    .max(5_000_000),
  maximumAuthorizedInfrastructureCostMicros: z.number().int().positive()
    .max(5_000_000),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingMutationAllowed: z.literal(false),
  }).strict(),
  authorityDigest: sha256,
}).strict()

const planningPayloadSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_PLANNING_VERSION,
  ),
  operationProfileId: z.literal(
    APPROVED_VISUAL_CALIBRATION_CANDIDATE_OBJECTIVE_QA_PROFILE_ID,
  ),
  runnerClass: z.literal(
    OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_ID,
  ),
  thresholdVersion: z.literal(
    CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_THRESHOLD_VERSION,
  ),
  costProfileId: z.literal(
    CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_COST_PROFILE_ID,
  ),
  motionStudioProductionId: identity,
  storytellingStyleAuthorityRefDigest: sha256,
  storytellingProductionAuthorityRefDigest: sha256,
  styleCalibrationPlanId: identity,
  styleCalibrationPlanVersion: z.number().int().positive().max(1_000_000),
  styleCalibrationPlanDigest: sha256,
  calibrationScenarioId: identity,
  calibrationScenarioKind: z.enum([
    'style_led_motion',
    'character_continuity',
    'strict_first_last_frame',
    'reference_heavy',
  ]),
  calibrationScenarioDigest: sha256,
  visualCalibrationContextDigest: sha256,
  sourceProviderWorkItemKey: identity,
  sourceProviderExpectedOutputId: identity,
  sourceProviderOperationId: z.literal(
    'provider.google.generate_visual_calibration_candidate.v1',
  ),
  sourceProviderOutputRole: z.literal(
    'provider_visual_calibration_video_mp4',
  ),
  referenceContractId: identity,
  referenceContractVersion: z.number().int().positive().max(1_000_000),
  referenceContractDigest: sha256,
  firstFrameReference: z.object({
    assetId: identity,
    assetVersionId: identity,
    expectedSha256: sha256,
  }).strict(),
  lastFrameReference: z.object({
    assetId: identity,
    assetVersionId: identity,
    expectedSha256: sha256,
  }).strict(),
  continuityContractId: identity,
  continuityContractVersion: z.number().int().positive().max(1_000_000),
  continuityContractDigest: sha256,
  maximumAuthorizedInfrastructureCostMicros: z.number().int().positive()
    .max(5_000_000),
  commercialBoundary: z.object({
    providerCostIncluded: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingMutationAllowed: z.literal(false),
  }).strict(),
  authorityDigest: sha256,
}).strict()

export type CanonicalVisualCalibrationObjectiveQaPlanningPayload = z.infer<
  typeof planningPayloadSchema
>
export type CanonicalVisualCalibrationProviderPlanningPayload = z.infer<
  typeof providerPlanningPayloadSchema
>

export interface CanonicalVisualCalibrationObjectiveQaWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  executionInput: Record<string, unknown>
  sourceSequenceItemIds: readonly string[]
  sourceCleanupDecisionIds: readonly string[]
  dependencyKeys: readonly string[]
  approvedToolIds: readonly string[]
  expectedOutputs: ReadonlyArray<{
    outputKey: string
    artifactType?: string
    assetRole: string
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
  }>
  providerExecutionMode?: string
  maxAttempts?: number
  required?: boolean
}

export interface CanonicalVisualCalibrationProviderPlanningWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  executionInput: Record<string, unknown>
  sourceSequenceItemIds: readonly string[]
  sourceCleanupDecisionIds: readonly string[]
  dependencyKeys: readonly string[]
  approvedToolIds: readonly string[]
  approvedProviderRoute?: string
  expectedOutputs: ReadonlyArray<{
    outputKey: string
    artifactType?: string
    assetRole: string
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
  }>
  providerExecutionMode?: string
  maxAttempts?: number
  required?: boolean
}

export function createCanonicalVisualCalibrationProviderPlanningPayload(input: {
  visualCalibrationContext: z.input<typeof visualCalibrationContextSchema>
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedInfrastructureCostMicros: number
}): CanonicalVisualCalibrationProviderPlanningPayload {
  const visualCalibrationContext = visualCalibrationContextSchema.parse(
    input.visualCalibrationContext,
  )
  const payload = {
    schemaVersion: CANONICAL_VISUAL_CALIBRATION_PROVIDER_PLANNING_VERSION,
    operationId:
      'provider.google.generate_visual_calibration_candidate.v1' as const,
    providerRouteId: 'gemini_omni_flash' as const,
    expectedOutputRole:
      'provider_visual_calibration_video_mp4' as const,
    visualCalibrationContext,
    visualCalibrationContextDigest: sha256AuthorityValue(
      visualCalibrationContext,
    ),
    providerExecutionMode: 'primary' as const,
    maximumAuthorizedProviderCostMicros:
      input.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedInfrastructureCostMicros:
      input.maximumAuthorizedInfrastructureCostMicros,
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingMutationAllowed: false as const,
    },
  }
  return validateCanonicalVisualCalibrationProviderPlanningPayload({
    ...payload,
    authorityDigest: sha256AuthorityValue(payload),
  })
}

export function validateCanonicalVisualCalibrationProviderPlanningPayload(
  value: unknown,
): CanonicalVisualCalibrationProviderPlanningPayload {
  const payload = providerPlanningPayloadSchema.parse(value)
  const { authorityDigest, ...unsigned } = payload
  if (
    authorityDigest !== sha256AuthorityValue(unsigned) ||
    payload.visualCalibrationContextDigest !== sha256AuthorityValue(
      payload.visualCalibrationContext,
    )
  ) throw invalid('Visual-calibration provider planning digest is invalid.')
  return payload
}

export function assertCanonicalVisualCalibrationProviderPlanningWorkItem(
  workItem: CanonicalVisualCalibrationProviderPlanningWorkItem,
): CanonicalVisualCalibrationProviderPlanningPayload {
  const payload = validateCanonicalVisualCalibrationProviderPlanningPayload(
    workItem.executionInput.structuredPayload,
  )
  const expectedOutputKeys = workItem.executionInput.expectedOutputKeys
  const output = workItem.expectedOutputs[0]
  if (
    workItem.workItemType !== 'generate_visual_calibration_candidate' ||
    workItem.workerClass !== 'provider_worker' ||
    workItem.executionInput.operation !==
      CANONICAL_VISUAL_CALIBRATION_PROVIDER_PLANNING_OPERATION ||
    !Array.isArray(expectedOutputKeys) || expectedOutputKeys.length !== 1 ||
    workItem.sourceSequenceItemIds.length !== 0 ||
    workItem.sourceCleanupDecisionIds.length !== 0 ||
    workItem.dependencyKeys.length !== 0 ||
    workItem.approvedToolIds.length !== 0 ||
    workItem.approvedProviderRoute !== payload.providerRouteId ||
    workItem.expectedOutputs.length !== 1 || !output ||
    expectedOutputKeys[0] !== output.outputKey ||
    output.artifactType !== payload.expectedOutputRole ||
    output.assetRole !== 'generated' || output.contentType !== 'video/mp4' ||
    output.required !== true || output.previewPlaceholderAllowed !== false ||
    workItem.providerExecutionMode !== 'primary' ||
    (workItem.maxAttempts !== undefined && workItem.maxAttempts !== 1) ||
    (workItem.required !== undefined && workItem.required !== true)
  ) throw invalid(
    'Visual-calibration provider work item lost its exact route, output, or one-attempt authority.',
  )
  return payload
}

export function assertCanonicalVisualCalibrationProviderQaPair(input: {
  providerWorkItem: CanonicalVisualCalibrationProviderPlanningWorkItem
  qaWorkItem: CanonicalVisualCalibrationObjectiveQaWorkItem
}): {
  provider: CanonicalVisualCalibrationProviderPlanningPayload
  qa: CanonicalVisualCalibrationObjectiveQaPlanningPayload
} {
  const provider = assertCanonicalVisualCalibrationProviderPlanningWorkItem(
    input.providerWorkItem,
  )
  const qa = assertCanonicalVisualCalibrationObjectiveQaWorkItem(
    input.qaWorkItem,
  )
  const context = provider.visualCalibrationContext
  if (
    qa.sourceProviderWorkItemKey !== input.providerWorkItem.workItemKey ||
    qa.sourceProviderExpectedOutputId !==
      input.providerWorkItem.expectedOutputs[0]?.outputKey ||
    qa.visualCalibrationContextDigest !==
      provider.visualCalibrationContextDigest ||
    qa.motionStudioProductionId !== context.motionStudioProductionId ||
    qa.storytellingStyleAuthorityRefDigest !==
      context.storytellingStyleAuthorityRefDigest ||
    qa.storytellingProductionAuthorityRefDigest !==
      context.storytellingProductionAuthorityRefDigest ||
    qa.styleCalibrationPlanId !== context.styleCalibrationPlanId ||
    qa.styleCalibrationPlanVersion !== context.styleCalibrationPlanVersion ||
    qa.styleCalibrationPlanDigest !== context.styleCalibrationPlanDigest ||
    qa.calibrationScenarioId !== context.calibrationScenarioId ||
    qa.calibrationScenarioDigest !== context.calibrationScenarioDigest ||
    qa.referenceContractId !== context.referenceContractId ||
    qa.referenceContractVersion !== context.referenceContractVersion ||
    qa.referenceContractDigest !== context.referenceContractDigest ||
    qa.firstFrameReference.assetId !== context.firstFrameAssetId ||
    qa.firstFrameReference.expectedSha256 !== context.firstFrameSha256 ||
    qa.lastFrameReference.assetId !== context.lastFrameAssetId ||
    qa.lastFrameReference.expectedSha256 !== context.lastFrameSha256 ||
    qa.continuityContractId !== context.continuityContractId ||
    qa.continuityContractVersion !== context.continuityContractVersion ||
    qa.continuityContractDigest !== context.continuityContractDigest
  ) throw invalid(
    'Visual-calibration provider and objective-QA work items do not share one approved source context.',
  )
  return { provider, qa }
}

export function createCanonicalVisualCalibrationObjectiveQaPlanningPayload(
  input: Omit<
    CanonicalVisualCalibrationObjectiveQaPlanningPayload,
    | 'schemaVersion'
    | 'operationProfileId'
    | 'runnerClass'
    | 'thresholdVersion'
    | 'costProfileId'
    | 'sourceProviderOperationId'
    | 'sourceProviderOutputRole'
    | 'commercialBoundary'
    | 'authorityDigest'
  >,
): CanonicalVisualCalibrationObjectiveQaPlanningPayload {
  const payload = {
    schemaVersion:
      CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_PLANNING_VERSION,
    operationProfileId:
      APPROVED_VISUAL_CALIBRATION_CANDIDATE_OBJECTIVE_QA_PROFILE_ID,
    runnerClass:
      OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_ID,
    thresholdVersion:
      CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_THRESHOLD_VERSION,
    costProfileId:
      CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_COST_PROFILE_ID,
    ...input,
    sourceProviderOperationId:
      'provider.google.generate_visual_calibration_candidate.v1' as const,
    sourceProviderOutputRole:
      'provider_visual_calibration_video_mp4' as const,
    commercialBoundary: {
      providerCostIncluded: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingMutationAllowed: false as const,
    },
  }
  return validateCanonicalVisualCalibrationObjectiveQaPlanningPayload({
    ...payload,
    authorityDigest: sha256AuthorityValue(payload),
  })
}

export function validateCanonicalVisualCalibrationObjectiveQaPlanningPayload(
  value: unknown,
): CanonicalVisualCalibrationObjectiveQaPlanningPayload {
  const payload = planningPayloadSchema.parse(value)
  const { authorityDigest, ...unsigned } = payload
  if (authorityDigest !== sha256AuthorityValue(unsigned)) {
    throw invalid('Visual-calibration objective-QA planning digest is invalid.')
  }
  return payload
}

export function assertCanonicalVisualCalibrationObjectiveQaWorkItem(
  workItem: CanonicalVisualCalibrationObjectiveQaWorkItem,
): CanonicalVisualCalibrationObjectiveQaPlanningPayload {
  const payload = validateCanonicalVisualCalibrationObjectiveQaPlanningPayload(
    workItem.executionInput.structuredPayload,
  )
  const operationIds = workItem.executionInput.approvedToolOperationIds
  const expectedOutputKeys = workItem.executionInput.expectedOutputKeys
  const output = workItem.expectedOutputs[0]
  if (
    workItem.workItemType !== 'run_asset_qa' ||
    workItem.workerClass !== 'qa_worker' ||
    workItem.executionInput.operation !==
      CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION ||
    !Array.isArray(operationIds) || operationIds.length !== 1 ||
    operationIds[0] !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    !Array.isArray(expectedOutputKeys) || expectedOutputKeys.length !== 1 ||
    workItem.sourceSequenceItemIds.length !== 0 ||
    workItem.sourceCleanupDecisionIds.length !== 0 ||
    workItem.dependencyKeys.length !== 1 ||
    workItem.dependencyKeys[0] !== payload.sourceProviderWorkItemKey ||
    workItem.approvedToolIds.length !== 1 ||
    workItem.approvedToolIds[0] !== 'ffmpeg' ||
    workItem.expectedOutputs.length !== 1 || !output ||
    expectedOutputKeys[0] !== output.outputKey ||
    output.artifactType !==
      CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_OUTPUT_ROLE ||
    output.assetRole !== 'qa' || output.contentType !== 'application/json' ||
    output.required !== true || output.previewPlaceholderAllowed !== false ||
    workItem.providerExecutionMode !== 'none' ||
    (workItem.maxAttempts !== undefined && workItem.maxAttempts !== 1) ||
    (workItem.required !== undefined && workItem.required !== true)
  ) throw invalid(
    'Visual-calibration objective-QA work item lost its exact provider dependency, output, or one-attempt authority.',
  )
  return payload
}

export function visualCalibrationScenarioKind(
  value: CanonicalVisualCalibrationObjectiveQaPlanningPayload,
): VisualCalibrationObjectiveQaScenarioKind {
  return value.calibrationScenarioKind
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'canonical_visual_calibration_objective_qa_authority',
  })
}
