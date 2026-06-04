import { runWebSearchCesiumPlanningScene } from './cesiumjs-planning-scene-runner'
import { runWebSearchMapLibreDeckGlPlanningRender } from './maplibre-planning-render-runner'
import type { WebSearchMap2DRenderResult, WebSearchMap3DRenderResult, WebSearchMapPlanningGeoJson } from './web-search-map-planning-types'

export async function runWebSearchMapPlanningCaptures(input: {
  geojson: WebSearchMapPlanningGeoJson
  root2d: string
  root3d: string
}): Promise<{ map2D: WebSearchMap2DRenderResult; map3D: WebSearchMap3DRenderResult }> {
  const map2D = await runWebSearchMapLibreDeckGlPlanningRender({ geojson: input.geojson, root: input.root2d })
  const map3D = await runWebSearchCesiumPlanningScene({ geojson: input.geojson, root: input.root3d })
  return { map2D, map3D }
}
