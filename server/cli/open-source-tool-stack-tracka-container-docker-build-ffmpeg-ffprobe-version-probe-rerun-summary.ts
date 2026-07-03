import { readTrackaDockerBuildProbeRerunArtifacts } from '../activation/open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun'

const reports = readTrackaDockerBuildProbeRerunArtifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      nextPrompt: reports.decision.nextPrompt,
      dockerBuildExitCode: reports.dockerBuildReport.exitCode,
      ffmpegProbeExitCode: reports.ffmpegContainerVersionProbeReport.exitCode,
      ffprobeProbeExitCode: reports.ffprobeContainerVersionProbeReport.exitCode,
      generatedOutputCleanupPassed: reports.generatedOutputCleanupReport.passed,
      sideEffectSafetyPassed: reports.sideEffectArtifactSafetyReport.passed,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  ),
)
