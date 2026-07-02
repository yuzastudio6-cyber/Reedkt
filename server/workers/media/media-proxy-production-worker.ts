import { createProxyVideo } from './ffmpeg-media-adapter'
import type { CreateProxyVideoInput, MediaFoundationArtifactSummary } from './media-worker-types'

export async function runMediaProxyProductionWorker(
  input: CreateProxyVideoInput,
): Promise<MediaFoundationArtifactSummary> {
  return createProxyVideo(input)
}
