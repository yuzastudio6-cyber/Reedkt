import { z } from 'zod'

import type { ReEditProRequestedModelUse } from '../../../src/types/model-role-routing'
import { REEDITPRO_REQUESTED_MODEL_USES } from '../../../src/types/model-role-routing'
import { ApiError } from '../../errors/api-error'
import { REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION } from '../../reasoning-model-cost'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  createMotionStudioKimiK3AttemptCostEvidence,
  MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
  MOTION_STUDIO_KIMI_K3_MODEL_ID,
  motionStudioKimiK3ProviderUsageV1Schema,
  type MotionStudioKimiK3AttemptCostEvidenceV1,
  type MotionStudioKimiK3ProviderUsageV1,
} from './kimi-k3-cost'
import {
  getMotionStudioStorytellingReasoningPolicyForRole,
  MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID,
  MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS,
  MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
  type MotionStudioStorytellingReasoningRoleId,
} from './storytelling-reasoning-policy'

export const MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_SCHEMA_VERSION =
  'motion-studio.kimi-k3-provider-session-adapter.v1' as const
export const MOTION_STUDIO_KIMI_K3_SESSION_REQUEST_SCHEMA_VERSION =
  'motion-studio.kimi-k3-provider-session-request.v1' as const
export const MOTION_STUDIO_KIMI_K3_SESSION_CHECKPOINT_SCHEMA_VERSION =
  'motion-studio.kimi-k3-provider-session-checkpoint.v1' as const
export const MOTION_STUDIO_KIMI_K3_PROJECT_PROJECTION_SCHEMA_VERSION =
  'motion-studio.reasoning-project-state-projection.v1' as const
export const MOTION_STUDIO_KIMI_K3_MAXIMUM_OUTPUT_TOKENS = 32_768 as const
export const MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS = 24 as const
export const MOTION_STUDIO_KIMI_K3_MAXIMUM_SESSION_INPUT_BYTES = 4_194_304 as const

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().safe()
const safeText = (maximum: number) => z.string().min(1).max(maximum)
  .refine((value) => !containsCredentialMaterial(value), {
    message: 'Provider session text cannot contain credential material, local paths, data URIs, or signed URLs.',
  })
const jsonObject = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  const errors = validateBoundedJson(value)
  errors.forEach((message) => context.addIssue({ code: 'custom', message }))
})

export const motionStudioKimiK3ProjectDataPolicyV1Schema = z.object({
  schemaVersion: z.literal('motion-studio.model-data-routing-policy.v1'),
  policyId: stableId,
  policyVersion: stableId,
  organizationPolicyId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  sensitivity: z.enum(['public', 'internal', 'confidential', 'restricted']),
  permittedProviderIds: z.array(z.enum(['moonshot', 'openai'])).min(1).max(2).readonly(),
  allowedProcessingRegions: z.array(stableId).min(1).max(16).readonly(),
  selectedProcessingRegion: stableId,
  retentionRequirement: z.enum([
    'zero_retention_required',
    'contractual_no_training',
    'standard_retention_allowed',
  ]),
  trainingUseRestriction: z.enum(['prohibited', 'contractually_disabled', 'allowed']),
  likenessConsentState: z.enum(['not_applicable', 'verified', 'missing']),
  confidentialSourcePolicy: z.enum(['not_present', 'provider_permitted', 'provider_forbidden']),
  allowedModalities: z.array(z.enum(['text', 'image', 'video'])).min(1).max(3).readonly(),
  decision: z.enum(['moonshot_allowed', 'moonshot_disallowed', 'unresolved']),
  decidedAt: isoDate,
  decisionDigest: digest,
  immutable: z.literal(true),
}).strict()

export type MotionStudioKimiK3ProjectDataPolicyV1 = z.infer<
  typeof motionStudioKimiK3ProjectDataPolicyV1Schema
>

const mediaReferenceSchema = z.object({
  type: z.literal('media_reference'),
  modality: z.enum(['image', 'video']),
  assetVersionId: stableId,
  contentDigest: digest,
  mimeType: z.enum(['image/png', 'image/jpeg', 'video/mp4']),
  deterministicEvidenceBundleDigest: digest,
  analysisAuthorityId: stableId,
  evidenceCoverage: z.enum(['full_proxy', 'targeted_original_crop', 'combined']),
  containsHumanLikeness: z.boolean(),
}).strict().superRefine((value, context) => {
  if (value.modality === 'image' && !value.mimeType.startsWith('image/')) {
    context.addIssue({ code: 'custom', path: ['mimeType'], message: 'Image references require an allowlisted image MIME type.' })
  }
  if (value.modality === 'video' && value.mimeType !== 'video/mp4') {
    context.addIssue({ code: 'custom', path: ['mimeType'], message: 'Video references require the bounded MP4 analysis route.' })
  }
})

const textPartSchema = z.object({
  type: z.literal('text'),
  text: safeText(100_000),
}).strict()

const messagePartSchema = z.discriminatedUnion('type', [
  textPartSchema,
  mediaReferenceSchema,
])

const toolCallSchema = z.object({
  toolCallId: stableId,
  toolId: stableId,
  arguments: jsonObject,
  idempotencyKey: stableId,
  sideEffectClass: z.enum(['read_only', 'mutating']),
}).strict()

const systemOrUserMessageSchema = z.object({
  messageId: stableId,
  role: z.enum(['system', 'user']),
  content: z.array(messagePartSchema).min(1).max(64).readonly(),
}).strict()

const assistantMessageSchema = z.object({
  messageId: stableId,
  role: z.literal('assistant'),
  content: z.array(textPartSchema).max(64).readonly(),
  reasoningContent: safeText(200_000).optional(),
  toolCalls: z.array(toolCallSchema).max(MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS).readonly(),
}).strict().superRefine((value, context) => {
  if (value.content.length === 0 && value.toolCalls.length === 0) {
    context.addIssue({ code: 'custom', message: 'Assistant messages must retain content or at least one complete tool call.' })
  }
})

const toolResultMessageSchema = z.object({
  messageId: stableId,
  role: z.literal('tool'),
  toolCallId: stableId,
  toolId: stableId,
  result: jsonObject,
  resultDigest: digest,
  outcome: z.enum(['completed', 'failed']),
  failureCategory: stableId.nullable(),
  sideEffectState: z.enum(['none', 'completed_read_only', 'reconciled_mutation']),
}).strict().superRefine((value, context) => {
  if (value.outcome === 'completed' && value.failureCategory !== null) {
    context.addIssue({ code: 'custom', path: ['failureCategory'], message: 'A completed tool result cannot retain a failure category.' })
  }
  if (value.outcome === 'failed' && value.failureCategory === null) {
    context.addIssue({ code: 'custom', path: ['failureCategory'], message: 'A failed tool result requires a stable failure category.' })
  }
})

