import { readMediaDataBetaGateSummary } from '../activation/media-data-beta-gate'

console.log(JSON.stringify(await readMediaDataBetaGateSummary(), null, 2))
