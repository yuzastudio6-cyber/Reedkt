import { extractAudioTrack } from './ffmpeg-media-adapter'
import type { ExtractAudioTrackInput, MediaFoundationArtifactSummary } from './media-worker-types'

export async function runAudioExtractProductionWorker(
  input: ExtractAudioTrackInput,
): Promise<MediaFoundationArtifactSummary> {
  return extractAudioTrack(input)
}
