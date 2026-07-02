import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_DECISION =
  'ai_graphics_external_agent_cpu_static_controlled_adapter_executable_six_with_route_worker_blocks'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS = [
  'd3',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

export type AiGraphicsExternalAgentCpuStaticControlledAdapterToolId =
  (typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS)[number]

export type AiGraphicsExternalAgentCpuStaticControlledAdapterStatus =
  | 'controlled_cpu_static_adapter_executed_private_output_ready'
  | 'controlled_cpu_static_adapter_rejected_unsupported_tool'

export interface AiGraphicsExternalAgentCpuStaticControlledAdapterRequest {
  requestId: string
  toolId: AiGraphicsCanonicalToolId
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  toolRouteApprovalRef: string
  workerApprovalRef: string
  traceId: string
  payload?: unknown
}

export interface AiGraphicsExternalAgentCpuStaticControlledAdapterOutput {
  outputKind:
    | 'svg_private_artifact_candidate'
    | 'vega_lite_compiled_spec_metadata'
    | 'vega_parsed_spec_metadata'
  mediaType: 'image/svg+xml' | 'application/json'
  privateArtifactExtension: '.svg' | '.json'
  privateArtifactBytes: number
  privateArtifactSha256: string
  summary: Record<string, unknown>
}

export interface AiGraphicsExternalAgentCpuStaticControlledAdapterResult {
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_DECISION
  status: AiGraphicsExternalAgentCpuStaticControlledAdapterStatus
  requestId: string
  traceId: string
  toolId: AiGraphicsCanonicalToolId
  controlledAdapterExecutableNow: boolean
  controlledAdapterExecutedNow: boolean
  localCpuStaticPackageExecutionPerformed: boolean
  externalAgentCanExecuteViaMountedRouteNow: false
  routeExecutionApprovedNow: false
  workerExecutionApprovedNow: false
  toolExecutionApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  providerRuntimeApprovedNow: false
  publicArtifactCreated: false
  signedUrlCreated: false
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
  privateArtifactManifestRef: string
  output: AiGraphicsExternalAgentCpuStaticControlledAdapterOutput | null
  blockersBeforeExternalRouteExecution: string[]
}

const defaultFixtures = {
  d3: {
    width: 320,
    height: 180,
    points: [
      { label: 'source', value: 12 },
      { label: 'proof', value: 24 },
      { label: 'handoff', value: 33 },
    ],
  },
  vega_lite: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Controlled adapter Vega-Lite bar chart.',
    mark: 'bar',
    data: {
      values: [
        { category: 'source', value: 1 },
        { category: 'proof', value: 2 },
        { category: 'handoff', value: 3 },
      ],
    },
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'value', type: 'quantitative' },
    },
  },
  vega: {
    $schema: 'https://vega.github.io/schema/vega/v6.json',
    description: 'Controlled adapter Vega parse fixture.',
    width: 320,
    height: 180,
    data: [
      {
        name: 'table',
        values: [
          { x: 0, y: 1 },
          { x: 1, y: 3 },
        ],
      },
    ],
    scales: [
      { name: 'x', type: 'linear', domain: [0, 1], range: 'width' },
    ],
    marks: [
      {
        type: 'symbol',
        from: { data: 'table' },
        encode: { enter: { x: { scale: 'x', field: 'x' } } },
      },
    ],
  },
  satori: {
    width: 640,
    height: 360,
    fontFamily: 'KenPixel',
    text: 'CPU Static',
    subtitle: 'Satori controlled adapter proof',
    fontRelativePath: 'node_modules/three/examples/fonts/ttf/kenpixel.ttf',
  },
  svgdotjs_svg_js: {
    width: 320,
    height: 180,
    rect: { x: 8, y: 8, width: 80, height: 40, fill: '#123456' },
    marker: 'svgdotjs-controlled-adapter-static-shape',
  },
  viz_js: {
    dot: 'digraph G { source -> proof; proof -> qa; }',
  },
} as const

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function countMatches(input: string, pattern: RegExp): number {
  return Array.from(input.matchAll(pattern)).length
}

