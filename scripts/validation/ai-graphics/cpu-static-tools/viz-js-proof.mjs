import {
  baseResult,
  hashString,
  importPackage,
  missingPackageResult,
  proofStatuses,
  writeLocalArtifact,
} from './common.mjs'

const metadata = { toolId: 'viz_js', displayName: '@viz-js/viz', packageName: '@viz-js/viz' }

export async function runVizJsProof({ fixture, paths }) {
  const imported = await importPackage('@viz-js/viz')
  if (imported.status === proofStatuses.blockedMissingPackage) return missingPackageResult(metadata, imported)
  if (imported.status === proofStatuses.failedUnexpectedError) throw new Error(imported.errorMessage)
  if (typeof imported.module.instance !== 'function') {
    return {
      ...baseResult(metadata),
      importStatus: 'passed',
      fixtureStatus: 'blocked',
      outputContractStatus: 'blocked_contract_recorded',
      status: proofStatuses.blockedMissingRuntime,
      blockedReason: '@viz-js/viz instance API is unavailable from the imported module.',
      runtimeRequirementsDiscovered: ['viz_js_instance_api_required'],
    }
  }

  const viz = await imported.module.instance()
  const svg = viz.renderString(fixture.dot, { format: 'svg' })
  const artifactPath = writeLocalArtifact(paths, 'viz_js.svg', `${svg}\n`)
  const valid = svg.includes('<svg') && svg.includes('source') && svg.includes('proof') && svg.includes('qa')

  return {
    ...baseResult(metadata),
    importStatus: 'passed',
    fixtureStatus: 'executed',
    outputContractStatus: valid ? 'checked' : 'failed',
    status: valid ? proofStatuses.passed : proofStatuses.failedUnexpectedError,
    outputSummary: {
      svgHash: hashString(svg),
      svgLength: svg.length,
      hasSvgRoot: svg.includes('<svg'),
      expectedNodeMarkersFound: valid,
      dotHash: hashString(fixture.dot),
    },
    localArtifactPaths: [artifactPath],
    runtimeRequirementsDiscovered: ['cpu_static_graphviz_wasm_svg_render_no_public_artifact'],
  }
}
