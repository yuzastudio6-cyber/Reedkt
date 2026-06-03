import { buildSignalsmithRuntimeCostSummary } from '../activation/signalsmith-stretch-runtime'

console.log(JSON.stringify(buildSignalsmithRuntimeCostSummary(), null, 2))
