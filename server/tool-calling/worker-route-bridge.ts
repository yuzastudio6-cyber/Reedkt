import type {
  ProductionRegistryWorkerType,
} from '../tool-registry'
import type {
  ProductionWorkerRuntimeType,
} from '../workers/production/production-worker-types'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  ToolCallingPipeline,
  ToolCallingPipelineStep,
} from './pipeline-composer'
import type {
  ToolCallingWorkerRouteBridgePlan,
} from './adapter-contract-types'

interface WorkerRouteBridgeSpec {
  operationId: ToolCallingOperationId
  allowedWorkerTypes: readonly ProductionWorkerRuntimeType[]
  futureHandlers: Partial<Record<ProductionWorkerRuntimeType, string>>
}

const operationWorkerRouteSpecs: Record<ToolCallingOperationId, WorkerRouteBridgeSpec> = {
  'media.inspect': {
    operationId: 'media.inspect',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_media_foundation' },
  },
  'media.proxy.create': {
    operationId: 'media.proxy.create',
    allowedWorkerTypes: ['render_worker', 'cpu_analysis_worker'],
    futureHandlers: {
      render_worker: 'render_worker_media_proxy_planning',
      cpu_analysis_worker: 'cpu_analysis_worker_media_foundation',
    },
  },
  'media.audio.extract': {
    operationId: 'media.audio.extract',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_media_foundation' },
  },
  'video.scene.detect': {
    operationId: 'video.scene.detect',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_smart_cut_foundation' },
  },
  'video.frame.sample': {
    operationId: 'video.frame.sample',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_media_foundation' },
  },
  'video.motion.score': {
    operationId: 'video.motion.score',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_media_foundation' },
  },
  'video.blur.score': {
    operationId: 'video.blur.score',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_media_foundation' },
  },
  'video.safe_zone.detect': {
    operationId: 'video.safe_zone.detect',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_media_foundation' },
  },
  'audio.transcribe': {
    operationId: 'audio.transcribe',
    allowedWorkerTypes: ['gpu_ai_worker'],
    futureHandlers: { gpu_ai_worker: 'gpu_ai_worker_speech_foundation' },
  },
  'audio.word_align': {
    operationId: 'audio.word_align',
    allowedWorkerTypes: ['gpu_ai_worker'],
    futureHandlers: { gpu_ai_worker: 'gpu_ai_worker_speech_caption_execution' },
  },
  'audio.loudness.normalize': {
    operationId: 'audio.loudness.normalize',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_audio_execution' },
  },
  'audio.cleanup': {
    operationId: 'audio.cleanup',
    allowedWorkerTypes: ['gpu_ai_worker', 'cpu_analysis_worker'],
    futureHandlers: {
      gpu_ai_worker: 'gpu_ai_worker_audio_execution',
      cpu_analysis_worker: 'cpu_analysis_worker_audio_execution',
    },
  },
  'caption.generate': {
    operationId: 'caption.generate',
    allowedWorkerTypes: ['gpu_ai_worker', 'render_worker'],
    futureHandlers: {
      gpu_ai_worker: 'gpu_ai_worker_speech_caption_execution',
      render_worker: 'render_worker_caption_execution',
    },
  },
  'caption.align': {
    operationId: 'caption.align',
    allowedWorkerTypes: ['gpu_ai_worker', 'render_worker'],
    futureHandlers: {
      gpu_ai_worker: 'gpu_ai_worker_speech_caption_execution',
      render_worker: 'render_worker_caption_execution',
    },
  },
  'caption.style': {
    operationId: 'caption.style',
    allowedWorkerTypes: ['render_worker'],
    futureHandlers: { render_worker: 'render_worker_caption_foundation' },
  },
  'caption.burn_in': {
    operationId: 'caption.burn_in',
    allowedWorkerTypes: ['render_worker'],
    futureHandlers: { render_worker: 'render_worker_caption_execution' },
  },
  'timeline.smart_cut': {
    operationId: 'timeline.smart_cut',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_smart_cut_timeline_execution' },
  },
  'timeline.validate': {
    operationId: 'timeline.validate',
    allowedWorkerTypes: ['cpu_analysis_worker', 'render_worker'],
    futureHandlers: {
      cpu_analysis_worker: 'cpu_analysis_worker_smart_cut_timeline_execution',
      render_worker: 'render_worker_timeline_foundation',
    },
  },
  'timeline.to_otio': {
    operationId: 'timeline.to_otio',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_smart_cut_timeline_execution' },
  },
  'render.preview': {
    operationId: 'render.preview',
    allowedWorkerTypes: ['render_worker'],
    futureHandlers: { render_worker: 'render_worker_final_render_export_execution' },
  },
  'render.compose': {
    operationId: 'render.compose',
    allowedWorkerTypes: ['render_worker'],
    futureHandlers: { render_worker: 'render_worker_final_render_export_execution' },
  },
  'export.mux': {
    operationId: 'export.mux',
    allowedWorkerTypes: ['render_worker'],
    futureHandlers: { render_worker: 'render_worker_final_render_export_execution' },
  },
  'export.validate': {
    operationId: 'export.validate',
    allowedWorkerTypes: ['qa_worker', 'cpu_analysis_worker'],
    futureHandlers: {
      qa_worker: 'qa_worker_final_render_export_qa',
      cpu_analysis_worker: 'cpu_analysis_worker_media_foundation',
    },
  },
  'mask.generate': {
    operationId: 'mask.generate',
    allowedWorkerTypes: ['gpu_ai_worker'],
    futureHandlers: { gpu_ai_worker: 'gpu_ai_worker_mask_composition_execution' },
  },
  'mask.refine': {
    operationId: 'mask.refine',
    allowedWorkerTypes: ['gpu_ai_worker', 'cpu_analysis_worker'],
    futureHandlers: {
      gpu_ai_worker: 'gpu_ai_worker_mask_composition_execution',
      cpu_analysis_worker: 'cpu_analysis_worker_mask_composition_dry_run',
    },
  },
  'background.remove': {
    operationId: 'background.remove',
    allowedWorkerTypes: ['gpu_ai_worker'],
    futureHandlers: { gpu_ai_worker: 'gpu_ai_worker_mask_composition_execution' },
  },
  'video.enhance': {
    operationId: 'video.enhance',
    allowedWorkerTypes: ['gpu_ai_worker', 'render_worker'],
    futureHandlers: {
      gpu_ai_worker: 'gpu_ai_worker_enhancement_slowmotion_execution',
      render_worker: 'render_worker_final_render_export_execution',
    },
  },
  'video.slow_motion': {
    operationId: 'video.slow_motion',
    allowedWorkerTypes: ['gpu_ai_worker', 'render_worker'],
    futureHandlers: {
      gpu_ai_worker: 'gpu_ai_worker_enhancement_slowmotion_execution',
      render_worker: 'render_worker_final_render_export_execution',
    },
  },
  'color.exposure.correct': {
    operationId: 'color.exposure.correct',
    allowedWorkerTypes: ['cpu_analysis_worker', 'render_worker'],
    futureHandlers: {
      cpu_analysis_worker: 'cpu_analysis_worker_color_execution',
      render_worker: 'render_worker_color_preview_execution',
    },
  },
  'color.shot_match': {
    operationId: 'color.shot_match',
    allowedWorkerTypes: ['cpu_analysis_worker', 'render_worker'],
    futureHandlers: {
      cpu_analysis_worker: 'cpu_analysis_worker_color_execution',
      render_worker: 'render_worker_color_preview_execution',
    },
  },
  'ocr.detect_text': {
    operationId: 'ocr.detect_text',
    allowedWorkerTypes: ['cpu_analysis_worker'],
    futureHandlers: { cpu_analysis_worker: 'cpu_analysis_worker_media_foundation' },
  },
  'thumbnail.generate': {
    operationId: 'thumbnail.generate',
    allowedWorkerTypes: ['render_worker', 'cpu_analysis_worker'],
    futureHandlers: {
      render_worker: 'render_worker_final_render_export_execution',
      cpu_analysis_worker: 'cpu_analysis_worker_media_foundation',
    },
  },
  'qa.final_delivery': {
    operationId: 'qa.final_delivery',
    allowedWorkerTypes: ['qa_worker'],
    futureHandlers: { qa_worker: 'qa_worker_final_render_export_qa' },
  },
}

