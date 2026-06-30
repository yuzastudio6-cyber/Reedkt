export const AI_GRAPHICS_PRODUCTION_LAUNCH_CONTROLS_DECISION =
  'ai_graphics_production_launch_controls_prepared_with_runtime_blocks'

export type AiGraphicsProductionLaunchControlsStatus =
  | 'missing_production_launch_controls'
  | 'production_launch_controls_accepted_with_runtime_blocks'

export interface AiGraphicsProductionLaunchControlsInput {
  productionOwnerApprovalRef?: string
  productionSupportRunbookRef?: string
  productionIncidentResponseRef?: string
  productionRollbackKillSwitchRef?: string
  productionCostConcurrencyCeilingRef?: string
  productionMonitoringAlertingRef?: string
  productionPostLaunchReviewRef?: string
  productionCreditLedgerApprovalSnapshotRef?: string
  productionToolRouteDeploymentRef?: string
  productionWorkerDeploymentRef?: string
  productionPrivacyRetentionRef?: string
  productionPrivateArtifactControlsRef?: string
  productionCanaryCohortRef?: string
  productionLaunchApproverRole?: string
}

export interface AiGraphicsProductionLaunchControls {
  decision: typeof AI_GRAPHICS_PRODUCTION_LAUNCH_CONTROLS_DECISION
  status: AiGraphicsProductionLaunchControlsStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  acceptedControlRefs: number
  requiredControlRefs: 13
  refs: Required<Omit<AiGraphicsProductionLaunchControlsInput, 'productionLaunchApproverRole'>>
  approverRole: 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER'
  missingLaunchControls: string[]
  productionLaunchControlPolicy: {
    privateEvidenceRefsOnly: true
    ownerApprovalRequired: true
    supportRunbookRequired: true
    incidentResponseRequired: true
    rollbackKillSwitchRequired: true
    costConcurrencyCeilingRequired: true
    monitoringAlertingRequired: true
    postLaunchReviewRequired: true
    creditLedgerAndApprovedSnapshotRequired: true
    productionToolRouteDeploymentRequired: true
    productionWorkerDeploymentRequired: true
    privacyRetentionRequired: true
    privateArtifactControlsRequired: true
    canaryCohortRequired: true
    onDemandGpuOnly: true
    approvesRuntimeNow: false
    approvesProductionNow: false
  }
  allowedControls: string[]
  blockedRuntimeActions: string[]
  booleans: {
    productionLaunchControlsPrepared: true
    productionLaunchControlsAccepted: boolean
    productionOwnerApprovalAccepted: boolean
    productionSupportRunbookAccepted: boolean
    productionIncidentResponseAccepted: boolean
    productionRollbackKillSwitchAccepted: boolean
    productionCostConcurrencyCeilingAccepted: boolean
    productionMonitoringAlertingAccepted: boolean
    productionPostLaunchReviewAccepted: boolean
    productionCreditLedgerApprovalSnapshotAccepted: boolean
    productionToolRouteDeploymentAccepted: boolean
    productionWorkerDeploymentAccepted: boolean
    productionPrivacyRetentionAccepted: boolean
    productionPrivateArtifactControlsAccepted: boolean
    productionCanaryCohortAccepted: boolean
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
  'productionOwnerApprovalRef',
  'productionSupportRunbookRef',
  'productionIncidentResponseRef',
  'productionRollbackKillSwitchRef',
  'productionCostConcurrencyCeilingRef',
  'productionMonitoringAlertingRef',
  'productionPostLaunchReviewRef',
  'productionCreditLedgerApprovalSnapshotRef',
  'productionToolRouteDeploymentRef',
  'productionWorkerDeploymentRef',
  'productionPrivacyRetentionRef',
  'productionPrivateArtifactControlsRef',
  'productionCanaryCohortRef',
] as const

const allowedControls = [
  'record private production owner approval evidence',
  'record private production support, incident, rollback, cost, monitoring, and post-launch evidence',
  'record private credit ledger, approved snapshot, Tool Route deployment, and Worker deployment evidence',
  'record private privacy, retention, private artifact, and canary cohort evidence',
  'return accepted production launch controls without enabling runtime, public artifacts, signed URLs, or production',
]

const blockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'Worker queue enqueue or execution',
  'production worker dispatch',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'production traffic enablement',
]

