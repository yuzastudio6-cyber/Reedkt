import { buildRealVideoFilmSlowmotionReport, summarizeRealVideoFilmSlowmotionReport } from '../activation/real-video-film-slowmotion'

const report = buildRealVideoFilmSlowmotionReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeRealVideoFilmSlowmotionReport(report))
