import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { cesiumJsLocal3DConfig } from './cesiumjs-local-3d-policy'
import { evaluateCesiumNetworkRequest, findForbiddenCesiumNetworkRequests } from './cesiumjs-network-guard'
import type { CesiumJsLocalHtmlFixture, CesiumRenderMetadata } from './cesiumjs-local-3d-types'
import type { NetworkRequestRecord } from '../maplibre-local-render-fixture'

export async function runCesiumJsPlaywrightCapture(input: {
  localFixture: CesiumJsLocalHtmlFixture
  outputRoot: string
}): Promise<{
  renderMetadata: CesiumRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
}> {
  const server = await startLocalFixtureServer(input.localFixture.fixtureRoot)
  const localOrigin = `http://127.0.0.1:${server.port}`
  const fixtureUrl = `${localOrigin}/generated-cesium-3d-page.html`
  const screenshotPath = path.join(input.outputRoot, 'cesiumjs-local-3d-screenshot.png')
  const networkRequestsObserved: NetworkRequestRecord[] = []
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader'],
  })
  try {
    const context = await browser.newContext({
      viewport: {
        width: cesiumJsLocal3DConfig.viewport.width,
        height: cesiumJsLocal3DConfig.viewport.height,
      },
      deviceScaleFactor: cesiumJsLocal3DConfig.viewport.deviceScaleFactor,
    })
    await context.route('**/*', async (route) => {
      const request = route.request()
      const record = evaluateCesiumNetworkRequest(request.url(), request.method(), request.resourceType(), localOrigin)
      networkRequestsObserved.push(record)
      if (record.allowed) await route.continue()
      else await route.abort()
    })
    const page = await context.newPage()
    await page.goto(fixtureUrl, { waitUntil: 'load', timeout: 60000 })
    await page.waitForFunction(() => window.__REEDITPRO_CESIUM_READY__ === true, undefined, { timeout: 60000 })
    const pageTitle = await page.title()
    const pageMetadata = await page.evaluate(() => ({
      readyMarkerObserved: window.__REEDITPRO_CESIUM_READY__ === true,
      renderMetadata: window.__REEDITPRO_CESIUM_METADATA__,
      cesiumError: window.__REEDITPRO_CESIUM_ERROR__ ?? null,
      cesiumVersion: window.Cesium?.VERSION,
    }))
    if (pageMetadata.cesiumError) throw new Error(`CesiumJS local 3D render reported error: ${pageMetadata.cesiumError}`)
    if (!pageMetadata.readyMarkerObserved || !pageMetadata.renderMetadata) throw new Error('CesiumJS ready marker or metadata was not observed.')
    await page.screenshot({ path: screenshotPath, type: 'png', fullPage: false })
    await context.close()
    const sharp = await loadSharp()
    const metadata = await sharp(screenshotPath).metadata()
    const externalNetworkRequestsObserved = findForbiddenCesiumNetworkRequests(networkRequestsObserved)
    return {
      renderMetadata: {
        pageTitle,
        readyMarkerObserved: pageMetadata.readyMarkerObserved,
        cesiumVersion: pageMetadata.cesiumVersion,
        playwrightVersion: await packageVersion('playwright'),
        viewport: cesiumJsLocal3DConfig.viewport,
        renderMetadata: pageMetadata.renderMetadata,
        screenshotPath,
        screenshotDimensions: { width: metadata.width ?? 0, height: metadata.height ?? 0 },
        capturedAt: new Date().toISOString(),
      },
      networkRequestsObserved,
      externalNetworkRequestsObserved,
    }
  } finally {
    await browser.close()
    await server.close()
  }
}

async function startLocalFixtureServer(root: string): Promise<{ port: number; close: () => Promise<void> }> {
  const server = createServer(async (req, res) => {
    try {
      const requestPath = decodeURIComponent((req.url ?? '/').split('?')[0])
      const normalized = requestPath === '/' ? '/generated-cesium-3d-page.html' : requestPath
      const relative = normalized.replace(/^\/+/, '')
      if (relative.includes('..')) {
        res.writeHead(403)
        res.end('forbidden')
        return
      }
      const filePath = path.join(root, relative)
      if (!filePath.startsWith(root)) {
        res.writeHead(403)
        res.end('forbidden')
        return
      }
      const body = await readFile(filePath)
      res.writeHead(200, { 'content-type': contentType(filePath) })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('not found')
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Local CesiumJS fixture server did not bind to a TCP port.')
  return {
    port: address.port,
    close: () => new Promise<void>((resolve, reject) => server.close((error?: Error) => error ? reject(error) : resolve())),
  }
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8'
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8'
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8'
  if (filePath.endsWith('.png')) return 'image/png'
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg'
  if (filePath.endsWith('.wasm')) return 'application/wasm'
  return 'application/octet-stream'
}

async function packageVersion(packageName: string): Promise<string | undefined> {
  try {
    const packageJson = JSON.parse(await readFile(`node_modules/${packageName}/package.json`, 'utf8')) as { version?: string }
    return packageJson.version
  } catch {
    return undefined
  }
}

async function loadSharp() {
  const module = await import('sharp')
  return module.default
}

declare global {
  interface Window {
    __REEDITPRO_CESIUM_READY__?: boolean
    __REEDITPRO_CESIUM_METADATA__?: CesiumRenderMetadata['renderMetadata']
    __REEDITPRO_CESIUM_ERROR__?: string
    Cesium?: { VERSION?: string }
  }
}
