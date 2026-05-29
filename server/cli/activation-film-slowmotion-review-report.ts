import {
  buildFilmSlowMotionReviewReport,
  renderFilmSlowMotionReviewReportMarkdown,
} from '../activation/film-slowmotion-review'

const output = process.argv.includes('--json') ? 'json' : 'markdown'
const report = buildFilmSlowMotionReviewReport()

if (output === 'json') {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(renderFilmSlowMotionReviewReportMarkdown(report))
}
