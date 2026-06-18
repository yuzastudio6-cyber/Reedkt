import { existsSync } from 'node:fs'
import {
  buildTrackaDockerBuildProbeQaPlan,
  readTrackaDockerBuildProbeQaArtifacts,
} from '../activation/open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-review'

const plan = buildTrackaDockerBuildProbeQaPlan()
if (
  plan.expectedDecision !==
  'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_qa_passed_media_processing_still_blocked_ready_for_batch1_rollup'
) {
  throw new Error('unexpected_expected_decision')
}

const reports = readTrackaDockerBuildProbeQaArtifacts()
if (reports.decision.decision !== plan.expectedDecision) throw new Error('unexpected_qa_decision')
if (reports.dockerBuildQa.accepted !== true) throw new Error('docker_build_qa_not_accepted')
if (reports.ffmpegVersionQa.accepted !== true) throw new Error('ffmpeg_qa_not_accepted')
if (reports.ffprobeVersionQa.accepted !== true) throw new Error('ffprobe_qa_not_accepted')
if (reports.generatedArtifactCleanupQa.accepted !== true) throw new Error('generated_artifact_cleanup_qa_not_accepted')
if (reports.mediaRenderBlockedScopeQa.accepted !== true) throw new Error('media_render_blocked_scope_not_accepted')

for (const directory of [
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]) {
  if (existsSync(directory)) throw new Error(`forbidden_generated_output_present:${directory}`)
}

console.log('Track A container Docker build FFmpeg/FFprobe version-probe QA review smoke passed.')