function blankRefs(): AiGraphicsProductionLaunchControls['refs'] {
  return Object.fromEntries(
    requiredRefFields.map((field) => [field, '']),
  ) as AiGraphicsProductionLaunchControls['refs']
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
    normalized.startsWith('production-evidence://')
}

export function acceptedAiGraphicsProductionLaunchControls(
  packet: AiGraphicsProductionLaunchControls | undefined,
): packet is AiGraphicsProductionLaunchControls {
  return Boolean(
    packet &&
      packet.decision === AI_GRAPHICS_PRODUCTION_LAUNCH_CONTROLS_DECISION &&
      packet.status === 'production_launch_controls_accepted_with_runtime_blocks' &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.acceptedControlRefs === 13 &&
      packet.requiredControlRefs === 13 &&
      packet.missingLaunchControls.length === 0 &&
      packet.approverRole === 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER' &&
      requiredRefFields.every((field) => isPrivateEvidenceRef(packet.refs[field])) &&
      packet.productionLaunchControlPolicy.privateEvidenceRefsOnly === true &&
      packet.productionLaunchControlPolicy.approvesRuntimeNow === false &&
      packet.productionLaunchControlPolicy.approvesProductionNow === false &&
      packet.booleans.productionLaunchControlsAccepted === true &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.workerQueueApprovedNow === false &&
      packet.booleans.gpuRuntimeApprovedNow === false &&
      packet.booleans.gpuRuntimeShouldStartNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export function buildAiGraphicsProductionLaunchControls(
  input: AiGraphicsProductionLaunchControlsInput = {},
): AiGraphicsProductionLaunchControls {
  const refs = {
    ...blankRefs(),
    ...Object.fromEntries(
      requiredRefFields.map((field) => [field, input[field]?.trim() ?? '']),
    ),
  } as AiGraphicsProductionLaunchControls['refs']
  const missingLaunchControls = [
    ...requiredRefFields
      .filter((field) => !isPrivateEvidenceRef(refs[field]))
      .map((field) => `${field}: private/backend production evidence ref is required`),
    input.productionLaunchApproverRole &&
      input.productionLaunchApproverRole !== 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER'
      ? 'productionLaunchApproverRole: AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER is required'
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))
  const accepted = missingLaunchControls.length === 0

  return {
    decision: AI_GRAPHICS_PRODUCTION_LAUNCH_CONTROLS_DECISION,
    status: accepted
      ? 'production_launch_controls_accepted_with_runtime_blocks'
      : 'missing_production_launch_controls',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    acceptedControlRefs: requiredRefFields.filter((field) => isPrivateEvidenceRef(refs[field])).length,
    requiredControlRefs: 13,
    refs,
    approverRole: 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
    missingLaunchControls,
    productionLaunchControlPolicy: {
      privateEvidenceRefsOnly: true,
      ownerApprovalRequired: true,
      supportRunbookRequired: true,
      incidentResponseRequired: true,
      rollbackKillSwitchRequired: true,
      costConcurrencyCeilingRequired: true,
      monitoringAlertingRequired: true,
      postLaunchReviewRequired: true,
      creditLedgerAndApprovedSnapshotRequired: true,
      productionToolRouteDeploymentRequired: true,
      productionWorkerDeploymentRequired: true,
      privacyRetentionRequired: true,
      privateArtifactControlsRequired: true,
      canaryCohortRequired: true,
      onDemandGpuOnly: true,
      approvesRuntimeNow: false,
      approvesProductionNow: false,
    },
    allowedControls,
    blockedRuntimeActions,
    booleans: {
      productionLaunchControlsPrepared: true,
      productionLaunchControlsAccepted: accepted,
      productionOwnerApprovalAccepted: accepted,
      productionSupportRunbookAccepted: accepted,
      productionIncidentResponseAccepted: accepted,
      productionRollbackKillSwitchAccepted: accepted,
      productionCostConcurrencyCeilingAccepted: accepted,
      productionMonitoringAlertingAccepted: accepted,
      productionPostLaunchReviewAccepted: accepted,
      productionCreditLedgerApprovalSnapshotAccepted: accepted,
      productionToolRouteDeploymentAccepted: accepted,
      productionWorkerDeploymentAccepted: accepted,
      productionPrivacyRetentionAccepted: accepted,
      productionPrivateArtifactControlsAccepted: accepted,
      productionCanaryCohortAccepted: accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
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