export const motionStudioKimiK3SessionMessageV1Schema = z.discriminatedUnion('role', [
  systemOrUserMessageSchema,
  assistantMessageSchema,
  toolResultMessageSchema,
])

export type MotionStudioKimiK3SessionMessageV1 = z.infer<
  typeof motionStudioKimiK3SessionMessageV1Schema
>

export const motionStudioKimiK3DynamicToolDefinitionV1Schema = z.object({
  toolId: stableId,
  description: safeText(1_000),
  inputJsonSchema: jsonObject,
  sideEffectClass: z.enum(['read_only', 'mutating']),
  capabilityTags: z.array(stableId).min(1).max(16).readonly(),
}).strict().superRefine((value, context) => {
  strictJsonSchemaErrors(value.inputJsonSchema).forEach((message) => {
    context.addIssue({ code: 'custom', path: ['inputJsonSchema'], message })
  })
})

export type MotionStudioKimiK3DynamicToolDefinitionV1 = z.infer<
  typeof motionStudioKimiK3DynamicToolDefinitionV1Schema
>

export const motionStudioKimiK3SessionCompileInputV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_KIMI_K3_SESSION_REQUEST_SCHEMA_VERSION),
  workloadScope: z.literal(MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE),
  routePolicyVersion: z.literal(MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION),
  providerSessionId: stableId,
  reasoningRunId: stableId,
  logicalArtifactKey: stableId,
  jobId: stableId,
  attemptId: stableId,
  roleId: z.enum(MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS),
  requestedUse: z.enum(REEDITPRO_REQUESTED_MODEL_USES),
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  approvedPlanSnapshotId: stableId,
  approvedExecutionPackageDigest: digest,
  creditReservationId: stableId,
  costEstimateItemId: stableId,
  maximumAuthorizedInternalCostMicros: z.number().int().positive().safe(),
  idempotencyKey: stableId,
  requestPayloadHash: digest,
  maximumOutputTokens: z.number().int().min(1).max(MOTION_STUDIO_KIMI_K3_MAXIMUM_OUTPUT_TOKENS),
  outputJsonSchema: jsonObject,
  projectDataPolicy: motionStudioKimiK3ProjectDataPolicyV1Schema,
  messages: z.array(motionStudioKimiK3SessionMessageV1Schema).min(1).max(512).readonly(),
  requestedToolIds: z.array(stableId).max(MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS).readonly(),
  availableTools: z.array(motionStudioKimiK3DynamicToolDefinitionV1Schema).max(MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS).readonly(),
  fullToolCatalogRequested: z.literal(false),
  streamingRequested: z.literal(true),
  interruptionPolicy: z.literal('checkpoint_then_reconcile'),
  reconnectionPolicy: z.literal('restore_exact_session_no_automatic_resubmit'),
}).strict().superRefine((value, context) => {
  strictJsonSchemaErrors(value.outputJsonSchema).forEach((message) => {
    context.addIssue({ code: 'custom', path: ['outputJsonSchema'], message })
  })
  const scopeFields = ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const
  for (const field of scopeFields) {
    if (value[field] !== value.projectDataPolicy[field]) {
      context.addIssue({ code: 'custom', path: ['projectDataPolicy', field], message: `Project data policy ${field} must match the exact reasoning session.` })
    }
  }
  const inputByteLength = new TextEncoder().encode(JSON.stringify({
    messages: value.messages,
    requestedToolIds: value.requestedToolIds,
    availableTools: value.availableTools,
    outputJsonSchema: value.outputJsonSchema,
  })).byteLength
  if (inputByteLength > MOTION_STUDIO_KIMI_K3_MAXIMUM_SESSION_INPUT_BYTES) {
    context.addIssue({
      code: 'custom',
      message: `Kimi session input exceeds the ${MOTION_STUDIO_KIMI_K3_MAXIMUM_SESSION_INPUT_BYTES}-byte task boundary.`,
    })
  }
})

export type MotionStudioKimiK3SessionCompileInputV1 = z.infer<
  typeof motionStudioKimiK3SessionCompileInputV1Schema
>

export interface MotionStudioKimiK3ProviderSessionRequestV1 {
  schemaVersion: typeof MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_SCHEMA_VERSION
  adapterId: typeof MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID
  workloadScope: typeof MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  canonicalRouteId: typeof MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID
  providerBoundary: 'kimi_k3_provider_boundary'
  providerId: 'moonshot'
  exactProviderModelId: typeof MOTION_STUDIO_KIMI_K3_MODEL_ID
  reasoningEffort: 'max'
  providerSessionId: string
  reasoningRunId: string
  logicalArtifactKey: string
  jobId: string
  attemptId: string
  roleId: MotionStudioStorytellingReasoningRoleId
  requestedUse: ReEditProRequestedModelUse
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedPlanSnapshotId: string
  approvedExecutionPackageDigest: string
  creditReservationId: string
  costEstimateItemId: string
  canonicalRateCardVersion: string
  maximumAuthorizedInternalCostMicros: number
  idempotencyKey: string
  approvedRequestPayloadHash: string
  maximumOutputTokens: number
  outputJsonSchema: Record<string, unknown>
  outputJsonSchemaDigest: string
  messages: readonly MotionStudioKimiK3SessionMessageV1[]
  loadedTools: readonly MotionStudioKimiK3DynamicToolDefinitionV1[]
  unresolvedToolCallIds: readonly string[]
  state: 'compiled_transport_authority_required' | 'waiting_for_tool_results'
  strictJsonSchema: true
  dynamicToolLoading: true
  fullToolCatalogLoaded: false
  samplingOverridesOmitted: true
  streaming: true
  interruptionPolicy: 'checkpoint_then_reconcile'
  reconnectionPolicy: 'restore_exact_session_no_automatic_resubmit'
  reasoningContentProjectAuthority: false
  projectDataPolicyDigest: string
  providerUsageCostRecordingRequired: true
  transportAuthorized: false
  providerCallMade: false
  credentialReadMade: false
  toolExecutionMade: false
  customerChargeCreated: false
  sessionRequestDigest: string
  immutable: true
}

export interface MotionStudioKimiK3ProjectStateProjectionV1 {
  schemaVersion: typeof MOTION_STUDIO_KIMI_K3_PROJECT_PROJECTION_SCHEMA_VERSION
  reasoningSessionId: string
  reasoningRunId: string
  logicalArtifactKey: string
  roleId: MotionStudioStorytellingReasoningRoleId
  requestedUse: ReEditProRequestedModelUse
  approvedPlanSnapshotId: string
  assistantMessages: readonly {
    messageId: string
    content: readonly { type: 'text'; text: string }[]
    toolCallIds: readonly string[]
  }[]
  outputJsonSchemaDigest: string
  state: MotionStudioKimiK3ProviderSessionRequestV1['state']
  reasoningContentIncluded: false
  providerIdentityIncluded: false
  transportAuthorityIncluded: false
  projectionDigest: string
  immutable: true
}

export interface MotionStudioKimiK3SessionCheckpointV1 {
  schemaVersion: typeof MOTION_STUDIO_KIMI_K3_SESSION_CHECKPOINT_SCHEMA_VERSION
  providerSessionId: string
  reasoningRunId: string
  attemptId: string
  sessionRequestDigest: string
  status: 'interrupted' | 'completed'
  lastEventSequence: number
  completeMessages: readonly MotionStudioKimiK3SessionMessageV1[]
  messageStateDigest: string
  structuredOutput: Readonly<Record<string, unknown>> | null
  structuredOutputDigest: string | null
  toolSideEffectsReconciled: boolean
  recoveryAction: 'restore_session_state_only' | 'no_recovery_needed'
  automaticReconnectAttempted: false
  automaticResubmitAuthorized: false
  providerCallMadeByCheckpoint: false
  toolExecutionMadeByCheckpoint: false
  checkpointedAt: string
  checkpointDigest: string
  immutable: true
}

export const MOTION_STUDIO_KIMI_K3_SESSION_CAPABILITY = deepFreeze({
  schemaVersion: 'motion-studio.kimi-k3-session-capability.v1' as const,
  adapterId: MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID,
  providerId: 'moonshot' as const,
  exactProviderModelId: MOTION_STUDIO_KIMI_K3_MODEL_ID,
  reasoningEffortValues: ['max'] as const,
  strictJsonSchema: true as const,
  dynamicToolLoading: true as const,
  completeAssistantMessageRoundTrip: true as const,
  reasoningContentRoundTrip: true as const,
  imageInput: true as const,
  videoInput: true as const,
  streamingStateCheckpoint: true as const,
  automaticReconnect: false as const,
  automaticResubmit: false as const,
  unsupportedSamplingOverridesOmitted: true as const,
  transportImplemented: false as const,
  providerCallAuthorized: false as const,
  capabilitySource: 'owner_frozen_policy_pending_live_qualification' as const,
  immutable: true as const,
})

export function compileMotionStudioKimiK3ProviderSession(
  inputValue: MotionStudioKimiK3SessionCompileInputV1,
): MotionStudioKimiK3ProviderSessionRequestV1 {
  const input = motionStudioKimiK3SessionCompileInputV1Schema.parse(inputValue)
  const policy = getMotionStudioStorytellingReasoningPolicyForRole(input.roleId)
  const errors: string[] = []

  if (!allowedUsesForRole(input.roleId).includes(input.requestedUse)) {
    errors.push(`${input.roleId} cannot perform requested model use ${input.requestedUse}.`)
  }
  if (input.messages[0]?.role !== 'system') {
    errors.push('Kimi provider sessions must begin with the complete bounded system instruction.')
  }
  if (input.requestedUse === 'visual_understanding' || input.requestedUse === 'provider_asset_generation') {
    errors.push('Kimi consumes deterministic visual evidence for reasoning; it is not the canonical visual specialist or an asset generator.')
  }
  validateProjectDataPolicy(input.projectDataPolicy, input.messages, errors)

  const requestedToolIds = new Set(input.requestedToolIds)
  if (requestedToolIds.size !== input.requestedToolIds.length) {
    errors.push('Dynamic tool selection contains duplicate tool identities.')
  }
  const availableById = new Map(input.availableTools.map((tool) => [tool.toolId, tool]))
  if (availableById.size !== input.availableTools.length) {
    errors.push('Dynamic tool definitions contain duplicate tool identities.')
  }
  const loadedTools = input.requestedToolIds.map((toolId) => availableById.get(toolId))
  if (loadedTools.some((tool) => !tool)) {
    errors.push('Every requested dynamic tool must resolve through the bounded capability router.')
  }
  if (input.availableTools.some((tool) => !requestedToolIds.has(tool.toolId))) {
    errors.push('The session adapter accepts only dynamically requested tools, never an unused full catalog.')
  }

  const toolState = validateConversationToolState(
    input.messages,
    loadedTools.filter(Boolean) as MotionStudioKimiK3DynamicToolDefinitionV1[],
  )
  errors.push(...toolState.errors)
  if (errors.length > 0) invalid(errors.join(' '))

  const outputJsonSchemaDigest = sha256CanonicalJson(input.outputJsonSchema)
  const requestBase = {
    schemaVersion: MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_SCHEMA_VERSION,
    adapterId: MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID,
    workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    canonicalRouteId: MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
    providerBoundary: 'kimi_k3_provider_boundary' as const,
    providerId: 'moonshot' as const,
    exactProviderModelId: MOTION_STUDIO_KIMI_K3_MODEL_ID,
    reasoningEffort: 'max' as const,
    providerSessionId: input.providerSessionId,
    reasoningRunId: input.reasoningRunId,
    logicalArtifactKey: input.logicalArtifactKey,
    jobId: input.jobId,
    attemptId: input.attemptId,
    roleId: input.roleId,
    requestedUse: input.requestedUse,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedExecutionPackageDigest: input.approvedExecutionPackageDigest,
    creditReservationId: input.creditReservationId,
    costEstimateItemId: input.costEstimateItemId,
    canonicalRateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    maximumAuthorizedInternalCostMicros: input.maximumAuthorizedInternalCostMicros,
    idempotencyKey: input.idempotencyKey,
    approvedRequestPayloadHash: input.requestPayloadHash,
    maximumOutputTokens: input.maximumOutputTokens,
    outputJsonSchema: structuredClone(input.outputJsonSchema),
    outputJsonSchemaDigest,
    messages: structuredClone(input.messages),
    loadedTools: structuredClone(loadedTools.filter(Boolean)) as MotionStudioKimiK3DynamicToolDefinitionV1[],
    unresolvedToolCallIds: toolState.unresolvedToolCallIds,
    state: toolState.unresolvedToolCallIds.length === 0
      ? 'compiled_transport_authority_required' as const
      : 'waiting_for_tool_results' as const,
    strictJsonSchema: true as const,
    dynamicToolLoading: true as const,
    fullToolCatalogLoaded: false as const,
    samplingOverridesOmitted: true as const,
    streaming: true as const,
    interruptionPolicy: input.interruptionPolicy,
    reconnectionPolicy: input.reconnectionPolicy,
    reasoningContentProjectAuthority: false as const,
    projectDataPolicyDigest: input.projectDataPolicy.decisionDigest,
    providerUsageCostRecordingRequired: true as const,
    transportAuthorized: false as const,
    providerCallMade: false as const,
    credentialReadMade: false as const,
    toolExecutionMade: false as const,
    customerChargeCreated: false as const,
    immutable: true as const,
  }

  if (policy.primary.exactProviderModelId !== requestBase.exactProviderModelId ||
      policy.primary.reasoningEffort !== requestBase.reasoningEffort ||
      policy.primary.canonicalGlobalRouteId !== requestBase.canonicalRouteId) {
    blocked('Kimi session adapter no longer matches the current Storytelling workload policy.')
  }

  return deepFreeze({
    ...requestBase,
    sessionRequestDigest: sha256CanonicalJson(requestBase),
  })
}

