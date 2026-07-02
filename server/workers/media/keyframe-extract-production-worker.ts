import { extractKeyframes } from './ffmpeg-media-adapter'
import type { ExtractKeyframesInput, MediaFoundationArtifactSummary } from './media-worker-types'

export async function runKeyframeExtractProductionWorker(
  input: ExtractKeyframesInput,
): Promise<MediaFoundationArtifactSummary[]> {
  return extractKeyframes(input)
}
