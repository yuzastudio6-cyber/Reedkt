import { execFileSync } from 'node:child_process'

type ProbeDecision = string

type VariableStatus = {
  key: string
  configured: boolean
  secretReference?: boolean
}

type SecretCandidate = {
  name: string
  secretId: string
  matchedBy: string[]
  exactWorkflowReference: boolean
}

type ProbeResult = {
  ok: boolean
  readyForLiveVerification: boolean
  decision: ProbeDecision
  googleProjectConfigured: boolean
  googleProjectId?: string
  variableStatus: VariableStatus[]
  missingRequiredVariables: string[]
  secretMetadataAvailable: boolean
  secretCandidates: SecretCandidate[]
  exactReferenceCandidates: SecretCandidate[]
  flags: {
    secretPayloadAccessed: false
    secretValuePrinted: false
    providerCallMade: false
    qwenCallMade: false
    supabaseCommandRun: false
    workerJobCreated: false
    renderJobCreated: false
    creditReservedOrSpent: false
  }
  nextStep: string
}

const CONFIRM_VALUE = 'PROBE_REEDITPRO_QWEN_BETA_CONFIG'
const DECISION_PREFIX = 'qwen_beta_config_probe_'
const DECISIONS = {
  ready: `${DECISION_PREFIX}passed_ready_for_live_verification`,
  missingVariables: `${DECISION_PREFIX}completed_missing_workflow_variables`,
  noCandidates: `${DECISION_PREFIX}completed_no_matching_secret_candidates`,
  missingConfirmation: `${DECISION_PREFIX}blocked_missing_confirmation`,
  missingProject: `${DECISION_PREFIX}blocked_missing_google_project`,
  metadataUnavailable: `${DECISION_PREFIX}blocked_gcloud_metadata_unavailable`,
} as const
const SECRET_NAME_PATTERNS = [
  { id: 'qwen', pattern: /qwen/i },
  { id: 'dashscope', pattern: /dashscope/i },
  { id: 'reasoning', pattern: /reasoning/i },
  { id: 'aliyun', pattern: /aliyun/i },
  { id: 'alibaba', pattern: /alibaba/i },
]

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = clean(process.env[key])
    if (value) return value
  }

  return undefined
}

function output(result: ProbeResult): never {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exit(result.ok ? 0 : 1)
}

function configured(key: string, secretReference = false): VariableStatus {
  return {
    key,
    configured: Boolean(clean(process.env[key])),
    secretReference,
  }
}

function normalizedSecretId(reference: string): string {
  return reference.split('/').filter(Boolean).at(-1) ?? reference
}

