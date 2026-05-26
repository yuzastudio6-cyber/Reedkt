import { extractRepresentativeFrames } from './ffmpeg-media-adapter'
import type { ExtractRepresentativeFramesInput, MediaFoundationArtifactSummary } from './media-worker-types'

export async function runRepresentativeFrameProductionWorker(
  input: ExtractRepresentativeFramesInput,
): Promise<MediaFoundationArtifactSummary[]> {
  return extractRepresentativeFrames(input)
}
