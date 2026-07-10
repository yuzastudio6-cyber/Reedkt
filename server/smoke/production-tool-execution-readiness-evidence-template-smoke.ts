import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  buildProductionToolExecutionReadinessEvidenceTemplateFromEnv,
  PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_TEMPLATE_VERSION,
  writeProductionToolExecutionReadinessEvidenceTemplateFile,
} from '../cli/production-tool-execution-readiness-evidence-template'
import {
  buildProductionToolExecutionReadinessEvidencePreflight,
  type ProductionToolExecutionReadinessEvidencePreflightEnv,
} from '../cli/production-tool-execution-readiness-evidence-preflight'

const tempRoot = mkdtempSync(join(tmpdir(), 'reeditpro-production-evidence-template-'))

const empty = await buildProductionToolExecutionReadinessEvidenceTemplateFromEnv({}, {
  generatedAt: new Date('2026-07-03T00:00:00.000Z'),
})
assert.equal(empty.version, PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_TEMPLATE_VERSION, 'template should use the evidence-file version')
assert.equal(empty.generatedAt, '2026-07-03T00:00:00.000Z', 'template should support deterministic generatedAt')
assert.ok(empty.instructions.some((item) => item.includes('do not commit')), 'template should warn operators not to commit local evidence')
assert.ok(empty.warnings.some((item) => item.includes('does not call backend routes')), 'template should document no-runtime behavior')
assert.equal(empty.templateBlockerSummary.paidProductionEvidenceReady, false, 'empty template should not imply paid-production readiness')
assert.equal(empty.templateBlockerSummary.readyForScopedReviewedToolExecution, true, 'template should preserve reviewed real handler readiness')
assert.equal(empty.recommendedSequence.length, 10, 'template should include the dry-run bundle recommended sequence')
assert.equal(
  empty.recommendedSequence.some((item) => item.command === 'npm run prod:readiness:tool-execution-evidence-collector'),
  true,
  'template should include final all-up evidence collector command',
)
assert.equal(
  empty.environment.REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW,
  'false',
  'template should default review confirmation to false',
)
assert.equal(
  empty.environment.REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED,
  'false',
  'template should default evidence booleans to false',
)
assert.equal(
  empty.environment.REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID,
  '',
  'template should leave artifact IDs blank instead of inventing evidence',
)
assert.equal(
  Object.keys(empty.environment).some((key) => key.includes('BEARER_TOKEN') || key.includes('API_BASE_URL') || key.includes('IDEMPOTENCY_KEY')),
  false,
  'template should not include backend collector credentials or idempotency settings',
)

const emptyPath = join(tempRoot, 'empty-template.json')
writeProductionToolExecutionReadinessEvidenceTemplateFile(emptyPath, empty)
const emptyPreflight = buildProductionToolExecutionReadinessEvidencePreflight({
  REEDITPRO_PRODUCTION_READINESS_EVIDENCE_FILE: emptyPath,
})
assert.equal(emptyPreflight.evidenceFile.loaded, true, 'template metadata should be accepted by the evidence-file preflight')
assert.equal(emptyPreflight.evidenceFile.errors.length, 0, 'template metadata should not create unsupported top-level key errors')
assert.equal(emptyPreflight.ok, false, 'empty template should remain blocked until evidence is supplied')
assert.ok(
  emptyPreflight.missingConfiguration.some((item) => item.includes('REEDITPRO_PRODUCTION_READINESS_SOURCE_ID')),
  'empty template should still name missing identity evidence',
)

const seededEnv: ProductionToolExecutionReadinessEvidencePreflightEnv = {
  REEDITPRO_PRODUCTION_READINESS_SOURCE_ID: 'operator-reviewed-production-evidence',
  REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA: '504a9d040d16c4d0a828c9333cd803154bd1b49d',
  REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID: 'workspace-template-smoke',
  REEDITPRO_PRODUCTION_READINESS_PROJECT_ID: 'project-template-smoke',
  REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID: 'track-a-track-b-reviewed-handler-evidence',
  REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA: '427ca9bdc039ce02edb34220400a29753752509b',
}
const seeded = await buildProductionToolExecutionReadinessEvidenceTemplateFromEnv(seededEnv)
assert.equal(seeded.environment.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID, seededEnv.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID)
assert.equal(seeded.environment.REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID, seededEnv.REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID)
assert.equal(seeded.environment.REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA, seededEnv.REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA)

await assert.rejects(
  () => buildProductionToolExecutionReadinessEvidenceTemplateFromEnv({
    REEDITPRO_PRODUCTION_OWNER_NOTES: 'owner note accidentally pasted service_role_key',
  }),
  /secret-like evidence input/,
  'template generator should reject secret-like allowed evidence values',
)

const rawTemplate = readFileSync(emptyPath, 'utf8')
assert.equal(rawTemplate.includes('service_role_key'), false, 'template file should not include secret-like placeholders')
assert.equal(rawTemplate.includes('REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN'), false, 'template file should not include bearer token settings')
assert.equal(rawTemplate.includes('REEDITPRO_PRODUCTION_READINESS_API_BASE_URL'), false, 'template file should not include backend API settings')

console.log(JSON.stringify({
  ok: true,
  version: empty.version,
  environmentVariables: Object.keys(empty.environment).length,
  recommendedSequence: empty.recommendedSequence.length,
  emptyTemplatePreflightLoaded: emptyPreflight.evidenceFile.loaded,
  seededSourceId: seeded.environment.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID,
}, null, 2))

rmSync(tempRoot, { force: true, recursive: true })
