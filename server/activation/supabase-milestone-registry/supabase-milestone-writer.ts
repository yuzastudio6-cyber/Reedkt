import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseFeatureGateInput,
  SupabaseMilestoneArtifactInput,
  SupabaseMilestoneBundle,
  SupabaseMilestoneBundleValidation,
  SupabaseMilestoneQaGateInput,
  SupabaseMilestoneWriteVerification,
  SupabaseReadinessSnapshotInput,
  SupabaseToolCapabilityInput,
} from './supabase-milestone-registry-types'

export function validateSupabaseMilestoneBundle(bundle: SupabaseMilestoneBundle): SupabaseMilestoneBundleValidation {
  const blockers: string[] = []
  const warnings: string[] = []

  if (!bundle.phaseId || !bundle.runId) blockers.push('Milestone bundle must include phaseId and runId.')
  for (const artifact of bundle.artifacts) {
    if (!artifact.gcsUri.startsWith('gs://')) blockers.push(`Artifact ${artifact.artifactId} must use a private gs:// URI.`)
    if (/^https?:\/\//i.test(artifact.gcsUri)) blockers.push(`Artifact ${artifact.artifactId} uses a public HTTP URL as source of truth.`)
    if (artifact.signedUrlSourceOfTruth) blockers.push(`Artifact ${artifact.artifactId} marks signed URL as source of truth.`)
  }
  for (const featureGate of bundle.featureGateUpdates) {
    if (featureGate.enabled) blockers.push(`Feature gate ${featureGate.gateKey} must remain disabled in Phase 51B.`)
    if (featureGate.productionAllowed || featureGate.externalBetaAllowed || featureGate.paidProductionAllowed || featureGate.broadMediaAllowed) {
      blockers.push(`Feature gate ${featureGate.gateKey} attempts to unlock production, beta, paid production, or broad media.`)
    }
  }
  for (const tool of bundle.toolCapabilities) {
    if (tool.productionAllowed || tool.externalBetaAllowed || tool.broadMediaAllowed) blockers.push(`Tool capability ${tool.toolId} attempts to unlock production, beta, or broad media.`)
  }
  const secretPath = findSecretLookingValue(bundle)
  if (secretPath) blockers.push(`Milestone bundle contains a secret-looking value at ${secretPath}.`)
  if (!bundle.artifacts.length) warnings.push('Milestone bundle has no artifact references.')

  return { ok: blockers.length === 0, blockers, warnings }
}

export async function writeMilestoneBundle(client: SupabaseClient, bundle: SupabaseMilestoneBundle): Promise<SupabaseMilestoneWriteVerification> {
  const validation = validateSupabaseMilestoneBundle(bundle)
  if (!validation.ok) {
    return blockedVerification({
      bundleValidated: false,
      blockers: validation.blockers,
      warnings: validation.warnings,
    })
  }

  try {
    const activationRun = await upsertActivationRun(client, bundle)
    if (!activationRun.id) throw new Error('Activation run upsert did not return an id.')
    const artifactRowsWritten = await upsertActivationArtifacts(client, activationRun.id, bundle.artifacts)
    const qaGateRowsWritten = await upsertActivationQaGates(client, activationRun.id, bundle.qaGates)
    const readinessRowsWritten = await Promise.all(bundle.readinessSnapshots.map((snapshot) => upsertReadinessSnapshot(client, activationRun.id, snapshot)))
    const toolRowsWritten = await Promise.all(bundle.toolCapabilities.map((tool) => upsertToolCapability(client, activationRun.id, tool)))
    const featureRowsWritten = await Promise.all(bundle.featureGateUpdates.map((gate) => upsertFeatureGate(client, activationRun.id, gate)))
    const readback = await readActivationRun(client, bundle.phaseId, bundle.runId)
    return {
      status: 'completed',
      schemaPresent: true,
      migrationApplied: false,
      bundleValidated: true,
      activationRunWritten: true,
      artifactRowsWritten,
      qaGateRowsWritten,
      readinessRowsWritten: readinessRowsWritten.length,
      toolCapabilityRowsWritten: toolRowsWritten.length,
      featureGateRowsWritten: featureRowsWritten.length,
      readbackMatched: readback?.run_id === bundle.runId,
      publicArtifactRejected: true,
      signedUrlRejected: true,
      secretLookingValueRejected: true,
      blockers: [],
      warnings: validation.warnings,
    }
  } catch (error) {
    return blockedVerification({
      schemaPresent: true,
      bundleValidated: true,
      blockers: [sanitizeWriteError(writeErrorMessage(error))],
      warnings: validation.warnings,
    })
  }
}

export async function upsertActivationRun(client: SupabaseClient, bundle: SupabaseMilestoneBundle): Promise<{ id: string }> {
  const row = {
    phase_id: bundle.phaseId,
    phase_name: bundle.phaseName,
    run_id: bundle.runId,
    status: bundle.status,
    track: bundle.track,
    subsystem: bundle.subsystem,
    branch: bundle.branch,
    pr_number: bundle.prNumber,
    pr_url: bundle.prUrl,
    base_branch: bundle.baseBranch,
    commit_sha: bundle.commitSha,
    qa_status: bundle.qaStatus,
    readiness_status: bundle.readinessStatus,
    completed_at: bundle.completedAt,
    summary: bundle.summary,
    summary_json: {
      phaseId: bundle.phaseId,
      runId: bundle.runId,
      artifacts: bundle.artifacts.length,
      qaGates: bundle.qaGates.length,
      readinessSnapshots: bundle.readinessSnapshots.length,
      toolCapabilities: bundle.toolCapabilities.length,
      featureGateUpdates: bundle.featureGateUpdates.length,
    },
    blockers_json: bundle.blockers,
    warnings_json: bundle.warnings,
  }
  const { data, error } = await client.from('activation_runs').upsert(row, { onConflict: 'phase_id,run_id' }).select('id').single()
  if (error) throw error
  return data as { id: string }
}

export async function upsertActivationArtifacts(client: SupabaseClient, activationRunId: string, artifacts: SupabaseMilestoneArtifactInput[]): Promise<number> {
  if (!artifacts.length) return 0
  const rows = artifacts.map((artifact) => ({
    activation_run_id: activationRunId,
    artifact_id: artifact.artifactId,
    artifact_type: artifact.artifactType,
    gcs_path: artifact.gcsUri,
    source_of_truth: artifact.sourceOfTruth,
    signed_url_source_of_truth: artifact.signedUrlSourceOfTruth,
    metadata_json: artifact.metadata ?? {},
  }))
  const { error } = await client.from('activation_artifacts').upsert(rows, { onConflict: 'activation_run_id,artifact_type,gcs_path' })
  if (error) throw error
  return rows.length
}

export async function upsertActivationQaGates(client: SupabaseClient, activationRunId: string, gates: SupabaseMilestoneQaGateInput[]): Promise<number> {
  if (!gates.length) return 0
  const rows = gates.map((gate) => ({
    activation_run_id: activationRunId,
    gate_id: gate.gateId,
    gate_status: gate.status,
    mandatory: gate.mandatory,
    summary: gate.summary,
    evidence_json: gate.evidence ?? {},
  }))
  const { error } = await client.from('activation_qa_gates').upsert(rows, { onConflict: 'activation_run_id,gate_id' })
  if (error) throw error
  return rows.length
}

export async function upsertReadinessSnapshot(client: SupabaseClient, activationRunId: string, snapshot: SupabaseReadinessSnapshotInput): Promise<void> {
  const { error } = await client.from('readiness_snapshots').upsert({
    subsystem: snapshot.subsystem,
    readiness_key: snapshot.readinessKey,
    readiness_status: snapshot.readinessStatus,
    scope: snapshot.scope,
    evidence_json: snapshot.evidence,
    last_activation_run_id: activationRunId,
  }, { onConflict: 'subsystem,readiness_key' })
  if (error) throw error
}

export async function upsertToolCapability(client: SupabaseClient, activationRunId: string, tool: SupabaseToolCapabilityInput): Promise<void> {
  const { error } = await client.from('tool_capabilities').upsert({
    tool_id: tool.toolId,
    display_name: tool.displayName,
    track: tool.track,
    subsystem: tool.subsystem,
    readiness_state: tool.readinessState,
    runtime_allowed: tool.runtimeAllowed,
    production_allowed: tool.productionAllowed,
    external_beta_allowed: tool.externalBetaAllowed,
    broad_media_allowed: tool.broadMediaAllowed,
    evidence_json: tool.evidence,
    last_activation_run_id: activationRunId,
  }, { onConflict: 'track,tool_id' })
  if (error) throw error
}

export async function upsertFeatureGate(client: SupabaseClient, activationRunId: string, gate: SupabaseFeatureGateInput): Promise<void> {
  const { error } = await client.from('feature_gates').upsert({
    gate_key: gate.gateKey,
    gate_name: gate.gateName,
    gate_status: gate.gateStatus,
    enabled: gate.enabled,
    production_allowed: gate.productionAllowed,
    external_beta_allowed: gate.externalBetaAllowed,
    paid_production_allowed: gate.paidProductionAllowed,
    broad_media_allowed: gate.broadMediaAllowed,
    evidence_json: gate.evidence,
    last_activation_run_id: activationRunId,
  }, { onConflict: 'gate_key' })
  if (error) throw error
}

export async function readActivationRun(client: SupabaseClient, phaseId: string, runId: string): Promise<{ id: string; run_id: string } | null> {
  const { data, error } = await client.from('activation_runs').select('id,run_id').eq('phase_id', phaseId).eq('run_id', runId).maybeSingle()
  if (error) throw error
  return data as { id: string; run_id: string } | null
}

export function buildNotAttemptedWriteVerification(blockers: string[] = [], warnings: string[] = []): SupabaseMilestoneWriteVerification {
  return {
    status: 'not_attempted',
    schemaPresent: false,
    migrationApplied: false,
    bundleValidated: false,
    activationRunWritten: false,
    artifactRowsWritten: 0,
    qaGateRowsWritten: 0,
    readinessRowsWritten: 0,
    toolCapabilityRowsWritten: 0,
    featureGateRowsWritten: 0,
    readbackMatched: false,
    publicArtifactRejected: true,
    signedUrlRejected: true,
    secretLookingValueRejected: true,
    blockers,
    warnings,
  }
}

function blockedVerification(input: {
  schemaPresent?: boolean
  bundleValidated: boolean
  blockers: string[]
  warnings: string[]
}): SupabaseMilestoneWriteVerification {
  return {
    status: 'blocked',
    schemaPresent: input.schemaPresent ?? false,
    migrationApplied: false,
    bundleValidated: input.bundleValidated,
    activationRunWritten: false,
    artifactRowsWritten: 0,
    qaGateRowsWritten: 0,
    readinessRowsWritten: 0,
    toolCapabilityRowsWritten: 0,
    featureGateRowsWritten: 0,
    readbackMatched: false,
    publicArtifactRejected: true,
    signedUrlRejected: true,
    secretLookingValueRejected: true,
    blockers: input.blockers,
    warnings: input.warnings,
  }
}

function findSecretLookingValue(value: unknown, path = '$'): string | undefined {
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    const secretPatterns = [
      'supabase_service_role_key',
      'brave_search_api_key',
      'x-subscription-token',
      'bearer ',
      'service_role_key',
      'postgres://',
      'postgresql://',
      'password=',
      'secret=',
      'apikey=',
      'sk-',
    ]
    if (secretPatterns.some((pattern) => lower.includes(pattern))) return path
  }
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findSecretLookingValue(value[index], `${path}[${index}]`)
      if (found) return found
    }
    return undefined
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    if (lowerKey.includes('secret') || lowerKey.includes('service_role_key') || lowerKey.includes('password') || lowerKey.includes('token')) {
      if (typeof nested === 'string' && nested.trim()) return `${path}.${key}`
    }
    const found = findSecretLookingValue(nested, `${path}.${key}`)
    if (found) return found
  }
  return undefined
}

function sanitizeWriteError(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 700)
}

function writeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== 'object') return String(error)
  const record = error as Record<string, unknown>
  const parts = [
    typeof record.code === 'string' ? `code=${record.code}` : undefined,
    typeof record.message === 'string' ? record.message : undefined,
    typeof record.details === 'string' ? `details=${record.details}` : undefined,
    typeof record.hint === 'string' ? `hint=${record.hint}` : undefined,
  ].filter(Boolean)
  if (parts.length) return parts.join(' ')
  try {
    return JSON.stringify(record)
  } catch {
    return String(error)
  }
}
