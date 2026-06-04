import { createHash } from 'node:crypto'
import { copyFile, mkdir, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import type { DeckGlLocalFixtureData, DeckGlLocalHtmlFixture } from './deckgl-local-overlay-types'

const require = createRequire(import.meta.url)

export async function writeDeckGlLocalHtmlFixture(input: {
  fixtureData: DeckGlLocalFixtureData
  root: string
}): Promise<DeckGlLocalHtmlFixture> {
  const fixtureRoot = path.join(input.root, 'fixture')
  const vendorRoot = path.join(fixtureRoot, 'vendor')
  await mkdir(vendorRoot, { recursive: true })
  const htmlPath = path.join(fixtureRoot, 'generated-deckgl-map-page.html')
  const stylePath = path.join(fixtureRoot, 'local-offline-style.json')
  const overlayDataPath = path.join(fixtureRoot, 'deckgl-overlay-data.json')
  const mapLibreJsPath = path.join(vendorRoot, 'maplibre-gl.js')
  const mapLibreCssPath = path.join(vendorRoot, 'maplibre-gl.css')
  const deckCoreJsPath = path.join(vendorRoot, 'deck-core.min.js')
  const deckLayersJsPath = path.join(vendorRoot, 'deck-layers.min.js')
  const deckMapboxJsPath = path.join(vendorRoot, 'deck-mapbox.min.js')

  await copyFile(require.resolve('maplibre-gl/dist/maplibre-gl.js'), mapLibreJsPath)
  await copyFile(require.resolve('maplibre-gl/dist/maplibre-gl.css'), mapLibreCssPath)
  await copyFile(localNodeModuleAsset('@deck.gl/core/dist.min.js'), deckCoreJsPath)
  await copyFile(localNodeModuleAsset('@deck.gl/layers/dist.min.js'), deckLayersJsPath)
  await copyFile(localNodeModuleAsset('@deck.gl/mapbox/dist.min.js'), deckMapboxJsPath)

  const html = buildDeckGlLocalHtml(input.fixtureData)
  await writeFile(htmlPath, html, 'utf8')
  await writeFile(stylePath, `${JSON.stringify(input.fixtureData.style, null, 2)}\n`, 'utf8')
  await writeFile(overlayDataPath, `${JSON.stringify(input.fixtureData.overlayData, null, 2)}\n`, 'utf8')
  const stats = await stat(htmlPath)
  return {
    fixtureRoot,
    htmlPath,
    stylePath,
    overlayDataPath,
    mapLibreJsPath,
    mapLibreCssPath,
    deckCoreJsPath,
    deckLayersJsPath,
    deckMapboxJsPath,
    title: 'ReeditPro deck.gl local overlay fixture',
    sha256: createHash('sha256').update(html).digest('hex'),
    sizeBytes: stats.size,
    localAssetCount: 7,
    externalAssetCount: 0,
  }
}

function buildDeckGlLocalHtml(input: DeckGlLocalFixtureData): string {
  const bbox = getBounds(input.fixture.combined.features.flatMap((feature) => collectCoordinates(feature.geometry.coordinates)))
  const center: [number, number] = [
    Math.round(((bbox[0] + bbox[2]) / 2) * 1000000) / 1000000,
    Math.round(((bbox[1] + bbox[3]) / 2) * 1000000) / 1000000,
  ]
  const labels = input.overlayData.points.map((point) => `<li><span>${escapeHtml(point.name)}</span><code>${point.position[1].toFixed(4)}, ${point.position[0].toFixed(4)}</code></li>`).join('\n')
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ReeditPro deck.gl local overlay fixture</title>
    <link rel="stylesheet" href="./vendor/maplibre-gl.css" />
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #eef3f0; color: #172033; }
      body { display: grid; grid-template-columns: minmax(0, 1fr) 318px; }
      #map { width: 100%; height: 100vh; }
      aside { height: 100vh; box-sizing: border-box; padding: 22px 20px; background: #ffffff; border-left: 1px solid #cfd7e3; box-shadow: -3px 0 14px rgba(23, 32, 51, 0.08); }
      h1 { margin: 0 0 10px; font-size: 22px; line-height: 1.1; }
      p { margin: 0 0 14px; color: #4f5a6f; line-height: 1.45; }
      .labels { display: flex; flex-wrap: wrap; gap: 7px; margin: 0 0 16px; }
      .label { border: 1px solid #9aa7b8; border-radius: 5px; padding: 5px 7px; font-size: 11px; font-weight: 800; text-transform: uppercase; background: #f6f8fb; }
      ul { margin: 14px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
      li { border: 1px solid #d9dee8; border-radius: 6px; padding: 8px; background: #fbfcfd; }
      li span { display: block; font-size: 13px; font-weight: 800; }
      code { display: block; margin-top: 4px; color: #4f5a6f; font-size: 11px; }
      .status { position: absolute; left: 18px; top: 18px; z-index: 2; padding: 8px 10px; border-radius: 6px; background: #ffffff; border: 1px solid #cfd7e3; font-size: 12px; font-weight: 800; box-shadow: 0 2px 10px rgba(23, 32, 51, 0.12); }
      .legend { position: absolute; left: 18px; bottom: 18px; z-index: 2; display: grid; gap: 6px; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.94); border: 1px solid #cfd7e3; font-size: 12px; font-weight: 700; }
      .swatch { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 7px; vertical-align: -1px; }
    </style>
  </head>
  <body>
    <div id="map" aria-label="Generated local/offline MapLibre and deck.gl overlay fixture"></div>
    <div class="status">local/offline MapLibre + deck.gl overlay</div>
    <div class="legend">
      <span><i class="swatch" style="background:#19a974"></i>Generated points</span>
      <span><i class="swatch" style="background:#d74848;border-radius:2px"></i>Generated paths</span>
      <span><i class="swatch" style="background:#7866d9"></i>Generated arcs</span>
    </div>
    <aside>
      <h1>ReeditPro deck.gl overlay fixture</h1>
      <p>Generated local data only. No live tiles, geocoding, routing, paid providers, D3, Three.js, or CesiumJS.</p>
      <div class="labels">
        <span class="label">deck.gl local</span>
        <span class="label">no live tiles</span>
        <span class="label">no geocoding</span>
        <span class="label">no routing</span>
      </div>
      <strong>Generated points</strong>
      <ul>${labels}</ul>
    </aside>
    <script src="./vendor/maplibre-gl.js"></script>
    <script src="./vendor/deck-core.min.js"></script>
    <script src="./vendor/deck-layers.min.js"></script>
    <script src="./vendor/deck-mapbox.min.js"></script>
    <script>
      window.__REEDITPRO_DECKGL_READY__ = false;
      window.__REEDITPRO_DECKGL_METADATA__ = null;
      const style = ${JSON.stringify(input.style)};
      const overlayData = ${JSON.stringify(input.overlayData)};
      const layerManifest = ${JSON.stringify(input.layerManifest)};
      const fixtureSummary = {
        bounds: ${JSON.stringify(bbox)},
        center: ${JSON.stringify(center)},
        pointCount: overlayData.points.length,
        pathCount: overlayData.paths.length,
        polygonCount: overlayData.polygons.length,
        arcCount: overlayData.arcs.length
      };
      const map = new maplibregl.Map({
        container: 'map',
        style,
        center: fixtureSummary.center,
        zoom: 12,
        attributionControl: false,
        interactive: false,
        preserveDrawingBuffer: true
      });
      map.on('error', (event) => {
        window.__REEDITPRO_DECKGL_ERROR__ = event && event.error ? String(event.error.message || event.error) : 'unknown map/deck error';
      });
      function buildLayers() {
        return [
          new deck.PolygonLayer({
            id: 'generated-polygon-layer',
            data: overlayData.polygons,
            getPolygon: d => d.polygon,
            getFillColor: [91, 134, 214, 48],
            getLineColor: [36, 77, 133, 220],
            getLineWidth: 3,
            lineWidthUnits: 'pixels',
            filled: true,
            stroked: true,
            pickable: false
          }),
          new deck.PathLayer({
            id: 'generated-path-layer',
            data: overlayData.paths,
            getPath: d => d.path,
            getColor: [224, 82, 82, 230],
            getWidth: d => 5 + Math.round(d.weight * 3),
            widthUnits: 'pixels',
            pickable: false
          }),
          new deck.ArcLayer({
            id: 'generated-arc-layer',
            data: overlayData.arcs,
            getSourcePosition: d => d.sourcePosition,
            getTargetPosition: d => d.targetPosition,
            getSourceColor: [120, 102, 217, 210],
            getTargetColor: [27, 157, 117, 210],
            getWidth: d => 2 + Math.round(d.weight * 3),
            pickable: false
          }),
          new deck.ScatterplotLayer({
            id: 'generated-scatterplot-layer',
            data: overlayData.points,
            getPosition: d => d.position,
            getRadius: d => 58 + Math.round(d.weight * 22),
            radiusUnits: 'meters',
            getFillColor: [25, 169, 116, 230],
            getLineColor: [255, 255, 255, 240],
            lineWidthUnits: 'pixels',
            getLineWidth: 2,
            pickable: false
          })
        ];
      }
      map.once('load', () => {
        map.fitBounds([[fixtureSummary.bounds[0], fixtureSummary.bounds[1]], [fixtureSummary.bounds[2], fixtureSummary.bounds[3]]], { padding: 74, duration: 0 });
        const OverlayCtor = deck.MapboxOverlay || (window.deck && window.deck.MapboxOverlay);
        if (!OverlayCtor) {
          window.__REEDITPRO_DECKGL_ERROR__ = 'deck.gl MapboxOverlay was not available from the local bundle.';
          return;
        }
        const overlay = new OverlayCtor({ interleaved: false, layers: buildLayers() });
        map.addControl(overlay);
        window.__REEDITPRO_DECKGL_OVERLAY__ = overlay;
      });
      map.once('idle', () => {
        requestAnimationFrame(() => {
          if (window.__REEDITPRO_DECKGL_ERROR__) return;
          const currentStyle = map.getStyle();
          window.__REEDITPRO_DECKGL_METADATA__ = {
            mapLibreSourceCount: Object.keys(currentStyle.sources || {}).length,
            mapLibreLayerCount: (currentStyle.layers || []).length,
            deckGlLayerCount: layerManifest.layers.length,
            pointCount: fixtureSummary.pointCount,
            pathCount: fixtureSummary.pathCount,
            polygonCount: fixtureSummary.polygonCount,
            arcCount: fixtureSummary.arcCount,
            bounds: fixtureSummary.bounds,
            center: fixtureSummary.center,
            labelsRenderedAsHtmlOverlay: true,
            mapboxOverlayAttached: Boolean(window.__REEDITPRO_DECKGL_OVERLAY__)
          };
          window.__REEDITPRO_DECKGL_READY__ = true;
        });
      });
    </script>
  </body>
</html>
`
}

function collectCoordinates(value: unknown): [number, number][] {
  if (!Array.isArray(value)) return []
  if (typeof value[0] === 'number' && typeof value[1] === 'number') return [[value[0], value[1]]]
  return value.flatMap((entry) => collectCoordinates(entry))
}

function getBounds(coordinates: [number, number][]): [number, number, number, number] {
  const lons = coordinates.map((coord) => coord[0])
  const lats = coordinates.map((coord) => coord[1])
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function localNodeModuleAsset(packageRelativePath: string): string {
  return path.join(process.cwd(), 'node_modules', packageRelativePath)
}