export function projectMotionStudioKimiK3SessionForProjectState(
  session: MotionStudioKimiK3ProviderSessionRequestV1,
): MotionStudioKimiK3ProjectStateProjectionV1 {
  assertMotionStudioKimiK3ProviderSession(session)
  const base = {
    schemaVersion: MOTION_STUDIO_KIMI_K3_PROJECT_PROJECTION_SCHEMA_VERSION,
    reasoningSessionId: session.providerSessionId,
    reasoningRunId: session.reasoningRunId,
    logicalArtifactKey: session.logicalArtifactKey,
    roleId: session.roleId,
    requestedUse: session.requestedUse,
    approvedPlanSnapshotId: session.approvedPlanSnapshotId,
    assistantMessages: session.messages
      .filter((message): message is z.infer<typeof assistantMessageSchema> => message.role === 'assistant')
      .map((message) => ({
        messageId: message.messageId,
        content: structuredClone(message.content),
        toolCallIds: message.toolCalls.map((call) => call.toolCallId),
      })),
    outputJsonSchemaDigest: session.outputJsonSchemaDigest,
    state: session.state,
    reasoningContentIncluded: false as const,
    providerIdentityIncluded: false as const,
    transportAuthorityIncluded: false as const,
    immutable: true as const,
  }
  return deepFreeze({ ...base, projectionDigest: sha256CanonicalJson(base) })
}

export function createMotionStudioKimiK3SessionCheckpoint(input: {
  session: MotionStudioKimiK3ProviderSessionRequestV1
  status: 'interrupted' | 'completed'
  lastEventSequence: number
  completeMessages: readonly MotionStudioKimiK3SessionMessageV1[]
  structuredOutput: Record<string, unknown> | null
  checkpointedAt: string
}): MotionStudioKimiK3SessionCheckpointV1 {
  assertMotionStudioKimiK3ProviderSession(input.session)
  const completeMessages = z.array(motionStudioKimiK3SessionMessageV1Schema).min(1).max(512).parse(input.completeMessages)
  safeInteger.parse(input.lastEventSequence)
  isoDate.parse(input.checkpointedAt)
  const toolState = validateConversationToolState(completeMessages, input.session.loadedTools)
  if (toolState.errors.length > 0) invalid(toolState.errors.join(' '))
  if (!messageSequenceStartsWith(completeMessages, input.session.messages)) {
    invalid('A Kimi session checkpoint must preserve the complete compiled message prefix exactly.')
  }
  if (input.status === 'completed' && toolState.unresolvedToolCallIds.length > 0) {
    invalid('A completed Kimi session checkpoint cannot retain unresolved tool calls.')
  }
  const lastMessage = completeMessages.at(-1)
  const structuredOutput = input.structuredOutput === null
    ? null
    : jsonObject.parse(input.structuredOutput)
  if (
    input.status === 'completed' &&
    (lastMessage?.role !== 'assistant' || lastMessage.toolCalls.length > 0)
  ) {
    invalid('A completed Kimi session must end with one final assistant response and no unresolved tool request.')
  }
  if (input.status === 'completed' && structuredOutput === null) {
    invalid('A completed Kimi session requires its strict structured output artifact.')
  }
  if (input.status === 'interrupted' && structuredOutput !== null) {
    invalid('An interrupted Kimi session cannot publish partial structured output as authoritative.')
  }
  if (structuredOutput !== null) {
    const outputErrors = validateJsonSchemaValue(
      structuredOutput,
      input.session.outputJsonSchema,
      'Kimi structured output',
    )
    if (outputErrors.length > 0) invalid(outputErrors.join(' '))
  }
  if (
    structuredOutput !== null &&
    !finalAssistantContentMatchesStructuredOutput(lastMessage, structuredOutput)
  ) {
    invalid('The final Kimi assistant content must exactly match the validated structured output artifact.')
  }
  const toolSideEffectsReconciled = toolState.unreconciledMutationCallIds.length === 0
  const base = {
    schemaVersion: MOTION_STUDIO_KIMI_K3_SESSION_CHECKPOINT_SCHEMA_VERSION,
    providerSessionId: input.session.providerSessionId,
    reasoningRunId: input.session.reasoningRunId,
    attemptId: input.session.attemptId,
    sessionRequestDigest: input.session.sessionRequestDigest,
    status: input.status,
    lastEventSequence: input.lastEventSequence,
    completeMessages: structuredClone(completeMessages),
    messageStateDigest: sha256CanonicalJson(completeMessages),
    structuredOutput: structuredOutput === null ? null : structuredClone(structuredOutput),
    structuredOutputDigest: structuredOutput === null
      ? null
      : sha256CanonicalJson(structuredOutput),
    toolSideEffectsReconciled,
    recoveryAction: input.status === 'interrupted'
      ? 'restore_session_state_only' as const
      : 'no_recovery_needed' as const,
    automaticReconnectAttempted: false as const,
    automaticResubmitAuthorized: false as const,
    providerCallMadeByCheckpoint: false as const,
    toolExecutionMadeByCheckpoint: false as const,
    checkpointedAt: input.checkpointedAt,
    immutable: true as const,
  }
  return deepFreeze({ ...base, checkpointDigest: sha256CanonicalJson(base) })
}

