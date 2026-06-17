import {
  buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalReports,
  readOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalArtifacts,
  summarizeOpenSourceToolStackFfmpegFfprobeVersionProbeApproval,
} from '../activation/open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval'

console.log(
  summarizeOpenSourceToolStackFfmpegFfprobeVersionProbeApproval(
    readOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalArtifacts() ??
      buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalReports(),
  ),
)
