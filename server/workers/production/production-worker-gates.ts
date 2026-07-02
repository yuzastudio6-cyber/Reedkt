import type { ToolExecutionPlan } from '../../../src/backend/contracts/tool-execution-contracts'
import {
  evaluateRuntimePolicy,
  evaluateToolLicensePolicy,
  evaluateToolModelWeightPolicy,
  getProductionToolProfile,
} from '../../tool-registry'
import { findForbiddenWorkerPayloadEntries, isUrlLikeOrSignedValue } from './production-worker-artifact-policy'
import { assertIdempotencyKeyMatchesPayload } from './production-worker-idempotency'
import type { ProductionWorkerGateCheck, ProductionWorkerJobPayload } from './production-worker-types'

type GateCheckFactoryInput = {
  gateName: string
  passed: boolean
  hardBlock: boolean
  message: string
  warnings?: string[]
  details?: Record<string, unknown>
}

function gate(input: GateCheckFactoryInput): ProductionWorkerGateCheck {
  return {
    gateName: input.gateName,
    status: input.passed ? 'passed' : input.hardBlock ? 'blocked' : 'warning',
    hardBlock: input.hardBlock && !input.passed,
    message: input.message,
    warnings: input.warnings ?? [],
    details: input.details,
  }
}

function hasRawPromptField(payload: unknown): boolean {
  const rawPromptNeedles = [
    'rawprompt',
    'raw_prompt',
    'prompttext',
    'prompt_text',
    'rawuserchat',
    'raw_user_chat',
    'rawchat',
    'raw_chat',
  ]
  const normalized = JSON.stringify(payload).toLowerCase()
  return rawPromptNeedles.some((needle) => normalized.includes(needle))
}

function hasSecretField(payload: unknown): boolean {
  const secretNeedles = [
    'servicerolekey',
    'service_role_key',
    'providerapikey',
    'provider_api_key',
    'secretvalue',
    'secret_value',
  ]
  const normalized = JSON.stringify(payload).toLowerCase()
  return secretNeedles.some((needle) => normalized.includes(needle))
}

export function approvedSnapshotGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  const passed = Boolean(payload.approvedSnapshotId)
  return gate({
    gateName: 'approved_snapshot',
    passed,
    hardBlock: true,
    message: passed
      ? 'Approved snapshot reference is present.'
      : 'Production worker payloads require approvedSnapshotId.',
  })
}

export function idempotencyGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  try {
    assertIdempotencyKeyMatchesPayload(payload)
    return gate({
      gateName: 'idempotency',
      passed: true,
      hardBlock: true,
      message: 'Stable idempotency key is present and matches payload IDs.',
    })
  } catch (error) {
    return gate({
      gateName: 'idempotency',
      passed: false,
      hardBlock: true,
      message: error instanceof Error ? error.message : 'Worker payload requires a stable idempotency key.',
    })
  }
}

export function rawPromptBlockGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  const passed = !hasRawPromptField(payload)
  return gate({
    gateName: 'raw_prompt_block',
    passed,
    hardBlock: true,
    message: passed
      ? 'No raw prompt/chat execution fields detected.'
      : 'Raw prompt/chat fields are blocked from worker payloads.',
  })
}

export function signedUrlBlockGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  const findings = findForbiddenWorkerPayloadEntries(payload).filter((finding) => (
    finding.toLowerCase().includes('signed') || finding.includes('url_like_value')
  ))
  const passed = findings.length === 0
  return gate({
    gateName: 'signed_url_block',
    passed,
    hardBlock: true,
    message: passed
      ? 'No signed URL/source URL payload fields detected.'
      : 'Signed URLs and raw URLs are blocked from worker payloads.',
    details: findings.length > 0 ? { findings } : undefined,
  })
}

export function secretBlockGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  const passed = !hasSecretField(payload)
  return gate({
    gateName: 'secret_block',
    passed,
    hardBlock: true,
    message: passed
      ? 'No secret/service-role/provider key fields detected.'
      : 'Secrets, service-role keys, and provider API keys are blocked from worker payloads.',
  })
}

