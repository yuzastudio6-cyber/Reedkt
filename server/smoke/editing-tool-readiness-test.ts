import { EDITING_TOOL_IDS } from '../tools/editing-tool-contracts'
import {
  runEditingToolReadiness,
  throwIfStrictReadinessFailed,
} from '../tools/editing-tool-readiness'
import { EditingToolReadinessError } from '../tools/editing-tool-errors'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const sourceEnv = {
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STRICT_TOOL_READINESS: 'false',
  TOOL_CHECK_TIMEOUT_MS: '10000',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
}

const nonStrict = await runEditingToolReadiness({ sourceEnv })

assert(nonStrict.ok, 'Non-strict tool readiness should not fail on optional or planned tools.')
assert(!nonStrict.strict, 'Non-strict result should be marked non-strict.')
assert(nonStrict.checks.length === EDITING_TOOL_IDS.length, 'Readiness should return every registered tool.')

const statuses = new Set(['passed', 'missing', 'warning', 'failed', 'blocked'])
for (const check of nonStrict.checks) {
  assert(statuses.has(check.status), `${check.toolId} should return an explicit status.`)
  assert(check.summary.length > 0, `${check.toolId} should return a bounded summary.`)
}

const optionalMissingOrWarning = nonStrict.checks.some((check) => (
  !check.required && check.status !== 'passed'
))
assert(optionalMissingOrWarning, 'At least one optional/planned tool should be allowed to be missing or warning.')

const futureStrict = await runEditingToolReadiness({
  strict: true,
  toolId: 'whisper',
  requiredToolIds: ['whisper'],
  sourceEnv,
})

assert(!futureStrict.ok, 'Strict readiness should fail when a simulated future required tool is missing.')
assert(
  futureStrict.missingRequiredToolIds.includes('whisper'),
  'Strict readiness should name the missing future required tool.',
)

let strictError: unknown
try {
  throwIfStrictReadinessFailed(futureStrict)
} catch (error) {
  strictError = error
}

assert(strictError instanceof EditingToolReadinessError, 'Strict failure should throw EditingToolReadinessError.')
assert(
  strictError instanceof EditingToolReadinessError && strictError.code === 'TOOL_STRICT_READINESS_FAILED',
  'Strict failure should use TOOL_STRICT_READINESS_FAILED.',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'non_strict_allows_optional_missing',
    'statuses_explicit',
    'strict_future_required_missing_fails',
    'strict_error_code_stable',
  ],
  nonStrictStatusByTool: Object.fromEntries(nonStrict.checks.map((check) => [check.toolId, check.status])),
  strictMissingRequiredToolIds: futureStrict.missingRequiredToolIds,
}))
