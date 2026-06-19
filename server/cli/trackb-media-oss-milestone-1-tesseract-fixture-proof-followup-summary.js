import { readTrackBMilestone1TesseractFixtureFollowupArtifacts } from '../activation/trackb-media-oss-milestone-1-tesseract-fixture-proof-followup/index.js'

const reports = readTrackBMilestone1TesseractFixtureFollowupArtifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decisionReport.decision,
      nextPrompt: reports.decisionReport.nextPrompt,
      imageTag: reports.decisionReport.imageTag,
      acceptedVariant: reports.decisionReport.acceptedVariant,
      tesseractFixtureProven: reports.fixtureReport.tesseractFixtureProven,
      tools: reports.statusMatrix.tools,
      supabaseClassification: reports.decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
