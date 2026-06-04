import {
  readDesktopBetaReadinessGateSummary,
  writeDesktopBetaReadinessGateArtifacts,
} from '../activation/desktop-beta-readiness-gate'

await writeDesktopBetaReadinessGateArtifacts()

console.log(JSON.stringify(readDesktopBetaReadinessGateSummary(), null, 2))
