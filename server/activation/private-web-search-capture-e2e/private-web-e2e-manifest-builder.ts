import type {
  PrivateFixturePage,
  PrivateWebCaptureMetadata,
  PrivateWebE2EArtifact,
  PrivateWebE2EManifest,
  PrivateWebExtractionRecord,
  PrivateWebSharpMetadata,
  PrivateWebSourceRecord,
} from './private-web-search-capture-e2e-types'

export function buildPrivateWebE2EManifest(input: {
  runId: string
  providerMode: 'private_fixture_provider' | 'private_searxng_endpoint'
  sources: PrivateWebSourceRecord[]
  fixturePages: PrivateFixturePage[]
  captures: PrivateWebCaptureMetadata[]
  sharpProcessing: PrivateWebSharpMetadata[]
  extractions: PrivateWebExtractionRecord[]
  artifacts: PrivateWebE2EArtifact[]
  warnings: string[]
  blockers: string[]
}): PrivateWebE2EManifest {
  return {
    runId: input.runId,
    providerMode: input.providerMode,
    sourceCount: input.sources.length,
    captureCount: input.captures.length,
    extractionCount: input.extractions.length,
    sources: input.sources.map((source) => {
      const fixturePage = input.fixturePages.find((page) => page.sourceId === source.sourceId)
      const capture = input.captures.find((item) => item.sourceId === source.sourceId)
      const sharp = input.sharpProcessing.find((item) => item.sourceId === source.sourceId)
      const extraction = input.extractions.find((item) => item.sourceId === source.sourceId)
      if (!fixturePage || !capture || !sharp || !extraction) throw new Error(`Missing manifest linkage for ${source.sourceId}.`)
      const captureManifest = {
        sourceId: capture.sourceId,
        browser: capture.browser,
        urlType: capture.urlType,
        fixtureUrl: capture.fixtureUrl,
        pageTitle: capture.pageTitle,
        viewport: capture.viewport,
        fullPage: capture.fullPage,
        publicWebCaptureUsed: capture.publicWebCaptureUsed,
        publicNetworkRequests: capture.publicNetworkRequests,
        capturedAt: capture.capturedAt,
        dom: capture.dom,
        screenshotDimensions: capture.screenshotDimensions,
      }
      const sharpManifest = {
        sourceId: sharp.sourceId,
        original: sharp.original,
        preview: sharp.preview,
        thumbnail: sharp.thumbnail,
        processedAt: sharp.processedAt,
        remoteImagesFetched: sharp.remoteImagesFetched,
      }
      return {
        source,
        fixturePage: {
          sourceId: fixturePage.sourceId,
          title: fixturePage.title,
          url: fixturePage.url,
          sizeBytes: fixturePage.sizeBytes,
          sha256: fixturePage.sha256,
        },
        capture: captureManifest,
        sharp: sharpManifest,
        extraction,
      }
    }),
    artifacts: input.artifacts,
    liveSearchUsed: false,
    paidProviderUsed: false,
    publicWebCaptureUsed: false,
    publicWebExtractionUsed: false,
    publicArtifactUsed: false,
    warnings: input.warnings,
    blockers: input.blockers,
  }
}
