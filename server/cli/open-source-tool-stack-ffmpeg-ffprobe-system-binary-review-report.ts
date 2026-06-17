import {
  buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewReports,
  readOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewArtifacts,
  summarizeOpenSourceToolStackFfmpegFfprobeSystemBinaryReview,
} from '../activation/open-source-tool-stack-ffmpeg-ffprobe-system-binary-review'

console.log(
  summarizeOpenSourceToolStackFfmpegFfprobeSystemBinaryReview(
    readOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewArtifacts() ??
      buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewReports(),
  ),
)
