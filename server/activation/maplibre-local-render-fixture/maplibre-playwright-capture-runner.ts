import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { mapLibreLocalRenderConfig } from './maplibre-local-render-policy'
import { evaluateMapLibreNetworkRequest, findForbiddenMapNetworkRequests } from './maplibre-network-guard'
import type { LocalMapHtmlFixture, MapLibreRenderMetadata, NetworkRequestRecord } from './maplibre-local-render-types'

export async function runMapLibrePlaywrightCapture(input: {
  localFixture: LocalMapHtmlFixture
  outputRoot: string
}): Promise<{
  renderMetadata: MapLibreRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
}> {
  const server = await startLocalFixtureServer(input.localFixture.fixtureRoot)
  const localOrigin = `http://127.0.0.1:${server.port}`
  const fixtureUrl = `${localOrigin}/generated-map-page.html`
  const screenshotPath = path.join(input.outputRoot, 'maplibre-local-render-screenshot.png')
  const networkRequestsObserved: NetworkRequestRecord[] = []
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: {
        width: mapLibreLocalRenderConfig.viewport.width,
        height: mapLibreLocalRenderConfig.viewport.height,
      },
      deviceScaleFactor: mapLibreLocalRenderConfig.viewport.deviceScaleFactor,
    })
    await context.route('**/*', async (route) => {
      const request = route.request()
      const record = evaluateMapLibreNetworkRequest(request.url(), request.method(), request.resourceType(), localOrigin)
      networkRequestsObserved.push(record)
      if (record.allowed) {
        await route.continue()
      } else {
        await route.abort()
      }
    })
    const page = await context.newPage()
    await page.goto(fixtureUrl, { waitUntil: 'load', timeout: 30000 })
    await page.waitForFunction(() => window.__REEDITPRO_MAP_READY__ === true, undefined, { timeout: 30000 })
    const pageTitle = await page.title()
    const pageMetadata = await page.evaluate(() => ({
      readyMarkerObserved: window.__REEDITPRO_MAP_READY__ === true,
      renderMetadata: window.__REEDITPRO_MAP_METADATA__,
      mapError: window.__REEDITPRO_MAP_ERROR__ ?? null,
      mapLibreVersion: window.maplibregl?.version,
    }))
    if (pageMetadata.mapError) throw new Error(`MapLibre render reported error: ${pageMetadata.mapError}`)
    if (!pageMetadata.readyMarkerObserved || !pageMetadata.renderMetadata) throw new Error('MapLibre ready marker or metadata was not observed.')
    await page.screenshot({ path: screenshotPath, type: 'png', fullPage: false })
    await context.close()
    const sharp = await loadSharp()
    const metadata = await sharp(screenshotPath).metadata()
    const externalNetworkRequestsObserved = findForbiddenMapNetworkRequests(networkRequestsObserved)
    return {
      renderMetadata: {
        pageTitle,
        readyMarkerObserved: pageMetadata.readyMarkerObserved,
        mapLibreVersion: pageMetadata.mapLibreVersion,
        playwrightVersion: await packageVersion('playwright'),
        viewport: mapLibreLocalRenderConfig.viewport,
        renderMetadata: pageMetadata.renderMetadata,
        screenshotPath,
        screenshotDimensions: {
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
        },
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
      const normalized = requestPath === '/' ? '/generated-map-page.html' : requestPath
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
  if (!address || typeof address === 'string') throw new Error('Local MapLibre fixture server did not bind to a TCP port.')
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
    __REEDITPRO_MAP_READY__?: boolean
    __REEDITPRO_MAP_METADATA__?: MapLibreRenderMetadata['renderMetadata']
    __REEDITPRO_MAP_ERROR__?: string
    maplibregl?: { version?: string }
  }
}
