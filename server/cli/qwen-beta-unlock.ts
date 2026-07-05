type Gate = {
  id: string
  ready: boolean
  expected: string
  blockedStatus: string
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function hasProject(env: NodeJS.ProcessEnv): boolean {
  return Boolean(clean(env.GOOGLE_CLOUD_PROJECT_ID) ?? clean(env.GCLOUD_PROJECT) ?? clean(env.GOOGLE_CLOUD_PROJECT))
}

function hasBaseUrl(env: NodeJS.ProcessEnv): boolean {
  return Boolean(clean(env.QWEN_REASONING_BASE_URL) ?? clean(env.QWEN_REASONING_BASE_URL_SECRET))
}

function hasModelId(env: NodeJS.ProcessEnv): boolean {
  return Boolean(clean(env.QWEN_REASONING_MODEL_ID) ?? clean(env.QWEN_REASONING_MODEL_ID_SECRET))
}

function gates(env: NodeJS.ProcessEnv): Gate[] {
  return [
    {
      id: 'runtime_mode',
      ready: clean(env.REEDITPRO_QWEN_RUNTIME_MODE) === 'beta_enabled',
      expected: 'REEDITPRO_QWEN_RUNTIME_MODE=beta_enabled',
      blockedStatus: 'blocked_runtime_disabled',
    },
    {
      id: 'google_project',
      ready: hasProject(env),
      expected: 'GOOGLE_CLOUD_PROJECT_ID or GCLOUD_PROJECT configured server-side',
      blockedStatus: 'blocked_missing_project_config',
    },
    {
      id: 'api_key_secret_reference',
      ready: Boolean(clean(env.QWEN_REASONING_API_KEY_SECRET)),
      expected: 'QWEN_REASONING_API_KEY_SECRET points at a Secret Manager secret id/resource',
      blockedStatus: 'blocked_missing_secret_reference',
    },
    {
      id: 'provider_base_url',
      ready: hasBaseUrl(env),
      expected: 'QWEN_REASONING_BASE_URL or QWEN_REASONING_BASE_URL_SECRET configured server-side',
      blockedStatus: 'blocked_missing_endpoint',
    },
    {
      id: 'provider_model_id',
      ready: hasModelId(env),
      expected: 'QWEN_REASONING_MODEL_ID or QWEN_REASONING_MODEL_ID_SECRET configured server-side',
      blockedStatus: 'blocked_missing_model_id',
    },
  ]
}

function firstBlocked(items: Gate[]): string | undefined {
  return items.find((item) => !item.ready)?.blockedStatus
}

const strict = process.argv.includes('--strict')
const example = process.argv.includes('--example')

if (example) {
  console.log([
    'export REEDITPRO_QWEN_RUNTIME_MODE=beta_enabled',
    'export GOOGLE_CLOUD_PROJECT_ID=<google-cloud-project-id>',
    'export QWEN_REASONING_API_KEY_SECRET=<secret-manager-secret-id>',
    'export QWEN_REASONING_BASE_URL=<provider-base-url>',
    'export QWEN_REASONING_MODEL_ID=<qwen-model-id>',
    '# Optional:',
    'export QWEN_REASONING_TRANSPORT_PROFILE=openai_chat_completions',
    'export QWEN_REASONING_REQUEST_PATH=/v1/chat/completions',
  ].join('\n'))
  process.exit(0)
}

const items = gates(process.env)
const blockedStatus = firstBlocked(items)
const result = {
  command: 'unlock:qwen-beta',
  ready: !blockedStatus,
  status: blockedStatus ?? 'ready_for_doctor',
  gates: items.map((item) => ({
    id: item.id,
    ready: item.ready,
    expected: item.expected,
    blockedStatus: item.ready ? undefined : item.blockedStatus,
  })),
  flags: {
    providerCallMade: false,
    qwenCallMade: false,
    secretValueAccessed: false,
    secretValuePrinted: false,
    gcloudCommandRun: false,
    supabaseCommandRun: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
  },
  nextStep: blockedStatus
    ? 'Configure the missing backend-only Qwen beta gate outside source control, then run doctor:qwen-beta.'
    : 'Run doctor:qwen-beta, then smoke:qwen-live-provider and smoke:qwen-marker-chat-live.',
}

console.log(JSON.stringify(result, null, 2))
if (strict && blockedStatus) process.exitCode = 1
