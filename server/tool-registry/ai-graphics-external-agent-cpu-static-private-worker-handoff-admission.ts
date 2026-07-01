import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  getAiGraphicsMappedProductionProfile,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_DECISION,
} from './ai-graphics-external-agent-cpu-static-adapter-smoke'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_handoff_admission_prepared_with_runtime_blocks'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_TOOL_IDS = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_BLOCKED_TOOL_IDS = [
  'satori',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS =
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
    (capabilityId) =>
      capabilityId !== 'planning_metadata_only' &&
      capabilityId !== 'blocked_or_deferred',
  )

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionStatus =
  | 'private_worker_handoff_admission_prepared_execution_blocked'
  | 'private_worker_handoff_blocked_pending_satori_font_fixture'
  | 'private_worker_handoff_deferred_non_cpu_static_runtime_boundary'
  | 'private_worker_handoff_blocked_missing_adapter_smoke'

export interface AiGraphicsExternalAgentCpuStaticAdapterSmokeSourceRow {
  toolId: AiGraphicsCanonicalToolId
  adapterSmokeStatus: string
  adapterSmokePreparedWithProvidedEvidence?: boolean
  privateOutputContractPrepared?: boolean
  externalAgentCanInvokeAdapterNow?: boolean
  agentCanExecuteToolsNow?: boolean
  routeExecutionApprovedNow?: boolean
  workerExecutionApprovedNow?: boolean
  toolExecutionApprovedNow?: boolean
  gpuRuntimeShouldStartNow?: boolean
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionInput {
  sourceAdapterSmokeDecision?: string
  sourceAdapterSmokeStatus?: string
  sourceAdapterSmokeRows?: AiGraphicsExternalAgentCpuStaticAdapterSmokeSourceRow[]
  sourceAdapterSmokeReadyTools?: number
  sourceAdapterSmokeBlockedTools?: number
  sourceSatoriBlockedPendingApprovedFontFixtureTools?: number
  sourceNonCpuStaticDeferredTools?: number
  sourceExternalAgentCanInvokeAdapterNowTools?: number
  sourceToolExecutionApprovedNowTools?: number
  sourceGpuRuntimeShouldStartNowTools?: number
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  workItemKind: 'ai_graphics_cpu_static_private_worker_handoff'
    | 'ai_graphics_cpu_static_handoff_blocked'
    | 'ai_graphics_runtime_deferred_handoff'
  admissionStatus: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionStatus
  sourceAdapterSmokeStatus: string | null
  sourceAdapterSmokePreparedWithProvidedEvidence: boolean
  sourcePrivateOutputContractPrepared: boolean
  privateWorkerHandoffAdmissionPrepared: boolean
  privateOutputManifestContractPrepared: boolean
  privateArtifactManifestRef: string | null
  idempotencyKeyTemplate: string | null
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  toolRouteApprovalRequired: true
  workerApprovalRequired: true
  workerQueueTransportRequired: true
  workerClaimLeaseRequired: true
  checkbackPolicyRequired: true
  fallbackPolicyRequired: true
  qaGateRequired: true
  privateArtifactOnly: true
  publicArtifactAllowed: false
  signedUrlAllowed: false
  externalAgentCanRequestPrivateWorkerHandoffNow: false
  externalAgentCanInvokeAdapterNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  workerExecutionApprovedNow: false
  workerEnqueueApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
  blocker: string
  nextProofMilestone: string
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-handoff-admission'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_DECISION
  status: 'external_agent_cpu_static_private_worker_handoff_admission_prepared_five_admitted_one_blocked_execution_blocked'
  sourceAdapterSmokeDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  unblockPolicy: {
    temporaryRuntimeBlock: true
    unblockMode: 'tool_by_tool_after_required_execution_gates'
    requiredBeforeAnyToolExecution: string[]
  }
  counts: {
    totalAiGraphicsTools: 21
    privateWorkerHandoffAdmissionPreparedTools: number
    cpuStaticPrivateWorkerHandoffReadyTools: number
    cpuStaticPrivateWorkerHandoffBlockedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    externalAgentCanRequestPrivateWorkerHandoffNowTools: 0
    externalAgentCanInvokeAdapterNowTools: 0
    externalAgentExecutableNowTools: 0
    workerEnqueueApprovedNowTools: 0
    workerDispatchApprovedNowTools: 0
    toolExecutionApprovedNowTools: 0
    publicArtifactAllowedTools: 0
    signedUrlAllowedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerHandoffAdmissionPrepared: true
    sourceCpuStaticAdapterSmokeAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    fiveCpuStaticPrivateWorkerHandoffAdmissionsPrepared: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    nonCpuStaticToolsDeferredByRuntimeBoundary: boolean
    privateOutputManifestContractsPreparedForAdmittedTools: boolean
    privateArtifactOnlyPolicyAccepted: true
    workerCheckbackPolicyRequired: true
    workerFallbackPolicyRequired: true
    workerQaGateRequired: true
    unblockPolicyDefined: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    externalAgentCanRequestPrivateWorkerHandoffNow: false
    externalAgentCanInvokeAdapterNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerEnqueueApprovedNow: false
    workerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformed: false
    workerEnqueuePerformed: false
    workerDispatchPerformed: false
    toolExecutionPerformed: false
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
  nextMilestone: string
}

const requiredBeforeAnyToolExecution = [
  'approved plan snapshot reference',
  'approved credit reservation reference',
  'Tool Route admission approval for the exact tool',
  'Worker admission approval for the exact tool',
  'private artifact manifest writer and retention policy',
  'worker queue transport proof',
  'worker claim and lease proof',
  'idempotency and retry policy',
  'checkback policy',
  'fallback policy',
  'tool-specific QA gate',
  'per-tool runtime proof for browser/GPU/model targets when applicable',
]

function sourceRow(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionInput,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticAdapterSmokeSourceRow | undefined {
  return input.sourceAdapterSmokeRows?.find((row) => row.toolId === toolId)
}

function isAdmittedCpuStaticTool(toolId: AiGraphicsCanonicalToolId): boolean {
  return AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_TOOL_IDS.includes(
    toolId,
  )
}

function isSatoriBlockedTool(toolId: AiGraphicsCanonicalToolId): boolean {
  return AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_BLOCKED_TOOL_IDS.includes(
    toolId,
  )
}

function sourceAdapterSmokeAccepted(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionInput,
): boolean {
  const rows = input.sourceAdapterSmokeRows ?? []
  const readyRowsAccepted =
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_TOOL_IDS.every(
      (toolId) => {
        const row = rows.find((source) => source.toolId === toolId)
        return row?.adapterSmokeStatus ===
          'cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked' &&
          row.adapterSmokePreparedWithProvidedEvidence === true &&
          row.privateOutputContractPrepared === true &&
          row.externalAgentCanInvokeAdapterNow === false &&
          row.toolExecutionApprovedNow === false &&
          row.gpuRuntimeShouldStartNow === false
      },
    )
  const satori = rows.find((row) => row.toolId === 'satori')

  return input.sourceAdapterSmokeDecision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_DECISION &&
    input.sourceAdapterSmokeStatus ===
      'external_agent_cpu_static_adapter_smoke_prepared_five_ready_one_blocked_execution_blocked' &&
    rows.length === 21 &&
    input.sourceAdapterSmokeReadyTools === 5 &&
    input.sourceAdapterSmokeBlockedTools === 1 &&
    input.sourceSatoriBlockedPendingApprovedFontFixtureTools === 1 &&
    input.sourceNonCpuStaticDeferredTools === 15 &&
    input.sourceExternalAgentCanInvokeAdapterNowTools === 0 &&
    input.sourceToolExecutionApprovedNowTools === 0 &&
    input.sourceGpuRuntimeShouldStartNowTools === 0 &&
    readyRowsAccepted &&
    satori?.adapterSmokeStatus ===
      'cpu_static_adapter_smoke_blocked_pending_approved_font_fixture' &&
    satori.adapterSmokePreparedWithProvidedEvidence === false
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticAdapterSmokeSourceRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionStatus {
  if (isAdmittedCpuStaticTool(input.toolId)) {
    if (
      input.sourceAccepted &&
      input.source?.adapterSmokePreparedWithProvidedEvidence === true &&
      input.source.privateOutputContractPrepared === true
    ) {
      return 'private_worker_handoff_admission_prepared_execution_blocked'
    }
    return 'private_worker_handoff_blocked_missing_adapter_smoke'
  }

  if (isSatoriBlockedTool(input.toolId)) {
    return 'private_worker_handoff_blocked_pending_satori_font_fixture'
  }

  return 'private_worker_handoff_deferred_non_cpu_static_runtime_boundary'
}

function workItemKindFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionStatus,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow['workItemKind'] {
  if (status === 'private_worker_handoff_admission_prepared_execution_blocked') {
    return 'ai_graphics_cpu_static_private_worker_handoff'
  }
  if (
    status === 'private_worker_handoff_blocked_pending_satori_font_fixture' ||
    status === 'private_worker_handoff_blocked_missing_adapter_smoke'
  ) {
    return 'ai_graphics_cpu_static_handoff_blocked'
  }
  return 'ai_graphics_runtime_deferred_handoff'
}

function privateArtifactManifestRefFor(
  toolId: AiGraphicsCanonicalToolId,
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionStatus,
): string | null {
  if (status !== 'private_worker_handoff_admission_prepared_execution_blocked') return null
  return `private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/${toolId}/artifact-manifest`
}

function idempotencyKeyTemplateFor(
  toolId: AiGraphicsCanonicalToolId,
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionStatus,
): string | null {
  if (status !== 'private_worker_handoff_admission_prepared_execution_blocked') return null
  return `ai-graphics:external-agent:cpu-static-private-worker-handoff-admission:${toolId}:{{approvedPlanSnapshotId}}:{{requestId}}`
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionStatus,
): string {
  if (status === 'private_worker_handoff_admission_prepared_execution_blocked') {
    return 'private worker-handoff admission contract is prepared, but external-agent adapter invocation, live queue write, worker dispatch, and tool execution remain blocked until the exact execution gates pass'
  }
  if (status === 'private_worker_handoff_blocked_pending_satori_font_fixture') {
    return 'Satori remains blocked pending approved font fixture proof for text SVG layout before private worker handoff admission'
  }
  if (status === 'private_worker_handoff_blocked_missing_adapter_smoke') {
    return 'CPU/static adapter-smoke evidence is missing or incompatible for this tool'
  }
  return 'non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes'
}

function nextProofMilestoneFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionStatus,
): string {
  if (status === 'private_worker_handoff_admission_prepared_execution_blocked') {
    return 'controlled private worker queue dry admission with approved snapshot and credit reservation fixtures, still without live queue write or tool execution'
  }
  if (status === 'private_worker_handoff_blocked_pending_satori_font_fixture') {
    return 'approved Satori font fixture proof before private worker handoff admission'
  }
  if (status === 'private_worker_handoff_blocked_missing_adapter_smoke') {
    return 'repair or rerun CPU/static adapter-smoke evidence for this tool'
  }
  return 'future runtime proof and handoff admission for browser/canvas/WebGL or GPU/model worker target'
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmission(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionReport {
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const sourceAccepted = sourceAdapterSmokeAccepted(input)

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const readiness = readinessRecords.find((record) => record.toolId === toolId)
    const productionProfile = getAiGraphicsMappedProductionProfile(toolId)
    if (
      !readiness ||
      !readiness.productionToolId ||
      !productionProfile ||
      readiness.productionWorkerType === 'none'
    ) {
      throw new Error(`Missing AI graphics private worker handoff readiness for ${toolId}`)
    }

    const source = sourceRow(input, toolId)
    const admissionStatus = statusFor({ toolId, source, sourceAccepted })
    const admissionPrepared =
      admissionStatus === 'private_worker_handoff_admission_prepared_execution_blocked'

    return {
      toolId,
      productionToolId: readiness.productionToolId,
      workerType: productionProfile.workerType,
      runtimeTarget: readiness.runtimeTarget,
      workItemKind: workItemKindFor(admissionStatus),
      admissionStatus,
      sourceAdapterSmokeStatus: source?.adapterSmokeStatus ?? null,
      sourceAdapterSmokePreparedWithProvidedEvidence:
        source?.adapterSmokePreparedWithProvidedEvidence === true,
      sourcePrivateOutputContractPrepared: source?.privateOutputContractPrepared === true,
      privateWorkerHandoffAdmissionPrepared: admissionPrepared,
      privateOutputManifestContractPrepared: admissionPrepared,
      privateArtifactManifestRef: privateArtifactManifestRefFor(toolId, admissionStatus),
      idempotencyKeyTemplate: idempotencyKeyTemplateFor(toolId, admissionStatus),
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      toolRouteApprovalRequired: true,
      workerApprovalRequired: true,
      workerQueueTransportRequired: true,
      workerClaimLeaseRequired: true,
      checkbackPolicyRequired: true,
      fallbackPolicyRequired: true,
      qaGateRequired: true,
      privateArtifactOnly: true,
      publicArtifactAllowed: false,
      signedUrlAllowed: false,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      blocker: blockerFor(admissionStatus),
      nextProofMilestone: nextProofMilestoneFor(admissionStatus),
    } satisfies AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow
  })

  const admissionRows = rows.filter((row) => row.privateWorkerHandoffAdmissionPrepared)
  const satoriBlockedRows = rows.filter(
    (row) => row.admissionStatus === 'private_worker_handoff_blocked_pending_satori_font_fixture',
  )
  const nonCpuRows = rows.filter(
    (row) => row.admissionStatus === 'private_worker_handoff_deferred_non_cpu_static_runtime_boundary',
  )
  const cpuStaticBlockedRows = rows.filter(
    (row) =>
      row.admissionStatus === 'private_worker_handoff_blocked_pending_satori_font_fixture' ||
      row.admissionStatus === 'private_worker_handoff_blocked_missing_adapter_smoke',
  )

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-handoff-admission',
    decision: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_DECISION,
    status:
      'external_agent_cpu_static_private_worker_handoff_admission_prepared_five_admitted_one_blocked_execution_blocked',
    sourceAdapterSmokeDecision: input.sourceAdapterSmokeDecision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS],
    unblockPolicy: {
      temporaryRuntimeBlock: true,
      unblockMode: 'tool_by_tool_after_required_execution_gates',
      requiredBeforeAnyToolExecution,
    },
    counts: {
      totalAiGraphicsTools: 21,
      privateWorkerHandoffAdmissionPreparedTools: admissionRows.length,
      cpuStaticPrivateWorkerHandoffReadyTools: admissionRows.length,
      cpuStaticPrivateWorkerHandoffBlockedTools: cpuStaticBlockedRows.length,
      satoriBlockedPendingApprovedFontFixtureTools: satoriBlockedRows.length,
      nonCpuStaticDeferredTools: nonCpuRows.length,
      externalAgentCanRequestPrivateWorkerHandoffNowTools: 0,
      externalAgentCanInvokeAdapterNowTools: 0,
      externalAgentExecutableNowTools: 0,
      workerEnqueueApprovedNowTools: 0,
      workerDispatchApprovedNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      publicArtifactAllowedTools: 0,
      signedUrlAllowedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentCpuStaticPrivateWorkerHandoffAdmissionPrepared: true,
      sourceCpuStaticAdapterSmokeAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      fiveCpuStaticPrivateWorkerHandoffAdmissionsPrepared:
        admissionRows.length === 5,
      satoriBlockedPendingApprovedFontFixture: satoriBlockedRows.length === 1,
      nonCpuStaticToolsDeferredByRuntimeBoundary: nonCpuRows.length === 15,
      privateOutputManifestContractsPreparedForAdmittedTools:
        admissionRows.length === 5 &&
        admissionRows.every((row) => row.privateOutputManifestContractPrepared),
      privateArtifactOnlyPolicyAccepted: true,
      workerCheckbackPolicyRequired: true,
      workerFallbackPolicyRequired: true,
      workerQaGateRequired: true,
      unblockPolicyDefined: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
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
    nextMilestone:
      'controlled private worker queue dry admission for the five admitted CPU/static tools, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred',
  }
}
