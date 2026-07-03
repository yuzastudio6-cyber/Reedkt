import { existsSync } from 'node:fs'
import {
  buildTrackaDockerBuildProbeRerunPlan,
  readTrackaDockerBuildProbeRerunArtifacts,
} from '../activation/open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun'

const plan = buildTrackaDockerBuildProbeRerunPlan()
if (plan.imageTag !== 'reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-9225347e636a50aa0ef241badbf51f9a3947b1f8') {
  throw new Error('unexpected_image_tag')
}

const reports = readTrackaDockerBuildProbeRerunArtifacts()
if (!reports.decision.decision) throw new Error('missing_decision_report')
if (!reports.generatedOutputCleanupReport.passed) throw new Error('generated_output_cleanup_not_passed')
for (const directory of [
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]) {
  if (existsSync(directory)) throw new Error(`generated_directory_present:${directory}`)
}

console.log('Track A container Docker build FFmpeg/FFprobe version-probe rerun smoke passed.')
