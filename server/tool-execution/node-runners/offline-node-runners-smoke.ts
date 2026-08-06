import { createHash } from 'node:crypto'
import { channel } from 'node:diagnostics_channel'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { performance } from 'node:perf_hooks'

import {
  OFFLINE_NODE_RUNNER_LIMITS,
  OFFLINE_NODE_RUNNER_PROTOCOL,
  OFFLINE_NODE_RUNNER_TOOL_IDS,
  createOfflineNodeRunnerDeadline,
  createOfflineNodeRunnerResult,
  runOfflineAnimeJsMotionOperation,
  runOfflineThreeJsSceneOperation,
  runOfflineD3SvgOperation,
  runOfflineEchartsSvgOperation,
  runOfflineSatoriSvgOperation,
  runOfflineNodeToolOperation,
  runOfflineVegaLiteSvgOperation,
  runOfflineVegaSvgOperation,
  runOfflineVizJsSvgOperation,
  sha256,
  type OfflineNodeRunnerResult,
  type OfflineAnimeMotionInput,
  type OfflineThreeSceneInput,
  type OfflineSatoriCardInput,
  type OfflineStructuredChartInput,
  type OfflineVizGraphInput,
} from './index'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const requireFromHere = createRequire(import.meta.url)
const expectedPackages = new Map([
  ['d3', 'd3'],
  ['echarts', 'echarts'],
  ['vega_lite', 'vega-lite'],
  ['vega', 'vega'],
  ['satori', 'satori'],
  ['viz_js', '@viz-js/viz'],
  ['animejs', 'animejs'],
  ['three_js', 'three'],
] as const)

const chartFixture: OfflineStructuredChartInput = {
  protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
  source: 'server_resolved_in_memory',
  width: 640,
  height: 360,
  title: 'Quarterly revenue',
  xAxisLabel: 'Quarter',
  yAxisLabel: 'Revenue',
  theme: 'light',
  data: [
    { label: 'Q1', value: 14 },
    { label: 'Q2', value: 23 },
    { label: 'Q3', value: 31 },
  ],
}

const graphFixture: OfflineVizGraphInput = {
  protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
  source: 'server_resolved_in_memory',
  direction: 'left_to_right',
  theme: 'dark',
  title: 'Approved edit flow',
  nodes: [
    { id: 'source', label: 'Source clips' },
    { id: 'plan', label: 'Approved plan' },
    { id: 'output', label: 'Private output' },
  ],
  edges: [
    { from: 'source', to: 'plan', label: 'analyze' },
    { from: 'plan', to: 'output', label: 'execute' },
  ],
}

const networkEvents: string[] = []
const diagnosticChannels = [
  channel('http.client.request.start'),
  channel('undici:request:create'),
  channel('net.client.socket'),
]
const diagnosticHandler = (_message: unknown, name: string | symbol): void => {
  networkEvents.push(String(name))
}
for (const diagnosticChannel of diagnosticChannels) diagnosticChannel.subscribe(diagnosticHandler)
const originalFetch = globalThis.fetch
let fetchAttemptCount = 0
globalThis.fetch = (async () => {
  fetchAttemptCount += 1
  throw new Error('Network fetch is forbidden during offline Node runner smoke.')
}) as typeof fetch

try {
  await runSmoke()
} finally {
  globalThis.fetch = originalFetch
  for (const diagnosticChannel of diagnosticChannels) diagnosticChannel.unsubscribe(diagnosticHandler)
}

