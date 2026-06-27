import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type { AiGraphicsExternalBetaEvidenceRecordInput } from './ai-graphics-external-beta-evidence-packet'

export const AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_SCAFFOLD_DECISION =
  'ai_graphics_external_beta_evidence_scaffold_prepared_for_local_private_records'

export type AiGraphicsExternalBetaEvidenceClassId =
  | 'internal_runtime_soak'
  | 'external_beta_qa'
  | 'cost_concurrency_privacy_rollback'
  | 'incident_response'
  | 'external_beta_owner_approval'

export interface AiGraphicsExternalBetaEvidenceScaffoldRecord {
  toolId: AiGraphicsCanonicalToolId
  directoryName: string
  relativeFilePath: string
  runtimeTarget: string
  gpuRequiredForRuntime: boolean
  placeholderRecord: AiGraphicsExternalBetaEvidenceRecordInput
  requiredEvidenceClasses: AiGraphicsExternalBetaEvidenceClassId[]
  acceptedPrivateEvidenceRefNamespaces: readonly [
    'private://',
    'reeditpro-private://',
    'backend-evidence://',
    'owner-evidence://',
    'external-beta-evidence://',
  ]
  placeholderRefsAreInvalidUntilReplaced: true
  status: 'template_only_not_validated'
  nextAction: string
}

export interface AiGraphicsExternalBetaEvidenceScaffoldChecklistItem {
  toolId: AiGraphicsCanonicalToolId
  localOnlyTemplatePath: string
  runtimeTarget: string
  gpuRequiredForRuntime: boolean
  requiredEvidenceClasses: AiGraphicsExternalBetaEvidenceClassId[]
  validationCommands: [
    'npm run --silent ai-graphics:external-beta-evidence-packet:validate -- --evidence-records "$REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_RECORDS"',
    'npm run --silent ai-graphics:external-beta-readiness-gate -- --all-shared-gates-passed --browser-canvas-webgl-sandbox-passed --native-gpu-runtime-proof-passed --model-weight-manifests-approved --model-weight-review-packet-accepted --external-beta-evidence-packet "$REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET"',
  ]
  localOnly: true
  committedEvidenceAccepted: false
  nextAction: string
}

