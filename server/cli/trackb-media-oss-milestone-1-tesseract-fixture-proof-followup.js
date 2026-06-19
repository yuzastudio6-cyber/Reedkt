import { writeTrackBMilestone1TesseractFixtureFollowupArtifacts } from '../activation/trackb-media-oss-milestone-1-tesseract-fixture-proof-followup/index.js'

const args = new Set(process.argv.slice(2))
const reports = writeTrackBMilestone1TesseractFixtureFollowupArtifacts({
  execute: args.has('--execute'),
})

console.log(JSON.stringify(reports.decisionReport, null, 2))
