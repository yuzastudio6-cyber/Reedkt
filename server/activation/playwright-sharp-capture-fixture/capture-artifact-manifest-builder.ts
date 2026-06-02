import type {
  CaptureArtifactManifest,
  PlaywrightCaptureMetadata,
  PlaywrightSharpCaptureArtifact,
  SharpPostprocessMetadata,
} from './playwright-sharp-capture-types'

export function buildCaptureArtifactManifest(input: {
  runId: string
  playwrightCapture: PlaywrightCaptureMetadata
  sharpProcessing: SharpPostprocessMetadata
  artifacts: PlaywrightSharpCaptureArtifact[]
  warnings: string[]
  blockers: string[]
}): CaptureArtifactManifest {
  return {
    runId: input.runId,
    fixtureMode: 'generated_local_html_capture',
    sourcePlan: 'generated_fixture',
    publicWebCaptureUsed: false,
    liveSearchUsed: false,
    paidProviderUsed: false,
    readabilityExtractionUsed: false,
    playwright: input.playwrightCapture,
    sharp: input.sharpProcessing,
    artifacts: input.artifacts,
    warnings: Array.from(new Set(input.warnings)),
    blockers: Array.from(new Set(input.blockers)),
  }
}