export interface AiGraphicsExternalBetaEvidenceScaffoldPacket {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_SCAFFOLD_DECISION
  totalAiGraphicsTools: 21
  scaffoldRecordsPrepared: 21
  committedEvidenceRecordsAccepted: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  scaffoldRecords: AiGraphicsExternalBetaEvidenceScaffoldRecord[]
  evidenceRecordTemplate: AiGraphicsExternalBetaEvidenceRecordInput[]
  collectionChecklist: AiGraphicsExternalBetaEvidenceScaffoldChecklistItem[]
  booleans: {
    externalBetaEvidenceScaffoldPrepared: true
    all21ToolsCovered: true
    templatesInvalidUntilPrivateEvidenceRefsReplaced: true
    privateEvidenceRefsNotLogged: true
    externalBetaEvidencePacketInputTemplatePrepared: true
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

const requiredEvidenceClasses = [
  'internal_runtime_soak',
  'external_beta_qa',
  'cost_concurrency_privacy_rollback',
  'incident_response',
  'external_beta_owner_approval',
] as const satisfies readonly AiGraphicsExternalBetaEvidenceClassId[]

const acceptedPrivateEvidenceRefNamespaces = [
  'private://',
  'reeditpro-private://',
  'backend-evidence://',
  'owner-evidence://',
  'external-beta-evidence://',
] as const

function directoryNameForTool(toolId: AiGraphicsCanonicalToolId): string {
  return toolId.replaceAll('_', '-')
}

function placeholderRecordForTool(toolId: AiGraphicsCanonicalToolId): AiGraphicsExternalBetaEvidenceRecordInput {
  const directoryName = directoryNameForTool(toolId)
  return {
    toolId,
    internalRuntimeSoakEvidenceRef:
      `public://replace-with-private-evidence/${directoryName}/internal-runtime-soak`,
    externalBetaQaEvidenceRef:
      `public://replace-with-private-evidence/${directoryName}/external-beta-qa`,
    costConcurrencyPrivacyRollbackEvidenceRef:
      `public://replace-with-private-evidence/${directoryName}/cost-concurrency-privacy-rollback`,
    incidentResponseEvidenceRef:
      `public://replace-with-private-evidence/${directoryName}/incident-response`,
    ownerApprovalRef:
      `public://replace-with-private-evidence/${directoryName}/external-beta-owner-approval`,
  }
}

function nextActionForTool(input: {
  toolId: AiGraphicsCanonicalToolId
  gpuRequiredForRuntime: boolean
  runtimeTarget: string
}): string {
  if (input.gpuRequiredForRuntime) {
    return `Collect private internal soak, external QA, cost/privacy/rollback, incident, and owner evidence after ${input.toolId} passes accepted on-demand GPU worker proof.`
  }
  if (input.runtimeTarget.startsWith('browser_')) {
    return `Collect private browser sandbox soak and external QA evidence before ${input.toolId} can be exposed to external beta.`
  }
  return `Collect private Node/static runtime soak and external QA evidence before ${input.toolId} can be exposed to external beta.`
}

function checklistItemForRecord(
  record: AiGraphicsExternalBetaEvidenceScaffoldRecord,
): AiGraphicsExternalBetaEvidenceScaffoldChecklistItem {
  return {
    toolId: record.toolId,
    localOnlyTemplatePath: `.local-artifacts/ai-graphics/external-beta-evidence/${record.relativeFilePath}`,
    runtimeTarget: record.runtimeTarget,
    gpuRequiredForRuntime: record.gpuRequiredForRuntime,
    requiredEvidenceClasses: [...requiredEvidenceClasses],
    validationCommands: [
      'npm run --silent ai-graphics:external-beta-evidence-packet:validate -- --evidence-records "$REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_RECORDS"',
      'npm run --silent ai-graphics:external-beta-readiness-gate -- --all-shared-gates-passed --browser-canvas-webgl-sandbox-passed --native-gpu-runtime-proof-passed --model-weight-manifests-approved --model-weight-review-packet-accepted --external-beta-evidence-packet "$REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET"',
    ],
    localOnly: true,
    committedEvidenceAccepted: false,
    nextAction: record.nextAction,
  }
}

export function buildAiGraphicsExternalBetaEvidenceScaffoldPacket(): AiGraphicsExternalBetaEvidenceScaffoldPacket {
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const scaffoldRecords = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const readinessRecord = readinessRecords.find((record) => record.toolId === toolId)
    if (!readinessRecord) {
      throw new Error(`Missing AI graphics readiness record for external-beta evidence scaffold: ${toolId}`)
    }
    const directoryName = directoryNameForTool(toolId)

    return {
      toolId,
      directoryName,
      relativeFilePath: `${directoryName}/external-beta-evidence-record.json`,
      runtimeTarget: readinessRecord.runtimeTarget,
      gpuRequiredForRuntime: readinessRecord.gpuRequiredForRuntime,
      placeholderRecord: placeholderRecordForTool(toolId),
      requiredEvidenceClasses: [...requiredEvidenceClasses],
      acceptedPrivateEvidenceRefNamespaces,
      placeholderRefsAreInvalidUntilReplaced: true as const,
      status: 'template_only_not_validated' as const,
      nextAction: nextActionForTool({
        toolId,
        runtimeTarget: readinessRecord.runtimeTarget,
        gpuRequiredForRuntime: readinessRecord.gpuRequiredForRuntime,
      }),
    }
  })

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_SCAFFOLD_DECISION,
    totalAiGraphicsTools: 21,
    scaffoldRecordsPrepared: 21,
    committedEvidenceRecordsAccepted: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    scaffoldRecords,
    evidenceRecordTemplate: scaffoldRecords.map((record) => record.placeholderRecord),
    collectionChecklist: scaffoldRecords.map(checklistItemForRecord),
    booleans: {
      externalBetaEvidenceScaffoldPrepared: true,
      all21ToolsCovered: true,
      templatesInvalidUntilPrivateEvidenceRefsReplaced: true,
      privateEvidenceRefsNotLogged: true,
      externalBetaEvidencePacketInputTemplatePrepared: true,
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