export function restoreMotionStudioKimiK3SessionCheckpoint(
  session: MotionStudioKimiK3ProviderSessionRequestV1,
  checkpoint: MotionStudioKimiK3SessionCheckpointV1,
): {
  completeMessages: readonly MotionStudioKimiK3SessionMessageV1[]
  toolSideEffectsReconciled: boolean
  structuredOutput: Readonly<Record<string, unknown>> | null
  automaticResubmitAuthorized: false
  transportAuthorized: false
} {
  assertMotionStudioKimiK3ProviderSession(session)
  assertMotionStudioKimiK3SessionCheckpoint(checkpoint)
  if (checkpoint.sessionRequestDigest !== session.sessionRequestDigest ||
      checkpoint.providerSessionId !== session.providerSessionId ||
      checkpoint.reasoningRunId !== session.reasoningRunId ||
      checkpoint.attemptId !== session.attemptId) {
    blocked('Kimi session checkpoint does not belong to the exact provider session attempt.')
  }
  if (!messageSequenceStartsWith(checkpoint.completeMessages, session.messages)) {
    blocked('Kimi session checkpoint no longer preserves the exact compiled message prefix.')
  }
  const toolState = validateConversationToolState(
    checkpoint.completeMessages,
    session.loadedTools,
  )
  const expectedSideEffectState = toolState.unreconciledMutationCallIds.length === 0
  if (
    toolState.errors.length > 0 ||
    (checkpoint.status === 'completed' && toolState.unresolvedToolCallIds.length > 0) ||
    checkpoint.toolSideEffectsReconciled !== expectedSideEffectState
  ) {
    blocked('Kimi session checkpoint failed exact tool-state and side-effect reconciliation.')
  }
  if (checkpoint.structuredOutput !== null) {
    const outputErrors = validateJsonSchemaValue(
      checkpoint.structuredOutput,
      session.outputJsonSchema,
      'Kimi restored structured output',
    )
    if (outputErrors.length > 0) blocked(outputErrors.join(' '))
  }
  return deepFreeze({
    completeMessages: structuredClone(checkpoint.completeMessages),
    toolSideEffectsReconciled: checkpoint.toolSideEffectsReconciled,
    structuredOutput: checkpoint.structuredOutput === null
      ? null
      : structuredClone(checkpoint.structuredOutput),
    automaticResubmitAuthorized: false as const,
    transportAuthorized: false as const,
  })
}

export function createMotionStudioKimiK3SessionAttemptCostEvidence(input: {
  session: MotionStudioKimiK3ProviderSessionRequestV1
  checkpoint: MotionStudioKimiK3SessionCheckpointV1
  responseUsageDigest: string
  usage: MotionStudioKimiK3ProviderUsageV1
  outcome: 'completed' | 'failed'
  acceptedArtifact: boolean
  failureCategory: string | null
  latencyMilliseconds: number
  measuredAt: string
}): MotionStudioKimiK3AttemptCostEvidenceV1 {
  assertMotionStudioKimiK3ProviderSession(input.session)
  restoreMotionStudioKimiK3SessionCheckpoint(input.session, input.checkpoint)
  digest.parse(input.responseUsageDigest)
  motionStudioKimiK3ProviderUsageV1Schema.parse(input.usage)
  if (
    (input.outcome === 'completed' && input.checkpoint.status !== 'completed') ||
    (input.outcome === 'failed' && input.checkpoint.status !== 'interrupted')
  ) {
    invalid('Kimi attempt outcome must match the exact completed or interrupted session checkpoint.')
  }
  if (input.acceptedArtifact && input.checkpoint.status !== 'completed') {
    invalid('Accepted Kimi cost evidence requires the exact completed structured-output checkpoint.')
  }
  const result = createMotionStudioKimiK3AttemptCostEvidence({
    logicalArtifactKey: input.session.logicalArtifactKey,
    jobId: input.session.jobId,
    reasoningRunId: input.session.reasoningRunId,
    attemptId: input.session.attemptId,
    approvedPlanSnapshotId: input.session.approvedPlanSnapshotId,
    creditReservationId: input.session.creditReservationId,
    idempotencyKey: input.session.idempotencyKey,
    requestPayloadHash: input.session.approvedRequestPayloadHash,
    responseUsageDigest: input.responseUsageDigest,
    usage: input.usage,
    outcome: input.outcome,
    acceptedArtifact: input.acceptedArtifact,
    failureCategory: input.failureCategory,
    latencyMilliseconds: input.latencyMilliseconds,
    costEstimateItemId: input.session.costEstimateItemId,
    rateCardVersionId: input.session.canonicalRateCardVersion,
    maximumAuthorizedInternalCostMicros: input.session.maximumAuthorizedInternalCostMicros,
    measuredAt: input.measuredAt,
  })
  return result.evidence
}

export function assertMotionStudioKimiK3ProviderSession(
  session: MotionStudioKimiK3ProviderSessionRequestV1,
): void {
  if (session.schemaVersion !== MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_SCHEMA_VERSION ||
      session.adapterId !== MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID ||
      session.workloadScope !== MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE ||
      session.routePolicyVersion !== MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION ||
      session.canonicalRouteId !== MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID ||
      session.exactProviderModelId !== MOTION_STUDIO_KIMI_K3_MODEL_ID ||
      session.reasoningEffort !== 'max') {
    blocked('Kimi provider session lost its exact Storytelling route or adapter authority.')
  }
  if (!session.strictJsonSchema || !session.dynamicToolLoading || session.fullToolCatalogLoaded ||
      !session.samplingOverridesOmitted || !session.streaming ||
      session.reasoningContentProjectAuthority || session.transportAuthorized ||
      session.providerCallMade || session.credentialReadMade || session.toolExecutionMade ||
      session.customerChargeCreated) {
    blocked('Kimi provider session weakened a structured-output, tool, reasoning, transport, credential, or commercial boundary.')
  }
  strictJsonSchemaErrors(session.outputJsonSchema).forEach((message) => blocked(message))
  const toolState = validateConversationToolState(session.messages, session.loadedTools)
  if (toolState.errors.length > 0) blocked(toolState.errors.join(' '))
  const expectedState = toolState.unresolvedToolCallIds.length === 0
    ? 'compiled_transport_authority_required'
    : 'waiting_for_tool_results'
  if (
    sha256CanonicalJson(toolState.unresolvedToolCallIds) !==
      sha256CanonicalJson(session.unresolvedToolCallIds) ||
    session.state !== expectedState ||
    session.maximumOutputTokens < 1 ||
    session.maximumOutputTokens > MOTION_STUDIO_KIMI_K3_MAXIMUM_OUTPUT_TOKENS ||
    session.loadedTools.length > MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS ||
    session.canonicalRateCardVersion !== REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION
  ) {
    blocked('Kimi provider session no longer matches its compiled tool, state, output, or cost authority.')
  }
  if (sha256CanonicalJson(session.outputJsonSchema) !== session.outputJsonSchemaDigest) {
    blocked('Kimi provider session output schema failed digest verification.')
  }
  const base = { ...session } as Record<string, unknown>
  delete base.sessionRequestDigest
  if (sha256CanonicalJson(base) !== session.sessionRequestDigest) {
    blocked('Kimi provider session failed immutable digest verification.')
  }
  if (!session.immutable || !Object.isFrozen(session)) {
    blocked('Kimi provider session must remain deeply immutable.')
  }
}

