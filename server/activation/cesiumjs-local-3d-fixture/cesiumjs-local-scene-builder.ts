import type { Cesium3DPlanningData, CesiumLocalSceneConfig } from './cesiumjs-local-3d-types'

export function validateCesiumLocalScene(input: {
  planningData: Cesium3DPlanningData
  sceneConfig: CesiumLocalSceneConfig
}) {
  const blockers = [
    ...input.sceneConfig.validation.blockers,
    ...(input.sceneConfig.cesiumIonAccessToken === '' ? [] : ['Cesium ion token must be empty.']),
    ...(input.sceneConfig.baseLayer === false ? [] : ['Cesium baseLayer must be false.']),
    ...(input.sceneConfig.terrainProvider === 'EllipsoidTerrainProvider' ? [] : ['Cesium terrain provider must be EllipsoidTerrainProvider.']),
    ...(input.sceneConfig.imageryProvider === 'none' ? [] : ['Cesium imagery provider must be none.']),
    ...(input.sceneConfig.threeDTiles === false ? [] : ['3D Tiles must be disabled.']),
    ...(input.sceneConfig.geocoder === false ? [] : ['Cesium geocoder must be disabled.']),
    ...(input.planningData.generatedFixture ? [] : ['Cesium planning data must be generated fixture data.']),
    ...(input.planningData.userLocationUsed === false ? [] : ['Cesium planning data must not use user location.']),
    ...(input.planningData.geocodingUsed === false ? [] : ['Cesium planning data must not use geocoding.']),
    ...(input.planningData.routingUsed === false ? [] : ['Cesium planning data must not use routing.']),
  ]
  return {
    valid: blockers.length === 0,
    blockers,
    warnings: input.sceneConfig.validation.warnings,
  }
}
