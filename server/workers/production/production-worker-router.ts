import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { ProductionWorkerJobPayload, ProductionWorkerRouteOutput } from './production-worker-types'
import { buildStorageArtifactReference, runMediaAnalysisFoundation } from '../media'
import type { MediaFoundationRunMode, MediaFoundationTask } from '../media'
import { runSpeechFoundation } from '../speech'
import type { SpeechFoundationRunMode } from '../speech'
import { runCaptionFoundation } from '../captions'
import type { CaptionFileFormat, CaptionFoundationRunMode, CaptionStylePresetId } from '../captions'
import { runSpeechCaptionExecutionPipeline } from '../speech-caption'
import type { SpeechCaptionExecutionMode } from '../speech-caption'
import { runSmartCutTimelineExecutionPipeline } from '../smart-cut-timeline'
import type { SmartCutTimelineExecutionMode } from '../smart-cut-timeline'
import { buildSmartCutPlan, runSmartCutFoundation } from '../smart-cut'
import type { SmartCutAggressiveness, SmartCutFoundationRunMode, SmartCutIntent, PacingProfileName } from '../smart-cut'
import { runTimelineFoundation } from '../timeline'
import type { TimelineFoundationRunMode } from '../timeline'
import { runAudioFoundation } from '../audio'
import type { AudioFoundationRunMode } from '../audio'
import { runAudioExecutionPipeline } from '../audio-execution'
import type { AudioExecutionMode } from '../audio-execution'
import { runColorExecutionPipeline } from '../color-execution'
import type { ColorExecutionMode, ColorGradeStyle } from '../color-execution'
import { runMaskCompositionPipeline } from '../mask-composition'
import type { MaskExecutionMode, MaskIntent, MaskToolId, MaskSubjectSelection } from '../mask-composition'
import { runEnhancementSlowMotionPipeline } from '../enhancement-slowmotion'
import type { EnhancementSlowMotionExecutionMode } from '../enhancement-slowmotion'
import type { EnhancementIntent } from '../enhancement'
import type { SlowMotionInterpolationMode } from '../slow-motion'
import { runFinalRenderExecutionPipeline } from '../final-render'
import type { FinalRenderEngine, FinalRenderExecutionMode, FinalRenderMode } from '../final-render'

export async function routeProductionWorkerJob(payload: ProductionWorkerJobPayload): Promise<ProductionWorkerRouteOutput> {
  switch (payload.workerType) {
    case 'cpu_analysis_worker':
      if (hasMediaFoundationRequest(payload)) {
        const mediaFoundationResult = await runMediaAnalysisFoundation(buildMediaFoundationInput(payload))
        return {
          summary: 'Milestone 6 CPU media foundation route completed in explicit mediaFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_media_foundation',
          mediaFoundationResult,
        }
      }

      if (hasSmartCutTimelineExecutionRequest(payload)) {
        const smartCutTimelineExecutionResult = await runSmartCutTimelineExecutionPipeline(buildSmartCutTimelineExecutionInput(payload))
        return {
          summary: 'Milestone 14 CPU analysis worker smart cut/timeline execution route completed in explicit smartCutTimelineExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_smart_cut_timeline_execution',
          smartCutTimelineExecutionResult,
        }
      }

      if (hasTimelineFoundationRequest(payload)) {
        const timelineFoundationResult = await runTimelineFoundation(buildTimelineFoundationInput(payload))
        return {
          summary: 'Milestone 8 CPU analysis worker timeline foundation route completed in explicit timelineFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_timeline_foundation',
          timelineFoundationResult,
        }
      }

      if (hasAudioExecutionRequest(payload)) {
        const audioExecutionResult = await runAudioExecutionPipeline(buildAudioExecutionInput(payload))
        return {
          summary: 'Milestone 15A CPU analysis worker audio execution route completed in explicit audioExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_audio_execution',
          audioExecutionResult,
        }
      }

      if (hasColorExecutionRequest(payload)) {
        const colorExecutionResult = await runColorExecutionPipeline(buildColorExecutionInput(payload))
        return {
          summary: 'Milestone 15B CPU analysis worker color execution route completed in explicit colorExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_color_execution',
          colorExecutionResult,
        }
      }

      if (hasCpuMaskCompositionRequest(payload)) {
        const maskCompositionResult = await runMaskCompositionPipeline(buildMaskCompositionInput(payload))
        return {
          summary: 'Milestone 15C CPU analysis worker mask QA/refinement dry-run route completed in explicit maskComposition mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_mask_composition_dry_run',
          maskCompositionResult,
        }
      }

      if (hasCpuEnhancementSlowMotionRequest(payload)) {
        const enhancementSlowMotionResult = await runEnhancementSlowMotionPipeline(buildEnhancementSlowMotionInput(payload))
        return {
          summary: 'Milestone 15D CPU analysis worker enhancement/slow-motion QA dry-run route completed in explicit enhancementSlowMotion mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_enhancement_slowmotion_dry_run',
          enhancementSlowMotionResult,
        }
      }

      if (hasSmartCutFoundationRequest(payload)) {
        const smartCutFoundationResult = await runSmartCutFoundation(buildSmartCutFoundationInput(payload))
        return {
          summary: 'Milestone 8 CPU analysis worker smart cut foundation route completed in explicit smartCutFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_smart_cut_foundation',
          smartCutFoundationResult,
        }
      }

      if (hasAudioFoundationRequest(payload)) {
        const audioFoundationResult = await runAudioFoundation(buildAudioFoundationInput(payload))
        return {
          summary: 'Milestone 9 CPU analysis worker audio foundation route completed in explicit audioFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'cpu_analysis_worker_audio_foundation',
          audioFoundationResult,
        }
      }

      if (hasTrackBAgentToolRecipeRequest(payload)) {
        return buildTrackBAgentToolRecipeRouteOutput(payload)
      }

      return {
        summary: 'Dry-run only: future CPU analysis worker will run media probe, proxy, scene, OCR, OpenTimelineIO, and analysis recipes.',
        workerType: payload.workerType,
        executionMode: payload.executionMode,
        mockOnly: true,
        futureHandler: 'cpu_analysis_worker_placeholder',
      }
    case 'gpu_ai_worker':
      if (hasEnhancementSlowMotionRequest(payload)) {
        const enhancementSlowMotionResult = await runEnhancementSlowMotionPipeline(buildEnhancementSlowMotionInput(payload))
        return {
          summary: 'Milestone 15D GPU AI worker enhancement/slow-motion execution route completed in explicit enhancementSlowMotion mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'gpu_ai_worker_enhancement_slowmotion_execution',
          enhancementSlowMotionResult,
        }
      }

      if (hasMaskCompositionRequest(payload)) {
        const maskCompositionResult = await runMaskCompositionPipeline(buildMaskCompositionInput(payload))
        return {
          summary: 'Milestone 15C GPU AI worker mask/background execution route completed in explicit maskComposition mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'gpu_ai_worker_mask_composition_execution',
          maskCompositionResult,
        }
      }

      if (hasGpuAudioExecutionRequest(payload)) {
        const audioExecutionResult = await runAudioExecutionPipeline(buildAudioExecutionInput(payload))
        return {
          summary: 'Milestone 15A GPU AI worker audio model-tool execution route completed in explicit audioExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'gpu_ai_worker_audio_execution',
          audioExecutionResult,
        }
      }

      if (hasSpeechCaptionExecutionRequest(payload)) {
        const speechCaptionExecutionResult = await runSpeechCaptionExecutionPipeline(buildSpeechCaptionExecutionInput(payload))
        return {
          summary: 'Milestone 13 GPU AI worker speech/caption execution route completed in explicit speechCaptionExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'gpu_ai_worker_speech_caption_execution',
          speechCaptionExecutionResult,
        }
      }

      if (hasAudioFoundationRequest(payload)) {
        const audioFoundationResult = await runAudioFoundation(buildAudioFoundationInput(payload))
        return {
          summary: 'Milestone 9 GPU AI worker audio model-tool foundation route completed in explicit audioFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'gpu_ai_worker_audio_foundation',
          audioFoundationResult,
        }
      }

      if (hasSpeechFoundationRequest(payload)) {
        const speechFoundationResult = await runSpeechFoundation(buildSpeechFoundationInput(payload))
        return {
          summary: 'Milestone 7 GPU AI worker speech foundation route completed in explicit speechFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'gpu_ai_worker_speech_foundation',
          speechFoundationResult,
        }
      }

      if (hasTrackBAgentToolRecipeRequest(payload)) {
        return buildTrackBAgentToolRecipeRouteOutput(payload)
      }

      return {
        summary: 'Dry-run only: future GPU AI worker will run faster-whisper, BiRefNet, SAM2, DeepFilterNet, Demucs, Real-ESRGAN, FILM, and heavy CV recipes after approval.',
        workerType: payload.workerType,
        executionMode: payload.executionMode,
        mockOnly: true,
        futureHandler: 'gpu_ai_worker_placeholder',
      }
    case 'render_worker':
      if (hasFinalRenderExecutionRequest(payload)) {
        const finalRenderExecutionResult = await runFinalRenderExecutionPipeline(buildFinalRenderExecutionInput(payload))
        return {
          summary: 'Milestone 16A render worker final render/export execution route completed in explicit finalRenderExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'render_worker_final_render_export_execution',
          finalRenderExecutionResult,
        }
      }

      if (hasRenderMaskCompositionRequest(payload)) {
        const maskCompositionResult = await runMaskCompositionPipeline(buildMaskCompositionInput(payload, { renderPreviewOnly: true }))
        return {
          summary: 'Milestone 15C render worker mask/text-behind-subject preview planning route completed in explicit maskComposition mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'render_worker_mask_composition_preview_planning',
          maskCompositionResult,
        }
      }

      if (hasRenderColorExecutionRequest(payload)) {
        const colorExecutionResult = await runColorExecutionPipeline(buildColorExecutionInput(payload, { renderPreviewOnly: true }))
        return {
          summary: 'Milestone 15B render worker color preview planning route completed in explicit colorExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'render_worker_color_preview_execution',
          colorExecutionResult,
        }
      }

      if (hasRenderSmartCutTimelineExecutionRequest(payload)) {
        const smartCutTimelineExecutionResult = await runSmartCutTimelineExecutionPipeline(buildSmartCutTimelineExecutionInput(payload, { timelinePreviewOnly: true }))
        return {
          summary: 'Milestone 14 render worker timeline preview planning route completed in explicit smartCutTimelineExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'render_worker_smart_cut_timeline_preview_execution',
          smartCutTimelineExecutionResult,
        }
      }

      if (hasSpeechCaptionExecutionRequest(payload)) {
        const speechCaptionExecutionResult = await runSpeechCaptionExecutionPipeline(buildSpeechCaptionExecutionInput(payload, { captionOnly: true }))
        return {
          summary: 'Milestone 13 render worker caption execution route completed in explicit speechCaptionExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'render_worker_caption_execution',
          speechCaptionExecutionResult,
        }
      }

      if (hasCaptionFoundationRequest(payload)) {
        const captionFoundationResult = await runCaptionFoundation(buildCaptionFoundationInput(payload))
        return {
          summary: 'Milestone 7 render worker caption foundation route completed in explicit captionFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'render_worker_caption_foundation',
          captionFoundationResult,
        }
      }

      if (hasTimelineFoundationRequest(payload)) {
        const timelineFoundationResult = await runTimelineFoundation(buildTimelineFoundationInput(payload))
        return {
          summary: 'Milestone 8 render worker timeline foundation route completed in explicit timelineFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'render_worker_timeline_foundation',
          timelineFoundationResult,
        }
      }

      if (hasTrackBAgentToolRecipeRequest(payload)) {
        return buildTrackBAgentToolRecipeRouteOutput(payload)
      }

      return {
        summary: 'Dry-run only: future render worker will run Remotion, FFmpeg, libass, Hyperframe handoff, and OpenTimelineIO render inputs.',
        workerType: payload.workerType,
        executionMode: payload.executionMode,
        mockOnly: true,
        futureHandler: 'render_worker_placeholder',
      }
    case 'qa_worker':
      if (hasFinalRenderQARequest(payload)) {
        const finalRenderExecutionResult = await runFinalRenderExecutionPipeline(buildFinalRenderExecutionInput(payload, { qaOnly: true }))
        return {
          summary: 'Milestone 16A QA worker final render/export QA route completed in explicit finalRenderQA mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'qa_worker_final_render_export_qa',
          finalRenderExecutionResult,
        }
      }

      if (hasEnhancementSlowMotionQARequest(payload)) {
        const enhancementSlowMotionResult = await runEnhancementSlowMotionPipeline(buildEnhancementSlowMotionInput(payload, { qaOnly: true }))
        return {
          summary: 'Milestone 15D QA worker enhancement/slow-motion QA route completed in explicit enhancementSlowMotionQA mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'qa_worker_enhancement_slowmotion_qa',
          enhancementSlowMotionResult,
        }
      }

      if (hasMaskCompositionQARequest(payload)) {
        const maskCompositionResult = await runMaskCompositionPipeline(buildMaskCompositionInput(payload, { qaOnly: true }))
        return {
          summary: 'Milestone 15C QA worker mask/text QA route completed in explicit maskCompositionQA mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'qa_worker_mask_composition_qa',
          maskCompositionResult,
        }
      }

      if (hasColorExecutionQARequest(payload)) {
        const colorExecutionResult = await runColorExecutionPipeline(buildColorExecutionInput(payload, { qaOnly: true }))
        return {
          summary: 'Milestone 15B QA worker color execution QA route completed in explicit colorExecutionQA mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'qa_worker_color_execution_qa',
          colorExecutionResult,
        }
      }

      if (hasAudioExecutionQARequest(payload)) {
        const audioExecutionResult = await runAudioExecutionPipeline(buildAudioExecutionInput(payload, { qaOnly: true }))
        return {
          summary: 'Milestone 15A QA worker audio execution QA route completed in explicit audioExecutionQA mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'qa_worker_audio_execution_qa',
          audioExecutionResult,
        }
      }

      if (hasSpeechCaptionExecutionRequest(payload)) {
        const speechCaptionExecutionResult = await runSpeechCaptionExecutionPipeline(buildSpeechCaptionExecutionInput(payload, { captionOnly: true }))
        return {
          summary: 'Milestone 13 QA worker caption execution route completed in explicit speechCaptionExecution mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'qa_worker_caption_execution',
          speechCaptionExecutionResult,
        }
      }

      if (hasAudioFoundationRequest(payload)) {
        const audioFoundationResult = await runAudioFoundation(buildAudioFoundationInput(payload))
        return {
          summary: 'Milestone 9 QA worker audio QA foundation route completed in explicit audioFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'qa_worker_audio_foundation',
          audioFoundationResult,
        }
      }

      if (hasCaptionFoundationRequest(payload)) {
        const captionFoundationResult = await runCaptionFoundation(buildCaptionFoundationInput(payload))
        return {
          summary: 'Milestone 7 QA worker caption foundation route completed in explicit captionFoundation mode.',
          workerType: payload.workerType,
          executionMode: payload.executionMode,
          mockOnly: true,
          futureHandler: 'qa_worker_caption_foundation',
          captionFoundationResult,
        }
      }

      if (hasTrackBAgentToolRecipeRequest(payload)) {
        return buildTrackBAgentToolRecipeRouteOutput(payload)
      }

      return {
        summary: 'Dry-run only: future QA worker will run caption, audio, color, mask, render, export, and final delivery quality gates.',
        workerType: payload.workerType,
        executionMode: payload.executionMode,
        mockOnly: true,
        futureHandler: 'qa_worker_placeholder',
      }
    case 'tool_readiness_worker':
      if (hasTrackBAgentToolRecipeRequest(payload)) {
        return buildTrackBAgentToolRecipeRouteOutput(payload)
      }

      return {
        summary: 'Dry-run only: future tool readiness worker will check installed tool versions, imports, capabilities, and review status.',
        workerType: payload.workerType,
        executionMode: payload.executionMode,
        mockOnly: true,
        futureHandler: 'tool_readiness_worker_placeholder',
      }
  }
}

function hasTrackBAgentToolRecipeRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.trackBAgentToolRecipe
  return Boolean(request && typeof request === 'object')
}

async function buildTrackBAgentToolRecipeRouteOutput(payload: ProductionWorkerJobPayload): Promise<ProductionWorkerRouteOutput> {
  const request = payload.metadata?.trackBAgentToolRecipe as Record<string, unknown>
  const toolId = stringValue(request.toolId) ?? payload.requestedToolIds[0] ?? 'unknown_tool'
  const action = stringValue(request.action) ?? payload.requestedRecipeIds[0] ?? 'unknown_action'
  const routeClass = stringValue(request.routeClass) ?? 'trackb_agent_tool_recipe'
  const handler = resolveTrackBAgentToolRecipeHandler(toolId, action, routeClass)
  if (toolId === 'sharp' && routeClass === 'image_asset_prepare_bounded_rehearsal') {
    return runSharpImageAssetPrepareBoundedRehearsal(payload, request, action, routeClass, handler)
  }
  if (toolId === 'duckdb' && routeClass === 'structured_artifact_query_bounded_rehearsal') {
    return runPythonStructuredToolBoundedRehearsal({
      payload,
      request,
      toolId: 'duckdb',
      action,
      routeClass,
      handler,
      script: DUCKDB_BOUNDED_REHEARSAL_SCRIPT,
    })
  }
  if (toolId === 'polars' && routeClass === 'dataframe_transform_bounded_rehearsal') {
    return runPythonStructuredToolBoundedRehearsal({
      payload,
      request,
      toolId: 'polars',
      action,
      routeClass,
      handler,
      script: POLARS_BOUNDED_REHEARSAL_SCRIPT,
    })
  }
  if (toolId === 'opentimelineio' && routeClass === 'timeline_serialize_bounded_rehearsal') {
    return runPythonStructuredToolBoundedRehearsal({
      payload,
      request,
      toolId: 'opentimelineio',
      action,
      routeClass,
      handler,
      script: OPENTIMELINEIO_BOUNDED_REHEARSAL_SCRIPT,
    })
  }
  if (toolId === 'opencolorio' && routeClass === 'color_config_bounded_rehearsal') {
    return runPythonStructuredToolBoundedRehearsal({
      payload,
      request,
      toolId: 'opencolorio',
      action,
      routeClass,
      handler,
      script: OPENCOLORIO_BOUNDED_REHEARSAL_SCRIPT,
    })
  }
  if (toolId === 'openimageio' && routeClass === 'imagebuf_metadata_bounded_rehearsal') {
    return runPythonStructuredToolBoundedRehearsal({
      payload,
      request,
      toolId: 'openimageio',
      action,
      routeClass,
      handler,
      script: OPENIMAGEIO_BOUNDED_REHEARSAL_SCRIPT,
    })
  }

  return {
    summary: `Track B agent worker recipe selected for ${toolId}:${action} through ${handler.futureHandler} without running real tool binaries or media processing.`,
    workerType: payload.workerType,
    executionMode: payload.executionMode,
    mockOnly: true,
    futureHandler: handler.futureHandler,
    trackBAgentToolRecipeResult: {
      toolId,
      action,
      routeClass,
      handlerKind: handler.handlerKind,
      namedHandlerReady: handler.namedHandlerReady,
      dryRunOnly: true,
      productRuntimeExecution: false,
      realToolBinaryExecution: false,
      mediaProcessing: false,
      sourceReferenceCount: payload.storageReferenceIds.length,
      plannedHandler: stringValue(request.plannedHandler),
      notes: Array.isArray(request.notes) ? request.notes.filter(isStringValue) : [],
    },
  }
}

function resolveTrackBAgentToolRecipeHandler(
  toolId: string,
  action: string,
  routeClass: string,
): {
  futureHandler: string
  handlerKind: 'explicit_trackb_agent_worker_handler' | 'unmapped_trackb_agent_recipe_handler'
  namedHandlerReady: boolean
} {
  if (toolId === 'sharp' && routeClass === 'image_asset_prepare_dry_run') {
    return {
      futureHandler: 'render_worker_sharp_image_asset_prepare_dry_run',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  if (toolId === 'sharp' && routeClass === 'image_asset_prepare_bounded_rehearsal') {
    return {
      futureHandler: 'render_worker_sharp_image_asset_prepare_bounded_rehearsal',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  if (toolId === 'duckdb' && routeClass === 'structured_artifact_query_dry_run') {
    return {
      futureHandler: 'cpu_analysis_worker_duckdb_structured_artifact_query_dry_run',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  if (toolId === 'duckdb' && routeClass === 'structured_artifact_query_bounded_rehearsal') {
    return {
      futureHandler: 'cpu_analysis_worker_duckdb_structured_artifact_query_bounded_rehearsal',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  if (toolId === 'polars' && routeClass === 'dataframe_transform_dry_run') {
    return {
      futureHandler: 'cpu_analysis_worker_polars_dataframe_transform_dry_run',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  if (toolId === 'polars' && routeClass === 'dataframe_transform_bounded_rehearsal') {
    return {
      futureHandler: 'cpu_analysis_worker_polars_dataframe_transform_bounded_rehearsal',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  if (toolId === 'opentimelineio' && routeClass === 'timeline_serialize_bounded_rehearsal') {
    return {
      futureHandler: 'cpu_analysis_worker_opentimelineio_timeline_serialize_bounded_rehearsal',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  if (toolId === 'opencolorio' && routeClass === 'color_config_bounded_rehearsal') {
    return {
      futureHandler: 'cpu_analysis_worker_opencolorio_color_config_bounded_rehearsal',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  if (toolId === 'openimageio' && routeClass === 'imagebuf_metadata_bounded_rehearsal') {
    return {
      futureHandler: 'cpu_analysis_worker_openimageio_imagebuf_metadata_bounded_rehearsal',
      handlerKind: 'explicit_trackb_agent_worker_handler',
      namedHandlerReady: true,
    }
  }

  return {
    futureHandler: `trackb_agent_${toolId}_${action}_recipe_dry_run`,
    handlerKind: 'unmapped_trackb_agent_recipe_handler',
    namedHandlerReady: false,
  }
}

async function runSharpImageAssetPrepareBoundedRehearsal(
  payload: ProductionWorkerJobPayload,
  request: Record<string, unknown>,
  action: string,
  routeClass: string,
  handler: ReturnType<typeof resolveTrackBAgentToolRecipeHandler>,
): Promise<ProductionWorkerRouteOutput> {
  try {
    const sharpModule = await import('sharp')
    const sharp = sharpModule.default
    const created = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: { r: 12, g: 108, b: 242, alpha: 1 },
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true })
    const transformed = await sharp(created.data)
      .resize(1, 1, { fit: 'fill' })
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true })
    const transformedMetadata = await sharp(transformed.data).metadata()

    return {
      summary: 'Track B agent Sharp bounded execution rehearsal completed with synthetic in-memory image data only; no user media or artifact file was processed.',
      workerType: payload.workerType,
      executionMode: payload.executionMode,
      mockOnly: false,
      futureHandler: handler.futureHandler,
      trackBAgentToolRecipeResult: {
        status: 'completed',
        toolId: 'sharp',
        action,
        routeClass,
        handlerKind: handler.handlerKind,
        namedHandlerReady: handler.namedHandlerReady,
        dryRunOnly: false,
        rehearsalOnly: true,
        productRuntimeExecution: false,
        realToolBinaryExecution: true,
        mediaProcessing: false,
        userMediaProcessed: false,
        syntheticInputOnly: true,
        artifactFileWritten: false,
        publicArtifactCreated: false,
        sourceReferenceCount: payload.storageReferenceIds.length,
        plannedHandler: stringValue(request.plannedHandler),
        sharpVersions: {
          sharp: sharp.versions.sharp,
          vips: sharp.versions.vips,
        },
        syntheticInput: {
          format: created.info.format,
          width: created.info.width,
          height: created.info.height,
          byteLength: created.data.byteLength,
          sha256: sha256Hex(created.data),
        },
        syntheticOutput: {
          format: transformed.info.format,
          width: transformed.info.width,
          height: transformed.info.height,
          metadataFormat: transformedMetadata.format,
          byteLength: transformed.data.byteLength,
          sha256: sha256Hex(transformed.data),
        },
        cleanup: {
          temporaryFilesCreated: 0,
          inMemoryBuffersOnly: true,
          removedBeforeReturn: true,
        },
        notes: [
          'Bounded execution rehearsal is payment-independent and non-billable.',
          'This proof uses synthetic in-memory pixels only; it does not read user media, write artifacts, call Supabase/GCS, enable beta, or approve production use.',
        ],
      },
    }
  } catch (error) {
    return {
      summary: 'Track B agent Sharp bounded execution rehearsal was blocked before proof completion.',
      workerType: payload.workerType,
      executionMode: payload.executionMode,
      mockOnly: true,
      futureHandler: handler.futureHandler,
      trackBAgentToolRecipeResult: {
        status: 'blocked',
        toolId: 'sharp',
        action,
        routeClass,
        handlerKind: handler.handlerKind,
        namedHandlerReady: handler.namedHandlerReady,
        dryRunOnly: false,
        rehearsalOnly: true,
        productRuntimeExecution: false,
        realToolBinaryExecution: false,
        mediaProcessing: false,
        userMediaProcessed: false,
        syntheticInputOnly: true,
        artifactFileWritten: false,
        publicArtifactCreated: false,
        blockedReason: error instanceof Error ? error.message : 'Unknown Sharp bounded execution rehearsal error.',
        notes: [
          'Sharp bounded execution rehearsal failed closed.',
          'No user media, artifact file, Supabase/GCS write, beta, or production scope was attempted.',
        ],
      },
    }
  }
}

function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

const DUCKDB_BOUNDED_REHEARSAL_SCRIPT = String.raw`
import duckdb
import json

conn = duckdb.connect(database=':memory:')
conn.execute('create table synthetic_events(tool varchar, value integer)')
conn.execute("insert into synthetic_events values ('duckdb', 7), ('duckdb', 35)")
rows = conn.execute('select tool, sum(value) as total_value, count(*) as row_count from synthetic_events group by tool').fetchall()
print(json.dumps({
  'version': duckdb.__version__,
  'database': ':memory:',
  'query': 'synthetic_grouped_sum',
  'columns': ['tool', 'total_value', 'row_count'],
  'rows': rows,
  'row_count': len(rows),
  'total_value': rows[0][1],
}))
`

const POLARS_BOUNDED_REHEARSAL_SCRIPT = String.raw`
import polars as pl
import json

frame = pl.DataFrame({
  'tool': ['polars', 'polars', 'polars'],
  'frames': [12, 18, 30],
})
result = frame.with_columns((pl.col('frames') * 2).alias('weighted_frames')).select([
  pl.col('frames').sum().alias('frames_sum'),
  pl.col('weighted_frames').sum().alias('weighted_sum'),
])
print(json.dumps({
  'version': pl.__version__,
  'shape': list(frame.shape),
  'columns': frame.columns,
  'operation': 'synthetic_dataframe_transform',
  'frames_sum': int(result.item(0, 'frames_sum')),
  'weighted_sum': int(result.item(0, 'weighted_sum')),
}))
`

const OPENTIMELINEIO_BOUNDED_REHEARSAL_SCRIPT = String.raw`
import json
import opentimelineio as otio

rate = 24
source_range = otio.opentime.TimeRange(
  start_time=otio.opentime.RationalTime(0, rate),
  duration=otio.opentime.RationalTime(48, rate),
)
clip = otio.schema.Clip(
  name='synthetic_clip',
  media_reference=otio.schema.MissingReference(name='synthetic_missing_reference'),
  source_range=source_range,
)
track = otio.schema.Track(name='synthetic_video_track', kind=otio.schema.TrackKind.Video)
track.append(clip)
timeline = otio.schema.Timeline(name='synthetic_trackb_timeline', tracks=[track])
serialized = otio.adapters.write_to_string(timeline, adapter_name='otio_json')
roundtrip = otio.adapters.read_from_string(serialized, adapter_name='otio_json')
print(json.dumps({
  'version': otio.__version__,
  'timeline_name': roundtrip.name,
  'track_count': len(roundtrip.tracks),
  'clip_count': sum(len(track) for track in roundtrip.tracks),
  'duration_frames': int(roundtrip.duration().value),
  'serialized_length': len(serialized),
  'media_reference_kind': roundtrip.tracks[0][0].media_reference.schema_name(),
}))
`

const OPENCOLORIO_BOUNDED_REHEARSAL_SCRIPT = String.raw`
import json
import PyOpenColorIO as ocio

config = ocio.Config.CreateRaw()
config.setName('synthetic_trackb_raw_config')
roles = [[role, color_space] for role, color_space in config.getRoles()]
color_spaces = [color_space.getName() for color_space in config.getColorSpaces()]
processor = config.getProcessor('raw', 'raw')
cpu_processor = processor.getDefaultCPUProcessor()
rgba = [0.1, 0.2, 0.3, 1.0]
result = cpu_processor.applyRGBA(rgba[:])
print(json.dumps({
  'version': ocio.__version__,
  'config_name': config.getName(),
  'roles': roles,
  'color_spaces': color_spaces,
  'processor_created': processor is not None,
  'input_rgba': rgba,
  'output_rgba': [round(value, 6) for value in result],
}))
`

const OPENIMAGEIO_BOUNDED_REHEARSAL_SCRIPT = String.raw`
import json
import OpenImageIO as oiio

spec = oiio.ImageSpec(2, 2, 3, oiio.UINT8)
buf = oiio.ImageBuf(spec)
buf.setpixel(0, 0, (255, 128, 0))
pixel = [round(float(value), 6) for value in buf.getpixel(0, 0)]
print(json.dumps({
  'version': oiio.VERSION_STRING,
  'spec_width': spec.width,
  'spec_height': spec.height,
  'nchannels': spec.nchannels,
  'format': str(spec.format),
  'pixel': pixel,
  'initialized': bool(buf.initialized),
}))
`

type PythonStructuredRehearsalToolId =
  | 'duckdb'
  | 'polars'
  | 'opentimelineio'
  | 'opencolorio'
  | 'openimageio'

function runPythonStructuredToolBoundedRehearsal(input: {
  payload: ProductionWorkerJobPayload
  request: Record<string, unknown>
  toolId: PythonStructuredRehearsalToolId
  action: string
  routeClass: string
  handler: ReturnType<typeof resolveTrackBAgentToolRecipeHandler>
  script: string
}): ProductionWorkerRouteOutput {
  const python = resolveBoundedRehearsalPython()
  if (!python) {
    return buildBlockedPythonStructuredToolRehearsal(input, 'Hydrated readiness Python is not available. Set REEDITPRO_READINESS_PYTHON_BIN or create .reeditpro-tool-readiness-python/bin/python.')
  }

  try {
    const output = execFileSync(python, ['-c', input.script], {
      encoding: 'utf8',
      timeout: 10_000,
      maxBuffer: 1024 * 512,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        PATH: process.env.PATH,
        PYTHONNOUSERSITE: '1',
      },
    })
    const proof = parsePythonProof(output)
    return {
      summary: `Track B agent ${input.toolId} bounded execution rehearsal completed with synthetic in-memory structured data only; no user media or artifact file was processed.`,
      workerType: input.payload.workerType,
      executionMode: input.payload.executionMode,
      mockOnly: false,
      futureHandler: input.handler.futureHandler,
      trackBAgentToolRecipeResult: {
        status: 'completed',
        toolId: input.toolId,
        action: input.action,
        routeClass: input.routeClass,
        handlerKind: input.handler.handlerKind,
        namedHandlerReady: input.handler.namedHandlerReady,
        dryRunOnly: false,
        rehearsalOnly: true,
        productRuntimeExecution: false,
        realToolBinaryExecution: true,
        mediaProcessing: false,
        userMediaProcessed: false,
        syntheticInputOnly: true,
        artifactFileWritten: false,
        publicArtifactCreated: false,
        sourceReferenceCount: input.payload.storageReferenceIds.length,
        plannedHandler: stringValue(input.request.plannedHandler),
        pythonRuntime: {
          source: process.env.REEDITPRO_READINESS_PYTHON_BIN ? 'env_REEDITPRO_READINESS_PYTHON_BIN' : 'local_readiness_venv',
          basename: python.split('/').pop(),
        },
        proof,
        cleanup: {
          temporaryFilesCreated: 0,
          inMemoryObjectsOnly: true,
          removedBeforeReturn: true,
        },
        notes: [
          'Bounded execution rehearsal is payment-independent and non-billable.',
          'This proof uses synthetic in-memory structured data only; it does not read user media, write artifacts, call Supabase/GCS, enable beta, or approve production use.',
        ],
      },
    }
  } catch (error) {
    const failed = error as { stderr?: string | Buffer, message?: string }
    return buildBlockedPythonStructuredToolRehearsal(
      input,
      cleanToolProcessDetail(failed.stderr) || cleanToolProcessDetail(failed.message) || `Unknown ${input.toolId} bounded execution rehearsal error.`,
    )
  }
}

function buildBlockedPythonStructuredToolRehearsal(
  input: {
    payload: ProductionWorkerJobPayload
    toolId: PythonStructuredRehearsalToolId
    action: string
    routeClass: string
    handler: ReturnType<typeof resolveTrackBAgentToolRecipeHandler>
  },
  blockedReason: string,
): ProductionWorkerRouteOutput {
  return {
    summary: `Track B agent ${input.toolId} bounded execution rehearsal was blocked before proof completion.`,
    workerType: input.payload.workerType,
    executionMode: input.payload.executionMode,
    mockOnly: true,
    futureHandler: input.handler.futureHandler,
    trackBAgentToolRecipeResult: {
      status: 'blocked',
      toolId: input.toolId,
      action: input.action,
      routeClass: input.routeClass,
      handlerKind: input.handler.handlerKind,
      namedHandlerReady: input.handler.namedHandlerReady,
      dryRunOnly: false,
      rehearsalOnly: true,
      productRuntimeExecution: false,
      realToolBinaryExecution: false,
      mediaProcessing: false,
      userMediaProcessed: false,
      syntheticInputOnly: true,
      artifactFileWritten: false,
      publicArtifactCreated: false,
      blockedReason,
      notes: [
        `${input.toolId} bounded execution rehearsal failed closed.`,
        'No user media, artifact file, Supabase/GCS write, beta, or production scope was attempted.',
      ],
    },
  }
}

function resolveBoundedRehearsalPython(): string | undefined {
  const candidates = [
    process.env.REEDITPRO_READINESS_PYTHON_BIN,
    '.reeditpro-tool-readiness-python/bin/python',
  ].filter((candidate): candidate is string => Boolean(candidate))
  return candidates.find((candidate) => existsSync(candidate))
}

function parsePythonProof(output: string): unknown {
  const line = output
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .at(-1)
  if (!line) {
    throw new Error('Python rehearsal produced no JSON proof output.')
  }
  return JSON.parse(line)
}

function cleanToolProcessDetail(value: string | Buffer | undefined): string {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' | ')
    .slice(0, 500)
}

function hasFinalRenderExecutionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.finalRenderExecution
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isFinalRenderExecutionMode(mode)
}

function hasFinalRenderQARequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.finalRenderQA
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isFinalRenderExecutionMode(mode)
}

function buildFinalRenderExecutionInput(
  payload: ProductionWorkerJobPayload,
  options: { qaOnly?: boolean } = {},
) {
  const request = (options.qaOnly ? payload.metadata?.finalRenderQA : payload.metadata?.finalRenderExecution) as Record<string, unknown>
  const mode = request.mode as FinalRenderExecutionMode
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    timelineManifestId: stringValue(request.timelineManifestId),
    timelineManifest: typeof request.timelineManifest === 'object' && request.timelineManifest ? request.timelineManifest as never : undefined,
    renderManifestId: stringValue(request.renderManifestId),
    renderManifest: typeof request.renderManifest === 'object' && request.renderManifest ? request.renderManifest as never : undefined,
    sourceVideoArtifactIds: Array.isArray(request.sourceVideoArtifactIds) ? request.sourceVideoArtifactIds.filter(isStringValue) : payload.storageReferenceIds.length > 0 ? [payload.storageReferenceIds[0]] : undefined,
    proxyVideoArtifactIds: Array.isArray(request.proxyVideoArtifactIds) ? request.proxyVideoArtifactIds.filter(isStringValue) : undefined,
    captionArtifactIds: Array.isArray(request.captionArtifactIds) ? request.captionArtifactIds.filter(isStringValue) : undefined,
    audioArtifactIds: Array.isArray(request.audioArtifactIds) ? request.audioArtifactIds.filter(isStringValue) : undefined,
    colorArtifactIds: Array.isArray(request.colorArtifactIds) ? request.colorArtifactIds.filter(isStringValue) : undefined,
    maskArtifactIds: Array.isArray(request.maskArtifactIds) ? request.maskArtifactIds.filter(isStringValue) : undefined,
    enhancementArtifactIds: Array.isArray(request.enhancementArtifactIds) ? request.enhancementArtifactIds.filter(isStringValue) : undefined,
    slowMotionArtifactIds: Array.isArray(request.slowMotionArtifactIds) ? request.slowMotionArtifactIds.filter(isStringValue) : undefined,
    qaGateResultIds: Array.isArray(request.qaGateResultIds) ? request.qaGateResultIds.filter(isStringValue) : undefined,
    upstreamQaResults: Array.isArray(request.upstreamQaResults) ? request.upstreamQaResults as never[] : undefined,
    sourceLocalPaths: Array.isArray(request.sourceLocalPaths) ? request.sourceLocalPaths.filter(isStringValue) : undefined,
    proxyLocalPaths: Array.isArray(request.proxyLocalPaths) ? request.proxyLocalPaths.filter(isStringValue) : undefined,
    captionLocalPaths: Array.isArray(request.captionLocalPaths) ? request.captionLocalPaths.filter(isStringValue) : undefined,
    audioLocalPaths: Array.isArray(request.audioLocalPaths) ? request.audioLocalPaths.filter(isStringValue) : undefined,
    outputDirectory: stringValue(request.outputDirectory),
    renderEngine: isFinalRenderEngine(request.renderEngine) ? request.renderEngine : 'hybrid',
    renderMode: isFinalRenderMode(request.renderMode) ? request.renderMode : payload.renderMode === 'final_export' ? 'final_export' : 'preview',
    canvas: parseRenderCanvas(request.canvas),
    fps: numberValue(request.fps) ?? 30,
    durationSeconds: numberValue(request.durationSeconds) ?? 8,
    exportSettings: parseRenderExportSettings(request.exportSettings),
    enableLocalDevRender: request.enableLocalDevRender === true,
    enableRemotionLocalRender: request.enableRemotionLocalRender === true,
    enableCaptionBurnIn: request.enableCaptionBurnIn === true,
    allowRevideo: request.allowRevideo === true,
    timeoutMs: numberValue(request.timeoutMs),
    readinessReport: typeof request.readinessReport === 'object' && request.readinessReport ? request.readinessReport as never : undefined,
    rawPrompt: request.rawPrompt,
    promptText: request.promptText,
    rawUserChat: request.rawUserChat,
    signedUrl: request.signedUrl,
    serviceRoleKey: request.serviceRoleKey,
    providerApiKey: request.providerApiKey,
    secretValue: request.secretValue,
    arbitraryFfmpegArgs: Array.isArray(request.arbitraryFfmpegArgs) ? request.arbitraryFfmpegArgs.filter(isStringValue) : undefined,
    arbitraryRemotionArgs: Array.isArray(request.arbitraryRemotionArgs) ? request.arbitraryRemotionArgs.filter(isStringValue) : undefined,
    arbitraryLibassArgs: Array.isArray(request.arbitraryLibassArgs) ? request.arbitraryLibassArgs.filter(isStringValue) : undefined,
  }
}

function isFinalRenderExecutionMode(value: unknown): value is FinalRenderExecutionMode {
  return value === 'dry_run' ||
    value === 'local_dev' ||
    value === 'container_ready' ||
    value === 'production_blocked' ||
    value === 'production_ready'
}

function isFinalRenderEngine(value: unknown): value is FinalRenderEngine {
  return value === 'remotion' || value === 'ffmpeg' || value === 'libass' || value === 'hybrid'
}

function isFinalRenderMode(value: unknown): value is FinalRenderMode {
  return value === 'preview' || value === 'final_export' || value === 'command_plan_only'
}

function parseRenderCanvas(value: unknown): { width: number; height: number; aspectRatio: string; backgroundColor?: string } {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return {
      width: numberValue(record.width) ?? 1920,
      height: numberValue(record.height) ?? 1080,
      aspectRatio: stringValue(record.aspectRatio) ?? '16:9',
      backgroundColor: stringValue(record.backgroundColor),
    }
  }
  return { width: 1920, height: 1080, aspectRatio: '16:9' }
}

function parseRenderExportSettings(value: unknown): { container: string; videoCodec: string; audioCodec: string; bitrate?: string; crf?: number; pixelFormat?: string } {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    container: stringValue(record.container) ?? 'mp4',
    videoCodec: stringValue(record.videoCodec) ?? 'h264',
    audioCodec: stringValue(record.audioCodec) ?? 'aac',
    bitrate: stringValue(record.bitrate),
    crf: numberValue(record.crf),
    pixelFormat: stringValue(record.pixelFormat) ?? 'yuv420p',
  }
}

function hasEnhancementSlowMotionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.enhancementSlowMotion
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isEnhancementSlowMotionExecutionMode(mode)
}

function hasCpuEnhancementSlowMotionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.enhancementSlowMotion
  if (!request || typeof request !== 'object') return false
  const record = request as Record<string, unknown>
  return record.mode === 'dry_run' && (record.qaOnly === true || record.analysisOnly === true)
}

function hasEnhancementSlowMotionQARequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.enhancementSlowMotionQA
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isEnhancementSlowMotionExecutionMode(mode)
}

function buildEnhancementSlowMotionInput(
  payload: ProductionWorkerJobPayload,
  options: { qaOnly?: boolean } = {},
) {
  const request = (options.qaOnly ? payload.metadata?.enhancementSlowMotionQA : payload.metadata?.enhancementSlowMotion) as Record<string, unknown>
  const mode = request.mode as EnhancementSlowMotionExecutionMode
  const enhancement = typeof request.enhancement === 'object' && request.enhancement
    ? request.enhancement as Record<string, unknown>
    : request
  const slowMotion = typeof request.slowMotion === 'object' && request.slowMotion
    ? request.slowMotion as Record<string, unknown>
    : request
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    mediaAnalysisReportId: payload.mediaAnalysisReportId,
    sourceVideoArtifactId: stringValue(request.sourceVideoArtifactId) ?? payload.storageReferenceIds[0],
    proxyVideoArtifactId: stringValue(request.proxyVideoArtifactId),
    sourceImageArtifactId: stringValue(request.sourceImageArtifactId),
    representativeFrameArtifactIds: Array.isArray(request.representativeFrameArtifactIds) ? request.representativeFrameArtifactIds.filter(isStringValue) : undefined,
    sourceVideoLocalPath: stringValue(request.sourceVideoLocalPath),
    proxyVideoLocalPath: stringValue(request.proxyVideoLocalPath),
    sourceImageLocalPath: stringValue(request.sourceImageLocalPath),
    representativeFrameLocalPaths: Array.isArray(request.representativeFrameLocalPaths) ? request.representativeFrameLocalPaths.filter(isStringValue) : undefined,
    outputDirectory: stringValue(request.outputDirectory),
    modelWeightManifestIds: Array.isArray(request.modelWeightManifestIds) ? request.modelWeightManifestIds.filter(isStringValue) : undefined,
    readinessReport: typeof request.readinessReport === 'object' && request.readinessReport ? request.readinessReport as never : undefined,
    buildEnhancement: request.buildEnhancement !== false,
    buildSlowMotion: request.buildSlowMotion !== false,
    enhancement: {
      enhancementIntent: isEnhancementIntent(enhancement.enhancementIntent) ? enhancement.enhancementIntent : 'improve_low_resolution_clip',
      targetScale: numberValue(enhancement.targetScale),
      targetResolution: parseResolution(enhancement.targetResolution),
      sourceResolution: parseResolution(enhancement.sourceResolution),
      sourceQualityIssueDetected: enhancement.sourceQualityIssueDetected === true,
      approvedEnhancementReason: stringValue(enhancement.approvedEnhancementReason),
      sampleOnly: enhancement.sampleOnly !== false,
      selectedClipRanges: Array.isArray(enhancement.selectedClipRanges) ? enhancement.selectedClipRanges as never[] : undefined,
      sampleCount: numberValue(enhancement.sampleCount),
      realEsrganModelLocalPath: stringValue(enhancement.realEsrganModelLocalPath),
      enableModelEnhancementExecution: enhancement.enableModelEnhancementExecution === true,
      enableFfmpegFallbackPreview: enhancement.enableFfmpegFallbackPreview === true,
      allowModelDownload: enhancement.allowModelDownload === true || request.allowModelDownload === true,
      allowFinalRender: enhancement.allowFinalRender === true || request.allowFinalRender === true,
      ffmpegBin: stringValue(enhancement.ffmpegBin) ?? stringValue(request.ffmpegBin),
      timeoutMs: numberValue(enhancement.timeoutMs) ?? numberValue(request.timeoutMs),
      rawPrompt: enhancement.rawPrompt ?? request.rawPrompt,
      promptText: enhancement.promptText ?? request.promptText,
      rawUserChat: enhancement.rawUserChat ?? request.rawUserChat,
      signedUrl: enhancement.signedUrl ?? request.signedUrl,
      serviceRoleKey: enhancement.serviceRoleKey ?? request.serviceRoleKey,
      providerApiKey: enhancement.providerApiKey ?? request.providerApiKey,
      secretValue: enhancement.secretValue ?? request.secretValue,
      arbitraryModelArgs: Array.isArray(enhancement.arbitraryModelArgs) ? enhancement.arbitraryModelArgs.filter(isStringValue) : Array.isArray(request.arbitraryModelArgs) ? request.arbitraryModelArgs.filter(isStringValue) : undefined,
      arbitraryFfmpegArgs: Array.isArray(enhancement.arbitraryFfmpegArgs) ? enhancement.arbitraryFfmpegArgs.filter(isStringValue) : Array.isArray(request.arbitraryFfmpegArgs) ? request.arbitraryFfmpegArgs.filter(isStringValue) : undefined,
    },
    slowMotion: {
      selectedClipRanges: Array.isArray(slowMotion.selectedClipRanges) ? slowMotion.selectedClipRanges as never[] : [{ startSeconds: 0, endSeconds: 2, reason: 'M15D router default selected sample clip.' }],
      slowMotionFactor: numberValue(slowMotion.slowMotionFactor) ?? 2,
      interpolationMode: isSlowMotionInterpolationMode(slowMotion.interpolationMode) ? slowMotion.interpolationMode : 'film',
      filmModelLocalPath: stringValue(slowMotion.filmModelLocalPath),
      enableModelSlowMotionExecution: slowMotion.enableModelSlowMotionExecution === true,
      enableFfmpegFallbackPreview: slowMotion.enableFfmpegFallbackPreview === true,
      allowModelDownload: slowMotion.allowModelDownload === true || request.allowModelDownload === true,
      allowFinalRender: slowMotion.allowFinalRender === true || request.allowFinalRender === true,
      ffmpegBin: stringValue(slowMotion.ffmpegBin) ?? stringValue(request.ffmpegBin),
      timeoutMs: numberValue(slowMotion.timeoutMs) ?? numberValue(request.timeoutMs),
      rawPrompt: slowMotion.rawPrompt ?? request.rawPrompt,
      promptText: slowMotion.promptText ?? request.promptText,
      rawUserChat: slowMotion.rawUserChat ?? request.rawUserChat,
      signedUrl: slowMotion.signedUrl ?? request.signedUrl,
      serviceRoleKey: slowMotion.serviceRoleKey ?? request.serviceRoleKey,
      providerApiKey: slowMotion.providerApiKey ?? request.providerApiKey,
      secretValue: slowMotion.secretValue ?? request.secretValue,
      arbitraryModelArgs: Array.isArray(slowMotion.arbitraryModelArgs) ? slowMotion.arbitraryModelArgs.filter(isStringValue) : Array.isArray(request.arbitraryModelArgs) ? request.arbitraryModelArgs.filter(isStringValue) : undefined,
      arbitraryFfmpegArgs: Array.isArray(slowMotion.arbitraryFfmpegArgs) ? slowMotion.arbitraryFfmpegArgs.filter(isStringValue) : Array.isArray(request.arbitraryFfmpegArgs) ? request.arbitraryFfmpegArgs.filter(isStringValue) : undefined,
    },
  }
}

function isEnhancementSlowMotionExecutionMode(value: unknown): value is EnhancementSlowMotionExecutionMode {
  return value === 'dry_run' ||
    value === 'local_dev' ||
    value === 'container_ready' ||
    value === 'production_blocked' ||
    value === 'production_ready'
}

function isEnhancementIntent(value: unknown): value is EnhancementIntent {
  return value === 'upscale_image' ||
    value === 'restore_video_frames' ||
    value === 'enhance_thumbnail' ||
    value === 'improve_low_resolution_clip' ||
    value === 'custom'
}

function isSlowMotionInterpolationMode(value: unknown): value is SlowMotionInterpolationMode {
  return value === 'film' ||
    value === 'ffmpeg_native_speed' ||
    value === 'planning_only'
}

function parseResolution(value: unknown): { width: number; height: number } | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const width = numberValue(record.width)
  const height = numberValue(record.height)
  return width && height ? { width, height } : undefined
}

function hasMaskCompositionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.maskComposition
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isMaskExecutionMode(mode)
}

function hasCpuMaskCompositionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.maskComposition
  if (!request || typeof request !== 'object') return false
  const record = request as Record<string, unknown>
  return record.mode === 'dry_run' && (record.qaOnly === true || record.refinementOnly === true)
}

function hasRenderMaskCompositionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.maskComposition
  if (!request || typeof request !== 'object') return false
  const record = request as Record<string, unknown>
  const mode = record.mode
  return (mode === 'dry_run' || mode === 'local_dev' || mode === 'container_ready') &&
    (record.enableMaskPreview === true || typeof record.textBehindSubject === 'object')
}

function hasMaskCompositionQARequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.maskCompositionQA
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isMaskExecutionMode(mode)
}

function buildMaskCompositionInput(
  payload: ProductionWorkerJobPayload,
  options: { qaOnly?: boolean; renderPreviewOnly?: boolean } = {},
) {
  const request = (options.qaOnly ? payload.metadata?.maskCompositionQA : payload.metadata?.maskComposition) as Record<string, unknown>
  const mode = request.mode as MaskExecutionMode
  const textBehindSubject = typeof request.textBehindSubject === 'object' && request.textBehindSubject
    ? request.textBehindSubject as Record<string, unknown>
    : undefined
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    mediaAnalysisReportId: payload.mediaAnalysisReportId,
    sourceImageArtifactId: stringValue(request.sourceImageArtifactId),
    sourceVideoArtifactId: stringValue(request.sourceVideoArtifactId) ?? payload.storageReferenceIds[0],
    proxyVideoArtifactId: stringValue(request.proxyVideoArtifactId),
    representativeFrameArtifactIds: Array.isArray(request.representativeFrameArtifactIds) ? request.representativeFrameArtifactIds.filter(isStringValue) : undefined,
    sourceImageLocalPath: stringValue(request.sourceImageLocalPath),
    sourceVideoLocalPath: stringValue(request.sourceVideoLocalPath),
    proxyVideoLocalPath: stringValue(request.proxyVideoLocalPath),
    representativeFrameLocalPaths: Array.isArray(request.representativeFrameLocalPaths) ? request.representativeFrameLocalPaths.filter(isStringValue) : undefined,
    outputDirectory: stringValue(request.outputDirectory),
    maskIntent: isMaskIntent(request.maskIntent) ? request.maskIntent : 'background_removal_image',
    subjectSelection: parseMaskSubjectSelection(request.subjectSelection),
    selectedPrimaryTool: isMaskToolId(request.selectedPrimaryTool) ? request.selectedPrimaryTool : undefined,
    fallbackTools: Array.isArray(request.fallbackTools) ? request.fallbackTools.filter(isMaskToolId) : undefined,
    modelWeightManifestIds: Array.isArray(request.modelWeightManifestIds) ? request.modelWeightManifestIds.filter(isStringValue) : undefined,
    modelLocalPaths: Array.isArray(request.modelLocalPaths) ? request.modelLocalPaths.filter(isStringValue) : undefined,
    birefnetModelLocalPath: stringValue(request.birefnetModelLocalPath),
    sam2CheckpointLocalPath: stringValue(request.sam2CheckpointLocalPath),
    maskConfidenceHint: numberValue(request.maskConfidenceHint),
    motionRequiresTracking: request.motionRequiresTracking === true,
    frameSamplingMaxFrames: numberValue(request.frameSamplingMaxFrames),
    textBehindSubject: textBehindSubject ? {
      mode,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
      approvedSnapshotId: payload.approvedSnapshotId,
      toolExecutionPlanId: payload.toolExecutionPlanId,
      idempotencyKey: payload.idempotencyKey,
      foregroundMaskArtifactId: stringValue(textBehindSubject.foregroundMaskArtifactId),
      maskSequenceArtifactId: stringValue(textBehindSubject.maskSequenceArtifactId),
      sourceVideoArtifactId: stringValue(textBehindSubject.sourceVideoArtifactId) ?? stringValue(request.sourceVideoArtifactId),
      proxyVideoArtifactId: stringValue(textBehindSubject.proxyVideoArtifactId) ?? stringValue(request.proxyVideoArtifactId),
      textContent: stringValue(textBehindSubject.textContent) ?? '',
      textStylePreset: isTextStylePreset(textBehindSubject.textStylePreset) ? textBehindSubject.textStylePreset : 'clean_title',
      placementPolicy: isTextPlacementPolicy(textBehindSubject.placementPolicy) ? textBehindSubject.placementPolicy : 'behind_subject_center',
      motionPolicy: isTextMotionPolicy(textBehindSubject.motionPolicy) ? textBehindSubject.motionPolicy : undefined,
      durationSeconds: numberValue(textBehindSubject.durationSeconds),
      safeZones: Array.isArray(textBehindSubject.safeZones) ? textBehindSubject.safeZones as never[] : undefined,
      outputDirectory: stringValue(textBehindSubject.outputDirectory) ?? stringValue(request.outputDirectory),
      maskConfidence: numberValue(textBehindSubject.maskConfidence) ?? numberValue(request.maskConfidenceHint),
      enablePreview: options.renderPreviewOnly ? textBehindSubject.enablePreview === true : textBehindSubject.enablePreview === true,
      allowFinalRender: textBehindSubject.allowFinalRender === true,
      rawPrompt: textBehindSubject.rawPrompt,
      signedUrl: textBehindSubject.signedUrl,
    } : undefined,
    enableModelMaskExecution: request.enableModelMaskExecution === true,
    enableMaskPreview: options.renderPreviewOnly ? request.enableMaskPreview === true : request.enableMaskPreview === true,
    allowModelDownload: request.allowModelDownload === true,
    allowFinalRender: request.allowFinalRender === true,
    timeoutMs: numberValue(request.timeoutMs),
    readinessReport: typeof request.readinessReport === 'object' && request.readinessReport ? request.readinessReport as never : undefined,
    rawPrompt: request.rawPrompt,
    promptText: request.promptText,
    rawUserChat: request.rawUserChat,
    signedUrl: request.signedUrl,
    serviceRoleKey: request.serviceRoleKey,
    providerApiKey: request.providerApiKey,
    secretValue: request.secretValue,
    arbitraryModelArgs: Array.isArray(request.arbitraryModelArgs) ? request.arbitraryModelArgs.filter(isStringValue) : undefined,
    arbitraryFfmpegArgs: Array.isArray(request.arbitraryFfmpegArgs) ? request.arbitraryFfmpegArgs.filter(isStringValue) : undefined,
  }
}

