import {
  buildFilmSlowmotionApprovalReport,
  summarizeFilmSlowmotionApprovalReport,
} from '../activation/film-slowmotion-approval'

const report = buildFilmSlowmotionApprovalReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeFilmSlowmotionApprovalReport(report))
