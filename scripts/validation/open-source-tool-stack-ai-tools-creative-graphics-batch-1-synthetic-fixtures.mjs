import { existsSync, readFileSync } from 'node:fs'

const fixturePaths = {
  d3: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-d3-chart-spec.json',
  echarts: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-echarts-option-spec.json',
  vega_lite: 'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-vega-lite-spec.json',
}

const requiredFalseBooleans = [
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
  'mediaRuntimeApprovedNow',
  'browserRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const blockedUseTokens = [
  'route_execution',
  'worker_execution',
  'provider_model_call',
  'supabase_mutation',
  'gcs_upload',
  'signed_url_creation',
  'public_artifact_creation',
  'beta_or_production_unlock',
]

const failures = []
const readFixture = (id, path) => {
  if (!existsSync(path)) {
    failures.push(`missing_fixture:${id}:${path}`)
    return null
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_fixture_json:${id}:${error.message}`)
    return null
  }
}

const walkStrings = (value, strings = []) => {
  if (typeof value === 'string') strings.push(value)
  else if (Array.isArray(value)) value.forEach((item) => walkStrings(item, strings))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => walkStrings(item, strings))
  return strings
}

const d3 = await import('d3')
const vegaLite = await import('vega-lite')
const vega = await import('vega')

const fixtures = Object.fromEntries(Object.entries(fixturePaths).map(([id, path]) => [id, readFixture(id, path)]))

for (const [id, fixture] of Object.entries(fixtures)) {
  if (!fixture) continue
  if (fixture.dataClassification !== 'synthetic_only') failures.push(`fixture_not_synthetic_only:${id}`)
  if (!Array.isArray(fixture.blockedUses)) failures.push(`fixture_missing_blocked_uses:${id}`)
  for (const token of blockedUseTokens) {
    if (!fixture.blockedUses?.includes(token)) failures.push(`fixture_blocked_use_missing:${id}:${token}`)
  }
  for (const field of requiredFalseBooleans) {
    if (fixture.approvals?.[field] !== false) failures.push(`fixture_approval_not_false:${id}:${field}`)
  }
  for (const value of walkStrings(fixture)) {
    if (/https?:\/\//i.test(value) || /X-Goog-Signature=|X-Amz-Signature=/i.test(value)) {
      failures.push(`fixture_contains_url_or_signature:${id}:${value}`)
    }
    if (/\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(value)) {
      failures.push(`fixture_contains_secret_like_value:${id}`)
    }
  }
}

const d3Fixture = fixtures.d3
if (d3Fixture) {
  const scale = d3.scaleLinear().domain(d3Fixture.scaleCheck.domain).range(d3Fixture.scaleCheck.range)
  const output = scale(d3Fixture.scaleCheck.sampleInput)
  if (output !== d3Fixture.scaleCheck.expectedOutput) failures.push(`d3_fixture_scale_output:${output}`)
  const lineOutput = d3.line()(d3Fixture.lineCheck.points)
  if (typeof lineOutput !== 'string' || !lineOutput.startsWith(d3Fixture.lineCheck.expectedPrefix)) {
    failures.push(`d3_fixture_line_output:${lineOutput}`)
  }
}

const echartsFixture = fixtures.echarts
if (echartsFixture) {
  if (echartsFixture.option?.series?.length !== echartsFixture.expectedSeriesCount) {
    failures.push(`echarts_series_count:${echartsFixture.option?.series?.length}`)
  }
  if (echartsFixture.option?.animation !== false) failures.push('echarts_animation_not_false')
  if (echartsFixture.option?.series?.[0]?.type !== 'bar') failures.push(`echarts_series_type:${echartsFixture.option?.series?.[0]?.type}`)
}

const vegaLiteFixture = fixtures.vega_lite
if (vegaLiteFixture) {
  const compiled = vegaLite.compile(vegaLiteFixture.spec)
  if (compiled?.spec?.marks?.[0]?.type !== vegaLiteFixture.expectedCompiledMarkType) {
    failures.push(`vega_lite_compiled_mark:${compiled?.spec?.marks?.[0]?.type}`)
  }
  const parsed = vega.parse(compiled.spec)
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.operators)) failures.push('vega_lite_fixture_parse_failed')
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  proofType: 'synthetic_fixture_metadata_validation_no_render',
  fixturesReviewed: Object.keys(fixturePaths),
  browserRuntimeUsed: false,
  chartInitializationUsed: false,
  renderExportUsed: false,
  routeExecutionUsed: false,
  workerExecutionUsed: false,
  providerRuntimeUsed: false,
  supabaseMutationUsed: false,
  publicArtifactsCreated: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
