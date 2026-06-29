import { AI_GRAPHICS_CANONICAL_TOOL_IDS } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_CONTROLS_DECISION =
  'ai_graphics_external_beta_launch_controls_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaLaunchControlsStatus =
  | 'missing_external_beta_launch_controls'
  | 'external_beta_launch_controls_accepted_with_runtime_blocks'

export interface AiGraphicsExternalBetaLaunchControlsInput {
  internalBetaRuntimeSoakRef?: string
  externalBetaQaEvidenceRef?: string
  externalBetaCostConcurrencyPrivacyRollbackRef?: string
  externalBetaIncidentResponseRef?: string
  externalBetaOwnerApprovalRef?: string
  externalBetaLaunchSwitchRef?: string
  externalBetaRolloutCohortRef?: string
  externalBetaCostConcurrencyCeilingRef?: string
  externalBetaRollbackIncidentRunbookRef?: string
  externalBetaPrivateArtifactRetentionSupportRef?: string
  externalBetaSupportOwnershipRef?: string
  externalBetaWorkerDispatchSmokeProofRef?: string
  externalBetaLaunchApproverRole?: string
}

export interface AiGraphicsExternalBetaLaunchControls {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_CONTROLS_DECISION
  status: AiGraphicsExternalBetaLaunchControlsStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  acceptedControlRefs: number
  requiredControlRefs: 12
  refs: Required<Omit<AiGraphicsExternalBetaLaunchControlsInput, 'externalBetaLaunchApproverRole'>>
  approverRole: 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
  missingLaunchControls: string[]
  launchControlPolicy: {
    privateEvidenceRefsOnly: true
    launchSwitchRequired: true
    rolloutCohortRequired: true
    costConcurrencyCeilingRequired: true
    rollbackIncidentRunbookRequired: true
    privacyRetentionSupportRequired: true
    externalBetaQaRequired: true
    ownerApprovalRequired: true
    workerDispatchSmokeProofRequired: true
    onDemandGpuOnly: true
    approvesRuntimeNow: false
    approvesExternalBetaTrafficNow: false
    approvesProductionNow: false
  }
  allowedControls: string[]
  blockedRuntimeActions: string[]
  booleans: {
    externalBetaLaunchControlsPrepared: true
    externalBetaLaunchControlsAccepted: boolean
    internalBetaRuntimeSoakAccepted: boolean
    externalBetaQaAccepted: boolean
    externalBetaCostConcurrencyPrivacyRollbackAccepted: boolean
    externalBetaIncidentResponseAccepted: boolean
    externalBetaOwnerApprovalGranted: boolean
    externalBetaWorkerDispatchSmokeProofAccepted: boolean
    externalBetaLaunchSwitchApproved: boolean
    externalBetaRolloutCohortApproved: boolean
    externalBetaCostConcurrencyCeilingApproved: boolean
    externalBetaRollbackIncidentRunbookApproved: boolean
    externalBetaPrivateArtifactRetentionSupportApproved: boolean
    externalBetaSupportOwnershipApproved: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
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
    routeExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const requiredRefFields = [
  'internalBetaRuntimeSoakRef',
  'externalBetaQaEvidenceRef',
  'externalBetaCostConcurrencyPrivacyRollbackRef',
  'externalBetaIncidentResponseRef',
  'externalBetaOwnerApprovalRef',
  'externalBetaLaunchSwitchRef',
  'externalBetaRolloutCohortRef',
  'externalBetaCostConcurrencyCeilingRef',
  'externalBetaRollbackIncidentRunbookRef',
  'externalBetaPrivateArtifactRetentionSupportRef',
  'externalBetaSupportOwnershipRef',
  'externalBetaWorkerDispatchSmokeProofRef',
] as const

const allowedControls = [
  'record private external-beta launch switch approval evidence',
  'record private rollout cohort approval evidence',
  'record private cost and concurrency ceiling evidence',
  'record private rollback, incident-response, privacy, retention, and support ownership evidence',
  'record private external-beta QA, runtime-soak, worker-dispatch smoke, and owner-approval evidence',
  'return accepted launch controls without enabling runtime, traffic, public artifacts, or production',
]

const blockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'Worker enqueue or execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta user traffic enablement',
  'production unlock',
]

function blankRefs(): AiGraphicsExternalBetaLaunchControls['refs'] {
  return Object.fromEntries(requiredRefFields.map((field) => [field, ''])) as AiGraphicsExternalBetaLaunchControls['refs']
}

function isPrivateEvidenceRef(value: string | undefined): boolean {
  if (!value || value.trim().length === 0) return false
  const normalized = value.trim().toLowerCase()
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-evidence://')
}

export function acceptedAiGraphicsExternalBetaLaunchControls(
  packet: AiGraphicsExternalBetaLaunchControls | undefined,
): packet is AiGraphicsExternalBetaLaunchControls {
  return Boolean(
    packet &&
      packet.decision === AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_CONTROLS_DECISION &&
      packet.status === 'external_beta_launch_controls_accepted_with_runtime_blocks' &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.acceptedControlRefs === 12 &&
      packet.requiredControlRefs === 12 &&
      packet.missingLaunchControls.length === 0 &&
      packet.approverRole === 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER' &&
      requiredRefFields.every((field) => isPrivateEvidenceRef(packet.refs[field])) &&
      packet.launchControlPolicy.privateEvidenceRefsOnly === true &&
      packet.launchControlPolicy.approvesRuntimeNow === false &&
      packet.launchControlPolicy.approvesExternalBetaTrafficNow === false &&
      packet.launchControlPolicy.approvesProductionNow === false &&
      packet.booleans.externalBetaLaunchControlsAccepted === true &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.workerQueueApprovedNow === false &&
      packet.booleans.gpuRuntimeApprovedNow === false &&
      packet.booleans.gpuRuntimeShouldStartNow === false &&
      packet.booleans.externalBetaReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export function buildAiGraphicsExternalBetaLaunchControls(
  input: AiGraphicsExternalBetaLaunchControlsInput = {},
): AiGraphicsExternalBetaLaunchControls {
  const refs = {
    ...blankRefs(),
    ...Object.fromEntries(
      requiredRefFields.map((field) => [field, input[field]?.trim() ?? '']),
    ),
  } as AiGraphicsExternalBetaLaunchControls['refs']
  const missingLaunchControls = [
    ...requiredRefFields
      .filter((field) => !isPrivateEvidenceRef(refs[field]))
      .map((field) => `${field}: private/backend external-beta evidence ref is required`),
    input.externalBetaLaunchApproverRole &&
      input.externalBetaLaunchApproverRole !== 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
      ? 'externalBetaLaunchApproverRole: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER is required'
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))
  const accepted = missingLaunchControls.length === 0

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_CONTROLS_DECISION,
    status: accepted
      ? 'external_beta_launch_controls_accepted_with_runtime_blocks'
      : 'missing_external_beta_launch_controls',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    acceptedControlRefs: requiredRefFields.filter((field) => isPrivateEvidenceRef(refs[field])).length,
    requiredControlRefs: 12,
    refs,
    approverRole: 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
    missingLaunchControls,
    launchControlPolicy: {
      privateEvidenceRefsOnly: true,
      launchSwitchRequired: true,
      rolloutCohortRequired: true,
      costConcurrencyCeilingRequired: true,
      rollbackIncidentRunbookRequired: true,
      privacyRetentionSupportRequired: true,
      externalBetaQaRequired: true,
      ownerApprovalRequired: true,
      workerDispatchSmokeProofRequired: true,
      onDemandGpuOnly: true,
      approvesRuntimeNow: false,
      approvesExternalBetaTrafficNow: false,
      approvesProductionNow: false,
    },
    allowedControls,
    blockedRuntimeActions,
    booleans: {
      externalBetaLaunchControlsPrepared: true,
      externalBetaLaunchControlsAccepted: accepted,
      internalBetaRuntimeSoakAccepted: accepted,
      externalBetaQaAccepted: accepted,
      externalBetaCostConcurrencyPrivacyRollbackAccepted: accepted,
      externalBetaIncidentResponseAccepted: accepted,
      externalBetaOwnerApprovalGranted: accepted,
      externalBetaWorkerDispatchSmokeProofAccepted: accepted,
      externalBetaLaunchSwitchApproved: accepted,
      externalBetaRolloutCohortApproved: accepted,
      externalBetaCostConcurrencyCeilingApproved: accepted,
      externalBetaRollbackIncidentRunbookApproved: accepted,
      externalBetaPrivateArtifactRetentionSupportApproved: accepted,
      externalBetaSupportOwnershipApproved: accepted,
      all21ToolsCovered: AI_GRAPHICS_CANONICAL_TOOL_IDS.length === 21,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
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
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
