import { buildMediaDataReadinessReports } from '../activation/media-data-readiness'

console.log(JSON.stringify(buildMediaDataReadinessReports().costSummary, null, 2))
