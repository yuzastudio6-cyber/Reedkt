import {
  buildFilmModelDownloadReport,
  summarizeFilmModelDownloadReport,
} from '../activation/film-model-download'

const report = buildFilmModelDownloadReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeFilmModelDownloadReport(report))
