import {
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import { listAiGraphicsToolCallHandoffTools } from './ai-graphics-tool-call-handoff'
import {
  AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
  type AiGraphicsExternalBetaLaunchGoNoGo,
} from './ai-graphics-external-beta-launch-go-no-go'
import {
  AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION,
  type AiGraphicsExternalBetaLiveEnqueueAuthorization,
} from './ai-graphics-external-beta-live-enqueue-authorization'
import {
  AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalBetaWorkerDispatchSmokeProof,
} from './ai-graphics-external-beta-worker-dispatch-smoke-proof'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_SCOPE_DECISION =
  'ai_graphics_external_beta_callable_scope_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaCallableScopeStatus =
  | 'missing_external_beta_launch_go_no_go'
  | 'external_beta_launch_go_no_go_rejected'
  | 'missing_external_beta_live_enqueue_authorization'
  | 'external_beta_live_enqueue_authorization_rejected'
  | 'missing_external_beta_worker_dispatch_smoke_proof'
  | 'external_beta_worker_dispatch_smoke_proof_rejected'
  | 'external_beta_callable_scope_candidate_recorded_runtime_still_blocked'

export interface AiGraphicsExternalBetaCallableScopeInput {
  sourceExternalBetaLaunchGoNoGoPacket?: AiGraphicsExternalBetaLaunchGoNoGo
  sourceExternalBetaLiveEnqueueAuthorizationPacket?:
    AiGraphicsExternalBetaLiveEnqueueAuthorization
  sourceExternalBetaWorkerDispatchSmokeProofPacket?:
    AiGraphicsExternalBetaWorkerDispatchSmokeProof
}

export interface AiGraphicsExternalBetaCallableToolScope {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  gpuRequiredForRuntime: boolean
  sourceLaunchGoNoGoApprovedWithProvidedEvidence: boolean
  sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence: boolean
  sourceWorkerDispatchSmokeProofAcceptedWithProvidedEvidence: boolean
  externalBetaCallableCandidateWithProvidedEvidence: boolean
  externalBetaCallableNow: false
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  missingEvidenceBeforeCallable: string[]
  blockedRuntimeActions: string[]
  nextExternalBetaMilestone: string
}

export interface AiGraphicsExternalBetaCallableScope {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_SCOPE_DECISION
  sourceExternalBetaLaunchGoNoGoDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION | null
  sourceExternalBetaLiveEnqueueAuthorizationDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION | null
  sourceExternalBetaWorkerDispatchSmokeProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION | null
  status: AiGraphicsExternalBetaCallableScopeStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: number
  heavyToolsIncorrectlyTargetingCpu: 0
  sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence: number
  sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: number
  sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: number
  externalBetaCallableCandidateToolsWithProvidedEvidence: number
  externalBetaCallableCandidateCapabilitiesWithProvidedEvidence: number
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceExternalBetaLaunchGoNoGo: AiGraphicsExternalBetaLaunchGoNoGo | null
  sourceExternalBetaLiveEnqueueAuthorization:
    AiGraphicsExternalBetaLiveEnqueueAuthorization | null
  sourceExternalBetaWorkerDispatchSmokeProof:
    AiGraphicsExternalBetaWorkerDispatchSmokeProof | null
  callableScopes: AiGraphicsExternalBetaCallableToolScope[]
  allowedCallableScopeActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaCallableScopePrepared: true
    sourceExternalBetaLaunchGoNoGoAccepted: boolean
    sourceExternalBetaLiveEnqueueAuthorizationAccepted: boolean
    sourceExternalBetaWorkerDispatchSmokeProofAccepted: boolean
    sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all8GpuToolsTargetGpuRuntime: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    all21ExternalBetaCallableCandidatesWithProvidedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleQueueSmokePerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    liveQueueWritePerformed: false
    workerLeaseCreated: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const allowedCallableScopeActions = [
  'read accepted external-beta launch go/no-go evidence',
  'read accepted live-enqueue authorization metadata without writing queue rows',
  'read accepted worker-dispatch smoke proof without dispatching workers',
  'record all 21 AI graphics tools as external-beta callable candidates with provided evidence',
  'preserve GPU startup as on-demand only for future accepted worker/tool jobs',
]

const blockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'live queue write',
  'Worker queue enqueue',
  'Worker execution',
  'production worker dispatch',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'Bind this callable scope to a real external-beta tool-call API admission layer with approved plan snapshot and credit reservation checks.',
  'Run private non-production end-to-end queue, worker claim, and worker dispatch proof for the callable scope before enabling user traffic.',
  'Keep GPU workers cold until an accepted GPU/model job is claimed by a worker, then release GPU resources after completion.',
  'Require separate production launch approval after external-beta soak, support, incident, rollback, and cost evidence exists.',
]

function launchGoNoGoAccepted(packet?: AiGraphicsExternalBetaLaunchGoNoGo): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION &&
    packet.status === 'external_beta_launch_go_no_go_approved_runtime_still_blocked' &&
    packet.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence === 21 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted === true &&
    packet.booleans.sourceExternalBetaServiceRoleQueueSmokeProofAccepted === true &&
    packet.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.booleans.sourceExternalBetaLaunchControlsAccepted === true &&
    packet.booleans.all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function liveEnqueueAuthorizationAccepted(
  packet?: AiGraphicsExternalBetaLiveEnqueueAuthorization,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION &&
    packet.status ===
      'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked' &&
    packet.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence === 21 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools === 8 &&
    packet.liveQueueWritesApprovedNowTools === 0 &&
    packet.liveQueueWritesPerformedNowTools === 0 &&
    packet.booleans.sourceControlledRuntimeExecutionApprovalAccepted === true &&
    packet.booleans.sourceRuntimeQueueServiceBridgeAccepted === true &&
    packet.booleans.liveEnqueueAuthorizationRecordAccepted === true &&
    packet.booleans.all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function workerDispatchSmokeProofAccepted(
  packet?: AiGraphicsExternalBetaWorkerDispatchSmokeProof,
): boolean {
  return Boolean(packet) &&
    packet?.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION &&
    packet.decision === 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks' &&
    packet.proofAcceptedWithProvidedEvidence === true &&
    packet.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
    packet.counts.sourceCapabilityScenariosCompletedWithProvidedEvidence === 12 &&
    packet.counts.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceLiveWorkerLeasesCreatedNow === 0 &&
    packet.counts.sourceLiveWorkerDispatchesNow === 0 &&
    packet.counts.sourceLiveToolExecutionsNow === 0 &&
    packet.evidence.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === true &&
    packet.evidence.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === true &&
    Boolean(packet.evidence.serviceRoleQueueSmokeAuthorizationRef) &&
    packet.booleans.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function statusFromInput(input: {
  hasLaunchGoNoGo: boolean
  launchGoNoGoAccepted: boolean
  hasLiveEnqueueAuthorization: boolean
  liveEnqueueAuthorizationAccepted: boolean
  hasWorkerDispatchSmokeProof: boolean
  workerDispatchSmokeProofAccepted: boolean
}): AiGraphicsExternalBetaCallableScopeStatus {
  if (!input.hasLaunchGoNoGo) return 'missing_external_beta_launch_go_no_go'
  if (!input.launchGoNoGoAccepted) return 'external_beta_launch_go_no_go_rejected'
  if (!input.hasLiveEnqueueAuthorization) {
    return 'missing_external_beta_live_enqueue_authorization'
  }
  if (!input.liveEnqueueAuthorizationAccepted) {
    return 'external_beta_live_enqueue_authorization_rejected'
  }
  if (!input.hasWorkerDispatchSmokeProof) {
    return 'missing_external_beta_worker_dispatch_smoke_proof'
  }
  if (!input.workerDispatchSmokeProofAccepted) {
    return 'external_beta_worker_dispatch_smoke_proof_rejected'
  }
  return 'external_beta_callable_scope_candidate_recorded_runtime_still_blocked'
}

function missingEvidenceForTool(input: {
  launchAccepted: boolean
  liveEnqueueAccepted: boolean
  workerSmokeAccepted: boolean
}): string[] {
  return [
    !input.launchAccepted ? 'accepted external-beta launch go/no-go' : undefined,
    !input.liveEnqueueAccepted ? 'accepted live-enqueue authorization' : undefined,
    !input.workerSmokeAccepted ? 'accepted worker-dispatch smoke proof' : undefined,
  ].filter((item): item is string => Boolean(item))
}

export function buildAiGraphicsExternalBetaCallableScope(
  input: AiGraphicsExternalBetaCallableScopeInput = {},
): AiGraphicsExternalBetaCallableScope {
  const launchGoNoGo = input.sourceExternalBetaLaunchGoNoGoPacket ?? null
  const liveEnqueueAuthorization =
    input.sourceExternalBetaLiveEnqueueAuthorizationPacket ?? null
  const workerDispatchSmokeProof =
    input.sourceExternalBetaWorkerDispatchSmokeProofPacket ?? null
  const launchAccepted = launchGoNoGoAccepted(input.sourceExternalBetaLaunchGoNoGoPacket)
  const liveEnqueueAccepted = liveEnqueueAuthorizationAccepted(
    input.sourceExternalBetaLiveEnqueueAuthorizationPacket,
  )
  const workerSmokeAccepted = workerDispatchSmokeProofAccepted(
    input.sourceExternalBetaWorkerDispatchSmokeProofPacket,
  )
  const status = statusFromInput({
    hasLaunchGoNoGo: Boolean(launchGoNoGo),
    launchGoNoGoAccepted: launchAccepted,
    hasLiveEnqueueAuthorization: Boolean(liveEnqueueAuthorization),
    liveEnqueueAuthorizationAccepted: liveEnqueueAccepted,
    hasWorkerDispatchSmokeProof: Boolean(workerDispatchSmokeProof),
    workerDispatchSmokeProofAccepted: workerSmokeAccepted,
  })
  const accepted =
    status === 'external_beta_callable_scope_candidate_recorded_runtime_still_blocked'
  const sourceLiveScopes = liveEnqueueAuthorization?.toolScopes ?? []
  const sourceScopeByTool = new Map(
    sourceLiveScopes.map((scope) => [scope.toolId, scope]),
  )

  const callableScopes = listAiGraphicsToolCallHandoffTools()
    .map((tool): AiGraphicsExternalBetaCallableToolScope => {
      const sourceScope = sourceScopeByTool.get(tool.toolId)
      const sourceLiveRecorded =
        sourceScope?.liveEnqueueAuthorizationRecordedWithProvidedEvidence === true
      const candidate =
        accepted &&
        launchAccepted &&
        sourceLiveRecorded &&
        workerSmokeAccepted
      return {
        toolId: tool.toolId,
        productionToolId: tool.productionToolId,
        workerType: tool.workerType,
        runtimeTarget: sourceScope?.runtimeTarget ?? tool.runtimeTarget,
        capabilityIds: [...tool.capabilities],
        gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
        sourceLaunchGoNoGoApprovedWithProvidedEvidence: launchAccepted,
        sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence:
          sourceLiveRecorded,
        sourceWorkerDispatchSmokeProofAcceptedWithProvidedEvidence:
          workerSmokeAccepted,
        externalBetaCallableCandidateWithProvidedEvidence: candidate,
        externalBetaCallableNow: false,
        gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
          candidate &&
          sourceScope?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
        gpuRuntimeShouldStartNow: false,
        missingEvidenceBeforeCallable: candidate
          ? []
    : missingEvidenceForTool({
            launchAccepted,
            liveEnqueueAccepted: sourceLiveRecorded,
            workerSmokeAccepted,
          }),
        blockedRuntimeActions,
        nextExternalBetaMilestone: tool.gpuRequiredForRuntime
          ? 'prove accepted GPU worker dispatch against private runtime, with GPU start only at job claim time'
          : 'prove accepted CPU/static worker dispatch against private runtime before external-beta traffic',
      }
    })

  const capabilityIds = new Set(
    callableScopes
      .flatMap((scope) => scope.capabilityIds)
      .filter((capabilityId) => (
        capabilityId !== 'planning_metadata_only' &&
        capabilityId !== 'blocked_or_deferred'
      )),
  )
  const callableCandidates = callableScopes.filter(
    (scope) => scope.externalBetaCallableCandidateWithProvidedEvidence,
  ).length
  const gpuRuntimeTargetedTools =
    callableScopes.filter((scope) => scope.gpuRequiredForRuntime).length
  const sourceLiveRecordedTools =
    callableScopes.filter(
      (scope) => scope.sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence,
    ).length

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_SCOPE_DECISION,
    sourceExternalBetaLaunchGoNoGoDecision:
      launchGoNoGo?.decision ?? null,
    sourceExternalBetaLiveEnqueueAuthorizationDecision:
      liveEnqueueAuthorization?.decision ?? null,
    sourceExternalBetaWorkerDispatchSmokeProofDecision:
      workerDispatchSmokeProof?.sourceDecision ?? null,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools,
    heavyToolsIncorrectlyTargetingCpu: 0,
    sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence:
      launchAccepted ? 21 : 0,
    sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence:
      sourceLiveRecordedTools,
    sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence:
      workerSmokeAccepted
        ? workerDispatchSmokeProof?.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence ?? 0
        : 0,
    externalBetaCallableCandidateToolsWithProvidedEvidence: callableCandidates,
    externalBetaCallableCandidateCapabilitiesWithProvidedEvidence:
      accepted ? capabilityIds.size : 0,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceExternalBetaLaunchGoNoGo: launchGoNoGo,
    sourceExternalBetaLiveEnqueueAuthorization: liveEnqueueAuthorization,
    sourceExternalBetaWorkerDispatchSmokeProof: workerDispatchSmokeProof,
    callableScopes,
    allowedCallableScopeActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaCallableScopePrepared: true,
      sourceExternalBetaLaunchGoNoGoAccepted: launchAccepted,
      sourceExternalBetaLiveEnqueueAuthorizationAccepted: liveEnqueueAccepted,
      sourceExternalBetaWorkerDispatchSmokeProofAccepted: workerSmokeAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted:
        launchGoNoGo?.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
        workerDispatchSmokeProof?.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true,
      all21ToolsCovered: callableScopes.length === 21,
      all12CapabilitiesCovered: capabilityIds.size === 12,
      all8GpuToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      all21ExternalBetaCallableCandidatesWithProvidedEvidence:
        callableCandidates === 21,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      liveQueueWritePerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
