import { readMediaDataReportingQaSummary } from '../activation/media-data-reporting-qa'

console.log(JSON.stringify(await readMediaDataReportingQaSummary(), null, 2))
