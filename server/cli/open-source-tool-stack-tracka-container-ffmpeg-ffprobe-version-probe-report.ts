import {
  buildTrackaContainerFfmpegFfprobeVersionProbeReports,
  readTrackaContainerFfmpegFfprobeVersionProbeArtifacts,
  summarizeTrackaContainerFfmpegFfprobeVersionProbe,
} from '../activation/open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-execution'

console.log(
  summarizeTrackaContainerFfmpegFfprobeVersionProbe(
    readTrackaContainerFfmpegFfprobeVersionProbeArtifacts() ??
      buildTrackaContainerFfmpegFfprobeVersionProbeReports(),
  ),
)
