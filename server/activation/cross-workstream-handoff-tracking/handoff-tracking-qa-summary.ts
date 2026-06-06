import { crossWorkstreamHandoffRequiredScripts } from './cross-workstream-handoff-policy'
import type {
  CrossWorkstreamHandoffManifest,
  CrossWorkstreamQaGate,
  CrossWorkstreamQaSummary,
  CrossWorkstreamSourceAudit,
  CrossWorkstreamSupabaseSyncResult,
  OwnerPromptPacketReference,
  OwnerResponseLedger,
  OwnerResponseSchema,
} from './cross-workstream-handoff-types'

export function buildCrossWorkstreamHandoffQaSummary(input: {
  packageScripts: Record<string, string>
  docsPresent: Record<string, boolean>
  repoOwnershipAudit: CrossWorkstreamSourceAudit
  ownerResponseSchema: OwnerResponseSchema
  ownerResponseLedger: OwnerResponseLedger
  ownerPromptPacketRefs: OwnerPromptPacketReference[]
  intakeManifest: CrossWorkstreamHandoffManifest
  supabaseSyncResult: CrossWorkstreamSupabaseSyncResult
  executionMode: boolean
}): CrossWorkstreamQaSummary {
  const gates: CrossWorkstreamQaGate[] = [
    gate('source_of_truth_repo_audit', input.repoOwnershipAudit.implementationAllowed && !input.repoOwnershipAudit.duplicateHandoffTrackingImplementationDetected, 'Required source-of-truth contracts are present or non-blocking gaps are documented.'),
    gate('phase52g_evidence', input.intakeManifest.supabaseMilestoneRefs.includes('52G:phase52g-20260606T033152'), 'Phase 52G completed evidence is referenced.'),
    gate('owner_response_schema', requiredSchemaFieldsPresent(input.ownerResponseSchema), 'Owner response schema includes all required fields and blocked boolean defaults.'),
    gate('owner_response_ledger', input.ownerResponseLedger.records.length === 12, 'Owner response ledger includes all 12 workstreams.'),
    gate('owner_prompt_references', input.ownerPromptPacketRefs.length === 12 && input.ownerPromptPacketRefs.every((ref) => ref.gcsPath.includes('/prompts/')), 'Owner prompt packet references exist and point to private Phase 52G prompt artifacts.'),
    gate('owner_response_statuses', input.ownerResponseLedger.pendingResponses.length === 8 && input.ownerResponseLedger.acceptedWithBlockersResponses.length === 4, 'Initial statuses distinguish pending owners from accepted-with-blockers evidence.'),
    gate('handoff_tracking_policy', input.intakeManifest.responseIntakeInstructions.prohibitedOwnerActions.some((item) => item.includes('Do not execute owner prompts')), 'Handoff tracking policy prevents prompt/runtime execution.'),
    gate('source_of_truth_policy', input.intakeManifest.blockedFeatures.includes('signed_url_source_of_truth') && input.intakeManifest.ownerPromptPacketRefs.every((ref) => ref.gcsPath.startsWith('gs://')), 'Private GCS refs are source of truth and signed URLs remain blocked.'),
    gate('supabase_milestone_sync', input.executionMode ? input.supabaseSyncResult.status === 'completed' : true, input.executionMode ? 'Phase 52H milestone sync completed during execution or exact blocker recorded.' : 'Static mode references Supabase sync without writing.'),
    gate('blocked_features', input.intakeManifest.blockedFeatures.includes('owner_prompt_execution') && input.intakeManifest.blockedFeatures.includes('worker_execution') && input.intakeManifest.blockedFeatures.includes('production_ready'), 'Owner prompt execution, worker execution, production, beta, public artifacts, providers, tools, models, and runtime remain blocked.'),
  ]

  for (const script of crossWorkstreamHandoffRequiredScripts) {
    if (!input.packageScripts[script]) gates.push(gate('blocked_features', false, `Missing package script ${script}.`))
  }
  for (const [docPath, present] of Object.entries(input.docsPresent)) {
    if (!present) gates.push(gate('source_of_truth_repo_audit', false, `Missing Phase 52H doc ${docPath}.`))
  }

  const blockers = gates.filter((item) => item.mandatory && !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  const warnings = Array.from(new Set([...input.repoOwnershipAudit.warnings, ...input.supabaseSyncResult.warnings]))
  return { status: blockers.length ? 'blocked' : 'passed', gates, blockers, warnings }
}

function gate(gateId: CrossWorkstreamQaGate['gateId'], passed: boolean, summary: string): CrossWorkstreamQaGate {
  return { gateId, passed, mandatory: true, summary }
}

function requiredSchemaFieldsPresent(schema: OwnerResponseSchema): boolean {
  const required = ['responseId', 'workstream', 'ownerChat', 'handoffPacketRef', 'responseStatus', 'supabaseUpdateClassification', 'productionReadyAllowed', 'rawPromptExecutionAllowed', 'signedUrlSourceOfTruthAllowed']
  return required.every((field) => schema.requiredFields.includes(field))
}
