import {
  baseResult,
  hashJson,
  importPackage,
  missingPackageResult,
  proofStatuses,
  writeLocalArtifact,
} from './common.mjs'

const metadata = { toolId: 'vega_lite', displayName: 'Vega-Lite', packageName: 'vega-lite' }

export async function runVegaLiteProof({ fixture, paths }) {
  const imported = await importPackage('vega-lite')
  if (imported.status === proofStatuses.blockedMissingPackage) return missingPackageResult(metadata, imported)
  if (imported.status === proofStatuses.failedUnexpectedError) throw new Error(imported.errorMessage)

  const compile = imported.module.compile ?? imported.module.default?.compile
  if (typeof compile !== 'function') {
    return {
      ...baseResult(metadata),
      importStatus: 'passed',
      fixtureStatus: 'blocked',
      outputContractStatus: 'blocked',
      status: proofStatuses.blockedMissingRuntime,
      blockedReason: 'vega-lite compile API is unavailable from the imported module.',
      runtimeRequirementsDiscovered: ['vega_lite_compile_api_required'],
    }
  }

  const compiled = compile(fixture).spec
  const artifactPath = writeLocalArtifact(paths, 'vega_lite_compiled.json', `${JSON.stringify(compiled, null, 2)}\n`)
  const valid =
    Array.isArray(compiled.marks) &&
    compiled.marks.length > 0 &&
    Array.isArray(compiled.data) &&
    Array.isArray(compiled.scales)

  return {
    ...baseResult(metadata),
    importStatus: 'passed',
    fixtureStatus: 'executed',
    outputContractStatus: valid ? 'checked' : 'failed',
    status: valid ? proofStatuses.passed : proofStatuses.failedUnexpectedError,
    outputSummary: {
      compiledHash: hashJson({ data: compiled.data, marks: compiled.marks, scales: compiled.scales }),
      markCount: compiled.marks.length,
      dataCount: compiled.data.length,
      scaleCount: compiled.scales.length,
    },
    localArtifactPaths: [artifactPath],
    runtimeRequirementsDiscovered: ['cpu_only_vega_lite_compile'],
  }
}
