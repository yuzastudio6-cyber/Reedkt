import {
  readWebCapabilityProfilerSummary,
  writeWebCapabilityProfilerArtifacts,
} from '../activation/web-capability-profiler'

await writeWebCapabilityProfilerArtifacts()

console.log(JSON.stringify(readWebCapabilityProfilerSummary(), null, 2))
