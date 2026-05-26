import { probeMediaFile } from './ffprobe-media-adapter'
import type { FFprobeMediaInput, MediaProbeResult } from './media-worker-types'

export async function runMediaProbeProductionWorker(input: FFprobeMediaInput): Promise<MediaProbeResult> {
  return probeMediaFile(input)
}