function listSecretNames(projectId: string): string[] {
  const raw = execFileSync('gcloud', [
    'secrets',
    'list',
    `--project=${projectId}`,
    '--format=json(name)',
  ], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const parsed = JSON.parse(raw) as Array<{ name?: unknown }>
  return parsed
    .map((item) => typeof item.name === 'string' ? item.name : undefined)
    .filter((item): item is string => Boolean(item))
}

function createCandidates(secretNames: string[], exactReferences: string[]): SecretCandidate[] {
  const exactIds = new Set(exactReferences.map(normalizedSecretId))

  return secretNames
    .map((name) => {
      const secretId = normalizedSecretId(name)
      const matchedBy = SECRET_NAME_PATTERNS
        .filter((item) => item.pattern.test(secretId))
        .map((item) => item.id)
      const exactWorkflowReference = exactIds.has(secretId)

      if (matchedBy.length === 0 && !exactWorkflowReference) return undefined

      return {
        name,
        secretId,
        matchedBy,
        exactWorkflowReference,
      }
    })
    .filter((item): item is SecretCandidate => Boolean(item))
    .sort((left, right) => left.secretId.localeCompare(right.secretId))
}

function decide(input: {
  missingRequiredVariables: string[]
  secretMetadataAvailable: boolean
  candidates: SecretCandidate[]
  exactReferenceCandidates: SecretCandidate[]
}): { decision: ProbeDecision; ok: boolean; readyForLiveVerification: boolean; nextStep: string } {
  if (!input.secretMetadataAvailable) {
    return {
      decision: DECISIONS.metadataUnavailable,
      ok: false,
      readyForLiveVerification: false,
      nextStep: 'Fix GitHub Actions GCP authentication or Secret Manager list permission, then rerun the Qwen beta config probe.',
    }
  }

  if (input.missingRequiredVariables.length > 0) {
    return {
      decision: DECISIONS.missingVariables,
      ok: true,
      readyForLiveVerification: false,
      nextStep: 'Set the missing QWEN_REASONING_* GitHub variables to owner-approved Secret Manager refs or literal non-secret endpoint/model values, then rerun Qwen Live Beta Verification.',
    }
  }

  if (input.candidates.length === 0) {
    return {
      decision: DECISIONS.noCandidates,
      ok: true,
      readyForLiveVerification: false,
      nextStep: 'Create an owner-approved Qwen/DashScope API key in Secret Manager, set QWEN_REASONING_API_KEY_SECRET, and rerun the probe.',
    }
  }

  if (input.exactReferenceCandidates.length === 0) {
    return {
      decision: DECISIONS.missingVariables,
      ok: true,
      readyForLiveVerification: false,
      nextStep: 'A matching secret name exists, but the workflow variables do not point to it yet. Set QWEN_REASONING_API_KEY_SECRET and rerun live verification.',
    }
  }

  return {
    decision: DECISIONS.ready,
    ok: true,
    readyForLiveVerification: true,
    nextStep: 'Run Qwen Live Beta Verification. This probe did not call Qwen or access secret payloads.',
  }
}

async function main() {
  if (clean(process.env.REEDITPRO_CONFIRM_QWEN_BETA_CONFIG_PROBE) !== CONFIRM_VALUE) {
    output({
      ok: false,
      readyForLiveVerification: false,
      decision: DECISIONS.missingConfirmation,
      googleProjectConfigured: false,
      variableStatus: [],
      missingRequiredVariables: [],
      secretMetadataAvailable: false,
      secretCandidates: [],
      exactReferenceCandidates: [],
      flags: {
        secretPayloadAccessed: false,
        secretValuePrinted: false,
        providerCallMade: false,
        qwenCallMade: false,
        supabaseCommandRun: false,
        workerJobCreated: false,
        renderJobCreated: false,
        creditReservedOrSpent: false,
      },
      nextStep: 'Set REEDITPRO_CONFIRM_QWEN_BETA_CONFIG_PROBE=PROBE_REEDITPRO_QWEN_BETA_CONFIG.',
    })
  }

  const googleProjectId = readEnv('GOOGLE_CLOUD_PROJECT_ID', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT')
  if (!googleProjectId) {
    output({
      ok: false,
      readyForLiveVerification: false,
      decision: DECISIONS.missingProject,
      googleProjectConfigured: false,
      variableStatus: [],
      missingRequiredVariables: ['GOOGLE_CLOUD_PROJECT_ID'],
      secretMetadataAvailable: false,
      secretCandidates: [],
      exactReferenceCandidates: [],
      flags: {
        secretPayloadAccessed: false,
        secretValuePrinted: false,
        providerCallMade: false,
        qwenCallMade: false,
        supabaseCommandRun: false,
        workerJobCreated: false,
        renderJobCreated: false,
        creditReservedOrSpent: false,
      },
      nextStep: 'Set GOOGLE_CLOUD_PROJECT_ID or GCLOUD_PROJECT before probing Secret Manager metadata.',
    })
  }

  const variableStatus = [
    configured('QWEN_REASONING_API_KEY_SECRET', true),
    configured('QWEN_REASONING_BASE_URL'),
    configured('QWEN_REASONING_BASE_URL_SECRET', true),
    configured('QWEN_REASONING_MODEL_ID'),
    configured('QWEN_REASONING_MODEL_ID_SECRET', true),
    configured('QWEN_REASONING_TRANSPORT_PROFILE'),
    configured('QWEN_REASONING_REQUEST_PATH'),
    configured('QWEN_REASONING_TIMEOUT_MS'),
    configured('QWEN_REASONING_MAX_RETRIES'),
  ]

  const missingRequiredVariables = [
    clean(process.env.QWEN_REASONING_API_KEY_SECRET) ? undefined : 'QWEN_REASONING_API_KEY_SECRET',
    clean(process.env.QWEN_REASONING_BASE_URL) || clean(process.env.QWEN_REASONING_BASE_URL_SECRET)
      ? undefined
      : 'QWEN_REASONING_BASE_URL or QWEN_REASONING_BASE_URL_SECRET',
    clean(process.env.QWEN_REASONING_MODEL_ID) || clean(process.env.QWEN_REASONING_MODEL_ID_SECRET)
      ? undefined
      : 'QWEN_REASONING_MODEL_ID or QWEN_REASONING_MODEL_ID_SECRET',
  ].filter((item): item is string => Boolean(item))

  let secretMetadataAvailable: boolean
  let candidates: SecretCandidate[] = []
  try {
    const exactReferences = [
      clean(process.env.QWEN_REASONING_API_KEY_SECRET),
      clean(process.env.QWEN_REASONING_BASE_URL_SECRET),
      clean(process.env.QWEN_REASONING_MODEL_ID_SECRET),
    ].filter((item): item is string => Boolean(item))
    candidates = createCandidates(listSecretNames(googleProjectId), exactReferences)
    secretMetadataAvailable = true
  } catch {
    secretMetadataAvailable = false
  }

  const exactReferenceCandidates = candidates.filter((candidate) => candidate.exactWorkflowReference)
  const result = decide({
    missingRequiredVariables,
    secretMetadataAvailable,
    candidates,
    exactReferenceCandidates,
  })

  output({
    ok: result.ok,
    readyForLiveVerification: result.readyForLiveVerification,
    decision: result.decision,
    googleProjectConfigured: true,
    googleProjectId,
    variableStatus,
    missingRequiredVariables,
    secretMetadataAvailable,
    secretCandidates: candidates,
    exactReferenceCandidates,
    flags: {
      secretPayloadAccessed: false,
      secretValuePrinted: false,
      providerCallMade: false,
      qwenCallMade: false,
      supabaseCommandRun: false,
      workerJobCreated: false,
      renderJobCreated: false,
      creditReservedOrSpent: false,
    },
    nextStep: result.nextStep,
  })
}

void main()