function isMaskExecutionMode(value: unknown): value is MaskExecutionMode {
  return value === 'dry_run' ||
    value === 'local_dev' ||
    value === 'container_ready' ||
    value === 'production_blocked' ||
    value === 'production_ready'
}

function isMaskIntent(value: unknown): value is MaskIntent {
  return value === 'background_removal_image' ||
    value === 'background_removal_video' ||
    value === 'subject_cutout' ||
    value === 'text_behind_subject' ||
    value === 'blur_background' ||
    value === 'custom'
}

function isMaskToolId(value: unknown): value is MaskToolId {
  return value === 'birefnet' ||
    value === 'sam2' ||
    value === 'transparent_background' ||
    value === 'rembg' ||
    value === 'opencv' ||
    value === 'kornia' ||
    value === 'none'
}

function parseMaskSubjectSelection(value: unknown): MaskSubjectSelection | undefined {
  if (!value || typeof value !== 'object') return undefined
  return value as MaskSubjectSelection
}

function isTextStylePreset(value: unknown): value is 'clean_title' | 'bold_social' | 'lower_third' | 'side_panel' | 'minimal_label' | 'custom' {
  return value === 'clean_title' ||
    value === 'bold_social' ||
    value === 'lower_third' ||
    value === 'side_panel' ||
    value === 'minimal_label' ||
    value === 'custom'
}

