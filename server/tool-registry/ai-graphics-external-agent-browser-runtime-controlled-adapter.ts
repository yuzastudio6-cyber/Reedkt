import { createHash } from 'node:crypto'
import fs from 'node:fs'
import http, { type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { chromium } from 'playwright'

import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_DECISION =
  'ai_graphics_external_agent_browser_runtime_controlled_adapter_executable_seven_with_global_blocks'

export const AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS = [
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

export type AiGraphicsExternalAgentBrowserRuntimeControlledAdapterToolId =
  (typeof AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS)[number]

export type AiGraphicsExternalAgentBrowserRuntimeControlledAdapterStatus =
  | 'controlled_browser_runtime_adapter_executed_private_metadata_ready'
  | 'controlled_browser_runtime_adapter_rejected_unsupported_tool'

export interface AiGraphicsExternalAgentBrowserRuntimeControlledAdapterRequest {
  requestId: string
  toolId: AiGraphicsCanonicalToolId
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  toolRouteApprovalRef: string
  workerApprovalRef: string
  browserRuntimeProofRef: string
  traceId: string
  payload?: unknown
}

export interface AiGraphicsExternalAgentBrowserRuntimeControlledAdapterOutput {
  outputKind: 'browser_runtime_private_metadata'
  mediaType: 'application/json'
  privateArtifactExtension: '.json'
  privateArtifactBytes: number
  privateArtifactSha256: string
  summary: Record<string, unknown>
}

export interface AiGraphicsExternalAgentBrowserRuntimeControlledAdapterResult {
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_DECISION
  status: AiGraphicsExternalAgentBrowserRuntimeControlledAdapterStatus
  requestId: string
  traceId: string
  toolId: AiGraphicsCanonicalToolId
  controlledAdapterExecutableNow: boolean
  controlledAdapterExecutedNow: boolean
  localBrowserRuntimePackageExecutionPerformed: boolean
  externalAgentCanExecuteViaMountedRouteNow: false
  routeExecutionApprovedNow: false
  workerExecutionApprovedNow: false
  toolExecutionApprovedNow: false
  browserWebglCanvasRuntimeApprovedForScopedControlledRoute: boolean
  browserRuntimeStartedByScopedRoute: boolean
  gpuRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  providerRuntimeApprovedNow: false
  publicArtifactCreated: false
  signedUrlCreated: false
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
  privateArtifactManifestRef: string
  output: AiGraphicsExternalAgentBrowserRuntimeControlledAdapterOutput | null
  blockersBeforeGlobalExternalRouteExecution: string[]
}

const browserRuntimeProofPath =
  'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json'

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function privateOutput(
  value: string,
  summary: Record<string, unknown>,
): AiGraphicsExternalAgentBrowserRuntimeControlledAdapterOutput {
  return {
    outputKind: 'browser_runtime_private_metadata',
    mediaType: 'application/json',
    privateArtifactExtension: '.json',
    privateArtifactBytes: Buffer.byteLength(value),
    privateArtifactSha256: sha256(value),
    summary,
  }
}

function privateRef(value: string, field: string): void {
  if (!value.startsWith('private://')) {
    throw new Error(`${field} must be a private:// reference`)
  }
}

function assertRequestBoundary(
  request: AiGraphicsExternalAgentBrowserRuntimeControlledAdapterRequest,
): void {
  if (!request.requestId) throw new Error('requestId is required')
  if (!request.approvedPlanSnapshotId) throw new Error('approvedPlanSnapshotId is required')
  if (!request.creditReservationId) throw new Error('creditReservationId is required')
  if (!request.traceId) throw new Error('traceId is required')
  privateRef(request.privateArtifactManifestRef, 'privateArtifactManifestRef')
  privateRef(request.toolRouteApprovalRef, 'toolRouteApprovalRef')
  privateRef(request.workerApprovalRef, 'workerApprovalRef')
  privateRef(request.browserRuntimeProofRef, 'browserRuntimeProofRef')
}

export function isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool(
  toolId: AiGraphicsCanonicalToolId | string,
): toolId is AiGraphicsExternalAgentBrowserRuntimeControlledAdapterToolId {
  return AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS.includes(
    toolId as AiGraphicsExternalAgentBrowserRuntimeControlledAdapterToolId,
  )
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html'
  if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) return 'text/javascript'
  if (filePath.endsWith('.json')) return 'application/json'
  if (filePath.endsWith('.wasm')) return 'application/wasm'
  if (filePath.endsWith('.css')) return 'text/css'
  return 'text/plain'
}

async function startLocalServer(): Promise<{ server: Server, baseUrl: string }> {
  const root = process.cwd()
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1')
    if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
      response.setHeader('content-type', 'text/html')
      response.end(`<!doctype html>
<html>
  <body>
    <div id="chart" style="width:320px;height:240px"></div>
    <div id="lottie"></div>
    <div id="anime-target" style="width:10px;height:10px"></div>
    <div id="konva"></div>
    <canvas id="three-canvas" width="64" height="64"></canvas>
  </body>
</html>`)
      return
    }

    const filePath = path.resolve(root, `.${decodeURIComponent(requestUrl.pathname)}`)
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.statusCode = 404
      response.end('not found')
      return
    }
    response.setHeader('content-type', contentType(filePath))
    fs.createReadStream(filePath).pipe(response)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server.address() as AddressInfo
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  }
}