async function runSmoke(): Promise<void> {
  check(new Set(OFFLINE_NODE_RUNNER_TOOL_IDS).size === OFFLINE_NODE_RUNNER_TOOL_IDS.length, 'Runner tool IDs must be unique.')
  check(OFFLINE_NODE_RUNNER_TOOL_IDS.length === expectedPackages.size + 2,
    'Eight host runners plus one Docker-only SVG.js runner and Sharp must be declared.')
  for (const toolId of OFFLINE_NODE_RUNNER_TOOL_IDS) {
    if (toolId === 'svg_js' || toolId === 'sharp') continue
    const packageName = expectedPackages.get(toolId)
    check(Boolean(packageName), `${toolId} must have a package identity.`)
    check(Boolean(requireFromHere.resolve(packageName as string)), `${toolId} package must resolve in the configured Node runtime.`)
  }

  const fontBytes = readServerFixtureFont()
  const cardFixture: OfflineSatoriCardInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: 640,
    height: 360,
    theme: 'dark',
    eyebrow: 'ReeditPro',
    title: 'Professional editing, approved first',
    body: 'A fixed server-owned card rendered from structured in-memory text and verified font bytes.',
    callout: 'Private preview',
    font: {
      family: 'ReeditProSans',
      sha256: sha256(fontBytes),
      bytes: fontBytes,
    },
  }
  const animeFixture: OfflineAnimeMotionInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: 640,
    height: 360,
    fps: 30,
    durationFrames: 60,
    motionProfileId: 'approved_card_reveal_v1',
    backgroundMode: 'opaque_panel',
    title: 'Approved deterministic motion',
  }
  const threeFixture: OfflineThreeSceneInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: 640,
    height: 360,
    fps: 30,
    durationFrames: 60,
    sceneProfileId: 'approved_product_cube_v1',
    cameraProfileId: 'approved_perspective_v1',
    lightingProfileId: 'approved_studio_v1',
    title: 'Approved product scene',
  }

  const runnerPairs: Array<{
    toolId: typeof OFFLINE_NODE_RUNNER_TOOL_IDS[number]
    run: () => Promise<OfflineNodeRunnerResult>
    signature: (svg: string) => boolean
  }> = [
    {
      toolId: 'd3',
      run: async () => runOfflineD3SvgOperation(chartFixture),
      signature: (svg) => svg.includes('data-reeditpro-library="d3.line"') && svg.includes('Quarterly revenue'),
    },
    {
      toolId: 'echarts',
      run: async () => runOfflineEchartsSvgOperation(chartFixture),
      signature: (svg) => svg.includes('reeditpro-zr-') && svg.includes('ecmeta_series_index='),
    },
    {
      toolId: 'vega_lite',
      run: async () => runOfflineVegaLiteSvgOperation(chartFixture),
      signature: (svg) => svg.includes('role-mark') && svg.includes('Quarterly revenue'),
    },
    {
      toolId: 'vega',
      run: async () => runOfflineVegaSvgOperation(chartFixture),
      signature: (svg) => svg.includes('role-mark') && svg.includes('Quarterly revenue'),
    },
    {
      toolId: 'satori',
      run: async () => runOfflineSatoriSvgOperation(cardFixture),
      signature: (svg) => svg.includes('<mask') && svg.includes('<path'),
    },
    {
      toolId: 'viz_js',
      run: async () => runOfflineVizJsSvgOperation(graphFixture),
      signature: (svg) => svg.includes('class="graph"') && svg.includes('class="node"') && svg.includes('class="edge"'),
    },
    {
      toolId: 'animejs',
      run: async () => runOfflineAnimeJsMotionOperation(animeFixture),
      signature: (svg) => svg.includes('data-reeditpro-library="animejs.animate"') &&
        svg.includes('deterministic seek proof'),
    },
    {
      toolId: 'three_js',
      run: async () => runOfflineThreeJsSceneOperation(threeFixture),
      signature: (svg) => svg.includes('data-reeditpro-library="three.Scene"') &&
        svg.includes('Three.js camera projection'),
    },
  ]

  const results: OfflineNodeRunnerResult[] = []
  for (const runner of runnerPairs) {
    const first = await runner.run()
    const second = await runner.run()
    verifyResult(first, runner.toolId, runner.signature)
    verifyResult(second, runner.toolId, runner.signature)
    check(first.artifacts[0].sha256 === second.artifacts[0].sha256, `${runner.toolId} normalized SVG must be deterministic.`)
    check(first.artifacts[1].sha256 === second.artifacts[1].sha256, `${runner.toolId} verification JSON must be deterministic.`)
    check(first.inputSha256 === second.inputSha256, `${runner.toolId} normalized input hash must be deterministic.`)
    results.push(first)
  }

  const d3OperationId = results.find((result) => result.toolId === 'd3')?.operationId
  check(Boolean(d3OperationId), 'D3 must expose one canonical operation identity.')
  const registryD3 = await runOfflineNodeToolOperation({
    toolId: 'd3',
    operationId: d3OperationId as string,
    payload: chartFixture,
  })
  check(registryD3.toolId === 'd3', 'Registry dispatch must preserve the canonical tool identity.')
  await assertRejected(
    () => runOfflineNodeToolOperation({
      toolId: 'd3',
      operationId: 'tool.d3.spoofed.v1',
      payload: chartFixture,
    }),
    ['INVALID_INPUT'],
    'Registry dispatch must reject an operation identity not approved by the canonical spec.',
  )
  await assertRejected(
    () => runOfflineNodeToolOperation({
      toolId: 'd3',
      operationId: d3OperationId as string,
      payload: chartFixture,
      url: 'https://example.com',
    } as never),
    ['INVALID_INPUT'],
    'Registry dispatch must reject extra transport or target fields.',
  )

  check(fetchAttemptCount === 0, 'Offline Node runners must not call fetch.')
  check(networkEvents.length === 0, `Offline Node runners emitted network diagnostics: ${networkEvents.join(', ')}.`)

  await assertRejected(
    () => Promise.resolve(runOfflineD3SvgOperation({ ...chartFixture, command: 'node' })),
    ['INVALID_INPUT'],
    'D3 must reject caller commands.',
  )
  await assertRejected(
    () => Promise.resolve(runOfflineEchartsSvgOperation({ ...chartFixture, url: 'https://example.com' })),
    ['INVALID_INPUT'],
    'ECharts must reject caller URLs.',
  )
  await assertRejected(
    () => runOfflineVegaLiteSvgOperation({ ...chartFixture, spec: { mark: 'bar' } }),
    ['INVALID_INPUT'],
    'Vega-Lite must reject caller specifications.',
  )
  await assertRejected(
    () => runOfflineVegaSvgOperation({ ...chartFixture, expression: 'datum.value' }),
    ['INVALID_INPUT'],
    'Vega must reject caller expressions.',
  )
  await assertRejected(
    () => Promise.resolve(runOfflineD3SvgOperation({ ...chartFixture, title: '<script>alert(1)</script>' })),
    ['UNSAFE_CONTENT'],
    'Chart runners must reject markup.',
  )
  await assertRejected(
    () => Promise.resolve(runOfflineD3SvgOperation({
      ...chartFixture,
      data: [{ label: 'https://example.com', value: 1 }],
    })),
    ['UNSAFE_CONTENT'],
    'Chart runners must reject URL-like labels.',
  )
  await assertRejected(
    () => Promise.resolve(runOfflineD3SvgOperation({ ...chartFixture, title: 'unsafe\u0000control' })),
    ['UNSAFE_CONTENT'],
    'Chart runners must reject control characters.',
  )
  await assertRejected(
    () => runOfflineVegaLiteSvgOperation({ ...chartFixture, title: 'clip1' }),
    ['UNSAFE_CONTENT'],
    'Vega normalization must not accept caller text that collides with generated identifiers.',
  )
  await assertRejected(
    () => Promise.resolve(runOfflineD3SvgOperation({
      ...chartFixture,
      data: Array.from({ length: OFFLINE_NODE_RUNNER_LIMITS.maximumChartDataItems + 1 }, (_, index) => ({
        label: `item ${index}`,
        value: index,
      })),
    })),
    ['INVALID_INPUT'],
    'Chart runners must reject oversized datasets.',
  )
  await assertRejected(
    () => Promise.resolve(runOfflineD3SvgOperation({
      ...chartFixture,
      data: [{ label: 'bad', value: Number.POSITIVE_INFINITY }],
    })),
    ['INVALID_INPUT'],
    'Chart runners must reject non-finite data.',
  )
  await assertRejected(
    () => Promise.resolve(runOfflineD3SvgOperation({
      ...chartFixture,
      width: OFFLINE_NODE_RUNNER_LIMITS.maximumWidth + 1,
    })),
    ['INVALID_INPUT'],
    'Chart runners must reject oversized dimensions.',
  )
  await assertRejected(
    () => runOfflineVizJsSvgOperation({
      ...graphFixture,
      nodes: [{ id: 'node; URL="https://example.com"', label: 'unsafe' }],
      edges: [],
    }),
    ['INVALID_INPUT'],
    'Viz.js must reject DOT identifier injection.',
  )
  await assertRejected(
    () => runOfflineVizJsSvgOperation({
      ...graphFixture,
      nodes: [{ id: 'safe', label: '<TABLE><TR><TD>unsafe</TD></TR></TABLE>' }],
      edges: [],
    }),
    ['UNSAFE_CONTENT'],
    'Viz.js must reject HTML labels.',
  )
  await assertRejected(
    () => runOfflineVizJsSvgOperation({
      ...graphFixture,
      edges: [{ from: 'source', to: 'missing' }],
    }),
    ['INVALID_INPUT'],
    'Viz.js must reject unknown edge endpoints.',
  )
  await assertRejected(
    () => runOfflineSatoriSvgOperation({
      ...cardFixture,
      font: { ...cardFixture.font, sha256: '0'.repeat(64) },
    }),
    ['INVALID_INPUT'],
    'Satori must reject font digest mismatch.',
  )
  await assertRejected(
    () => runOfflineSatoriSvgOperation({
      ...cardFixture,
      font: {
        ...cardFixture.font,
        bytes: new Uint8Array(OFFLINE_NODE_RUNNER_LIMITS.maximumFontBytes + 1),
        sha256: createHash('sha256').update(new Uint8Array(OFFLINE_NODE_RUNNER_LIMITS.maximumFontBytes + 1)).digest('hex'),
      },
    }),
    ['INVALID_INPUT'],
    'Satori must reject oversized font content.',
  )
  await assertRejected(
    () => runOfflineSatoriSvgOperation({ ...cardFixture, callout: 'javascript:alert(1)' }),
    ['UNSAFE_CONTENT'],
    'Satori must reject executable text content.',
  )

  assertInvalidSvgRejected('<svg width="320" height="180"><script>alert(1)</script></svg>', 'Active SVG markup must be rejected.')
  assertInvalidSvgRejected('<svg width="320" height="180"><image href="https://example.com/x.png"/></svg>', 'External SVG resources must be rejected.')
  assertInvalidSvgRejected('<svg width="320" height="180"><style>@import "theme.css";</style></svg>', 'CSS import output must be rejected.')
  assertInvalidSvgRejected('<svg width="320" height="180"><path d="M NaN 1"/></svg>', 'Non-finite SVG output must be rejected.')
  assertInvalidSvgRejected(`<svg width="320" height="180"><text>${'x'.repeat(OFFLINE_NODE_RUNNER_LIMITS.maximumSvgBytes)}</text></svg>`, 'Oversized SVG output must be rejected.')

  const shortDeadline = createOfflineNodeRunnerDeadline(1)
  const busyUntil = performance.now() + 3
  while (performance.now() < busyUntil) {
    // Fixed three-millisecond busy loop proves the cooperative synchronous deadline check.
  }
  let timeoutRejected = false
  try {
    shortDeadline.assertWithin('deadline smoke')
  } catch (error) {
    timeoutRejected = errorCode(error) === 'TIMEOUT'
  }
  check(timeoutRejected, 'Synchronous operation deadline overrun must be rejected.')

  console.log(JSON.stringify({
    ok: true,
    actualOfflineNodeRunnerCount: results.length,
    actualOfflineNodeRunnerToolIds: results.map((result) => result.toolId),
    actualLibraryOperationCount: results.filter((result) => result.actualToolPackageExecuted).length,
    deterministicSvgCount: results.length,
    deterministicVerificationJsonCount: results.length,
    offlineNetworkEventCount: networkEvents.length,
    fetchAttemptCount,
    svgJs: 'covered_by_confined_structured_execution_smoke',
    outputArtifactsPerRunner: 2,
    readinessScope: 'tool_specific_operation_evidence_only',
  }, null, 2))
}