function isTextPlacementPolicy(value: unknown): value is 'behind_subject_center' | 'behind_subject_upper' | 'behind_subject_lower' | 'side_panel' | 'lower_third' | 'foreground_safe' {
  return value === 'behind_subject_center' ||
    value === 'behind_subject_upper' ||
    value === 'behind_subject_lower' ||
    value === 'side_panel' ||
    value === 'lower_third' ||
    value === 'foreground_safe'
}

function isTextMotionPolicy(value: unknown): value is 'static' | 'subtle_follow' | 'frame_locked' {
  return value === 'static' || value === 'subtle_follow' || value === 'frame_locked'
}

function hasColorExecutionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.colorExecution
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isColorExecutionMode(mode)
}

function hasRenderColorExecutionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.colorExecution
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return mode === 'dry_run' || mode === 'local_dev' || mode === 'container_ready'
}

function hasColorExecutionQARequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.colorExecutionQA
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isColorExecutionMode(mode)
}

function buildColorExecutionInput(
  payload: ProductionWorkerJobPayload,
  options: { qaOnly?: boolean; renderPreviewOnly?: boolean } = {},
) {
  const request = (options.qaOnly ? payload.metadata?.colorExecutionQA : payload.metadata?.colorExecution) as Record<string, unknown>
  const mode = request.mode as ColorExecutionMode
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    mediaAnalysisReportId: payload.mediaAnalysisReportId,
    sourceVideoArtifactId: stringValue(request.sourceVideoArtifactId) ?? payload.storageReferenceIds[0],
    proxyVideoArtifactId: stringValue(request.proxyVideoArtifactId),
    representativeFrameArtifactIds: Array.isArray(request.representativeFrameArtifactIds) ? request.representativeFrameArtifactIds.filter(isStringValue) : undefined,
    sourceVideoLocalPath: stringValue(request.sourceVideoLocalPath),
    proxyVideoLocalPath: stringValue(request.proxyVideoLocalPath),
    representativeFrameLocalPaths: Array.isArray(request.representativeFrameLocalPaths) ? request.representativeFrameLocalPaths.filter(isStringValue) : undefined,
    sourceStorageObjectPath: stringValue(request.sourceStorageObjectPath) ?? payload.storageReferenceIds[0],
    outputDirectory: stringValue(request.outputDirectory),
    colorGradeStyle: isColorGradeStyle(request.colorGradeStyle) ? request.colorGradeStyle : undefined,
    colorIntensity: numberValue(request.colorIntensity),
    lutStrength: numberValue(request.lutStrength),
    colorCorrectionPlan: typeof request.colorCorrectionPlan === 'object' && request.colorCorrectionPlan ? request.colorCorrectionPlan as never : undefined,
    lutArtifactId: stringValue(request.lutArtifactId),
    lutLocalPath: stringValue(request.lutLocalPath),
    referenceClipArtifactId: stringValue(request.referenceClipArtifactId),
    mockAnalysis: typeof request.mockAnalysis === 'object' && request.mockAnalysis ? request.mockAnalysis as never : undefined,
    enableFfmpegColorPreview: options.renderPreviewOnly ? request.enableFfmpegColorPreview === true : request.enableFfmpegColorPreview === true,
    enableOpenColorIOExecution: request.enableOpenColorIOExecution === true,
    enableOpenImageIOExecution: request.enableOpenImageIOExecution === true,
    allowFinalExport: request.allowFinalExport === true,
    ffmpegBin: stringValue(request.ffmpegBin),
    timeoutMs: numberValue(request.timeoutMs),
    readinessReport: typeof request.readinessReport === 'object' && request.readinessReport ? request.readinessReport as never : undefined,
    rawPrompt: request.rawPrompt,
    promptText: request.promptText,
    rawUserChat: request.rawUserChat,
    signedUrl: request.signedUrl,
    serviceRoleKey: request.serviceRoleKey,
    providerApiKey: request.providerApiKey,
    secretValue: request.secretValue,
    arbitraryFfmpegArgs: Array.isArray(request.arbitraryFfmpegArgs) ? request.arbitraryFfmpegArgs.filter(isStringValue) : undefined,
    arbitraryLutArgs: Array.isArray(request.arbitraryLutArgs) ? request.arbitraryLutArgs.filter(isStringValue) : undefined,
  }
}