function isProductionWorkerRuntimeType(workerType: ProductionRegistryWorkerType | undefined): workerType is ProductionWorkerRuntimeType {
  return workerType === 'cpu_analysis_worker' ||
    workerType === 'gpu_ai_worker' ||
    workerType === 'render_worker' ||
    workerType === 'qa_worker' ||
    workerType === 'tool_readiness_worker'
}

function selectWorkerType(step: ToolCallingPipelineStep, spec: WorkerRouteBridgeSpec): ProductionWorkerRuntimeType {
  if (
    isProductionWorkerRuntimeType(step.workerType) &&
    spec.allowedWorkerTypes.includes(step.workerType)
  ) {
    return step.workerType
  }

  const defaultWorkerType = spec.allowedWorkerTypes[0]
  if (!defaultWorkerType) {
    throw new Error(`No worker route bridge worker type configured for ${step.operationId}.`)
  }

  return defaultWorkerType
}

export function listWorkerRouteBridgeSpecs(): WorkerRouteBridgeSpec[] {
  return Object.values(operationWorkerRouteSpecs)
}

export function getWorkerRouteBridgeSpec(operationId: ToolCallingOperationId | string): WorkerRouteBridgeSpec | undefined {
  return operationWorkerRouteSpecs[operationId as ToolCallingOperationId]
}

