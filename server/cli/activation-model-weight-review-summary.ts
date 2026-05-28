import {
  buildModelWeightReviewSummary,
  summarizeModelWeightReviewSummary,
} from '../activation/model-approval'

const summary = buildModelWeightReviewSummary()

if (process.argv.includes('--json')) console.log(JSON.stringify(summary, null, 2))
else console.log(summarizeModelWeightReviewSummary(summary))
