import { buildFixturePrefix, stagingFixtureBuckets } from './staging-fixture-storage-client'
import type { StagingFixtureArtifact } from './staging-fixture-e2e-types'

export function expectedStagingFixtureArtifacts(runId: string): StagingFixtureArtifact[] {
  const prefix = buildFixturePrefix(runId)
  return [
    artifact('source_fixture', stagingFixtureBuckets.source, `${prefix}/fixture.mp4`, true),
    artifact('proxy_video', stagingFixtureBuckets.proxy, `${prefix}/proxy/proxy.mp4`, true),
    artifact('media_analysis', stagingFixtureBuckets.analysis, `${prefix}/analysis/media-analysis.json`, true),
    artifact('timeline_manifest', stagingFixtureBuckets.analysis, `${prefix}/analysis/timeline-manifest.json`, true),
    artifact('transcript', stagingFixtureBuckets.transcripts, `${prefix}/transcripts/transcript.json`, true),
    artifact('preview', stagingFixtureBuckets.previews, `${prefix}/previews/preview.mp4`, true),
    artifact('render_manifest', stagingFixtureBuckets.previews, `${prefix}/previews/render-manifest.json`, true),
    artifact('final_export', stagingFixtureBuckets.finalExports, `${prefix}/final-exports/final-export.mp4`, true),
    artifact('qa_summary', stagingFixtureBuckets.qa, `${prefix}/qa/qa-summary.json`, true),
  ]
}

export function mergeArtifactVerification(runId: string, verifiedObjects: string[]): StagingFixtureArtifact[] {
  const verified = new Set(verifiedObjects)
  return expectedStagingFixtureArtifacts(runId).map((item) => ({
    ...item,
    exists: verified.has(`gs://${item.bucket}/${item.object}`),
  }))
}

function artifact(kind: string, bucket: string, object: string, sourceOfTruth: boolean): StagingFixtureArtifact {
  return { kind, bucket, object, exists: false, private: true, sourceOfTruth }
}