export function buildWorkerRouteBridgePlanForStep(
  step: ToolCallingPipelineStep,
): ToolCallingWorkerRouteBridgePlan {
  const spec = getWorkerRouteBridgeSpec(step.operationId)
  if (!spec) {
    throw new Error(`No worker route bridge metadata configured for ${step.operationId}.`)
  }

  const workerType = selectWorkerType(step, spec)
  const futureHandler = spec.futureHandlers[workerType] ?? `${workerType}_placeholder`

  return {
    workerType,
    futureHandler,
    sourcePipelineStepId: step.stepId,
    sourceOperationId: step.operationId,
    selectedToolId: step.selectedToolId,
    payloadShape: {
      payloadKind: 'production_worker_job_payload_metadata',
      requiredFields: [
        'jobId',
        'workspaceId',
        'projectId',
        'approvedSnapshotId',
        'toolExecutionPlanId',
        'workerType',
        'executionMode',
        'requestedToolIds',
        'storageReferenceIds',
      ],
      metadataFields: [
        'adapterPlanId',
        'sourcePipelineStepId',
        'sourceOperationId',
        'selectedToolId',
        'requiredQualityGateTypes',
      ],
      storageReferenceMode: 'private_artifact_references_only',
      blockedDataCategories: [
        'unapproved_instruction_text',
        'public_or_ephemeral_media_links',
        'privileged_database_context',
        'freeform_runtime_arguments',
        'direct_filesystem_output_targets',
      ],
    },
    approvedSnapshotRequired: true,
    rawPromptAllowed: false,
    signedUrlAllowed: false,
    serviceRoleAllowed: false,
    executesTools: false,
  }
}

export function buildWorkerRouteBridgePlansForPipeline(
  pipeline: ToolCallingPipeline,
): ToolCallingWorkerRouteBridgePlan[] {
  return pipeline.steps.map(buildWorkerRouteBridgePlanForStep)
}
