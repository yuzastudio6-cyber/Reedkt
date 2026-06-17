import {
  buildTrackaFfmpegFfprobeSourceOfTruthReports,
  readTrackaFfmpegFfprobeSourceOfTruthArtifacts,
  summarizeTrackaFfmpegFfprobeSourceOfTruth,
} from '../activation/tracka-ffmpeg-ffprobe-source-of-truth'

console.log(
  summarizeTrackaFfmpegFfprobeSourceOfTruth(
    readTrackaFfmpegFfprobeSourceOfTruthArtifacts() ?? buildTrackaFfmpegFfprobeSourceOfTruthReports(),
  ),
)
