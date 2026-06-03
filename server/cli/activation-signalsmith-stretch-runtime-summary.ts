import { readSignalsmithRuntimeSummary } from '../activation/signalsmith-stretch-runtime'

console.log(JSON.stringify(await readSignalsmithRuntimeSummary(), null, 2))
