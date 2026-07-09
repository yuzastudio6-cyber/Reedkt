import { summarizeProductionToolRegistry } from '../tool-registry'
import type { ProductionToolId } from '../tool-registry'
import type { ToolCallingOperationId } from './operation-ontology'
import {
  INITIAL_PIPELINE_PATTERN_IDS,
  composePipelineForPattern,
  type PipelinePatternId,
} from './pipeline-composer'
import { buildAdapterPlanForPipeline } from './adapter-planner'
import type { ToolCallingRankingContext } from './tool-capability-card-types'

export const INTERNAL_TESTING_TOOL_ROUTING_READINESS_DECISION =
  'internal_testing_tool_routing_readiness_passed_ready_for_approved_snapshot_adapter_route_review'

export type InternalTestingToolActivityId =
  | 'source_preparation'
  | 'speech_and_captions'
  | 'story_cleanup'
  | 'audio_polish'
  | 'visual_review'
  | 'private_review_build'
  | 'delivery_check'

export interface InternalTestingToolRoutingActivity {
  activityId: InternalTestingToolActivityId
  label: string
  summary: string
  plannedOperationCount: number
  status: 'route_metadata_ready'
}

export interface InternalTestingToolRoutingPatternSummary {
  patternId: PipelinePatternId
  plannedStepCount: number
  adapterPlanCount: number
  workerRouteBridgePlanCount: number
  approvedSnapshotRequired: true
  rawPromptAllowed: false
  signedUrlAllowed: false
  serviceRoleAllowed: false
  executesTools: false
  mediaProcessingAllowed: false
  selectedToolIds: readonly ProductionToolId[]
}

export interface InternalTestingToolRoutingReadiness {
  decision: typeof INTERNAL_TESTING_TOOL_ROUTING_READINESS_DECISION
  source: 'server_production_registry_adapter_route_metadata'
  productReady: false
  frontendExecutableTools: 0
  productionRegistryTools: number
  launchCoreTools: number
  plannedOrFutureTools: number
  patternSummaries: readonly InternalTestingToolRoutingPatternSummary[]
  userFacingActivities: readonly InternalTestingToolRoutingActivity[]
  blockedScope: {
    directFrontendToolExecution: false
    rawPromptExecution: false
    publicOrSignedUrlArtifacts: false
    serviceRoleBrowserAccess: false
    providerOrModelCalls: false
    workerDispatch: false
    mediaProcessing: false
    renderOrExport: false
    creditSpend: false
    ledgerWrites: false
    supabaseWrites: false
    externalBeta: false
    paidProduction: false
    productReady: false
  }
}

const INTERNAL_TESTING_ROUTING_CONTEXT: ToolCallingRankingContext = {
  mode: 'preview',
  qualityTarget: 'balanced',
  allowGpu: false,
  mediaContext: {
    mediaTypes: ['video', 'audio'],
    hasAudio: true,
    hasSpeech: true,
    hasMotion: true,
    sourceArtifactTypes: ['source_media'],
    desiredOutputArtifactTypes: ['preview_video', 'qa_report'],
  },
}

const activityCopy: Record<InternalTestingToolActivityId, Omit<InternalTestingToolRoutingActivity, 'activityId' | 'plannedOperationCount' | 'status'>> = {
  source_preparation: {
    label: 'Source preparation',
    summary: 'Prepare uploaded source video for safe private analysis and review planning.',
  },
  speech_and_captions: {
    label: 'Speech and captions',
    summary: 'Prepare transcript, alignment, caption, and readability work after approval gates.',
  },
  story_cleanup: {
    label: 'Story cleanup',
    summary: 'Prepare clean cuts, timing checks, and timeline handoff for the edit plan.',
  },
  audio_polish: {
    label: 'Audio polish',
    summary: 'Prepare loudness, cleanup, and music timing checks for a private review.',
  },
  visual_review: {
    label: 'Visual review',
    summary: 'Prepare framing, safe-zone, image, color, and visual quality checks.',
  },
  private_review_build: {
    label: 'Private review build',
    summary: 'Prepare the private review composition path after the approved snapshot is ready.',
  },
  delivery_check: {
    label: 'Delivery check',
    summary: 'Prepare final private review validation without public delivery or production release.',
  },
}

