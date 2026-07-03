import { readTrackaDockerBuildProbeQaArtifacts } from '../activation/open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-review'

const reports = readTrackaDockerBuildProbeQaArtifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      nextPrompt: reports.decision.nextPrompt,
      dockerBuildQaAccepted: reports.dockerBuildQa.accepted,
      ffmpegVersionQaAccepted: reports.ffmpegVersionQa.accepted,
      ffprobeVersionQaAccepted: reports.ffprobeVersionQa.accepted,
      generatedArtifactCleanupQaAccepted: reports.generatedArtifactCleanupQa.accepted,
      mediaRenderBlockedScopeQaAccepted: reports.mediaRenderBlockedScopeQa.accepted,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  ),
)
