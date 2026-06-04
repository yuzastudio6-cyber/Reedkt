import { readDemucsProvenanceSummary } from '../activation/demucs-provenance-approval'

console.log(JSON.stringify(await readDemucsProvenanceSummary(), null, 2))
