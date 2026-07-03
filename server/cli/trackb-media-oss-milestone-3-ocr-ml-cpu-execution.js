import { writeTrackBMilestone3OcrMlCpuExecutionArtifacts } from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution/index.js'

const args = new Set(process.argv.slice(2))
const reports = writeTrackBMilestone3OcrMlCpuExecutionArtifacts({ execute: args.has('--execute') })
console.log(JSON.stringify(reports.decisionReport, null, 2))