export function assertMotionStudioKimiK3SessionCheckpoint(
  checkpoint: MotionStudioKimiK3SessionCheckpointV1,
): void {
  const messageValidation = z.array(motionStudioKimiK3SessionMessageV1Schema)
    .min(1)
    .max(512)
    .safeParse(checkpoint.completeMessages)
  if (!messageValidation.success) {
    blocked('Kimi session checkpoint contains an invalid complete message sequence.')
  }
  if (
    (checkpoint.status !== 'interrupted' && checkpoint.status !== 'completed') ||
    !Number.isSafeInteger(checkpoint.lastEventSequence) ||
    checkpoint.lastEventSequence < 0 ||
    !isoDate.safeParse(checkpoint.checkpointedAt).success ||
    checkpoint.recoveryAction !== (checkpoint.status === 'interrupted'
      ? 'restore_session_state_only'
      : 'no_recovery_needed')
  ) {
    blocked('Kimi session checkpoint contains invalid event, time, status, or recovery state.')
  }
  if (checkpoint.schemaVersion !== MOTION_STUDIO_KIMI_K3_SESSION_CHECKPOINT_SCHEMA_VERSION ||
      checkpoint.automaticReconnectAttempted || checkpoint.automaticResubmitAuthorized ||
      checkpoint.providerCallMadeByCheckpoint || checkpoint.toolExecutionMadeByCheckpoint) {
    blocked('Kimi session checkpoint weakened the interruption or replay boundary.')
  }
  if (
    (checkpoint.status === 'completed' &&
      (checkpoint.structuredOutput === null || checkpoint.structuredOutputDigest === null)) ||
    (checkpoint.status === 'interrupted' &&
      (checkpoint.structuredOutput !== null || checkpoint.structuredOutputDigest !== null))
  ) {
    blocked('Kimi session checkpoint weakened its completed or interrupted structured-output boundary.')
  }
  if (
    checkpoint.structuredOutput !== null &&
    sha256CanonicalJson(checkpoint.structuredOutput) !== checkpoint.structuredOutputDigest
  ) {
    blocked('Kimi session checkpoint structured output failed digest verification.')
  }
  if (
    checkpoint.structuredOutput !== null &&
    validateBoundedJson(checkpoint.structuredOutput).length > 0
  ) {
    blocked('Kimi session checkpoint structured output violates the bounded private-data contract.')
  }
  if (
    checkpoint.status === 'completed' &&
    checkpoint.structuredOutput !== null &&
    !finalAssistantContentMatchesStructuredOutput(
      checkpoint.completeMessages.at(-1),
      checkpoint.structuredOutput,
    )
  ) {
    blocked('Kimi session checkpoint final response no longer matches its structured output.')
  }
  if (sha256CanonicalJson(checkpoint.completeMessages) !== checkpoint.messageStateDigest) {
    blocked('Kimi session checkpoint message state failed digest verification.')
  }
  const base = { ...checkpoint } as Record<string, unknown>
  delete base.checkpointDigest
  if (sha256CanonicalJson(base) !== checkpoint.checkpointDigest) {
    blocked('Kimi session checkpoint failed immutable digest verification.')
  }
  if (!checkpoint.immutable || !Object.isFrozen(checkpoint)) {
    blocked('Kimi session checkpoint must remain deeply immutable.')
  }
}

function validateProjectDataPolicy(
  policy: MotionStudioKimiK3ProjectDataPolicyV1,
  messages: readonly MotionStudioKimiK3SessionMessageV1[],
  errors: string[],
): void {
  const base = { ...policy } as Record<string, unknown>
  delete base.decisionDigest
  if (sha256CanonicalJson(base) !== policy.decisionDigest) {
    errors.push('Project model-data policy failed immutable digest verification.')
  }
  if (new Set(policy.permittedProviderIds).size !== policy.permittedProviderIds.length ||
      !policy.permittedProviderIds.includes('moonshot') || policy.decision !== 'moonshot_allowed') {
    errors.push('Project model-data policy does not permit the Moonshot Kimi route.')
  }
  if (new Set(policy.allowedProcessingRegions).size !== policy.allowedProcessingRegions.length ||
      new Set(policy.allowedModalities).size !== policy.allowedModalities.length) {
    errors.push('Project model-data policy region and modality lists must be unique.')
  }
  if (!policy.allowedProcessingRegions.includes(policy.selectedProcessingRegion)) {
    errors.push('Selected Kimi processing region is outside the project policy.')
  }
  if (policy.trainingUseRestriction === 'allowed') {
    errors.push('Kimi production routing requires training use to be prohibited or contractually disabled.')
  }
  if (policy.sensitivity === 'restricted' && policy.retentionRequirement !== 'zero_retention_required') {
    errors.push('Restricted Storytelling material requires a verified zero-retention policy before Kimi routing.')
  }
  if (policy.confidentialSourcePolicy === 'provider_forbidden') {
    errors.push('Confidential-source policy forbids this project from using Kimi.')
  }
  const media = messages.flatMap((message) =>
    message.role === 'system' || message.role === 'user'
      ? message.content.filter((part): part is z.infer<typeof mediaReferenceSchema> => part.type === 'media_reference')
      : [])
  const modalities = new Set(policy.allowedModalities)
  if (!modalities.has('text')) {
    errors.push('Project model-data policy does not permit text input.')
  }
  for (const item of media) {
    if (!modalities.has(item.modality)) {
      errors.push(`Project model-data policy does not permit ${item.modality} input.`)
    }
    if (item.containsHumanLikeness && policy.likenessConsentState !== 'verified') {
      errors.push('Image or video input containing a human likeness requires verified consent authority.')
    }
  }
}

