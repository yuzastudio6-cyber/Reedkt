import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_OWNER_ROUTES,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID,
} from './provider-output-plan-snapshot-policy'
import type {
  CandidateApprovedPlanSnapshot,
  ExecutionBlockValidation,
  PlanSnapshotSchemaValidation,
} from './provider-output-plan-snapshot-types'

const REQUIRED_SNAPSHOT_FIELDS = [
  'planId',
  'planVersion',
  'sourceProviderRunId',
  'qwenModel',
  'deepseekModel',
  'sourceSchemas',
  'selectedIntents',
  'implementationProposalRefs',
  'ownerRoutes',
  'requiredCapabilities',
  'inputArtifactScope',
  'outputArtifactScope',
  'artifactPolicy',
  'qaRequirements',
  'privacyLimits',
  'costLimits',
  'runtimeLimits',
  'rollbackPolicy',
  'blockedActions',
  'handoffRequired',
  'nextOwner',
  'supabaseMilestoneSyncPolicy',
  'executionStatus',
]

const FALSE_SAFETY_FLAGS = [
  'workerExecutionAllowed',
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'providerExecutionAllowed',
  'rawPromptExecution',
  'approvedForRuntime',
  'publicArtifactAllowed',
  'signedUrlSourceOfTruthAllowed',
  'productionReadyAllowed',
  'externalBetaAllowed',
  'broadMediaAllowed',
] as const

const FORBIDDEN_PATTERNS = [
  { id: 'db_url', pattern: /postgres(?:ql)?:\/\/[^\s"'`]+/i },
  { id: 'jwt', pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { id: 'bearer_token', pattern: /bearer\s+[A-Za-z0-9._-]{20,}/i },
  { id: 'provider_key', pattern: /sk-[A-Za-z0-9]{20,}/ },
  { id: 'stripe_key', pattern: /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{20,}/ },
  { id: 'signed_url', pattern: new RegExp(`x-goog-${'signature'}=|x-amz-${'signature'}=|X-Amz-${'Signature'}=`, 'i') },
  { id: 'raw_prompt_payload', pattern: /"prompt"\s*:\s*"[^"]{40,}|raw prompt payload/i },
  { id: 'shell_command_execution', pattern: /\b(?:bash|sh|zsh|python|node|npm|pnpm|yarn|gcloud|supabase|psql|docker|curl)\s+/i },
  { id: 'execution_instruction', pattern: /\b(?:execute|run|dispatch|invoke)\s+(?:worker|tool|route|provider|model|sql|migration)\b/i },
]

function missingFields(snapshot: CandidateApprovedPlanSnapshot): string[] {
  const record = snapshot as unknown as Record<string, unknown>
  return REQUIRED_SNAPSHOT_FIELDS.filter((field) => record[field] === undefined)
}

function ownerRoutesComplete(snapshot: CandidateApprovedPlanSnapshot): boolean {
  const owners = new Set(snapshot.ownerRoutes.map((route) => route.owner))
  return PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_OWNER_ROUTES.every((owner) => owners.has(owner))
}

export function validateCandidateApprovedPlanSnapshot(
  snapshot: CandidateApprovedPlanSnapshot,
): PlanSnapshotSchemaValidation {
  const blockers: string[] = []
  const missing = missingFields(snapshot)
  if (missing.length > 0) blockers.push(...missing.map((field) => `missing_required_field:${field}`))
  if (snapshot.sourceProviderRunId !== PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID) {
    blockers.push('source_provider_run_id_mismatch')
  }
  if (!snapshot.sourceSchemas.includes('plan_snapshot_candidate_v1')) blockers.push('missing_qwen_source_schema')
  if (!snapshot.sourceSchemas.includes('agent_findings_v1')) blockers.push('missing_deepseek_source_schema')
  if (snapshot.qwenModel !== 'qwen3.7-plus') blockers.push('qwen_model_mismatch')
  if (snapshot.deepseekModel !== 'deepseek-v4-flash') blockers.push('deepseek_model_mismatch')
  if (snapshot.executionStatus !== 'candidate_only') blockers.push('execution_status_not_candidate_only')
  if (!ownerRoutesComplete(snapshot)) blockers.push('missing_required_owner_routes')
  if (snapshot.selectedIntents.length === 0) blockers.push('selected_intents_empty')
  if (snapshot.implementationProposalRefs.length === 0) blockers.push('implementation_proposal_refs_empty')

  return {
    phase: 'PLAN_SNAPSHOT_1',
    status: blockers.length === 0 ? 'passed' : 'blocked',
    requiredFieldsPresent: missing.length === 0,
    qwenSchemaAccepted: snapshot.sourceSchemas.includes('plan_snapshot_candidate_v1'),
    deepseekSchemaAccepted: snapshot.sourceSchemas.includes('agent_findings_v1'),
    sourceProviderRunIdAccepted: snapshot.sourceProviderRunId === PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID,
    ownerRoutesComplete: ownerRoutesComplete(snapshot),
    activeBlockers: blockers,
  }
}

export function validateExecutionBlocks(snapshot: CandidateApprovedPlanSnapshot): ExecutionBlockValidation {
  const blockers: string[] = []
  const record = snapshot as unknown as Record<string, unknown>
  for (const flag of FALSE_SAFETY_FLAGS) {
    if (record[flag] !== false) blockers.push(`safety_flag_not_false:${flag}`)
  }
  if (snapshot.requiresWorkerRuntimeOwnerApproval !== true) blockers.push('worker_runtime_owner_approval_not_required')
  if (snapshot.executionStatus !== 'candidate_only') blockers.push('execution_status_not_candidate_only')
  if (snapshot.outputArtifactScope.publicArtifactsAllowed !== false) blockers.push('output_public_artifacts_not_false')
  if (snapshot.outputArtifactScope.signedUrlsAllowed !== false) blockers.push('output_signed_urls_not_false')
  if (snapshot.outputArtifactScope.runtimeDispatchAllowed !== false) blockers.push('runtime_dispatch_not_false')
  if (snapshot.artifactPolicy.publicArtifactAllowed !== false) blockers.push('artifact_public_allowed_not_false')
  if (snapshot.artifactPolicy.signedUrlSourceOfTruthAllowed !== false) blockers.push('signed_url_source_of_truth_not_false')

  const serialized = JSON.stringify(snapshot)
  const matched = FORBIDDEN_PATTERNS.filter((item) => item.pattern.test(serialized)).map((item) => item.id)
  blockers.push(...matched.map((id) => `forbidden_pattern:${id}`))

  return {
    phase: 'PLAN_SNAPSHOT_1',
    status: blockers.length === 0 ? 'passed' : 'blocked',
    allExecutionFlagsFalse: FALSE_SAFETY_FLAGS.every((flag) => record[flag] === false),
    approvedForRuntime: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    routeExecutionAllowed: false,
    providerExecutionAllowed: false,
    rawPromptExecution: false,
    publicArtifactAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
    shellCommandExecutionInstructions: false,
    providerToolWorkerRouteRequests: false,
    activeBlockers: blockers,
  }
}
