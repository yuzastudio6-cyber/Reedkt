import type {
  EditLevelMarkerContextPolicyModel,
  EditLevelSourceContextLayerListModel,
  EditLevelSourceUnderstandingFallbackNoticeModel,
  EditLevelSourceUnderstandingPolicyPackage,
  EditLevelSourceUnderstandingSummaryModel,
  ReEditProCanonicalEditLevel,
} from '../types'
import { mapCanonicalEditLevelToPublicLabel } from './edit-level-compatibility-mappers'
import {
  createEditLevelSourceUnderstandingBoundarySummary,
  createEditLevelSourceUnderstandingPolicyPackage,
} from './edit-level-source-understanding-rules'
import {
  createEditLevelSourceFutureGatedSummary,
  depthLabel,
} from './edit-level-source-understanding-summaries'

export function loadEditLevelSourceUnderstandingForUI(
  level: ReEditProCanonicalEditLevel,
): EditLevelSourceUnderstandingPolicyPackage {
  return createEditLevelSourceUnderstandingPolicyPackage(level)
}

export function createEditLevelSourceUnderstandingSummaryModel(
  level: ReEditProCanonicalEditLevel,
  routingPackage: EditLevelSourceUnderstandingPolicyPackage = createEditLevelSourceUnderstandingPolicyPackage(level),
): EditLevelSourceUnderstandingSummaryModel {
  const markerPolicy = routingPackage.markerContextPolicy

  return {
    level,
    displayName: routingPackage.displayName,
    depth: routingPackage.sourceUnderstandingDepth,
    depthLabel: depthLabel(routingPackage.sourceUnderstandingDepth),
    headline: `${routingPackage.displayName} source understanding depth`,
    userFacingSummary: routingPackage.userFacingSummary,
    transcriptPolicy: transcriptPolicyForLevel(level),
    visualPolicy: visualPolicyForLevel(level),
    audioPolicy: audioPolicyForLevel(level),
    graphicTextPolicy: graphicTextPolicyForLevel(level),
    markerContextWindow: `${markerPolicy.windowBeforeSeconds}s before / ${markerPolicy.windowAfterSeconds}s after markers`,
    futureGatedSummary: createEditLevelSourceFutureGatedSummary(routingPackage),
    highlights: [
      routingPackage.userFacingSummary,
      `Marker context window: ${markerPolicy.windowBeforeSeconds}s before and ${markerPolicy.windowAfterSeconds}s after.`,
      routingPackage.qwenContextPolicy.userFacingSummary,
      'No source-understanding tools execute in this mock/local milestone.',
    ],
    mockOnly: true,
  }
}

export function createEditLevelSourceContextLayerListModel(
  level: ReEditProCanonicalEditLevel,
  routingPackage: EditLevelSourceUnderstandingPolicyPackage = createEditLevelSourceUnderstandingPolicyPackage(level),
): EditLevelSourceContextLayerListModel {
  return {
    level,
    displayName: routingPackage.displayName,
    required: routingPackage.layers.filter((route) => route.requiredness === 'required'),
    recommended: routingPackage.layers.filter((route) => route.requiredness === 'recommended'),
    optional: routingPackage.layers.filter((route) => route.requiredness === 'optional'),
    targeted: routingPackage.layers.filter((route) => route.requiredness === 'targeted'),
    futureGated: routingPackage.layers.filter((route) => ['provider_required', 'worker_required', 'storage_required', 'future_gated', 'runtime_disabled'].includes(route.status)),
    degradedOrFallback: routingPackage.layers.filter((route) => routingPackage.degradedLayers.includes(route.layerId)),
    mockOnly: true,
  }
}

export function createEditLevelMarkerContextPolicyModel(
  level: ReEditProCanonicalEditLevel,
  routingPackage: EditLevelSourceUnderstandingPolicyPackage = createEditLevelSourceUnderstandingPolicyPackage(level),
): EditLevelMarkerContextPolicyModel {
  const policy = routingPackage.markerContextPolicy

  return {
    level,
    displayName: mapCanonicalEditLevelToPublicLabel(level),
    windowLabel: `${policy.windowBeforeSeconds}s before / ${policy.windowAfterSeconds}s after`,
    transcriptPolicy: policy.includeTranscript.replaceAll('_', ' '),
    visualPolicy: policy.includeVisualContext.replaceAll('_', ' '),
    audioPolicy: policy.includeAudioContext.replaceAll('_', ' '),
    graphicTextPolicy: policy.includeGraphicTextContext.replaceAll('_', ' '),
    includesPreferenceDNA: policy.includePreferenceDNA,
    includesQAWarnings: policy.includeQAWarnings,
    summary: policy.userFacingSummary,
    mockOnly: true,
  }
}

export function createEditLevelSourceUnderstandingFallbackNoticeModel(
  level: ReEditProCanonicalEditLevel,
  routingPackage: EditLevelSourceUnderstandingPolicyPackage = createEditLevelSourceUnderstandingPolicyPackage(level),
): EditLevelSourceUnderstandingFallbackNoticeModel {
  return {
    level,
    displayName: routingPackage.displayName,
    notices: routingPackage.fallbackPolicy,
    boundary: createEditLevelSourceUnderstandingBoundarySummary().join(' '),
    mockOnly: true,
  }
}

function transcriptPolicyForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'Targeted only when speech clarity changes the edit.'
  if (level === 'premium') return 'Timecoded transcript recommended when speech exists.'
  return 'Transcript required when speech exists, with speech timing for strict QA.'
}

function visualPolicyForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'Targeted Qwen2.5-VL only when a marker or ambiguity requires it.'
  if (level === 'premium') return 'Key visual moments and marker-window summaries when available.'
  return 'Scene-level visual analysis and marker-window context when future model access exists.'
}

function audioPolicyForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'Basic voice-first audio policy.'
  if (level === 'premium') return 'Audio, music, SFX, ambience, and ducking guidance where available.'
  return 'Audio, music, SFX, timing, and sound-design context.'
}

function graphicTextPolicyForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'Basic visible text and caption safety.'
  if (level === 'premium') return 'Graphic, text, card, and caption observations where relevant.'
  return 'Graphic, text, layout, card, and motion-direction observations.'
}
