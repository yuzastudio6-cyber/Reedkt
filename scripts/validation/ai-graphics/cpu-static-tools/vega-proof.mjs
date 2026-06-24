import {
  baseResult,
  hashJson,
  importPackage,
  missingPackageResult,
  proofStatuses,
  writeLocalArtifact,
} from './common.mjs'

const metadata = { toolId: 'vega', displayName: 'Vega', packageName: 'vega' }

export async function runVegaProof({ fixture, paths }) {
  const imported = await importPackage('vega')
  if (imported.status === proofStatuses.blockedMissingPackage) return missingPackageResult(metadata, imported)
  if (imported.status === proofStatuses.failedUnexpectedError) throw new Error(imported.errorMessage)
  if (typeof imported.module.parse !== 'function') {
    return {
      ...baseResult(metadata),
      importStatus: 'passed',
      fixtureStatus: 'blocked',
      outputContractStatus: 'blocked',
      status: proofStatuses.blockedMissingRuntime,
      blockedReason: 'vega parse API is unavailable from the imported module.',
      runtimeRequirementsDiscovered: ['vega_parse_api_required'],
    }
  }

  const parsed = imported.module.parse(fixture)
  const summary = {
    parsedHash: hashJson({
      operators: parsed.operators?.length ?? 0,
      streams: parsed.streams?.length ?? 0,
      updates: parsed.updates?.length ?? 0,
    }),
    operatorCount: Array.isArray(parsed.operators) ? parsed.operators.length : 0,
    streamCount: Array.isArray(parsed.streams) ? parsed.streams.length : 0,
    markCount: Array.isArray(fixture.marks) ? fixture.marks.length : 0,
  }
  const artifactPath = writeLocalArtifact(paths, 'vega_parsed_metadata.json', `${JSON.stringify(summary, null, 2)}\n`)
  const valid = summary.operatorCount > 0 && summary.markCount === 1

  return {
    ...baseResult(metadata),
    importStatus: 'passed',
    fixtureStatus: 'executed',
    outputContractStatus: valid ? 'checked' : 'failed',
    status: valid ? proofStatuses.passed : proofStatuses.failedUnexpectedError,
    outputSummary: summary,
    localArtifactPaths: [artifactPath],
    runtimeRequirementsDiscovered: ['cpu_only_vega_parse_metadata_no_view_render'],
  }
}
