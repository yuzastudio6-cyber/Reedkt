import { readSignalsmithControlledRuntimeSummary } from '../activation/signalsmith-stretch-runtime/controlled'

console.log(JSON.stringify(await readSignalsmithControlledRuntimeSummary(), null, 2))