function readBrowserRuntimeProof(toolId: AiGraphicsExternalAgentBrowserRuntimeControlledAdapterToolId) {
  const proofPath = path.join(process.cwd(), browserRuntimeProofPath)
  const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8')) as any
  const sourceTool = Array.isArray(proof.tools)
    ? proof.tools.find((tool: any) => tool.toolId === toolId)
    : undefined
  if (proof.decision !== 'ai_graphics_browser_runtime_proof_completed_with_warnings') {
    throw new Error('browser runtime proof decision is not accepted')
  }
  if (!sourceTool || !String(sourceTool.status ?? '').endsWith('_passed')) {
    throw new Error(`browser runtime proof is missing a passed result for ${toolId}`)
  }
  return {
    proofDecision: proof.decision,
    sourceProofStatus: sourceTool.status,
    sourceProofVersion: sourceTool.version,
    sourceProofPath: browserRuntimeProofPath,
  }
}

async function runBrowserTool(
  toolId: AiGraphicsExternalAgentBrowserRuntimeControlledAdapterToolId,
): Promise<Record<string, unknown>> {
  const { server, baseUrl } = await startLocalServer()
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } })

  try {
    await page.goto(`${baseUrl}/index.html`)

    if (toolId === 'echarts') {
      await page.addScriptTag({ url: `${baseUrl}/node_modules/echarts/dist/echarts.min.js` })
      return await page.evaluate(() => {
        const w = window as any
        const chart = w.echarts.init(document.getElementById('chart'), null, { renderer: 'svg' })
        chart.setOption({
          animation: false,
          xAxis: { type: 'category', data: ['a', 'b'] },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: [1, 2] }],
        })
        const svgRendered = Boolean(chart.getZr().dom.querySelector('svg'))
        const seriesCount = chart.getOption().series.length
        chart.dispose()
        return {
          packageName: 'echarts',
          version: w.echarts.version,
          status: svgRendered
            ? 'browser_svg_chart_runtime_controlled_route_passed'
            : 'browser_svg_chart_runtime_controlled_route_failed',
          renderer: 'svg',
          seriesCount,
          svgRendered,
        }
      })
    }

    if (toolId === 'lottie_web') {
      await page.addScriptTag({ url: `${baseUrl}/node_modules/lottie-web/build/player/lottie.min.js` })
      return await page.evaluate(async () => {
        const w = window as any
        const animation = w.lottie.loadAnimation({
          container: document.getElementById('lottie'),
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData: {
            v: '5.7.4',
            fr: 30,
            ip: 0,
            op: 2,
            w: 64,
            h: 64,
            nm: 'reeditpro-controlled-route',
            ddd: 0,
            assets: [],
            layers: [],
          },
        })
        await new Promise((resolve) => setTimeout(resolve, 50))
        const apiReady = typeof animation.goToAndStop === 'function'
        animation.goToAndStop(1, true)
        animation.destroy()
        return {
          packageName: 'lottie-web',
          version: w.lottie.version,
          status: apiReady
            ? 'browser_svg_animation_runtime_controlled_route_passed'
            : 'browser_svg_animation_runtime_controlled_route_failed',
          renderer: 'svg',
          apiReady,
        }
      })
    }

    if (toolId === 'animejs') {
      return await page.evaluate(async () => {
        const anime = await (0, eval)('import("/node_modules/animejs/dist/modules/index.js")')
        const target = document.getElementById('anime-target') as HTMLElement
        anime.animate(target, { x: '24px', duration: 50, ease: 'linear' })
        await new Promise((resolve) => setTimeout(resolve, 120))
        return {
          packageName: 'animejs',
          version: '4.4.1',
          status: target.style.transform.includes('24px')
            ? 'browser_dom_animation_runtime_controlled_route_passed'
            : 'browser_dom_animation_runtime_controlled_route_failed',
          transform: target.style.transform,
        }
      })
    }

    if (toolId === 'three_js') {
      return await page.evaluate(async () => {
        const THREE: any = await (0, eval)('import("/node_modules/three/build/three.module.js")')
        const canvas = document.getElementById('three-canvas') as HTMLCanvasElement
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10)
        camera.position.z = 2
        scene.add(new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        ))
        renderer.render(scene, camera)
        const gl = renderer.getContext()
        const pixel = new Uint8Array(4)
        gl.readPixels(32, 32, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
        renderer.dispose()
        return {
          packageName: 'three',
          version: `0.${THREE.REVISION}.0`,
          status: pixel[0] > 0 && pixel[3] === 255
            ? 'browser_webgl_runtime_controlled_route_passed'
            : 'browser_webgl_runtime_controlled_route_failed',
          renderer: 'webgl',
          webglContextCreated: true,
          centerPixelRgba: Array.from(pixel),
        }
      })
    }

    if (toolId === 'pixi_js') {
      return await page.evaluate(async () => {
        const PIXI: any = await (0, eval)('import("/node_modules/pixi.js/dist/pixi.mjs")')
        const app = new PIXI.Application()
        await app.init({ width: 64, height: 64, preference: 'webgl', backgroundColor: 0x112233 })
        app.stage.addChild(new PIXI.Graphics().rect(8, 8, 32, 32).fill(0xff0000))
        app.render()
        const rendererType = app.renderer.type
        app.destroy(true, { children: true })
        return {
          packageName: 'pixi.js',
          version: PIXI.VERSION,
          status: rendererType
            ? 'browser_canvas_webgl_runtime_controlled_route_passed'
            : 'browser_canvas_webgl_runtime_controlled_route_failed',
          rendererType,
        }
      })
    }

    if (toolId === 'konva') {
      await page.addScriptTag({ url: `${baseUrl}/node_modules/konva/konva.min.js` })
      return await page.evaluate(() => {
        const w = window as any
        const stage = new w.Konva.Stage({ container: 'konva', width: 64, height: 64 })
        const layer = new w.Konva.Layer()
        layer.add(new w.Konva.Rect({ x: 5, y: 5, width: 20, height: 20, fill: 'red' }))
        stage.add(layer)
        layer.draw()
        const rectCount = stage.find('Rect').length
        stage.destroy()
        return {
          packageName: 'konva',
          version: w.Konva.version,
          status: rectCount === 1
            ? 'browser_canvas_runtime_controlled_route_passed'
            : 'browser_canvas_runtime_controlled_route_failed',
          rectCount,
        }
      })
    }

    await page.addScriptTag({ url: `${baseUrl}/node_modules/babylonjs/babylon.js` })
    return await page.evaluate(() => {
      const w = window as any
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      document.body.appendChild(canvas)
      const engine = new w.BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
      const scene = new w.BABYLON.Scene(engine)
      const camera = new w.BABYLON.FreeCamera('camera', new w.BABYLON.Vector3(0, 0, -4), scene)
      camera.setTarget(w.BABYLON.Vector3.Zero())
      w.BABYLON.MeshBuilder.CreateBox('box', { size: 1 }, scene)
      scene.render()
      const meshCount = scene.meshes.length
      engine.dispose()
      canvas.remove()
      return {
        packageName: 'babylonjs',
        version: w.BABYLON.Engine.Version,
        status: meshCount === 1
          ? 'browser_webgl_runtime_controlled_route_passed'
          : 'browser_webgl_runtime_controlled_route_failed',
        meshCount,
      }
    })
  } finally {
    await browser.close()
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
}

