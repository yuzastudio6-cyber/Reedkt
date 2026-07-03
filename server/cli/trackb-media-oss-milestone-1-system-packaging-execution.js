import { writeTrackBMilestone1SystemPackagingExecutionArtifacts } from '../activation/trackb-media-oss-milestone-1-system-packaging-execution/index.js'

const args = new Set(process.argv.slice(2))
const reports = writeTrackBMilestone1SystemPackagingExecutionArtifacts({
  execute: args.has('--execute'),
})

console.log(JSON.stringify(reports.decisionReport, null, 2))