export function registryRuntimeGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  const blockingReasons: string[] = []
  const warnings: string[] = []

  for (const toolId of payload.requestedToolIds) {
    const profile = getProductionToolProfile(toolId)
    if (!profile) {
      blockingReasons.push(`Unknown production tool: ${toolId}`)
      continue
    }

    const result = evaluateRuntimePolicy(profile, payload.workerType)
    const productionExecution = payload.executionMode === 'production_ready'
    const hardReasons = result.blockingReasons.filter((reason) => (
      productionExecution ||
      reason.includes('requires GPU execution') ||
      reason.includes('owned by')
    ))

    blockingReasons.push(...hardReasons)
    warnings.push(...result.warnings)

    if (!productionExecution && result.blockingReasons.length > hardReasons.length) {
      warnings.push(...result.blockingReasons)
    }
  }

  return gate({
    gateName: 'registry_runtime',
    passed: blockingReasons.length === 0,
    hardBlock: true,
    message: blockingReasons.length === 0
      ? 'Production tool registry runtime policy passed.'
      : blockingReasons.join(' '),
    warnings,
  })
}

export function licenseModelWeightGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  const blockingReasons: string[] = []
  const warnings: string[] = []
  const productionExecution = payload.executionMode === 'production_ready'

  for (const toolId of payload.requestedToolIds) {
    const profile = getProductionToolProfile(toolId)
    if (!profile) continue

    const licenseResult = evaluateToolLicensePolicy(profile)
    const modelWeightResult = evaluateToolModelWeightPolicy(profile)

    if (productionExecution) {
      blockingReasons.push(...licenseResult.blockingReasons, ...modelWeightResult.blockingReasons)
    } else {
      warnings.push(...licenseResult.blockingReasons, ...modelWeightResult.blockingReasons)
    }

    warnings.push(...licenseResult.warnings, ...modelWeightResult.warnings)
  }

  return gate({
    gateName: 'license_model_weight',
    passed: blockingReasons.length === 0,
    hardBlock: true,
    message: blockingReasons.length === 0
      ? 'License and model-weight policy passed for this execution mode.'
      : blockingReasons.join(' '),
    warnings,
  })
}

export function creditReservationGate(
  payload: ProductionWorkerJobPayload,
  plan?: Pick<ToolExecutionPlan, 'creditReservationId' | 'workerPlan'>,
): ProductionWorkerGateCheck {
  const expensive = payload.executionMode === 'production_ready' &&
    (payload.workerType === 'gpu_ai_worker' || payload.workerType === 'render_worker')
  const creditReservationId = payload.creditReservationId ?? plan?.creditReservationId
  const passed = !expensive || Boolean(creditReservationId)

  return gate({
    gateName: 'credit_reservation',
    passed,
    hardBlock: true,
    message: passed
      ? 'Credit reservation gate passed or is not required for this placeholder mode.'
      : 'Production-ready GPU/render worker jobs require creditReservationId.',
  })
}

export function artifactPolicyGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  const badRefs = payload.storageReferenceIds.filter((referenceId) => isUrlLikeOrSignedValue(referenceId))
  return gate({
    gateName: 'artifact_policy',
    passed: badRefs.length === 0,
    hardBlock: true,
    message: badRefs.length === 0
      ? 'Storage references are IDs/paths, not signed URLs.'
      : 'Storage references must not be signed URLs or raw URLs.',
    details: badRefs.length > 0 ? { badRefs } : undefined,
  })
}

export function qaPolicyGate(
  payload: ProductionWorkerJobPayload,
  plan?: Pick<ToolExecutionPlan, 'requiredQualityGates'>,
): ProductionWorkerGateCheck {
  const finalRender = payload.workerType === 'render_worker' && payload.renderMode === 'final_export'
  const payloadGateCount = (payload.requiredQualityGateIds?.length ?? 0) + (payload.requiredQualityGateTypes?.length ?? 0)
  const planHasFinalExportGate = Boolean(plan?.requiredQualityGates.some((qualityGate) => (
    qualityGate.required && qualityGate.blocksFinalExport
  )))
  const passed = !finalRender || payloadGateCount > 0 || planHasFinalExportGate

  return gate({
    gateName: 'qa_policy',
    passed,
    hardBlock: true,
    message: passed
      ? 'QA policy gate passed or is not a final render/export worker job.'
      : 'Render worker final export requires required QA gate references.',
  })
}