export async function executeAiGraphicsExternalAgentBrowserRuntimeControlledAdapter(
  request: AiGraphicsExternalAgentBrowserRuntimeControlledAdapterRequest,
): Promise<AiGraphicsExternalAgentBrowserRuntimeControlledAdapterResult> {
  assertRequestBoundary(request)

  if (!isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool(request.toolId)) {
    return {
      decision: AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_DECISION,
      status: 'controlled_browser_runtime_adapter_rejected_unsupported_tool',
      requestId: request.requestId,
      traceId: request.traceId,
      toolId: request.toolId,
      controlledAdapterExecutableNow: false,
      controlledAdapterExecutedNow: false,
      localBrowserRuntimePackageExecutionPerformed: false,
      externalAgentCanExecuteViaMountedRouteNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      browserWebglCanvasRuntimeApprovedForScopedControlledRoute: false,
      browserRuntimeStartedByScopedRoute: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      providerRuntimeApprovedNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      privateArtifactManifestRef: request.privateArtifactManifestRef,
      output: null,
      blockersBeforeGlobalExternalRouteExecution: [
        'tool is not in the seven-tool browser runtime controlled adapter cohort',
      ],
    }
  }

  const sourceProof = readBrowserRuntimeProof(request.toolId)
  const runtimeResult = await runBrowserTool(request.toolId)
  const status = String(runtimeResult.status ?? '')
  if (!status.endsWith('_passed')) {
    throw new Error(`${request.toolId} controlled browser runtime failed with ${status}`)
  }

  const summary = {
    toolId: request.toolId,
    ...sourceProof,
    ...runtimeResult,
    localServerOnly: true,
    headlessChromium: true,
    swiftShaderRequested: true,
    privateMetadataOnly: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    gpuRuntimeShouldStartNow: false,
  }
  const output = privateOutput(JSON.stringify(summary, null, 2), summary)

  return {
    decision: AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_DECISION,
    status: 'controlled_browser_runtime_adapter_executed_private_metadata_ready',
    requestId: request.requestId,
    traceId: request.traceId,
    toolId: request.toolId,
    controlledAdapterExecutableNow: true,
    controlledAdapterExecutedNow: true,
    localBrowserRuntimePackageExecutionPerformed: true,
    externalAgentCanExecuteViaMountedRouteNow: false,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    browserWebglCanvasRuntimeApprovedForScopedControlledRoute: true,
    browserRuntimeStartedByScopedRoute: true,
    gpuRuntimeApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    providerRuntimeApprovedNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    output,
    blockersBeforeGlobalExternalRouteExecution: [
      'broad all-21 external-beta route remains blocked',
      'private worker queue and service-role persistence are not enabled by this scoped route',
      'no public artifact, signed URL, beta traffic, or production unlock is created',
      'GPU/model tools still require on-demand model runtime proof before execution',
    ],
  }
}
