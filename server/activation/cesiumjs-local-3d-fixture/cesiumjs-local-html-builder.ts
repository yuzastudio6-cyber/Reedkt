import { createHash } from 'node:crypto'
import { cp, mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { CesiumJsLocalFixtureData, CesiumJsLocalHtmlFixture } from './cesiumjs-local-3d-types'

export async function writeCesiumJsLocalHtmlFixture(input: {
  fixtureData: CesiumJsLocalFixtureData
  root: string
}): Promise<CesiumJsLocalHtmlFixture> {
  const fixtureRoot = path.join(input.root, 'fixture')
  const vendorRoot = path.join(fixtureRoot, 'vendor')
  const cesiumRootPath = path.join(vendorRoot, 'cesium')
  await mkdir(vendorRoot, { recursive: true })
  await cp(path.join(process.cwd(), 'node_modules', 'cesium', 'Build', 'Cesium'), cesiumRootPath, { recursive: true })
  const htmlPath = path.join(fixtureRoot, 'generated-cesium-3d-page.html')
  const html = buildCesiumLocalHtml(input.fixtureData)
  await writeFile(htmlPath, html, 'utf8')
  const stats = await stat(htmlPath)
  return {
    fixtureRoot,
    htmlPath,
    cesiumRootPath,
    title: 'ReeditPro CesiumJS local 3D planning fixture',
    sha256: createHash('sha256').update(html).digest('hex'),
    sizeBytes: stats.size,
    localAssetCount: await countFiles(cesiumRootPath) + 1,
    externalAssetCount: 0,
  }
}

function buildCesiumLocalHtml(input: CesiumJsLocalFixtureData): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ReeditPro CesiumJS local 3D planning fixture</title>
    <script>window.CESIUM_BASE_URL = './vendor/cesium/';</script>
    <script src="./vendor/cesium/Cesium.js"></script>
    <link rel="stylesheet" href="./vendor/cesium/Widgets/widgets.css" />
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #0b1120; color: #f8fbff; }
      body { display: grid; grid-template-columns: minmax(0, 1fr) 326px; }
      #cesiumContainer { width: 100%; height: 100vh; }
      aside { height: 100vh; box-sizing: border-box; padding: 22px 20px; background: #101827; border-left: 1px solid #31405a; box-shadow: -3px 0 18px rgba(0, 0, 0, 0.24); }
      h1 { margin: 0 0 10px; font-size: 22px; line-height: 1.1; }
      p { margin: 0 0 14px; color: #b6c3d6; line-height: 1.45; }
      .labels { display: flex; flex-wrap: wrap; gap: 7px; margin: 0 0 16px; }
      .label { border: 1px solid #53657e; border-radius: 5px; padding: 5px 7px; font-size: 11px; font-weight: 800; text-transform: uppercase; background: #182235; }
      ul { margin: 14px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
      li { border: 1px solid #2d3b52; border-radius: 6px; padding: 8px; background: #0d1524; }
      li span { display: block; font-size: 13px; font-weight: 800; }
      code { display: block; margin-top: 4px; color: #9fb0c7; font-size: 11px; }
      .status { position: absolute; left: 18px; top: 18px; z-index: 2; padding: 8px 10px; border-radius: 6px; background: #101827; border: 1px solid #31405a; font-size: 12px; font-weight: 800; box-shadow: 0 2px 10px rgba(0,0,0,0.28); }
      .local-scene-frame { position: absolute; left: 28px; right: 348px; bottom: 26px; z-index: 2; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; pointer-events: none; }
      .local-scene-frame span { height: 6px; border-radius: 999px; background: linear-gradient(90deg, #2dd4bf, #f97316, #a78bfa); box-shadow: 0 0 18px rgba(45, 212, 191, 0.42); opacity: 0.86; }
      .cesium-widget-credits { display: none !important; }
    </style>
  </head>
  <body>
    <div id="cesiumContainer" aria-label="Generated local/offline CesiumJS 3D planning fixture"></div>
    <div class="status">local/offline CesiumJS 3D planning fixture</div>
    <div class="local-scene-frame" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
    <aside>
      <h1>ReeditPro CesiumJS local 3D planning fixture</h1>
      <p>Generated local data only. No Cesium ion, live terrain, live imagery, 3D Tiles, geocoding, routing, or paid providers.</p>
      <div class="labels">
        <span class="label">no ion</span>
        <span class="label">no terrain</span>
        <span class="label">no imagery</span>
        <span class="label">no 3D Tiles</span>
        <span class="label">no geocoding</span>
        <span class="label">no routing</span>
      </div>
      <strong>Generated 3D entities</strong>
      <ul>
        <li><span>Points</span><code>${input.planningData.points.length}</code></li>
        <li><span>Routes</span><code>${input.planningData.routes.length}</code></li>
        <li><span>Polygons</span><code>${input.planningData.polygons.length}</code></li>
        <li><span>Vertical markers</span><code>${input.planningData.verticalMarkers.length}</code></li>
      </ul>
    </aside>
    <script>
      window.__REEDITPRO_CESIUM_READY__ = false;
      window.__REEDITPRO_CESIUM_METADATA__ = null;
      window.__REEDITPRO_CESIUM_ERROR__ = null;
      const planningData = ${JSON.stringify(input.planningData)};
      const sceneConfig = ${JSON.stringify(input.sceneConfig)};
      try {
        Cesium.Ion.defaultAccessToken = '';
        const viewer = new Cesium.Viewer('cesiumContainer', {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          baseLayer: false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          requestRenderMode: false,
          shouldAnimate: false
        });
        viewer.imageryLayers.removeAll();
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1c355f');
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
        if (viewer.scene.sun) viewer.scene.sun.show = false;
        if (viewer.scene.moon) viewer.scene.moon.show = false;
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0b1120');

        for (const point of planningData.points) {
          const coords = point.coordinates;
          viewer.entities.add({
            id: point.entityId,
            name: point.name,
            position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1], coords[2]),
            point: { pixelSize: 26, color: Cesium.Color.fromCssColorString('#2dd4bf'), outlineColor: Cesium.Color.WHITE, outlineWidth: 3, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: {
              text: point.name,
              font: '12px sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -22),
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#111827').withAlpha(0.82),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        }
        for (const route of planningData.routes) {
          viewer.entities.add({
            id: route.entityId,
            name: route.name,
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights(route.coordinates.flat()),
              width: 10,
              material: Cesium.Color.fromCssColorString('#f97316')
            }
          });
        }
        for (const polygon of planningData.polygons) {
          viewer.entities.add({
            id: polygon.entityId,
            name: polygon.name,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights(polygon.coordinates.flat()),
              material: Cesium.Color.fromCssColorString('#60a5fa').withAlpha(0.26),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#bfdbfe'),
              perPositionHeight: true,
              extrudedHeight: (polygon.heightMeters || 20) + 180
            }
          });
        }
        for (const marker of planningData.verticalMarkers) {
          const coords = marker.coordinates;
          viewer.entities.add({
            id: marker.entityId,
            name: marker.name,
            position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1], marker.heightMeters / 2),
            cylinder: {
              length: marker.heightMeters + 360,
              topRadius: 140,
              bottomRadius: 220,
              material: Cesium.Color.fromCssColorString('#a78bfa').withAlpha(0.68),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#ede9fe')
            }
          });
        }
        const camera = sceneConfig.initialCamera;
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(camera.destination.lon, camera.destination.lat, camera.destination.heightMeters),
          orientation: {
            heading: Cesium.Math.toRadians(camera.orientation.headingDegrees),
            pitch: Cesium.Math.toRadians(camera.orientation.pitchDegrees),
            roll: Cesium.Math.toRadians(camera.orientation.rollDegrees)
          }
        });
        viewer.zoomTo(viewer.entities);
        viewer.scene.requestRender();
        setTimeout(() => {
          const cartographic = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC);
          window.__REEDITPRO_CESIUM_METADATA__ = {
            cesiumEntityCount: viewer.entities.values.length,
            pointCount: planningData.points.length,
            routeCount: planningData.routes.length,
            polygonCount: planningData.polygons.length,
            verticalMarkerCount: planningData.verticalMarkers.length,
            cameraPosition: {
              longitudeDegrees: Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(6)),
              latitudeDegrees: Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(6)),
              heightMeters: Math.round(cartographic.height)
            },
            cameraHeadingPitchRollDegrees: {
              heading: Number(Cesium.Math.toDegrees(viewer.camera.heading).toFixed(3)),
              pitch: Number(Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(3)),
              roll: Number(Cesium.Math.toDegrees(viewer.camera.roll).toFixed(3))
            },
            cesiumIonTokenEmpty: Cesium.Ion.defaultAccessToken === '',
            baseLayerDisabled: viewer.imageryLayers.length === 0,
            ellipsoidTerrainUsed: viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider
          };
          window.__REEDITPRO_CESIUM_READY__ = true;
        }, 900);
      } catch (error) {
        window.__REEDITPRO_CESIUM_ERROR__ = error && error.message ? error.message : String(error);
      }
    </script>
  </body>
</html>
`
}

async function countFiles(root: string): Promise<number> {
  const { readdir } = await import('node:fs/promises')
  const entries = await readdir(root, { withFileTypes: true })
  let count = 0
  for (const entry of entries) {
    if (entry.isDirectory()) count += await countFiles(path.join(root, entry.name))
    if (entry.isFile()) count += 1
  }
  return count
}