function isColorExecutionMode(value: unknown): value is ColorExecutionMode {
  return value === 'dry_run' ||
    value === 'local_dev' ||
    value === 'container_ready' ||
    value === 'production_blocked' ||
    value === 'production_ready'
}

function isColorGradeStyle(value: unknown): value is ColorGradeStyle {
  return value === 'clean_natural' ||
    value === 'premium_clean' ||
    value === 'warm_lifestyle' ||
    value === 'cinematic_contrast' ||
    value === 'documentary_neutral' ||
    value === 'luxury_real_estate' ||
    value === 'corporate_neutral' ||
    value === 'bright_social' ||
    value === 'moody_dramatic' ||
    value === 'film_emulation_light' ||
    value === 'muted_editorial' ||
    value === 'high_key_clean' ||
    value === 'monochrome' ||
    value === 'custom'
}

function hasAudioExecutionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.audioExecution
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isAudioExecutionMode(mode)
}

function hasGpuAudioExecutionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.audioExecution
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isAudioExecutionMode(mode) && (request as Record<string, unknown>).enableModelAudioExecution === true
}

function hasAudioExecutionQARequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.audioExecutionQA
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isAudioExecutionMode(mode)
}

function buildAudioExecutionInput(
  payload: ProductionWorkerJobPayload,
  options: { qaOnly?: boolean } = {},
) {
  const request = (options.qaOnly ? payload.metadata?.audioExecutionQA : payload.metadata?.audioExecution) as Record<string, unknown>
  const mode = request.mode as AudioExecutionMode
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    sourceAudioArtifactId: stringValue(request.sourceAudioArtifactId) ?? payload.storageReferenceIds[0] ?? 'audio-artifact-not-set',
    sourceAudioStorageObjectPath: stringValue(request.sourceAudioStorageObjectPath) ?? payload.storageReferenceIds[0],
    sourceAudioLocalPath: stringValue(request.sourceAudioLocalPath),
    outputDirectory: stringValue(request.outputDirectory),
    audioAnalysis: typeof request.audioAnalysis === 'object' && request.audioAnalysis ? request.audioAnalysis as never : undefined,
    audioCleanupPlan: typeof request.audioCleanupPlan === 'object' && request.audioCleanupPlan ? request.audioCleanupPlan as never : undefined,
    loudnessPlan: typeof request.loudnessPlan === 'object' && request.loudnessPlan ? request.loudnessPlan as never : undefined,
    musicDuckingPlan: typeof request.musicDuckingPlan === 'object' && request.musicDuckingPlan ? request.musicDuckingPlan as never : undefined,
    soundSyncCuePlan: typeof request.soundSyncCuePlan === 'object' && request.soundSyncCuePlan ? request.soundSyncCuePlan as never : undefined,
    transcriptArtifactIds: Array.isArray(request.transcriptArtifactIds) ? request.transcriptArtifactIds.filter(isStringValue) : undefined,
    timelineManifestId: stringValue(request.timelineManifestId),
    smartCutPlanId: stringValue(request.smartCutPlanId),
    modelWeightManifestIds: Array.isArray(request.modelWeightManifestIds) ? request.modelWeightManifestIds.filter(isStringValue) : undefined,
    enableFfmpegAudioExecution: request.enableFfmpegAudioExecution === true,
    enableModelAudioExecution: request.enableModelAudioExecution === true,
    allowModelDownload: request.allowModelDownload === true,
    allowFinalMux: request.allowFinalMux === true,
    ffmpegBin: stringValue(request.ffmpegBin),
    timeoutMs: numberValue(request.timeoutMs),
    platform: isAudioPlatform(request.platform) ? request.platform : undefined,
    voiceOnly: request.voiceOnly === true,
    approvedDemucsReason: stringValue(request.approvedDemucsReason),
    localDevToolExecution: request.localDevToolExecution === true,
    readinessReport: typeof request.readinessReport === 'object' && request.readinessReport ? request.readinessReport as never : undefined,
    rawPrompt: request.rawPrompt,
    promptText: request.promptText,
    rawUserChat: request.rawUserChat,
    signedUrl: request.signedUrl,
    serviceRoleKey: request.serviceRoleKey,
    providerApiKey: request.providerApiKey,
    secretValue: request.secretValue,
    arbitraryFfmpegArgs: Array.isArray(request.arbitraryFfmpegArgs) ? request.arbitraryFfmpegArgs.filter(isStringValue) : undefined,
  }
}

function isAudioExecutionMode(value: unknown): value is AudioExecutionMode {
  return value === 'dry_run' ||
    value === 'local_dev' ||
    value === 'container_ready' ||
    value === 'production_blocked' ||
    value === 'production_ready'
}

function hasSmartCutTimelineExecutionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.smartCutTimelineExecution
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isSmartCutTimelineExecutionMode(mode)
}

function hasRenderSmartCutTimelineExecutionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.smartCutTimelineExecution
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return mode === 'dry_run' || mode === 'local_dev' || mode === 'container_ready'
}

function buildSmartCutTimelineExecutionInput(
  payload: ProductionWorkerJobPayload,
  options: { timelinePreviewOnly?: boolean } = {},
) {
  const request = payload.metadata?.smartCutTimelineExecution as Record<string, unknown>
  const mode = request.mode as SmartCutTimelineExecutionMode
  const smartCutPlan = typeof request.smartCutPlan === 'object' && request.smartCutPlan
    ? request.smartCutPlan as ReturnType<typeof buildSmartCutPlan>
    : buildSmartCutPlan({
      mode: 'dry_run',
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
      approvedSnapshotId: payload.approvedSnapshotId,
      toolExecutionPlanId: payload.toolExecutionPlanId,
      idempotencyKey: payload.idempotencyKey,
      mediaDurationSeconds: numberValue(request.mediaDurationSeconds) ?? 8,
    })

  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    editPlanId: payload.editPlanId,
    workerPayload: payload,
    mediaAnalysisReportId: payload.mediaAnalysisReportId,
    smartCutPlanId: stringValue(request.smartCutPlanId),
    smartCutPlan,
    timelineManifestId: stringValue(request.timelineManifestId),
    sourceVideoArtifactId: stringValue(request.sourceVideoArtifactId),
    proxyVideoArtifactId: stringValue(request.proxyVideoArtifactId),
    sourceVideoLocalPath: stringValue(request.sourceVideoLocalPath),
    proxyVideoLocalPath: stringValue(request.proxyVideoLocalPath),
    sourceStorageObjectPath: stringValue(request.sourceStorageObjectPath) ?? payload.storageReferenceIds[0],
    captionArtifactIds: Array.isArray(request.captionArtifactIds) ? request.captionArtifactIds.filter(isStringValue) : undefined,
    transcriptArtifactIds: Array.isArray(request.transcriptArtifactIds) ? request.transcriptArtifactIds.filter(isStringValue) : undefined,
    wordTimestamps: Array.isArray(request.wordTimestamps) ? request.wordTimestamps as never[] : undefined,
    outputDirectory: stringValue(request.outputDirectory),
    enableProxyPreview: options.timelinePreviewOnly ? request.enableProxyPreview === true : request.enableProxyPreview === true,
    allowFinalExport: request.allowFinalExport === true,
    ffmpegBin: stringValue(request.ffmpegBin),
    ffprobeBin: stringValue(request.ffprobeBin),
    timeoutMs: numberValue(request.timeoutMs),
    fps: numberValue(request.fps),
    mediaDurationSeconds: numberValue(request.mediaDurationSeconds),
    readinessReport: typeof request.readinessReport === 'object' && request.readinessReport ? request.readinessReport as never : undefined,
    arbitraryFfmpegArgs: Array.isArray(request.arbitraryFfmpegArgs) ? request.arbitraryFfmpegArgs.filter(isStringValue) : undefined,
  }
}

function isSmartCutTimelineExecutionMode(value: unknown): value is SmartCutTimelineExecutionMode {
  return value === 'dry_run' ||
    value === 'local_dev' ||
    value === 'container_ready' ||
    value === 'production_blocked' ||
    value === 'production_ready'
}

function hasSpeechCaptionExecutionRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.speechCaptionExecution
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return isSpeechCaptionExecutionMode(mode)
}

function buildSpeechCaptionExecutionInput(
  payload: ProductionWorkerJobPayload,
  options: { captionOnly?: boolean } = {},
) {
  const request = payload.metadata?.speechCaptionExecution as Record<string, unknown>
  const mode = request.mode as SpeechCaptionExecutionMode
  const captionFormats = Array.isArray(request.captionFormats)
    ? request.captionFormats.filter(isCaptionFileFormat)
    : undefined

  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    sourceAudioArtifactId: stringValue(request.sourceAudioArtifactId) ?? payload.storageReferenceIds[0] ?? 'audio-artifact-not-set',
    sourceAudioLocalPath: stringValue(request.sourceAudioLocalPath),
    sourceVideoLocalPath: stringValue(request.sourceVideoLocalPath),
    outputDirectory: stringValue(request.outputDirectory),
    modelWeightManifestId: stringValue(request.modelWeightManifestId),
    modelName: stringValue(request.modelName),
    localModelPath: stringValue(request.localModelPath),
    language: stringValue(request.language),
    device: isSpeechDevice(request.device) ? request.device : 'auto',
    computeType: stringValue(request.computeType),
    wordTimestamps: typeof request.wordTimestamps === 'boolean' ? request.wordTimestamps : true,
    vadFilter: typeof request.vadFilter === 'boolean' ? request.vadFilter : true,
    beamSize: numberValue(request.beamSize),
    timeoutMs: numberValue(request.timeoutMs),
    enableRealTranscription: request.enableRealTranscription === true,
    allowModelDownload: request.allowModelDownload === true,
    enableCaptionPreview: request.enableCaptionPreview === true,
    buildSpeech: options.captionOnly ? false : request.buildSpeech !== false,
    buildCaptions: request.buildCaptions !== false,
    captionFormats,
    captionStyle: isCaptionStylePresetId(request.captionStyle) ? request.captionStyle : undefined,
    workerPayload: payload,
  }
}

