import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET_DECISION =
  'ai_graphics_external_beta_evidence_packet_prepared_with_runtime_blocks'

export interface AiGraphicsExternalBetaEvidenceRecordInput {
  toolId: AiGraphicsCanonicalToolId
  internalRuntimeSoakEvidenceRef?: string
  externalBetaQaEvidenceRef?: string
  costConcurrencyPrivacyRollbackEvidenceRef?: string
  incidentResponseEvidenceRef?: string
  ownerApprovalRef?: string
}

export interface AiGraphicsExternalBetaEvidenceRecord {
  toolId: AiGraphicsCanonicalToolId
  internalRuntimeSoakEvidenceRefAccepted: boolean
  externalBetaQaEvidenceRefAccepted: boolean
  costConcurrencyPrivacyRollbackEvidenceRefAccepted: boolean
  incidentResponseEvidenceRefAccepted: boolean
  ownerApprovalRefAccepted: boolean
  externalBetaEvidenceAcceptedWithProvidedEvidence: boolean
  externalBetaReadyNow: false
  productionReadyNow: false
  missingEvidence: string[]
  acceptedRefsRedacted: true
}

export interface AiGraphicsExternalBetaEvidencePacket {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET_DECISION
  totalAiGraphicsTools: 21
  evidenceRecordsProvided: number
  evidenceRecordsAcceptedWithProvidedEvidence: number
  externalBetaReadyWithProvidedEvidenceTools: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  records: AiGraphicsExternalBetaEvidenceRecord[]
  requiredEvidenceClasses: string[]
  forbiddenEvidenceRefPatterns: string[]
  booleans: {
    externalBetaEvidencePacketPrepared: true
    all21ToolsCovered: true
    internalBetaRuntimeSoakAcceptedWithProvidedEvidence: boolean
    externalBetaQaAcceptedWithProvidedEvidence: boolean
    externalBetaCostConcurrencyPrivacyRollbackAcceptedWithProvidedEvidence: boolean
    externalBetaIncidentResponseAcceptedWithProvidedEvidence: boolean
    externalBetaOwnerApprovalGrantedWithProvidedEvidence: boolean
    externalBetaReadyWithProvidedEvidence: boolean
    privateOrBackendEvidenceRefsRequired: true
    publicArtifactRefsRejected: true
    signedUrlRefsRejected: true
    rawHttpRefsRejected: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
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

const allTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const requiredEvidenceClasses = [
  'internal runtime soak evidence',
  'external-beta QA evidence',
  'cost/concurrency/privacy/rollback evidence',
  'incident-response evidence',
  'external-beta owner approval evidence',
]

const forbiddenEvidenceRefPatterns = [
  'http://',
  'https://',
  'signed-url://',
  'public://',
  'gs://public',
]

const acceptedEvidenceRefPrefixes = [
  'private://',
  'reeditpro-private://',
  'backend-evidence://',
  'owner-evidence://',
  'external-beta-evidence://',
]

function isSafeEvidenceRef(value: string | undefined): boolean {
  if (!value) return false
  if (forbiddenEvidenceRefPatterns.some((pattern) => value.startsWith(pattern))) return false
  const acceptedPrefix = acceptedEvidenceRefPrefixes.find((prefix) => value.startsWith(prefix))
  if (acceptedPrefix) {
    const suffix = value.slice(acceptedPrefix.length)
    return suffix.length > 0 && /^[a-z0-9_.:/-]+$/i.test(suffix)
  }
  return /^[a-z0-9_:-]+$/i.test(value)
}

function uniqueRecordsByTool(
  records: readonly AiGraphicsExternalBetaEvidenceRecordInput[],
): Map<AiGraphicsCanonicalToolId, AiGraphicsExternalBetaEvidenceRecordInput> {
  const byTool = new Map<AiGraphicsCanonicalToolId, AiGraphicsExternalBetaEvidenceRecordInput>()
  for (const record of records) {
    if (!allTools.includes(record.toolId)) continue
    if (byTool.has(record.toolId)) continue
    byTool.set(record.toolId, record)
  }
  return byTool
}

function missingEvidenceForTool(
  toolId: AiGraphicsCanonicalToolId,
  checks: {
    internalRuntimeSoakEvidenceRefAccepted: boolean
    externalBetaQaEvidenceRefAccepted: boolean
    costConcurrencyPrivacyRollbackEvidenceRefAccepted: boolean
    incidentResponseEvidenceRefAccepted: boolean
    ownerApprovalRefAccepted: boolean
  },
): string[] {
  return [
    !checks.internalRuntimeSoakEvidenceRefAccepted
      ? `${toolId}: internal runtime soak evidence ref`
      : undefined,
    !checks.externalBetaQaEvidenceRefAccepted
      ? `${toolId}: external-beta QA evidence ref`
      : undefined,
    !checks.costConcurrencyPrivacyRollbackEvidenceRefAccepted
      ? `${toolId}: cost/concurrency/privacy/rollback evidence ref`
      : undefined,
    !checks.incidentResponseEvidenceRefAccepted
      ? `${toolId}: incident-response evidence ref`
      : undefined,
    !checks.ownerApprovalRefAccepted
      ? `${toolId}: external-beta owner approval ref`
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))
}

export function buildAiGraphicsExternalBetaEvidencePacket(
  records: readonly AiGraphicsExternalBetaEvidenceRecordInput[] = [],
): AiGraphicsExternalBetaEvidencePacket {
  const byTool = uniqueRecordsByTool(records)
  const normalizedRecords = allTools.map((toolId): AiGraphicsExternalBetaEvidenceRecord => {
    const input = byTool.get(toolId)
    const checks = {
      internalRuntimeSoakEvidenceRefAccepted:
        isSafeEvidenceRef(input?.internalRuntimeSoakEvidenceRef),
      externalBetaQaEvidenceRefAccepted:
        isSafeEvidenceRef(input?.externalBetaQaEvidenceRef),
      costConcurrencyPrivacyRollbackEvidenceRefAccepted:
        isSafeEvidenceRef(input?.costConcurrencyPrivacyRollbackEvidenceRef),
      incidentResponseEvidenceRefAccepted:
        isSafeEvidenceRef(input?.incidentResponseEvidenceRef),
      ownerApprovalRefAccepted:
        isSafeEvidenceRef(input?.ownerApprovalRef),
    }
    const missingEvidence = missingEvidenceForTool(toolId, checks)

    return {
      toolId,
      ...checks,
      externalBetaEvidenceAcceptedWithProvidedEvidence: missingEvidence.length === 0,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      missingEvidence,
      acceptedRefsRedacted: true,
    }
  })
  const acceptedRecords = normalizedRecords.filter(
    (record) => record.externalBetaEvidenceAcceptedWithProvidedEvidence,
  )
  const allInternalRuntimeSoakAccepted = normalizedRecords.every(
    (record) => record.internalRuntimeSoakEvidenceRefAccepted,
  )
  const allQaAccepted = normalizedRecords.every(
    (record) => record.externalBetaQaEvidenceRefAccepted,
  )
  const allCostPrivacyRollbackAccepted = normalizedRecords.every(
    (record) => record.costConcurrencyPrivacyRollbackEvidenceRefAccepted,
  )
  const allIncidentAccepted = normalizedRecords.every(
    (record) => record.incidentResponseEvidenceRefAccepted,
  )
  const allOwnerAccepted = normalizedRecords.every(
    (record) => record.ownerApprovalRefAccepted,
  )
  const externalBetaReadyWithProvidedEvidence =
    acceptedRecords.length === allTools.length &&
    allInternalRuntimeSoakAccepted &&
    allQaAccepted &&
    allCostPrivacyRollbackAccepted &&
    allIncidentAccepted &&
    allOwnerAccepted

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET_DECISION,
    totalAiGraphicsTools: 21,
    evidenceRecordsProvided: byTool.size,
    evidenceRecordsAcceptedWithProvidedEvidence: acceptedRecords.length,
    externalBetaReadyWithProvidedEvidenceTools:
      externalBetaReadyWithProvidedEvidence ? 21 : 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    records: normalizedRecords,
    requiredEvidenceClasses,
    forbiddenEvidenceRefPatterns,
    booleans: {
      externalBetaEvidencePacketPrepared: true,
      all21ToolsCovered: true,
      internalBetaRuntimeSoakAcceptedWithProvidedEvidence: allInternalRuntimeSoakAccepted,
      externalBetaQaAcceptedWithProvidedEvidence: allQaAccepted,
      externalBetaCostConcurrencyPrivacyRollbackAcceptedWithProvidedEvidence:
        allCostPrivacyRollbackAccepted,
      externalBetaIncidentResponseAcceptedWithProvidedEvidence: allIncidentAccepted,
      externalBetaOwnerApprovalGrantedWithProvidedEvidence: allOwnerAccepted,
      externalBetaReadyWithProvidedEvidence,
      privateOrBackendEvidenceRefsRequired: true,
      publicArtifactRefsRejected: true,
      signedUrlRefsRejected: true,
      rawHttpRefsRejected: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
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
