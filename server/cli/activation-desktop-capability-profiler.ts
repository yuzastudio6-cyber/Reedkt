import {
  readDesktopCapabilityProfilerSummary,
  writeDesktopCapabilityProfilerArtifacts,
} from '../activation/desktop-capability-profiler'

const includeLocalProfile = process.argv.includes('--local-profile') && process.argv.includes('--execute')

await writeDesktopCapabilityProfilerArtifacts(undefined, { includeLocalProfile })

console.log(JSON.stringify(readDesktopCapabilityProfilerSummary(), null, 2))
