import { toolCapabilityManifestSchema } from '../shared-agent-tool-architecture'
import { toolCapabilityRegistryExpectedCounts } from './tool-capability-registry-policy'
import { buildToolCapabilityRegistrySummary, toolCapabilityRecords } from './canonical-tool-capability-records'
import type { ToolCapabilityRecord, ToolCapabilityRegistryValidation } from './tool-capability-registry-types'

const requiredManifestFields = [
  'internalBetaCandidateReady',
  'productionReady',
  'readinessEvidence',
  'lastValidatedRunId',
  'supabaseMilestoneRefs',
] as const

export function validateToolCapabilityRegistry(records: ToolCapabilityRecord[] = toolCapabilityRecords): ToolCapabilityRegistryValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  const summary = buildToolCapabilityRegistrySummary(records)

  if (summary.totalRecords !== toolCapabilityRegistryExpectedCounts.total) blockers.push(`Expected ${toolCapabilityRegistryExpectedCounts.total} capability records, got ${summary.totalRecords}.`)
  for (const [track, expected] of Object.entries(toolCapabilityRegistryExpectedCounts)) {
    if (track === 'total') continue
    const actual = summary.byTrack[track as keyof typeof summary.byTrack]
    if (actual !== expected) blockers.push(`Expected ${expected} ${track} records, got ${actual}.`)
  }
  if (summary.duplicateKeys.length) blockers.push(`Duplicate track/toolId keys: ${summary.duplicateKeys.join(', ')}`)

  for (const item of records) {
    const schemaMissing = toolCapabilityManifestSchema.requiredFields.filter((field) => !(field in item))
    if (schemaMissing.length) blockers.push(`${item.track}:${item.toolId} is missing Phase 52A schema field(s): ${schemaMissing.join(', ')}`)
    const missing = requiredManifestFields.filter((field) => !(field in item))
    if (missing.length) blockers.push(`${item.track}:${item.toolId} is missing manifest field(s): ${missing.join(', ')}`)
    if (item.productionReady) blockers.push(`${item.track}:${item.toolId} attempts productionReady=true.`)
    if (item.runtimeExecutionAllowed || item.frontendExecutionAllowed || item.providerCallAllowed) blockers.push(`${item.track}:${item.toolId} attempts to enable runtime/frontend/provider execution.`)
    if (item.publicArtifactAllowed || item.signedUrlSourceOfTruthAllowed || item.rawPromptExecutionAllowed) blockers.push(`${item.track}:${item.toolId} attempts to enable public artifact, signed URL truth, or raw prompt execution.`)
    if (!item.readinessEvidence.length) blockers.push(`${item.track}:${item.toolId} has no readiness evidence.`)
    if (!item.supabaseMilestoneRefs.length) blockers.push(`${item.track}:${item.toolId} has no Supabase milestone reference.`)
    if (statusNeedsBlocker(item.status) && !item.blockerReason) blockers.push(`${item.track}:${item.toolId} has status ${item.status} but no blockerReason.`)
    if (item.toolId === 'demucs' && item.status !== 'blocked_pending_model_provenance') blockers.push('Demucs must remain blocked_pending_model_provenance.')
    if ((item.toolId === 'qwen3_vl' || item.toolId === 'vlm_track_b_route') && item.status !== 'excluded_for_initial_internal_testing') blockers.push(`${item.toolId} must remain excluded_for_initial_internal_testing.`)
  }

  const schemaFields = new Set(toolCapabilityManifestSchema.requiredFields)
  for (const field of requiredManifestFields) {
    if (!schemaFields.has(field)) warnings.push(`Phase 52A schema does not list ${field}; Phase 52B still requires it per prompt contract.`)
  }
  if (summary.internalBetaCandidateReadyCount < 1) warnings.push('No internal beta candidate capability is marked ready.')

  return { ok: blockers.length === 0, recordCount: records.length, summary, blockers, warnings }
}

function statusNeedsBlocker(status: ToolCapabilityRecord['status']): boolean {
  return [
    'implemented_but_blocked',
    'blocked_pending_model_provenance',
    'blocked_pending_runtime_resolution',
    'excluded_for_initial_internal_testing',
    'future_scoped',
    'external_track_owned_pending_manifest',
    'evidence_missing',
  ].includes(status)
}