function privateOutput(
  value: string,
  outputKind: AiGraphicsExternalAgentCpuStaticControlledAdapterOutput['outputKind'],
  mediaType: AiGraphicsExternalAgentCpuStaticControlledAdapterOutput['mediaType'],
  privateArtifactExtension: AiGraphicsExternalAgentCpuStaticControlledAdapterOutput['privateArtifactExtension'],
  summary: Record<string, unknown>,
): AiGraphicsExternalAgentCpuStaticControlledAdapterOutput {
  return {
    outputKind,
    mediaType,
    privateArtifactExtension,
    privateArtifactBytes: Buffer.byteLength(value),
    privateArtifactSha256: sha256(value),
    summary,
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

function privateRef(value: string, field: string): void {
  if (!value.startsWith('private://')) {
    throw new Error(`${field} must be a private:// reference`)
  }
}

async function importRuntimeModule(moduleName: string): Promise<any> {
  return import(moduleName)
}

function assertRequestBoundary(request: AiGraphicsExternalAgentCpuStaticControlledAdapterRequest): void {
  if (!request.requestId) throw new Error('requestId is required')
  if (!request.approvedPlanSnapshotId) throw new Error('approvedPlanSnapshotId is required')
  if (!request.creditReservationId) throw new Error('creditReservationId is required')
  if (!request.traceId) throw new Error('traceId is required')
  privateRef(request.privateArtifactManifestRef, 'privateArtifactManifestRef')
  privateRef(request.toolRouteApprovalRef, 'toolRouteApprovalRef')
  privateRef(request.workerApprovalRef, 'workerApprovalRef')
}

export function isAiGraphicsExternalAgentCpuStaticControlledAdapterTool(
  toolId: AiGraphicsCanonicalToolId | string,
): toolId is AiGraphicsExternalAgentCpuStaticControlledAdapterToolId {
  return AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS.includes(
    toolId as AiGraphicsExternalAgentCpuStaticControlledAdapterToolId,
  )
}

async function runD3(payload: unknown): Promise<AiGraphicsExternalAgentCpuStaticControlledAdapterOutput> {
  const d3 = await importRuntimeModule('d3')
  const input = { ...defaultFixtures.d3, ...asObject(payload) } as any
  const points = Array.isArray(input.points) && input.points.length > 0
    ? input.points
    : defaultFixtures.d3.points
  const width = positiveNumber(input.width, defaultFixtures.d3.width)
  const height = positiveNumber(input.height, defaultFixtures.d3.height)
  const values = points.map((point: any) => Number(point.value)).filter(Number.isFinite)
  const safeValues = values.length > 0 ? values : defaultFixtures.d3.points.map((point) => point.value)
  const x = d3.scaleLinear().domain([0, safeValues.length - 1]).range([24, width - 24])
  const y = d3.scaleLinear().domain([0, d3.max(safeValues) ?? 1]).range([height - 24, 24])
  const pathData = d3
    .line()
    .x((_: number, index: number) => Number(x(index).toFixed(2)))
    .y((value: number) => Number(y(value).toFixed(2)))(safeValues)
  const marker = 'd3-controlled-adapter-static-path'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-tool="${marker}" width="${width}" height="${height}"><path d="${pathData}" fill="none" stroke="#123456"/></svg>`

  return privateOutput(svg, 'svg_private_artifact_candidate', 'image/svg+xml', '.svg', {
    pointCount: safeValues.length,
    pathData,
    width,
    height,
    marker,
  })
}

async function runVegaLite(payload: unknown): Promise<AiGraphicsExternalAgentCpuStaticControlledAdapterOutput> {
  const vegaLite = await importRuntimeModule('vega-lite')
  const compile = vegaLite.compile ?? vegaLite.default?.compile
  if (typeof compile !== 'function') throw new Error('vega-lite compile API is unavailable')
  const spec = Object.keys(asObject(payload)).length > 0 ? payload : defaultFixtures.vega_lite
  const compiled = compile(spec).spec
  const summary = {
    markCount: Array.isArray(compiled.marks) ? compiled.marks.length : 0,
    dataCount: Array.isArray(compiled.data) ? compiled.data.length : 0,
    scaleCount: Array.isArray(compiled.scales) ? compiled.scales.length : 0,
    compiledShapeHash: sha256(JSON.stringify({
      data: compiled.data,
      marks: compiled.marks,
      scales: compiled.scales,
    })),
  }

  return privateOutput(
    JSON.stringify(summary, null, 2),
    'vega_lite_compiled_spec_metadata',
    'application/json',
    '.json',
    summary,
  )
}

async function runVega(payload: unknown): Promise<AiGraphicsExternalAgentCpuStaticControlledAdapterOutput> {
  const vega = await importRuntimeModule('vega')
  if (typeof vega.parse !== 'function') throw new Error('vega parse API is unavailable')
  const spec = Object.keys(asObject(payload)).length > 0 ? payload : defaultFixtures.vega
  const parsed = vega.parse(spec)
  const summary = {
    operatorCount: Array.isArray(parsed.operators) ? parsed.operators.length : 0,
    streamCount: Array.isArray(parsed.streams) ? parsed.streams.length : 0,
    updateCount: Array.isArray(parsed.updates) ? parsed.updates.length : 0,
    parsedShapeHash: sha256(JSON.stringify({
      operators: parsed.operators?.length ?? 0,
      streams: parsed.streams?.length ?? 0,
      updates: parsed.updates?.length ?? 0,
    })),
  }

  return privateOutput(
    JSON.stringify(summary, null, 2),
    'vega_parsed_spec_metadata',
    'application/json',
    '.json',
    summary,
  )
}

async function runSatori(payload: unknown): Promise<AiGraphicsExternalAgentCpuStaticControlledAdapterOutput> {
  const satoriModule = await importRuntimeModule('satori')
  const render = satoriModule.default ?? satoriModule
  if (typeof render !== 'function') throw new Error('satori render API is unavailable')

  const input = { ...defaultFixtures.satori, ...asObject(payload) } as any
  const width = positiveNumber(input.width, defaultFixtures.satori.width)
  const height = positiveNumber(input.height, defaultFixtures.satori.height)
  const text = typeof input.text === 'string' ? input.text : defaultFixtures.satori.text
  const subtitle = typeof input.subtitle === 'string'
    ? input.subtitle
    : defaultFixtures.satori.subtitle
  const fontRelativePath = defaultFixtures.satori.fontRelativePath
  const fontPath = path.join(process.cwd(), fontRelativePath)
  const fontData = fs.readFileSync(fontPath)
  const fontHash = sha256(fontData)

  const fixtureNode = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#ffffff',
        color: '#111827',
        fontFamily: defaultFixtures.satori.fontFamily,
        fontSize: 34,
        padding: 32,
        lineHeight: 1.2,
      },
      children: [
        text,
        {
          type: 'span',
          props: {
            style: {
              display: 'block',
              marginTop: 18,
              fontSize: 18,
              color: '#374151',
            },
            children: subtitle,
          },
        },
      ],
    },
  }

  const renderOptions = {
    width,
    height,
    fonts: [
      {
        name: defaultFixtures.satori.fontFamily,
        data: fontData,
        weight: 400,
        style: 'normal',
      },
    ],
  }
  const firstSvg = await render(fixtureNode, renderOptions)
  const secondSvg = await render(fixtureNode, renderOptions)
  const deterministic = sha256(firstSvg) === sha256(secondSvg)

  return privateOutput(firstSvg, 'svg_private_artifact_candidate', 'image/svg+xml', '.svg', {
    svgLength: firstSvg.length,
    hasSvgRoot: firstSvg.startsWith('<svg'),
    hasExpectedViewBox: firstSvg.includes(`viewBox="0 0 ${width} ${height}"`),
    pathCount: countMatches(firstSvg, /<path\b/g),
    deterministic,
    fontFixtureSource: 'locked_three_package_example_font',
    fontRelativePath,
    fontFamily: defaultFixtures.satori.fontFamily,
    fontSha256: fontHash,
    fontByteLength: fontData.byteLength,
    svgArtifactCommitted: false,
    publicArtifactCreated: false,
  })
}

async function runSvgdotjs(payload: unknown): Promise<AiGraphicsExternalAgentCpuStaticControlledAdapterOutput> {
  const svgdotjs = await importRuntimeModule('@svgdotjs/svg.js')
  const jsdom = await importRuntimeModule('jsdom')
  const { JSDOM } = jsdom
  const { SVG, registerWindow } = svgdotjs
  if (typeof SVG !== 'function' || typeof registerWindow !== 'function') {
    throw new Error('SVG.js SVG/registerWindow APIs are unavailable')
  }
  const input = { ...defaultFixtures.svgdotjs_svg_js, ...asObject(payload) } as any
  const rect = { ...defaultFixtures.svgdotjs_svg_js.rect, ...asObject(input.rect) } as any
  const width = positiveNumber(input.width, defaultFixtures.svgdotjs_svg_js.width)
  const height = positiveNumber(input.height, defaultFixtures.svgdotjs_svg_js.height)
  const marker = typeof input.marker === 'string' ? input.marker : defaultFixtures.svgdotjs_svg_js.marker
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  registerWindow(dom.window, dom.window.document)
  const draw = SVG().size(width, height)
  draw
    .rect(positiveNumber(rect.width, defaultFixtures.svgdotjs_svg_js.rect.width), positiveNumber(rect.height, defaultFixtures.svgdotjs_svg_js.rect.height))
    .move(positiveNumber(rect.x, defaultFixtures.svgdotjs_svg_js.rect.x), positiveNumber(rect.y, defaultFixtures.svgdotjs_svg_js.rect.y))
    .attr({ fill: typeof rect.fill === 'string' ? rect.fill : defaultFixtures.svgdotjs_svg_js.rect.fill, 'data-proof-marker': marker })
  const svg = draw.svg()

  return privateOutput(svg, 'svg_private_artifact_candidate', 'image/svg+xml', '.svg', {
    svgLength: svg.length,
    hasSvgRoot: svg.startsWith('<svg'),
    hasRect: svg.includes('<rect'),
    marker,
    nodeDomAdapterUsed: 'jsdom_existing_lockfile_dependency',
  })
}

async function runVizJs(payload: unknown): Promise<AiGraphicsExternalAgentCpuStaticControlledAdapterOutput> {
  const vizModule = await importRuntimeModule('@viz-js/viz')
  if (typeof vizModule.instance !== 'function') throw new Error('@viz-js/viz instance API is unavailable')
  const dot = typeof asObject(payload).dot === 'string'
    ? String(asObject(payload).dot)
    : defaultFixtures.viz_js.dot
  const viz = await vizModule.instance()
  const svg = viz.renderString(dot, { format: 'svg' })

  return privateOutput(svg, 'svg_private_artifact_candidate', 'image/svg+xml', '.svg', {
    svgLength: svg.length,
    hasSvgRoot: svg.includes('<svg'),
    dotHash: sha256(dot),
  })
}

export async function executeAiGraphicsExternalAgentCpuStaticControlledAdapter(
  request: AiGraphicsExternalAgentCpuStaticControlledAdapterRequest,
): Promise<AiGraphicsExternalAgentCpuStaticControlledAdapterResult> {
  assertRequestBoundary(request)

  if (!isAiGraphicsExternalAgentCpuStaticControlledAdapterTool(request.toolId)) {
    return {
      decision: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_DECISION,
      status: 'controlled_cpu_static_adapter_rejected_unsupported_tool',
      requestId: request.requestId,
      traceId: request.traceId,
      toolId: request.toolId,
      controlledAdapterExecutableNow: false,
      controlledAdapterExecutedNow: false,
      localCpuStaticPackageExecutionPerformed: false,
      externalAgentCanExecuteViaMountedRouteNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
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
      blockersBeforeExternalRouteExecution: [
        'tool is not in the six-tool CPU/static controlled adapter cohort',
      ],
    }
  }

  const output = await ({
    d3: runD3,
    vega_lite: runVegaLite,
    vega: runVega,
    satori: runSatori,
    svgdotjs_svg_js: runSvgdotjs,
    viz_js: runVizJs,
  } satisfies Record<
    AiGraphicsExternalAgentCpuStaticControlledAdapterToolId,
    (payload: unknown) => Promise<AiGraphicsExternalAgentCpuStaticControlledAdapterOutput>
  >)[request.toolId](request.payload)

  return {
    decision: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_DECISION,
    status: 'controlled_cpu_static_adapter_executed_private_output_ready',
    requestId: request.requestId,
    traceId: request.traceId,
    toolId: request.toolId,
    controlledAdapterExecutableNow: true,
    controlledAdapterExecutedNow: true,
    localCpuStaticPackageExecutionPerformed: true,
    externalAgentCanExecuteViaMountedRouteNow: false,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    browserWebglCanvasRuntimeApprovedNow: false,
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
    blockersBeforeExternalRouteExecution: [
      'mounted external-beta route still requires queue/worker execution approval',
      'private worker queue write and claim/dispatch proof must pass before external route execution',
      'private artifact persistence must be bound by backend worker before user-visible output',
    ],
  }
}
