import { runDeckGlPlaywrightCapture, runDeckGlSharpScreenshotProcessing, writeDeckGlLocalHtmlFixture } from '../deckgl-local-overlay-fixture'
import type { DeckGlLocalFixtureData } from '../deckgl-local-overlay-fixture'
import { buildMapLibreLocalStyle, validateMapLibreLocalStyle } from '../maplibre-local-render-fixture'
import { buildWebSearchDeckGlPlanningOverlay } from './deckgl-planning-overlay-runner'
import type { WebSearchMap2DRenderResult, WebSearchMapPlanningGeoJson } from './web-search-map-planning-types'

export async function runWebSearchMapLibreDeckGlPlanningRender(input: {
  geojson: WebSearchMapPlanningGeoJson
  root: string
}): Promise<WebSearchMap2DRenderResult> {
  const style = buildMapLibreLocalStyle(input.geojson.fixture)
  const styleValidation = validateMapLibreLocalStyle(style)
  const { overlayData, layerManifest } = buildWebSearchDeckGlPlanningOverlay(input.geojson)
  const fixtureData: DeckGlLocalFixtureData = {
    source: 'phase50b_generated_fixture_code',
    approvedPhase50CRunId: 'phase50c-20260604T020852',
    fixture: input.geojson.fixture,
    style,
    styleValidation,
    overlayData,
    layerManifest,
  }
  const localFixture = await writeDeckGlLocalHtmlFixture({ fixtureData, root: input.root })
  const capture = await runDeckGlPlaywrightCapture({ localFixture, outputRoot: input.root })
  const sharpProcessing = await runDeckGlSharpScreenshotProcessing({
    screenshotPath: capture.renderMetadata.screenshotPath,
    outputRoot: input.root,
  })
  return {
    style,
    styleValidation,
    overlayData,
    layerManifest,
    renderMetadata: capture.renderMetadata,
    networkRequestsObserved: capture.networkRequestsObserved,
    externalNetworkRequestsObserved: capture.externalNetworkRequestsObserved,
    sharpProcessing,
  }
}
