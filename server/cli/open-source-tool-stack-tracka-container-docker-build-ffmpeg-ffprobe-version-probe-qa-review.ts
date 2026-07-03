import { writeTrackaDockerBuildProbeQaArtifacts } from '../activation/open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-review'

const reports = writeTrackaDockerBuildProbeQaArtifacts()

console.log(JSON.stringify(reports.decision, null, 2))
