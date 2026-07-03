import { writeTrackaDockerBuildProbeRerunArtifacts } from '../activation/open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun'

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const reports = writeTrackaDockerBuildProbeRerunArtifacts({ execute, args })

console.log(JSON.stringify(reports.decision, null, 2))
