import { writeTrackBMilestone1Artifacts } from '../activation/trackb-media-oss-milestone-1-low-risk-metadata-tooling-execution/index.js'

const reports = writeTrackBMilestone1Artifacts()

console.log(JSON.stringify(reports.decisionReport, null, 2))
