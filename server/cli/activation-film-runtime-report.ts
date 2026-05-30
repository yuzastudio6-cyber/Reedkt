import { buildFilmRuntimeReport, summarizeFilmRuntimeReport } from '../activation/film-runtime'

const report = buildFilmRuntimeReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeFilmRuntimeReport(report))