function isSpeechCaptionExecutionMode(value: unknown): value is SpeechCaptionExecutionMode {
  return value === 'dry_run' ||
    value === 'local_dev' ||
    value === 'container_ready' ||
    value === 'production_blocked' ||
    value === 'production_ready'
}

function isSpeechDevice(value: unknown): value is 'cpu' | 'cuda' | 'auto' {
  return value === 'cpu' || value === 'cuda' || value === 'auto'
}

function hasAudioFoundationRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.audioFoundation
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return mode === 'dry_run' || mode === 'local_dev'
}

function buildAudioFoundationInput(payload: ProductionWorkerJobPayload) {
  const request = payload.metadata?.audioFoundation as Record<string, unknown>
  const mode = request.mode as Extract<AudioFoundationRunMode, 'dry_run' | 'local_dev'>
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    sourceAudioArtifactId: stringValue(request.sourceAudioArtifactId) ?? payload.storageReferenceIds[0],
    sourceAudioStorageObjectPath: stringValue(request.sourceAudioStorageObjectPath) ?? payload.storageReferenceIds[0],
    sourceAudioLocalPath: stringValue(request.sourceAudioLocalPath),
    outputRoot: stringValue(request.outputRoot),
    ffmpegBin: stringValue(request.ffmpegBin),
    timeoutMs: numberValue(request.timeoutMs),
    localDevToolExecution: request.localDevToolExecution === true,
    localDevFfmpegLoudness: request.localDevFfmpegLoudness === true,
    approvedDirectiveSummary: stringValue(request.approvedDirectiveSummary),
    userIntentSummary: stringValue(request.userIntentSummary),
    platform: isAudioPlatform(request.platform) ? request.platform : undefined,
    voiceOnly: request.voiceOnly === true,
    requestedSfxDensity: isSfxDensity(request.requestedSfxDensity) ? request.requestedSfxDensity : undefined,
    mockAnalysis: typeof request.mockAnalysis === 'object' && request.mockAnalysis ? request.mockAnalysis as Record<string, unknown> : undefined,
  }
}

function hasSmartCutFoundationRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.smartCutFoundation
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return mode === 'dry_run' || mode === 'local_dev'
}

function hasTimelineFoundationRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.timelineFoundation
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return mode === 'dry_run' || mode === 'local_dev'
}

function buildSmartCutFoundationInput(payload: ProductionWorkerJobPayload) {
  const request = payload.metadata?.smartCutFoundation as Record<string, unknown>
  const mode = request.mode as Extract<SmartCutFoundationRunMode, 'dry_run' | 'local_dev'>
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    mediaDurationSeconds: numberValue(request.mediaDurationSeconds),
    intent: Array.isArray(request.intent) ? request.intent.filter(isSmartCutIntent) : undefined,
    aggressiveness: isSmartCutAggressiveness(request.aggressiveness) ? request.aggressiveness : undefined,
    pacingProfileId: isPacingProfileName(request.pacingProfileId) ? request.pacingProfileId : undefined,
    localDevPreview: request.localDevPreview === true,
    outputRoot: stringValue(request.outputRoot),
  }
}

function buildTimelineFoundationInput(payload: ProductionWorkerJobPayload) {
  const request = payload.metadata?.timelineFoundation as Record<string, unknown>
  const mode = request.mode as Extract<TimelineFoundationRunMode, 'dry_run' | 'local_dev'>
  const smartCutPlan = typeof request.smartCutPlan === 'object' && request.smartCutPlan
    ? request.smartCutPlan as ReturnType<typeof buildSmartCutPlan>
    : buildSmartCutPlan({
      mode: 'dry_run',
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
      approvedSnapshotId: payload.approvedSnapshotId,
      toolExecutionPlanId: payload.toolExecutionPlanId,
      idempotencyKey: payload.idempotencyKey,
      mediaDurationSeconds: numberValue(request.mediaDurationSeconds) ?? 8,
    })
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    editPlanId: payload.editPlanId ?? 'edit-plan-not-set',
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    smartCutPlan,
    sourceStorageObjectPath: stringValue(request.sourceStorageObjectPath) ?? payload.storageReferenceIds[0],
    transcriptArtifactId: stringValue(request.transcriptArtifactId),
    wordTimestampArtifactId: stringValue(request.wordTimestampArtifactId),
    captionArtifactIds: Array.isArray(request.captionArtifactIds) ? request.captionArtifactIds.filter(isStringValue) : undefined,
    outputRoot: stringValue(request.outputRoot),
    fps: numberValue(request.fps),
  }
}

function hasSpeechFoundationRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.speechFoundation
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return mode === 'dry_run' || mode === 'local_dev'
}

function hasCaptionFoundationRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.captionFoundation
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return mode === 'dry_run' || mode === 'local_dev'
}

function buildSpeechFoundationInput(payload: ProductionWorkerJobPayload) {
  const request = payload.metadata?.speechFoundation as Record<string, unknown>
  const mode = request.mode as Extract<SpeechFoundationRunMode, 'dry_run' | 'local_dev'>
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    sourceAudioArtifactId: stringValue(request.sourceAudioArtifactId) ?? payload.storageReferenceIds[0] ?? 'audio-artifact-not-set',
    localAudioPath: stringValue(request.localAudioPath),
    outputRoot: stringValue(request.outputRoot),
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
  }
}

function buildCaptionFoundationInput(payload: ProductionWorkerJobPayload) {
  const request = payload.metadata?.captionFoundation as Record<string, unknown>
  const mode = request.mode as Extract<CaptionFoundationRunMode, 'dry_run' | 'local_dev'>
  const formats = Array.isArray(request.formats)
    ? request.formats.filter(isCaptionFileFormat)
    : undefined
  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    toolExecutionPlanId: payload.toolExecutionPlanId,
    approvedSnapshotId: payload.approvedSnapshotId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    outputRoot: stringValue(request.outputRoot),
    sourceVideoLocalPath: stringValue(request.sourceVideoLocalPath),
    ffmpegBin: stringValue(request.ffmpegBin),
    timeoutMs: numberValue(request.timeoutMs),
    stylePresetId: isCaptionStylePresetId(request.stylePresetId) ? request.stylePresetId : undefined,
    formats,
  }
}

function isCaptionFileFormat(value: unknown): value is CaptionFileFormat {
  return value === 'srt' || value === 'webvtt' || value === 'ass'
}

function isCaptionStylePresetId(value: unknown): value is CaptionStylePresetId {
  return value === 'clean_subtitle' ||
    value === 'small_premium_subtitle' ||
    value === 'bold_social_captions' ||
    value === 'keyword_emphasis_captions' ||
    value === 'karaoke_word_by_word' ||
    value === 'sentence_block_captions' ||
    value === 'documentary_lower_third' ||
    value === 'education_label_captions' ||
    value === 'minimal_accessibility_captions'
}

function hasMediaFoundationRequest(payload: ProductionWorkerJobPayload): boolean {
  const request = payload.metadata?.mediaFoundation
  if (!request || typeof request !== 'object') return false
  const mode = (request as Record<string, unknown>).mode
  return mode === 'dry_run' || mode === 'local_dev'
}

function buildMediaFoundationInput(payload: ProductionWorkerJobPayload) {
  const request = payload.metadata?.mediaFoundation as Record<string, unknown>
  const mode = request.mode as Extract<MediaFoundationRunMode, 'dry_run' | 'local_dev'>
  const sourceObjectPath = stringValue(request.sourceStorageObjectPath) ?? payload.storageReferenceIds[0] ?? 'source_media/not-set'
  const sourceLocalPath = stringValue(request.sourceLocalPath)
  const sourceStorageObjectId = stringValue(request.sourceStorageObjectId) ?? payload.storageReferenceIds[0] ?? 'source-storage-object-not-set'
  const tasks = Array.isArray(request.tasks)
    ? request.tasks.filter(isMediaFoundationTask)
    : undefined

  return {
    mode,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? 'media-asset-not-set',
    sourceStorageObjectId,
    approvedSnapshotId: payload.approvedSnapshotId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    idempotencyKey: payload.idempotencyKey,
    workerPayload: payload,
    source: buildStorageArtifactReference({
      sourceStorageObjectId,
      storageBucketPurpose: 'source_media',
      storageObjectPath: sourceObjectPath,
      localFilePath: sourceLocalPath,
      contentType: stringValue(request.contentType),
    }),
    localStorageRoot: stringValue(request.localStorageRoot),
    outputRoot: stringValue(request.outputRoot),
    ffprobeBin: stringValue(request.ffprobeBin),
    ffmpegBin: stringValue(request.ffmpegBin),
    timeoutMs: numberValue(request.timeoutMs),
    tasks,
  }
}

function isMediaFoundationTask(value: unknown): value is MediaFoundationTask {
  return value === 'probe' ||
    value === 'create_proxy' ||
    value === 'extract_audio' ||
    value === 'extract_keyframes' ||
    value === 'extract_representative_frames' ||
    value === 'build_analysis_report'
}

function isSmartCutIntent(value: unknown): value is SmartCutIntent {
  return value === 'remove_dead_space' ||
    value === 'remove_fillers' ||
    value === 'remove_repeated_takes' ||
    value === 'tighten_pacing' ||
    value === 'preserve_story' ||
    value === 'social_fast_cut' ||
    value === 'podcast_clean_cut' ||
    value === 'talking_head_clean_cut' ||
    value === 'custom'
}

function isSmartCutAggressiveness(value: unknown): value is SmartCutAggressiveness {
  return value === 'gentle' || value === 'balanced' || value === 'tight' || value === 'aggressive'
}

function isPacingProfileName(value: unknown): value is PacingProfileName {
  return value === 'natural_clean' ||
    value === 'social_fast' ||
    value === 'podcast_clean' ||
    value === 'talking_head_tight' ||
    value === 'documentary_measured' ||
    value === 'education_structured' ||
    value === 'custom'
}

function isStringValue(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isAudioPlatform(value: unknown): value is 'social' | 'web' | 'broadcast' | 'podcast' | 'education' | 'premium' | 'custom' {
  return value === 'social' ||
    value === 'web' ||
    value === 'broadcast' ||
    value === 'podcast' ||
    value === 'education' ||
    value === 'premium' ||
    value === 'custom'
}

function isSfxDensity(value: unknown): value is 'none' | 'light' | 'medium' | 'heavy' {
  return value === 'none' || value === 'light' || value === 'medium' || value === 'heavy'
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
