import type {
  LyriaGenerateMusicRequest,
  LyriaGenerationConfig,
  LyriaModelName,
  LyriaOutputMimeType,
} from './lyria-provider-contracts'
import type { LyriaPromptPlanRecord, MusicCueSheetItemRecord } from '../../../types'
import { getLyriaModelName, getLyriaOutputMimeType } from './lyria-config'

export function buildLyriaGenerationConfig(
  outputMimeType: LyriaOutputMimeType = getLyriaOutputMimeType(),
): LyriaGenerationConfig | undefined {
  if (outputMimeType !== 'audio/wav') return undefined

  return {
    responseModalities: ['AUDIO', 'TEXT'],
    responseFormat: {
      audio: {
        mimeType: outputMimeType,
      },
    },
  }
}

export function buildLyriaPromptWithNegativePrompt(params: {
  prompt: string
  negativePrompt?: string
  durationSeconds?: number
}) {
  const parts = [params.prompt.trim()]

  if (params.durationSeconds) {
    parts.push(`Target duration: about ${Math.round(params.durationSeconds)} seconds.`)
  }

  if (params.negativePrompt?.trim()) {
    parts.push(`Constraints: ${params.negativePrompt.trim()}`)
  }

  return parts.join(' ')
}

export function buildLyriaGenerateMusicRequest(input: {
  prompt: string
  negativePrompt?: string
  durationSeconds?: number
  model?: LyriaModelName
  outputMimeType?: LyriaOutputMimeType
  metadata?: Record<string, unknown>
}): LyriaGenerateMusicRequest {
  const outputMimeType = getLyriaOutputMimeType(input.outputMimeType)

  return {
    model: getLyriaModelName(input.model),
    prompt: buildLyriaPromptWithNegativePrompt({
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      durationSeconds: input.durationSeconds,
    }),
    negativePrompt: input.negativePrompt,
    durationSeconds: input.durationSeconds,
    outputMimeType,
    generationConfig: buildLyriaGenerationConfig(outputMimeType),
    metadata: {
      styleDnaOnly: true,
      realProviderCall: false,
      ...input.metadata,
    },
  }
}

export function buildLyriaGenerateMusicRequestFromPromptPlan(input: {
  promptPlan: LyriaPromptPlanRecord
  musicCue?: MusicCueSheetItemRecord
  model?: LyriaModelName
  outputMimeType?: LyriaOutputMimeType
}): LyriaGenerateMusicRequest {
  const durationSeconds = input.musicCue?.timeRange
    ? Math.max(8, input.musicCue.timeRange.endSeconds - input.musicCue.timeRange.startSeconds)
    : undefined

  return buildLyriaGenerateMusicRequest({
    prompt: input.promptPlan.prompt,
    negativePrompt: input.promptPlan.negativePrompt,
    durationSeconds,
    model: input.model,
    outputMimeType: input.outputMimeType,
    metadata: {
      promptPlanId: input.promptPlan.id,
      cueSheetItemId: input.promptPlan.cueSheetItemId,
      musicCueId: input.musicCue?.id,
      referenceDnaId: input.promptPlan.referenceDnaId,
      vocalPolicy: input.promptPlan.vocalPolicy,
      speechSafety: input.promptPlan.speechSafety,
      blockedReferenceContent: input.promptPlan.blockedReferenceContent.join(', '),
    },
  })
}
