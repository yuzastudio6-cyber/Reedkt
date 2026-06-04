import { readAudioTimingBetaGateSummary } from '../activation/audio-timing-beta-gate'

console.log(JSON.stringify(await readAudioTimingBetaGateSummary(), null, 2))
