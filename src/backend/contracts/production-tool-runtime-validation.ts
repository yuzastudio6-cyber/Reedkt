import type { LicenseReviewRecord, ModelWeightManifest } from './model-license-contracts'
import type { QualityGateResult } from './quality-gate-contracts'
import type { ToolArtifact } from './tool-artifact-contracts'
import type { ToolExecutionPlan } from './tool-execution-contracts'

function assertCondition(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasUrlLikeValue(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('signed://')
    || normalized.includes('x-amz-signature=')
    || normalized.includes('x-goog-signature=')
    || normalized.includes('signature=')
    || normalized.includes('signedurl')
    || normalized.includes('signed_url')
}

export function assertToolExecutionPlanIsApproved(plan: ToolExecutionPlan): void {
  assertCondition(Boolean(plan.approvedSnapshotId), 'Tool execution requires an approved snapshot ID.')
  assertCondition(plan.status !== 'draft', 'Draft tool execution plans cannot execute.')
  assertCondition(plan.status !== 'waiting_approval', 'Tool execution plan is still waiting for approval.')
  assertCondition(plan.status !== 'blocked', plan.blockedReason ?? 'Blocked tool execution plans cannot execute.')

  if (plan.approvalRequired) {
    assertCondition(Boolean(plan.approvedAt), 'Approval-required tool execution plans must include approvedAt.')
  }
}

export function assertArtifactUsesStorageReference(artifact: ToolArtifact): void {
  const artifactRecord = artifact as ToolArtifact & Record<string, unknown>

  assertCondition(artifact.isPrivate === true, 'Tool artifacts must be private by default.')
  assertCondition(artifact.sourceOfTruth === true, 'Tool artifacts must store source-of-truth storage references.')
  assertCondition(Boolean(artifact.storageBucketPurpose), 'Tool artifacts require a storage bucket purpose.')
  assertCondition(Boolean(artifact.storageObjectPath), 'Tool artifacts require a storage object path.')
  assertCondition(!hasUrlLikeValue(artifact.storageObjectPath), 'Tool artifact storage object path must not be a signed URL.')
  assertCondition(!('signedUrl' in artifactRecord), 'Tool artifacts must not persist signedUrl values.')
  assertCondition(!('signed_url' in artifactRecord), 'Tool artifacts must not persist signed_url values.')
  assertCondition(!('url' in artifactRecord), 'Tool artifacts must not persist URL values as source of truth.')
}

export function assertQualityGatesAllowFinalExport(gates: QualityGateResult[]): void {
  const blockingGate = gates.find((gate) => (
    gate.required
    && gate.blocksFinalExport
    && (
      gate.blocking
      || gate.status === 'failed'
      || gate.status === 'blocked'
      || gate.status === 'needs_human_review'
    )
  ))

  assertCondition(!blockingGate, `Final export blocked by quality gate: ${blockingGate?.gateType ?? 'unknown'}.`)
}

export function assertNoRawPromptExecutionPayload(payload: unknown): void {
  const forbiddenKeys = new Set([
    'chatMessages',
    'executionPrompt',
    'messages',
    'prompt',
    'promptText',
    'providerPrompt',
    'rawChat',
    'rawChatText',
    'rawMessages',
    'rawPrompt',
    'rawPromptText',
    'systemPrompt',
    'userPrompt',
  ].map((key) => key.toLowerCase()))

  function visit(value: unknown, path: string): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }

    if (!isRecord(value)) return

    Object.entries(value).forEach(([key, child]) => {
      const normalizedKey = key.toLowerCase()
      assertCondition(!forbiddenKeys.has(normalizedKey), `Raw prompt/chat execution payload is not allowed at ${path}.${key}.`)
      visit(child, `${path}.${key}`)
    })
  }

  visit(payload, 'payload')
}

export function assertModelWeightAllowedForCommercialUse(manifest: ModelWeightManifest): void {
  assertCondition(manifest.commercialUseAllowed, `Model weight is not approved for commercial use: ${manifest.toolId}.`)
  assertCondition(manifest.reviewStatus === 'approved', `Model weight review is not approved: ${manifest.reviewStatus}.`)
}

export function assertLicenseAllowedForProduction(record: LicenseReviewRecord): void {
  assertCondition(record.commercialUseAllowed, `Package is not approved for commercial use: ${record.packageName}.`)
  assertCondition(record.reviewStatus === 'approved', `License review is not approved: ${record.reviewStatus}.`)
  assertCondition(record.distributionRisk !== 'blocked', `Distribution risk is blocked: ${record.packageName}.`)
  assertCondition(record.networkUseRisk !== 'blocked', `Network use risk is blocked: ${record.packageName}.`)
}
