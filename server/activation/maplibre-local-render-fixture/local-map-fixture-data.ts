import { buildGeneratedGeoJsonFixture } from '../maplibre-turf-fixture'
import { buildMapLibreLocalStyle, validateMapLibreLocalStyle } from './maplibre-local-style-builder'
import type { LocalMapFixtureData } from './maplibre-local-render-types'

export function buildLocalMapFixtureData(): LocalMapFixtureData {
  const fixture = buildGeneratedGeoJsonFixture()
  const style = buildMapLibreLocalStyle(fixture)
  const styleValidation = validateMapLibreLocalStyle(style)
  return {
    source: 'phase50b_generated_fixture_code',
    approvedPhase50BRunId: 'phase50b-20260604T01114',
    fixture,
    style,
    styleValidation,
  }
}
