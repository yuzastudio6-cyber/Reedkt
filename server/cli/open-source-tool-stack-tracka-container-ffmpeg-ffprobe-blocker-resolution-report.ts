import {
  buildTrackaContainerFfmpegFfprobeBlockerResolutionReports,
  readTrackaContainerFfmpegFfprobeBlockerResolutionArtifacts,
  summarizeTrackaContainerFfmpegFfprobeBlockerResolution,
} from '../activation/open-source-tool-stack-tracka-container-ffmpeg-ffprobe-blocker-resolution'

console.log(
  summarizeTrackaContainerFfmpegFfprobeBlockerResolution(
    readTrackaContainerFfmpegFfprobeBlockerResolutionArtifacts() ??
      buildTrackaContainerFfmpegFfprobeBlockerResolutionReports(),
  ),
)
