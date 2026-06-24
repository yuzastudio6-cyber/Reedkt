import {
  baseResult,
  hashString,
  importPackage,
  missingPackageResult,
  proofStatuses,
  writeLocalArtifact,
} from './common.mjs'

const metadata = { toolId: 'svgdotjs_svg_js', displayName: '@svgdotjs/svg.js', packageName: '@svgdotjs/svg.js' }

export async function runSvgdotjsProof({ fixture, paths }) {
  const [svgdotjs, jsdom] = await Promise.all([importPackage('@svgdotjs/svg.js'), importPackage('jsdom')])
  if (svgdotjs.status === proofStatuses.blockedMissingPackage) return missingPackageResult(metadata, svgdotjs)
  if (svgdotjs.status === proofStatuses.failedUnexpectedError) throw new Error(svgdotjs.errorMessage)
  if (jsdom.status === proofStatuses.blockedMissingPackage) {
    return {
      ...baseResult(metadata),
      importStatus: 'passed',
      fixtureStatus: 'blocked',
      outputContractStatus: 'blocked_contract_recorded',
      status: proofStatuses.blockedMissingRuntime,
      blockedReason: 'SVG.js imported, but no Node DOM adapter is available from the existing lockfile install.',
      runtimeRequirementsDiscovered: ['node_dom_adapter_required_for_svgdotjs_svg_js'],
    }
  }
  if (jsdom.status === proofStatuses.failedUnexpectedError) throw new Error(jsdom.errorMessage)

  const { JSDOM } = jsdom.module
  const { SVG, registerWindow } = svgdotjs.module
  if (typeof SVG !== 'function' || typeof registerWindow !== 'function') {
    return {
      ...baseResult(metadata),
      importStatus: 'passed',
      fixtureStatus: 'blocked',
      outputContractStatus: 'blocked_contract_recorded',
      status: proofStatuses.blockedMissingRuntime,
      blockedReason: 'SVG.js imported, but SVG/registerWindow APIs are unavailable.',
      runtimeRequirementsDiscovered: ['svgdotjs_register_window_api_required'],
    }
  }

  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  registerWindow(dom.window, dom.window.document)
  const draw = SVG().size(fixture.width, fixture.height)
  draw
    .rect(fixture.rect.width, fixture.rect.height)
    .move(fixture.rect.x, fixture.rect.y)
    .attr({ fill: fixture.rect.fill, 'data-proof-marker': fixture.marker })
  const svg = draw.svg()
  const artifactPath = writeLocalArtifact(paths, 'svgdotjs_svg_js.svg', `${svg}\n`)
  const valid =
    svg.startsWith('<svg') &&
    svg.includes('<rect') &&
    svg.includes(fixture.marker) &&
    svg.includes(String(fixture.width))

  return {
    ...baseResult(metadata),
    importStatus: 'passed',
    fixtureStatus: 'executed',
    outputContractStatus: valid ? 'checked' : 'failed',
    status: valid ? proofStatuses.passed : proofStatuses.failedUnexpectedError,
    outputSummary: {
      svgHash: hashString(svg),
      svgLength: svg.length,
      hasSvgRoot: svg.startsWith('<svg'),
      hasRect: svg.includes('<rect'),
      proofMarkerFound: svg.includes(fixture.marker),
      nodeDomAdapterUsed: 'jsdom_existing_lockfile_dependency',
    },
    localArtifactPaths: [artifactPath],
    runtimeRequirementsDiscovered: ['node_dom_adapter_from_existing_jsdom_lockfile_dependency'],
  }
}
