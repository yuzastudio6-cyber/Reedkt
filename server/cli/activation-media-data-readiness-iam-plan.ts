import { buildMediaDataReadinessReports } from '../activation/media-data-readiness'

console.log(JSON.stringify(buildMediaDataReadinessReports().iamPlan, null, 2))
