import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_BLOCKED_ACTIONS,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_CAPABILITIES,
  buildSupabaseMilestoneSyncPolicy,
  getProviderOutputPlanSnapshotGeneratedPrefix,
  getProviderOutputPlanSnapshotQaPrefix,
} from './provider-output-plan-snapshot-policy'
import type {
  CandidateApprovedPlanSnapshot,
  ImplementationProposalRef,
  OwnerRouteEntry,
  ProviderOutputEvidenceContext,
  SelectedIntent,
} from './provider-output-plan-snapshot-types'

export function buildCandidateApprovedPlanSnapshot(input: {
  runId: string
  evidence: ProviderOutputEvidenceContext
  selectedIntents: SelectedIntent[]
  implementationProposalRefs: ImplementationProposalRef[]
  ownerRoutes: OwnerRouteEntry[]
  qaRequirements: string[]
  privacyLimits: string[]
  costLimits: string[]
  runtimeLimits: string[]
}): CandidateApprovedPlanSnapshot {
  return {
    planId: `candidate-approved-plan-${input.runId}`,
    planVersion: 1,
    sourceProviderRunId: 'modeldryrun1-20260612T174538',
    qwenModel: 'qwen3.7-plus',
    deepseekModel: 'deepseek-v4-flash',
    sourceSchemas: ['plan_snapshot_candidate_v1', 'agent_findings_v1'],
    selectedIntents: input.selectedIntents,
    implementationProposalRefs: input.implementationProposalRefs,
    ownerRoutes: input.ownerRoutes,
    requiredCapabilities: PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_CAPABILITIES,
    inputArtifactScope: {
      committedSanitizedProviderDryRunReportsOnly: true,
      rawProviderResponsesAllowed: false,
      rawPromptPayloadsAllowed: false,
      secretPayloadsAllowed: false,
      mediaPayloadsAllowed: false,
    },
    outputArtifactScope: {
      candidatePlanSnapshotJson: true,
      privateGcsJsonOnly: true,
      publicArtifactsAllowed: false,
      signedUrlsAllowed: false,
      runtimeDispatchAllowed: false,
    },
    artifactPolicy: {
      privateGeneratedPrefix: getProviderOutputPlanSnapshotGeneratedPrefix(input.runId),
      privateQaPrefix: getProviderOutputPlanSnapshotQaPrefix(input.runId),
      publicArtifactAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      rawPromptStored: false,
      rawProviderResponseStored: false,
      secretPayloadStored: false,
    },
    qaRequirements: input.qaRequirements,
    privacyLimits: input.privacyLimits,
    costLimits: input.costLimits,
    runtimeLimits: input.runtimeLimits,
    rollbackPolicy: [
      'Discard the candidate snapshot if any owner route rejects the contract.',
      'Regenerate a new candidate from committed sanitized evidence only after a new approved dry-run or policy update.',
      'Do not mutate an approved plan version from this candidate evidence.',
    ],
    blockedActions: PROVIDER_OUTPUT_PLAN_SNAPSHOT_BLOCKED_ACTIONS,
    handoffRequired: true,
    nextOwner: 'WORKER_RUNTIME_JOBS',
    supabaseMilestoneSyncPolicy: buildSupabaseMilestoneSyncPolicy(true),
    executionStatus: 'candidate_only',
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    routeExecutionAllowed: false,
    providerExecutionAllowed: false,
    rawPromptExecution: false,
    approvedForRuntime: false,
    publicArtifactAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
    requiresWorkerRuntimeOwnerApproval: true,
  }
}
