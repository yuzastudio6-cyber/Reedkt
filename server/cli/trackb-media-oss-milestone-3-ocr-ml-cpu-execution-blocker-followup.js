import { writeTrackBMilestone3OcrMlCpuExecutionBlockerFollowupArtifacts } from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup/index.js'

const args = new Set(process.argv.slice(2))
const reports = writeTrackBMilestone3OcrMlCpuExecutionBlockerFollowupArtifacts({ execute: args.has('--execute') })
console.log(JSON.stringify(reports.decisionReport, null, 2))