function validateConversationToolState(
  messages: readonly MotionStudioKimiK3SessionMessageV1[],
  loadedTools: readonly MotionStudioKimiK3DynamicToolDefinitionV1[],
): {
  errors: string[]
  unresolvedToolCallIds: string[]
  unreconciledMutationCallIds: string[]
} {
  const errors: string[] = []
  const tools = new Map(loadedTools.map((tool) => [tool.toolId, tool]))
  const calls = new Map<string, z.infer<typeof toolCallSchema>>()
  const results = new Map<string, z.infer<typeof toolResultMessageSchema>>()
  const messageIds = new Set<string>()

  for (const message of messages) {
    if (messageIds.has(message.messageId)) errors.push(`Duplicate provider-session message ID ${message.messageId}.`)
    messageIds.add(message.messageId)
    if (message.role === 'assistant') {
      for (const call of message.toolCalls) {
        const tool = tools.get(call.toolId)
        if (!tool) errors.push(`Tool call ${call.toolCallId} is outside the dynamically loaded tool set.`)
        if (tool && tool.sideEffectClass !== call.sideEffectClass) {
          errors.push(`Tool call ${call.toolCallId} changed the registered side-effect class.`)
        }
        if (tool) errors.push(...validateToolArguments(call, tool))
        if (calls.has(call.toolCallId)) errors.push(`Duplicate provider tool-call ID ${call.toolCallId}.`)
        calls.set(call.toolCallId, call)
      }
    }
    if (message.role === 'tool') {
      const call = calls.get(message.toolCallId)
      if (!call) errors.push(`Tool result ${message.messageId} has no earlier matching tool call.`)
      if (results.has(message.toolCallId)) errors.push(`Tool call ${message.toolCallId} has multiple results.`)
      if (call && (call.toolId !== message.toolId || sha256CanonicalJson(message.result) !== message.resultDigest)) {
        errors.push(`Tool result ${message.messageId} does not match its exact call identity or digest.`)
      }
      if (
        call?.sideEffectClass === 'read_only' &&
        message.outcome === 'completed' &&
        message.sideEffectState !== 'completed_read_only'
      ) {
        errors.push(`Completed read-only tool call ${message.toolCallId} requires completed_read_only evidence.`)
      }
      if (
        call?.sideEffectClass === 'read_only' &&
        message.outcome === 'failed' &&
        message.sideEffectState !== 'none'
      ) {
        errors.push(`Failed read-only tool call ${message.toolCallId} requires an explicit no-side-effect state.`)
      }
      if (
        call?.sideEffectClass === 'mutating' &&
        message.sideEffectState !== 'reconciled_mutation'
      ) {
        errors.push(`Mutating tool call ${message.toolCallId} requires reconciled_mutation evidence before conversation continuation.`)
      }
      results.set(message.toolCallId, message)
    }
  }

  const unresolvedToolCallIds = [...calls.keys()].filter((callId) => !results.has(callId))
  const unreconciledMutationCallIds = unresolvedToolCallIds.filter((callId) =>
    calls.get(callId)?.sideEffectClass === 'mutating')
  return { errors, unresolvedToolCallIds, unreconciledMutationCallIds }
}

function allowedUsesForRole(roleId: MotionStudioStorytellingReasoningRoleId): readonly ReEditProRequestedModelUse[] {
  if (roleId === 'motion_studio.motion_engineer' || roleId === 'motion_studio.code_engineer') {
    return ['tool_code', 'remotion_draft', 'edit_planning']
  }
  if (roleId === 'motion_studio.quality_reviewer') return ['edit_qa_reasoning']
  if (roleId === 'motion_studio.change_impact_reasoner') return ['edit_planning', 'edit_qa_reasoning']
  if (roleId === 'motion_studio.director' || roleId === 'motion_studio.executive_reasoner') {
    return ['user_reasoning', 'edit_planning', 'creative_edit_strategy', 'edit_qa_reasoning']
  }
  return ['user_reasoning', 'edit_planning', 'creative_edit_strategy']
}

/**
 * Reuses the accepted Kimi session validator for sibling server-private
 * planning authorities without copying its tool-call reconciliation rules.
 * This performs validation only; it never executes a tool.
 */
export function inspectMotionStudioKimiK3ConversationToolState(
  messagesValue: readonly MotionStudioKimiK3SessionMessageV1[],
  loadedToolsValue: readonly MotionStudioKimiK3DynamicToolDefinitionV1[],
): {
  errors: readonly string[]
  unresolvedToolCallIds: readonly string[]
  unreconciledMutationCallIds: readonly string[]
} {
  const messages = z.array(motionStudioKimiK3SessionMessageV1Schema)
    .min(1)
    .max(512)
    .parse(messagesValue)
  const loadedTools = z.array(motionStudioKimiK3DynamicToolDefinitionV1Schema)
    .max(MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS)
    .parse(loadedToolsValue)
  const state = validateConversationToolState(messages, loadedTools)
  return deepFreeze({
    errors: [...state.errors],
    unresolvedToolCallIds: [...state.unresolvedToolCallIds],
    unreconciledMutationCallIds: [...state.unreconciledMutationCallIds],
  })
}

/**
 * Shares the accepted recursive strict-output rules with transport-free
 * planning contracts. An empty array means the schema passed validation.
 */
export function validateMotionStudioKimiK3StrictJsonSchema(
  schema: Record<string, unknown>,
): readonly string[] {
  return deepFreeze([...strictJsonSchemaErrors(schema)])
}

export function isMotionStudioKimiK3RequestedUseAllowedForRole(
  roleId: MotionStudioStorytellingReasoningRoleId,
  requestedUse: ReEditProRequestedModelUse,
): boolean {
  return allowedUsesForRole(roleId).includes(requestedUse)
}