function verifyResult(
  result: OfflineNodeRunnerResult,
  expectedToolId: typeof OFFLINE_NODE_RUNNER_TOOL_IDS[number],
  signature: (svg: string) => boolean,
): void {
  check(result.toolId === expectedToolId, `${expectedToolId} result must retain canonical tool identity.`)
  check(result.status === 'actual_library_operation_completed', `${expectedToolId} must report actual operation completion.`)
  check(result.actualToolPackageExecuted, `${expectedToolId} must record actual library execution.`)
  check(result.frontendExecutionAllowed === false, `${expectedToolId} must remain backend-only.`)
  check(!Object.hasOwn(result, 'productReady'), `${expectedToolId} result must not make a productReady claim.`)
  check(result.networkPolicy === 'offline_no_caller_targets_no_provider_calls', `${expectedToolId} must retain offline policy.`)
  check(result.artifacts.length === 2, `${expectedToolId} must return SVG and verification JSON bytes.`)
  const [svgArtifact, verificationArtifact] = result.artifacts
  check(svgArtifact.artifactKind === 'svg' && svgArtifact.mimeType === 'image/svg+xml', `${expectedToolId} primary artifact must be SVG.`)
  check(svgArtifact.byteLength === svgArtifact.bytes.byteLength, `${expectedToolId} SVG size must match bytes.`)
  check(svgArtifact.sha256 === sha256(svgArtifact.bytes), `${expectedToolId} SVG digest must match bytes.`)
  check(svgArtifact.byteLength <= OFFLINE_NODE_RUNNER_LIMITS.maximumSvgBytes, `${expectedToolId} SVG must stay inside the output ceiling.`)
  check(svgArtifact.privateArtifactRequired && svgArtifact.publicUrl === null, `${expectedToolId} SVG must remain private.`)
  check(signature(svgArtifact.bytes.toString('utf8')), `${expectedToolId} SVG must contain library-specific semantic output.`)
  check(verificationArtifact.artifactKind === 'verification_json' && verificationArtifact.mimeType === 'application/json', `${expectedToolId} secondary artifact must be verification JSON.`)
  check(verificationArtifact.sha256 === sha256(verificationArtifact.bytes), `${expectedToolId} verification digest must match bytes.`)
  check(verificationArtifact.byteLength <= OFFLINE_NODE_RUNNER_LIMITS.maximumVerificationJsonBytes, `${expectedToolId} verification JSON must stay bounded.`)
  const verification = JSON.parse(verificationArtifact.bytes.toString('utf8')) as Record<string, unknown>
  check(verification.toolId === expectedToolId, `${expectedToolId} verification JSON must retain tool identity.`)
  check(verification.svgSha256 === svgArtifact.sha256, `${expectedToolId} verification JSON must bind the SVG digest.`)
  check(verification.actualToolPackageExecuted === true, `${expectedToolId} verification JSON must record actual invocation.`)
  check(!Object.hasOwn(verification, 'productReady'), `${expectedToolId} verification JSON must not make a productReady claim.`)
  check('svgRootCount' in result.semanticEvidence && result.semanticEvidence.svgRootCount === 1, `${expectedToolId} must verify one SVG root.`)
  check('elementCount' in result.semanticEvidence && result.semanticEvidence.elementCount > 0, `${expectedToolId} must verify semantic SVG elements.`)
  check('unsafeMarkupRejected' in result.semanticEvidence && result.semanticEvidence.unsafeMarkupRejected, `${expectedToolId} must run unsafe-markup validation.`)
  check('externalReferencesRejected' in result.semanticEvidence && result.semanticEvidence.externalReferencesRejected, `${expectedToolId} must run external-reference validation.`)
}

