import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

type PackageJson = {
  readonly scripts?: Readonly<Record<string, string>>
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as
  PackageJson
const scripts = packageJson.scripts ?? {}
const operators = [
  {
    script: 'compile:sam3_1-gpu-runtime-driver-qualification',
    file: 'server/cli/compile-canonical-sam3_1-gpu-runtime-driver-qualification.ts',
    factory: 'createCanonicalSam31GcpGpuRuntimeDriverQualificationOwner',
    method: 'compileAndPersistDriverQualificationComponent',
  },
  {
    script: 'compile:sam3_1-gpu-runtime-deterministic-qualification',
    file:
      'server/cli/compile-canonical-sam3_1-gpu-runtime-deterministic-qualification.ts',
    factory: 'createCanonicalSam31GcpGpuRuntimeDeterministicQualificationOwner',
    method: 'compileAndPersistDeterministicQualificationComponent',
  },
  {
    script: 'compile:sam3_1-gpu-complete-source-performance',
    file: 'server/cli/compile-canonical-sam3_1-gpu-complete-source-performance.ts',
    factory: 'createCanonicalSam31GcpGpuCompleteSourcePerformanceOwner',
    method: 'compileAndPersistPerformanceEvidence',
  },
  {
    script: 'compile:sam3_1-gpu-performance-p95-qualification',
    file:
      'server/cli/compile-canonical-sam3_1-gpu-performance-p95-qualification.ts',
    factory: 'createCanonicalSam31GcpGpuPerformanceP95QualificationOwner',
    method: 'compileAndPersistPerformanceQualificationComponent',
  },
  {
    script: 'assemble:sam3_1-gpu-temporal-evidence',
    file: 'server/cli/assemble-canonical-sam3_1-gpu-temporal-evidence.ts',
    factory: 'createCanonicalSam31GcpGpuTemporalEvidenceAssembler',
    method: 'assembleAndPersist',
  },
  {
    script: 'compile:sam3_1-gpu-temporal-measurement',
    file: 'server/cli/compile-canonical-sam3_1-gpu-temporal-measurement.ts',
    factory: 'createCanonicalSam31GcpGpuTemporalMeasurementCompiler',
    method: 'compileAndPersistMeasurementSet',
  },
  {
    script: 'compile:sam3_1-gpu-temporal-quality-qualification',
    file:
      'server/cli/compile-canonical-sam3_1-gpu-temporal-quality-qualification.ts',
    factory: 'createCanonicalSam31GcpGpuTemporalQualityQualificationOwner',
    method: 'compileAndPersistTemporalQualityComponent',
  },
] as const

for (const operator of operators) {
  assert.equal(scripts[operator.script], `tsx ${operator.file}`)
  const source = readFileSync(operator.file, 'utf8')
  assert.match(source, new RegExp(operator.factory, 'u'))
  assert.match(source, new RegExp(`\\.${operator.method}\\(request\\)`, 'u'))
  assert.match(source, /WEEDITPRO_[A-Z0-9_]+_REQUEST_JSON/u)
  assert.match(source, /JSON\.parse\(raw\)/u)
  assert.match(source, /gpuJobDispatched: false/u)
  assert.match(source, /customerCreditsMutated: false/u)
  assert.match(source, /runtimeReleaseGranted: false/u)
  assert.match(source, /productionAuthorityGranted: false/u)
  assert.doesNotMatch(
    source,
    /node:child_process|\bspawn(?:Sync)?\b|\bexec(?:File|Sync)?\b|fetch\(|axios|submitCustomJob|createJob\(|deploy/u,
  )
}

const temporalAssemblerSource = readFileSync(
  'server/services/canonical-sam3_1-gpu-temporal-evidence-assembler.ts',
  'utf8',
)
assert.match(
  temporalAssemblerSource,
  /createCanonicalSam31GpuTemporalEvidenceAssemblerFromObjectPort/u,
)
assert.match(
  temporalAssemblerSource,
  /createCanonicalSam31GcpGpuTemporalEvidenceAssembler/u,
)
assert.match(
  temporalAssemblerSource,
  /reeditpro-production-reeditpro-control-plane-state/u,
)
assert.match(
  temporalAssemblerSource,
  /createCanonicalTrackAllSam31TaskQaCandidateRepository/u,
)
assert.match(
  temporalAssemblerSource,
  /createCanonicalSam31CrossChunkBoundaryMeasurementSetRepository/u,
)
assert.match(
  temporalAssemblerSource,
  /createCanonicalSam31TemporalMetricSeriesSetRepository/u,
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-qualification-operator-entrypoints',
  boundedOperatorEntrypointCount: operators.length,
  canonicalGcpOwnerOnly: true,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
