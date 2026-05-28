import type { FirstRealVideoArtifact, FirstRealVideoRuntimeReport } from './first-real-video-types'

export function listFirstRealVideoArtifacts(report?: FirstRealVideoRuntimeReport): FirstRealVideoArtifact[] {
  return report?.artifacts ?? []
}