function strictJsonSchemaErrors(schema: Record<string, unknown>): string[] {
  const errors = validateBoundedJson(schema)
  if (schema.type !== 'object') errors.push('Strict JSON Schema root type must be object.')
  if (schema.additionalProperties !== false) errors.push('Strict JSON Schema must set additionalProperties to false at the root.')
  if (!isPlainRecord(schema.properties)) errors.push('Strict JSON Schema must define a bounded properties object.')
  if (!Array.isArray(schema.required)) errors.push('Strict JSON Schema must define an explicit required array.')
  const serialized = JSON.stringify(schema)
  if (/"\$ref"\s*:/i.test(serialized)) {
    errors.push('JSON Schema references are forbidden in the bounded provider-session contract.')
  }
  validateStrictObjectNodes(schema, '$', errors)
  return [...new Set(errors)]
}

function validateStrictObjectNodes(
  candidate: unknown,
  path: string,
  errors: string[],
): void {
  if (Array.isArray(candidate)) {
    candidate.forEach((item, index) => validateStrictObjectNodes(item, `${path}[${index}]`, errors))
    return
  }
  if (!isPlainRecord(candidate)) return
  if (candidate.type === 'object') {
    if (candidate.additionalProperties !== false) {
      errors.push(`Strict JSON Schema object ${path} must set additionalProperties to false.`)
    }
    if (!isPlainRecord(candidate.properties)) {
      errors.push(`Strict JSON Schema object ${path} must define properties.`)
    }
    if (!Array.isArray(candidate.required) ||
        !candidate.required.every((entry) => typeof entry === 'string')) {
      errors.push(`Strict JSON Schema object ${path} must define a string required array.`)
    } else if (isPlainRecord(candidate.properties)) {
      const propertyKeys = Object.keys(candidate.properties).sort()
      const requiredKeys = [...new Set(candidate.required)].sort()
      if (sha256CanonicalJson(propertyKeys) !== sha256CanonicalJson(requiredKeys)) {
        errors.push(`Strict JSON Schema object ${path} must require every declared property exactly once.`)
      }
    }
  }
  if (candidate.type === 'array' && candidate.items === undefined) {
    errors.push(`Strict JSON Schema array ${path} must define bounded items.`)
  }
  for (const [key, child] of Object.entries(candidate)) {
    validateStrictObjectNodes(child, `${path}.${key}`, errors)
  }
}

function validateBoundedJson(value: unknown): string[] {
  const errors: string[] = []
  let nodes = 0
  const visit = (candidate: unknown, depth: number, key = ''): void => {
    nodes += 1
    if (nodes > 2_048) {
      errors.push('JSON value exceeds the 2,048-node bound.')
      return
    }
    if (depth > 16) {
      errors.push('JSON value exceeds the 16-level depth bound.')
      return
    }
    if (candidate === null || typeof candidate === 'boolean' || typeof candidate === 'string') {
      if (typeof candidate === 'string' && containsCredentialMaterial(candidate)) {
        errors.push(`JSON field ${key || 'value'} contains credential material, a local path, data URI, or signed URL.`)
      }
      return
    }
    if (typeof candidate === 'number') {
      if (!Number.isFinite(candidate) || Math.abs(candidate) > Number.MAX_SAFE_INTEGER) {
        errors.push(`JSON field ${key || 'value'} must use a finite number within the safe numeric range.`)
      }
      return
    }
    if (Array.isArray(candidate)) {
      if (candidate.length > 512) errors.push(`JSON array ${key || 'value'} exceeds 512 entries.`)
      candidate.forEach((item, index) => visit(item, depth + 1, `${key}[${index}]`))
      return
    }
    if (!isPlainRecord(candidate)) {
      errors.push(`JSON field ${key || 'value'} must be plain JSON data.`)
      return
    }
    const entries = Object.entries(candidate)
    if (entries.length > 256) errors.push(`JSON object ${key || 'value'} exceeds 256 fields.`)
    for (const [childKey, child] of entries) {
      if (/(?:api.?key|authorization|bearer|secret|password|credential|private.?key)/i.test(childKey)) {
        errors.push(`JSON field ${childKey} is forbidden in a provider session contract.`)
      }
      visit(child, depth + 1, childKey)
    }
  }
  visit(value, 0)
  return [...new Set(errors)]
}

function containsCredentialMaterial(value: string): boolean {
  return /(?:\bBearer\s+[A-Za-z0-9._~-]+|\bsk-[A-Za-z0-9_-]{12,}|-----BEGIN [A-Z ]+PRIVATE KEY-----|\b(?:file|data|javascript):|(?:^|\s)(?:\/Users\/|\/home\/|[A-Za-z]:\\)|[?&](?:x-goog-signature|x-amz-signature|signature|sig|token)=)/i.test(value)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
}

function messageSequenceStartsWith(
  messages: readonly MotionStudioKimiK3SessionMessageV1[],
  expectedPrefix: readonly MotionStudioKimiK3SessionMessageV1[],
): boolean {
  if (messages.length < expectedPrefix.length) return false
  return sha256CanonicalJson(messages.slice(0, expectedPrefix.length)) ===
    sha256CanonicalJson(expectedPrefix)
}

function finalAssistantContentMatchesStructuredOutput(
  message: MotionStudioKimiK3SessionMessageV1 | undefined,
  structuredOutput: Readonly<Record<string, unknown>>,
): boolean {
  if (message?.role !== 'assistant' || message.content.length !== 1) return false
  try {
    const parsed = JSON.parse(message.content[0]?.text ?? '') as unknown
    return isPlainRecord(parsed) &&
      validateBoundedJson(parsed).length === 0 &&
      sha256CanonicalJson(parsed) === sha256CanonicalJson(structuredOutput)
  } catch {
    return false
  }
}

function validateToolArguments(
  call: z.infer<typeof toolCallSchema>,
  tool: MotionStudioKimiK3DynamicToolDefinitionV1,
): string[] {
  return validateJsonSchemaValue(
    call.arguments,
    tool.inputJsonSchema,
    `Tool call ${call.toolCallId} for ${tool.toolId}`,
  )
}

function validateJsonSchemaValue(
  value: unknown,
  schema: Record<string, unknown>,
  label: string,
): string[] {
  try {
    const validator = z.fromJSONSchema(
      schema as Parameters<typeof z.fromJSONSchema>[0],
    )
    const result = validator.safeParse(value)
    if (result.success) return []
    return result.error.issues.map((issue) =>
      `${label} failed JSON Schema validation at ${issue.path.join('.') || '$'}: ${issue.message}`)
  } catch (error) {
    return [
      `${label} has an unsupported bounded JSON Schema: ${error instanceof Error ? error.message : 'unknown schema error'}`,
    ]
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