export function workerModeGate(payload: ProductionWorkerJobPayload): ProductionWorkerGateCheck {
  const passed = payload.executionMode !== 'production_blocked'
  return gate({
    gateName: 'worker_mode',
    passed,
    hardBlock: true,
    message: passed
      ? 'Worker execution mode is allowed for Milestone 4 placeholder routing.'
      : 'production_blocked mode cannot be dispatched.',
  })
}

export function assertWorkerPayloadHasApprovedSnapshot(payload: ProductionWorkerJobPayload): void {
  if (!payload.approvedSnapshotId) throw new Error('Worker payload requires approvedSnapshotId.')
}

export function assertWorkerPayloadHasIdempotencyKey(payload: ProductionWorkerJobPayload): void {
  if (!payload.idempotencyKey) throw new Error('Worker payload requires idempotencyKey.')
}

export function assertWorkerPayloadHasNoRawPrompt(payload: ProductionWorkerJobPayload): void {
  if (hasRawPromptField(payload)) throw new Error('Worker payload must not include raw prompt/chat fields.')
}

export function assertWorkerPayloadHasNoSignedUrls(payload: ProductionWorkerJobPayload): void {
  if (findForbiddenWorkerPayloadEntries(payload).some((finding) => finding.toLowerCase().includes('signed') || finding.includes('url_like_value'))) {
    throw new Error('Worker payload must not include signed URLs or raw URLs.')
  }
}

export function assertWorkerTypeAllowedForTools(payload: ProductionWorkerJobPayload): void {
  const result = registryRuntimeGate(payload)
  if (result.hardBlock) throw new Error(result.message)
}

export function assertExecutionPlanAllowed(plan: ToolExecutionPlan, payload: ProductionWorkerJobPayload): void {
  if (plan.id !== payload.toolExecutionPlanId) {
    throw new Error('Worker payload toolExecutionPlanId does not match execution plan.')
  }
  if (plan.approvedSnapshotId !== payload.approvedSnapshotId) {
    throw new Error('Worker payload approvedSnapshotId does not match execution plan.')
  }
  if (plan.status === 'draft' || plan.status === 'waiting_approval' || plan.status === 'blocked') {
    throw new Error(`Tool execution plan status does not allow dispatch: ${plan.status}`)
  }
}

export function assertCreditReservationIfRequired(payload: ProductionWorkerJobPayload, plan?: ToolExecutionPlan): void {
  const result = creditReservationGate(payload, plan)
  if (result.hardBlock) throw new Error(result.message)
}

export function assertQualityGatesNotBypassed(payload: ProductionWorkerJobPayload, plan?: ToolExecutionPlan): void {
  const result = qaPolicyGate(payload, plan)
  if (result.hardBlock) throw new Error(result.message)
}

export function assertRevideoNotProductionExecuted(payload: ProductionWorkerJobPayload): void {
  if (payload.executionMode === 'production_ready' && payload.requestedToolIds.includes('revideo')) {
    throw new Error('Revideo is evaluation-only and blocked from production worker execution.')
  }
}

export function runProductionWorkerGates(
  payload: ProductionWorkerJobPayload,
  plan?: ToolExecutionPlan,
): ProductionWorkerGateCheck[] {
  return [
    approvedSnapshotGate(payload),
    idempotencyGate(payload),
    rawPromptBlockGate(payload),
    signedUrlBlockGate(payload),
    secretBlockGate(payload),
    registryRuntimeGate(payload),
    licenseModelWeightGate(payload),
    creditReservationGate(payload, plan),
    artifactPolicyGate(payload),
    qaPolicyGate(payload, plan),
    workerModeGate(payload),
  ]
}

export function getHardFailedGates(gates: ProductionWorkerGateCheck[]): ProductionWorkerGateCheck[] {
  return gates.filter((item) => item.hardBlock)
}