function readServerFixtureFont(): Uint8Array {
  const fixedCandidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/Library/Fonts/Arial.ttf',
  ]
  const fontPath = fixedCandidates.find((candidate) => existsSync(candidate))
  check(Boolean(fontPath), 'Satori smoke requires a fixed server-owned TrueType fixture font.')
  return new Uint8Array(readFileSync(fontPath as string))
}

async function assertRejected(
  work: () => Promise<unknown>,
  allowedCodes: readonly string[],
  message: string,
): Promise<void> {
  let rejectedCode: string | undefined
  try {
    await work()
  } catch (error) {
    rejectedCode = errorCode(error)
  }
  check(Boolean(rejectedCode) && allowedCodes.includes(rejectedCode as string), `${message} Received ${rejectedCode ?? 'no rejection'}.`)
}

function assertInvalidSvgRejected(svg: string, message: string): void {
  let rejected = false
  try {
    createOfflineNodeRunnerResult({
      toolId: 'd3',
      packageName: 'd3',
      invokedEntrypoints: ['adversarial-output-fixture'],
      sourceInput: chartFixture,
      svg,
      elapsedMilliseconds: 1,
      normalizedForDeterminism: false,
    })
  } catch (error) {
    rejected = ['INVALID_OUTPUT', 'OUTPUT_TOO_LARGE'].includes(errorCode(error))
  }
  check(rejected, message)
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'UNKNOWN'
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : 'UNKNOWN'
}
