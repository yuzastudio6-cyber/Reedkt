import {
  buildFilmSlowMotionReviewReport,
  summarizeFilmSlowMotionReviewPlan,
} from '../activation/film-slowmotion-review'

const output = process.argv.includes('--json') ? 'json' : 'text'
const report = buildFilmSlowMotionReviewReport()

if (output === 'json') {
  console.log(JSON.stringify({
    phase: report.phase,
    status: 'blocked_for_execution / review_complete',
    policy: report.policy,
    futureBoundedTestScope: report.futureBoundedTestScope,
    commandPlans: report.commandPlans,
  }, null, 2))
} else {
  console.log(summarizeFilmSlowMotionReviewPlan(report))
}
