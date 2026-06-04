import {
  readDesktopCapabilityProfilerSummary,
  writeDesktopCapabilityProfilerArtifacts,
} from '../activation/desktop-capability-profiler'

await writeDesktopCapabilityProfilerArtifacts()

console.log(JSON.stringify(readDesktopCapabilityProfilerSummary(), null, 2))
