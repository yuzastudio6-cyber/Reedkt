import {
  baseResult,
  hashString,
  importPackage,
  missingPackageResult,
  proofStatuses,
  writeLocalArtifact,
} from './common.mjs'

const metadata = { toolId: 'd3', displayName: 'D3', packageName: 'd3' }

export async function runD3Proof({ fixture, paths }) {
  const imported = await importPackage('d3')
  if (imported.status === proofStatuses.blockedMissingPackage) return missingPackageResult(metadata, imported)
  if (imported.status === proofStatuses.failedUnexpectedError) throw new Error(imported.errorMessage)

  const d3 = imported.module
  const width = fixture.width
  const height = fixture.height
  const values = fixture.points.map((point) => point.value)
  const x = d3.scaleLinear().domain([0, values.length - 1]).range([24, width - 24])
  const y = d3.scaleLinear().domain([0, d3.max(values)]).range([height - 24, 24])
  const pathData = d3
    .line()
    .x((_, index) => Number(x(index).toFixed(2)))
    .y((value) => Number(y(value).toFixed(2)))(values)
  const marker = 'd3-phase0-static-path'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-tool="${marker}" width="${width}" height="${height}"><path d="${pathData}" fill="none" stroke="#123456"/></svg>`
  const artifactPath = writeLocalArtifact(paths, 'd3.svg', `${svg}\n`)
  const valid = svg.startsWith('<svg') && svg.includes(marker) && pathData.startsWith('M') && svg.includes('<path')

  return {
    ...baseResult(metadata),
    importStatus: 'passed',
    fixtureStatus: 'executed',
    outputContractStatus: valid ? 'checked' : 'failed',
    status: valid ? proofStatuses.passed : proofStatuses.failedUnexpectedError,
    outputSummary: {
      svgHash: hashString(svg),
      pathData,
      pointCount: fixture.points.length,
      width,
      height,
      marker,
    },
    localArtifactPaths: [artifactPath],
    runtimeRequirementsDiscovered: ['cpu_only_d3_shape_and_path_generation'],
  }
}