function activityForOperation(operationId: ToolCallingOperationId): InternalTestingToolActivityId {
  if (operationId.startsWith('media.')) return 'source_preparation'
  if (operationId.startsWith('audio.transcribe') || operationId.startsWith('audio.word') || operationId.startsWith('caption.')) return 'speech_and_captions'
  if (operationId.startsWith('timeline.')) return 'story_cleanup'
  if (operationId.startsWith('audio.')) return 'audio_polish'
  if (operationId.startsWith('video.') || operationId.startsWith('color.') || operationId.startsWith('mask.') || operationId.startsWith('background.') || operationId.startsWith('thumbnail.') || operationId.startsWith('ocr.')) {
    return 'visual_review'
  }
  if (operationId.startsWith('render.') || operationId.startsWith('export.mux')) return 'private_review_build'
  return 'delivery_check'
}

function summarizePattern(patternId: PipelinePatternId): InternalTestingToolRoutingPatternSummary {
  const pipeline = composePipelineForPattern(patternId, INTERNAL_TESTING_ROUTING_CONTEXT)
  const adapterPlan = buildAdapterPlanForPipeline(pipeline)

  return {
    patternId,
    plannedStepCount: pipeline.steps.length,
    adapterPlanCount: adapterPlan.adapterPlans.length,
    workerRouteBridgePlanCount: adapterPlan.workerRouteBridgePlans.length,
    approvedSnapshotRequired: true,
    rawPromptAllowed: false,
    signedUrlAllowed: false,
    serviceRoleAllowed: false,
    executesTools: false,
    mediaProcessingAllowed: false,
    selectedToolIds: pipeline.steps.map((step) => step.selectedToolId),
  }
}

function buildActivities(patternIds: readonly PipelinePatternId[]): InternalTestingToolRoutingActivity[] {
  const operationCounts = new Map<InternalTestingToolActivityId, number>()

  for (const patternId of patternIds) {
    const pipeline = composePipelineForPattern(patternId, INTERNAL_TESTING_ROUTING_CONTEXT)
    for (const step of pipeline.steps) {
      const activityId = activityForOperation(step.operationId)
      operationCounts.set(activityId, (operationCounts.get(activityId) ?? 0) + 1)
    }
  }

  return [...operationCounts.entries()]
    .map(([activityId, plannedOperationCount]) => ({
      activityId,
      ...activityCopy[activityId],
      plannedOperationCount,
      status: 'route_metadata_ready' as const,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function getInternalTestingToolRoutingReadiness(): InternalTestingToolRoutingReadiness {
  const registry = summarizeProductionToolRegistry()
  const patternSummaries = INITIAL_PIPELINE_PATTERN_IDS.map(summarizePattern)
  const plannedOrFutureTools = registry.totalTools - registry.launchCoreTools.length

  return {
    decision: INTERNAL_TESTING_TOOL_ROUTING_READINESS_DECISION,
    source: 'server_production_registry_adapter_route_metadata',
    productReady: false,
    frontendExecutableTools: 0,
    productionRegistryTools: registry.totalTools,
    launchCoreTools: registry.launchCoreTools.length,
    plannedOrFutureTools,
    patternSummaries,
    userFacingActivities: buildActivities(INITIAL_PIPELINE_PATTERN_IDS),
    blockedScope: {
      directFrontendToolExecution: false,
      rawPromptExecution: false,
      publicOrSignedUrlArtifacts: false,
      serviceRoleBrowserAccess: false,
      providerOrModelCalls: false,
      workerDispatch: false,
      mediaProcessing: false,
      renderOrExport: false,
      creditSpend: false,
      ledgerWrites: false,
      supabaseWrites: false,
      externalBeta: false,
      paidProduction: false,
      productReady: false,
    },
  }
}
