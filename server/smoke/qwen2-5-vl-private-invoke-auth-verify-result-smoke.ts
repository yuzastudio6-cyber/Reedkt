import { readFileSync } from 'node:fs'

import { QWEN25_PRIVATE_INVOKE_AUTH_VERIFY_RESULT } from '../activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-verify-result'

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function collectForbiddenStrings(value: unknown, path = '$'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const forbiddenPatterns = [
      /https?:\/\//i,
      /run\.app/i,
      /gs:\/\//i,
      /storage\.googleapis\.com/i,
      /X-Goog-/i,
      /signature=/i,
      /BEGIN PRIVATE KEY/i,
      /AIza[0-9A-Za-z_-]{20,}/,
      /ya29\.[0-9A-Za-z_-]+/,
      /sk-[0-9A-Za-z_-]{20,}/,
      /Authorization:\s*Bearer/i,
      /identity[_-]?token\s*[:=]\s*['"][^'"]+['"]/i,
    ]
    if (forbiddenPatterns.some((pattern) => pattern.test(value))) {
      findings.push(path)
    }
    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findings.push(...collectForbiddenStrings(item, `${path}[${index}]`))
    })
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      findings.push(...collectForbiddenStrings(item, `${path}.${key}`))
    }
  }

  return findings
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const docText = readFileSync('docs/qwen2-5-vl-7b-private-invoke-auth-verify-result.md', 'utf8')
const runnerDocText = readFileSync('docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner.md', 'utf8')

check(
  packageJson.scripts?.['smoke:qwen2-5-vl-private-invoke-auth-verify-result'] ===
    'tsx server/smoke/qwen2-5-vl-private-invoke-auth-verify-result-smoke.ts',
  'Package script must point to the Qwen private invoke auth verify result smoke.',
)

const result = QWEN25_PRIVATE_INVOKE_AUTH_VERIFY_RESULT

check(
  result.mode === 'qwen2_5_vl_private_invoke_auth_verify_result_blocked_gcloud_reauth_no_invocation',
  'Result mode must record blocked gcloud reauth verification.',
)
check(result.status === 'blocked', 'Auth verification result must remain blocked.')
check(result.runId === 'qwen25-private-invoke-auth-20260627T060925', 'Run ID must match the recorded guarded preflight.')
check(result.target.project === 'reeditpro', 'Project must remain reeditpro.')
check(result.target.region === 'us-central1', 'Region must remain us-central1.')
check(result.target.service === 'reeditpro-qwen2-5-vl-l4-worker', 'Cloud Run service must match Qwen L4 worker.')
check(result.verifiedToolState.gcloudVersionChecked === true, 'gcloud version check must be recorded.')
check(result.verifiedToolState.activeProjectVerified === true, 'active project must be verified.')
check(result.verifiedToolState.activeProject === 'reeditpro', 'active project must be reeditpro.')
check(result.verifiedToolState.activeAccountPresent === true, 'active account presence must be recorded.')
check(result.verifiedToolState.activeAccountDomain === 'reeditpro.com', 'active account domain must be recorded without storing token data.')
check(result.blockedReason === 'gcloud_auth_session_requires_interactive_reauthentication', 'Blocked reason must be interactive reauth.')

const passedProbeIds = new Set<string>(result.passedProbeIds)
const blockedProbeIds = new Set<string>(result.blockedProbeIds)

for (const probe of ['gcloud_version', 'active_project', 'active_account']) {
  check(passedProbeIds.has(probe), `Passed probes must include ${probe}.`)
}

for (const probe of [
  'cloud_run_service_describe',
  'cloud_run_service_iam_policy',
  'runtime_service_account_describe',
  'project_invoker_policy_read',
]) {
  check(blockedProbeIds.has(probe), `Blocked probes must include ${probe}.`)
}

for (const key of [
  'tokenOutputPrinted',
  'serviceAccountKeyCreated',
  'identityTokenFetched',
  'cloudRunInvocationAttempted',
  'serviceRuntimeRequestSent',
  'iamBindingCreated',
  'dispatchSubmitted',
  'modelImportRun',
  'modelLoadRun',
  'vllmEngineInitialized',
  'forwardPassRun',
  'inferenceRun',
  'supabaseTouched',
  'sqlExecuted',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
] as const) {
  check(result.runtimeFlags[key] === false, `${key} must remain false.`)
}

check(result.qwenRuntimeReadiness.privateInvocationAuthVerified === false, 'Private invocation auth must not be verified.')
check(result.qwenRuntimeReadiness.readyForPrivateInvocationSmoke === false, 'Private invocation smoke must not be ready.')
check(result.qwenRuntimeReadiness.betaProductionReadyClaimed === false, 'Beta/production readiness must not be claimed.')

for (const phrase of [
  'Decision: `qwen2_5_vl_private_invoke_auth_verify_result_blocked_gcloud_reauth_no_invocation`',
  '`identityTokenFetched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`serviceRuntimeRequestSent=false`',
  '`inferenceRun=false`',
  '`betaUnlocked=false`',
  '`productionUnlocked=false`',
  result.nextPrompt,
]) {
  check(docText.includes(phrase), `Result doc missing phrase: ${phrase}`)
}

check(runnerDocText.includes('The runner never fetches identity tokens and never invokes Cloud Run.'), 'Runner doc must preserve no-token/no-invocation guarantee.')

const forbiddenFindings = [
  ...collectForbiddenStrings(result, 'result'),
  ...collectForbiddenStrings(docText, 'docText'),
]
check(forbiddenFindings.length === 0, `Forbidden concrete URL/token/storage markers found: ${forbiddenFindings.join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  status: result.status,
  runId: result.runId,
  passedProbeCount: result.passedProbeIds.length,
  blockedProbeCount: result.blockedProbeIds.length,
  identityTokenFetched: result.runtimeFlags.identityTokenFetched,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
