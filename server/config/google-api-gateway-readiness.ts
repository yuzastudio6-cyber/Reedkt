export type GoogleApiGatewayReadinessProbeId =
  | 'enabled_services'
  | 'cloud_run_service'
  | 'cloud_run_iam'
  | 'api_gateway_apis'
  | 'api_gateway_configs'
  | 'api_gateway_gateways'

export interface GoogleApiGatewayReadinessTarget {
  projectId: string
  region: string
  cloudRunServiceName: string
  cloudRunRuntimeServiceAccount: string
  apiId: string
  gatewayId: string
  gatewayServiceAccount: string
}

export interface GoogleApiGatewayReadinessProbePlanItem {
  id: GoogleApiGatewayReadinessProbeId
  command: 'gcloud'
  args: string[]
  readOnly: true
}

export interface GoogleApiGatewayReadinessProbeResult {
  id: GoogleApiGatewayReadinessProbeId
  ok: boolean
  exitCode: number | null
  classification: 'passed' | 'service_disabled' | 'permission_denied' | 'not_found' | 'timeout' | 'unavailable' | 'failed'
  stdout: string
  outputByteCount: number
}

export const REEDITPRO_GOOGLE_API_GATEWAY_STAGING_TARGET = Object.freeze({
  projectId: 'reeditpro',
  region: 'us-east1',
  cloudRunServiceName: 'reeditpro-api-staging',
  cloudRunRuntimeServiceAccount: 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com',
  apiId: 'reeditpro-browser-staging',
  gatewayId: 'reeditpro-browser-staging',
  gatewayServiceAccount: 'reeditpro-api-gateway-staging@reeditpro.iam.gserviceaccount.com',
}) satisfies GoogleApiGatewayReadinessTarget

export interface GoogleApiGatewayReadinessReport {
  ok: boolean
  decision: 'ready_for_signed_in_gateway_route_test' | 'blocked_before_signed_in_gateway_route_test'
  target: {
    projectMatched: boolean
    regionMatched: boolean
    cloudRunServiceNameMatched: boolean
    apiIdMatched: boolean
    gatewayIdMatched: boolean
  }
  gates: {
    requiredGoogleApisEnabled: boolean
    cloudRunServiceResolved: boolean
    cloudRunReady: boolean
    cloudRunUsesExpectedRuntimeServiceAccount: boolean
    cloudRunBrowserTransportConfigured: boolean
    cloudRunRequiredEnvNamesPresent: boolean
    cloudRunSensitiveEnvUsesSecretReferences: boolean
    cloudRunPublicInvokerAbsent: boolean
    gatewayServiceAccountIsInvoker: boolean
    cloudRunOnlyExpectedGatewayInvoker: boolean
    apiResourcePresent: boolean
    apiConfigPresent: boolean
    gatewayPresent: boolean
    gatewayActive: boolean
  }
  counts: {
    enabledRequiredGoogleApis: number
    requiredGoogleApis: number
    cloudRunInvokerBindings: number
    cloudRunInvokerMembers: number
    cloudRunPublicInvokerMembers: number
    cloudRunUnexpectedInvokerMembers: number
    apiResources: number
    apiConfigs: number
    gateways: number
  }
  missingRuntimeEnvNames: string[]
  probeStatus: Array<{
    id: GoogleApiGatewayReadinessProbeId
    ok: boolean
    classification: GoogleApiGatewayReadinessProbeResult['classification']
    outputByteCount: number
  }>
  blockers: string[]
  boundaries: {
    readOnly: true
    apiEnablementPerformed: false
    resourceCreationPerformed: false
    iamMutationPerformed: false
    deploymentPerformed: false
    supabaseContacted: false
    providerCalled: false
    billingCalled: false
    secretsPrinted: false
    rawIamPrincipalsPrinted: false
  }
}

const REQUIRED_GOOGLE_APIS = [
  'apigateway.googleapis.com',
  'servicecontrol.googleapis.com',
  'servicemanagement.googleapis.com',
] as const

const REQUIRED_RUNTIME_ENV_NAMES = [
  'API_ALLOWED_CORS_ORIGINS',
  'REEDITPRO_BROWSER_API_TRANSPORT',
  'REEDITPRO_INTERNAL_SERVICE_TOKEN',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
] as const

const SENSITIVE_RUNTIME_ENV_NAMES = [
  'REEDITPRO_INTERNAL_SERVICE_TOKEN',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
] as const

export function createGoogleApiGatewayReadinessProbePlan(
  target: GoogleApiGatewayReadinessTarget,
): GoogleApiGatewayReadinessProbePlanItem[] {
  assertTarget(target)
  const projectArgs = [`--project=${target.projectId}`, '--quiet']

  return [
    {
      id: 'enabled_services',
      command: 'gcloud',
      args: [
        'services',
        'list',
        '--enabled',
        ...projectArgs,
        '--format=value(config.name)',
      ],
      readOnly: true,
    },
    {
      id: 'cloud_run_service',
      command: 'gcloud',
      args: [
        'run',
        'services',
        'describe',
        target.cloudRunServiceName,
        ...projectArgs,
        `--region=${target.region}`,
        '--format=json',
      ],
      readOnly: true,
    },
    {
      id: 'cloud_run_iam',
      command: 'gcloud',
      args: [
        'run',
        'services',
        'get-iam-policy',
        target.cloudRunServiceName,
        ...projectArgs,
        `--region=${target.region}`,
        '--format=json',
      ],
      readOnly: true,
    },
    {
      id: 'api_gateway_apis',
      command: 'gcloud',
      args: [
        'api-gateway',
        'apis',
        'list',
        ...projectArgs,
        `--filter=name:${target.apiId}`,
        '--format=json',
      ],
      readOnly: true,
    },
    {
      id: 'api_gateway_configs',
      command: 'gcloud',
      args: [
        'api-gateway',
        'api-configs',
        'list',
        ...projectArgs,
        `--api=${target.apiId}`,
        '--format=json',
      ],
      readOnly: true,
    },
    {
      id: 'api_gateway_gateways',
      command: 'gcloud',
      args: [
        'api-gateway',
        'gateways',
        'list',
        ...projectArgs,
        `--location=${target.region}`,
        `--filter=name:${target.gatewayId}`,
        '--format=json',
      ],
      readOnly: true,
    },
  ]
}

export function evaluateGoogleApiGatewayReadiness(
  target: GoogleApiGatewayReadinessTarget,
  results: GoogleApiGatewayReadinessProbeResult[],
): GoogleApiGatewayReadinessReport {
  assertTarget(target)
  const byId = new Map(results.map((result) => [result.id, result]))
  const enabledServices = new Set(lines(byId.get('enabled_services')?.stdout))
  const enabledRequiredGoogleApis = REQUIRED_GOOGLE_APIS.filter((api) => enabledServices.has(api)).length

  const cloudRun = safeJsonRecord(byId.get('cloud_run_service'))
  const cloudRunName = stringAt(cloudRun, ['metadata', 'name'])
  const cloudRunUrl = stringAt(cloudRun, ['status', 'url'])
  const cloudRunReady = arrayAt(cloudRun, ['status', 'conditions']).some((condition) =>
    isRecord(condition) && condition.type === 'Ready' && condition.status === 'True')
  const runtimeServiceAccount = stringAt(cloudRun, ['spec', 'template', 'spec', 'serviceAccountName'])
  const envEntries = arrayAt(cloudRun, ['spec', 'template', 'spec', 'containers', 0, 'env'])
    .filter(isRecord)
  const envNames = new Set(envEntries.map((entry) => typeof entry.name === 'string' ? entry.name : ''))
  const missingRuntimeEnvNames = REQUIRED_RUNTIME_ENV_NAMES.filter((name) => !envNames.has(name))
  const browserTransportConfigured = envEntries.some((entry) =>
    entry.name === 'REEDITPRO_BROWSER_API_TRANSPORT' && entry.value === 'google_api_gateway')
  const sensitiveEnvUsesSecretReferences = SENSITIVE_RUNTIME_ENV_NAMES.every((name) => {
    const entry = envEntries.find((candidate) => candidate.name === name)
    return Boolean(entry && isRecord(entry.valueFrom) && isRecord(entry.valueFrom.secretKeyRef))
  })

  const iam = safeJsonRecord(byId.get('cloud_run_iam'))
  const bindings = Array.isArray(iam.bindings) ? iam.bindings.filter(isRecord) : []
  const invokerBindings = bindings.filter((binding) => binding.role === 'roles/run.invoker')
  const invokerMembers = invokerBindings.flatMap((binding) =>
    Array.isArray(binding.members) ? binding.members.filter((member): member is string => typeof member === 'string') : [])
  const uniqueInvokerMembers = [...new Set(invokerMembers)]
  const publicInvokerMembers = uniqueInvokerMembers.filter((member) =>
    member === 'allUsers' || member === 'allAuthenticatedUsers')
  const gatewayInvokerMember = `serviceAccount:${target.gatewayServiceAccount}`
  const unexpectedInvokerMembers = uniqueInvokerMembers.filter((member) => member !== gatewayInvokerMember)

  const apiResources = safeJsonArray(byId.get('api_gateway_apis'))
  const apiConfigs = safeJsonArray(byId.get('api_gateway_configs'))
  const gateways = safeJsonArray(byId.get('api_gateway_gateways'))
  const apiResourcePresent = apiResources.some((entry) => resourceNameEndsWith(entry, target.apiId))
  const apiConfigPresent = apiConfigs.length > 0
  const matchingGateway = gateways.find((entry) => resourceNameEndsWith(entry, target.gatewayId))
  const gatewayActive = Boolean(
    matchingGateway &&
    (matchingGateway.state === 'ACTIVE' || matchingGateway.state === 'READY') &&
    typeof matchingGateway.defaultHostname === 'string' &&
    matchingGateway.defaultHostname.length > 0,
  )

  const gates = {
    requiredGoogleApisEnabled: enabledRequiredGoogleApis === REQUIRED_GOOGLE_APIS.length,
    cloudRunServiceResolved: byId.get('cloud_run_service')?.ok === true &&
      cloudRunName === target.cloudRunServiceName &&
      isExactCloudRunUrl(cloudRunUrl),
    cloudRunReady,
    cloudRunUsesExpectedRuntimeServiceAccount: runtimeServiceAccount === target.cloudRunRuntimeServiceAccount,
    cloudRunBrowserTransportConfigured: browserTransportConfigured,
    cloudRunRequiredEnvNamesPresent: missingRuntimeEnvNames.length === 0,
    cloudRunSensitiveEnvUsesSecretReferences: sensitiveEnvUsesSecretReferences,
    cloudRunPublicInvokerAbsent: byId.get('cloud_run_iam')?.ok === true && publicInvokerMembers.length === 0,
    gatewayServiceAccountIsInvoker: uniqueInvokerMembers.includes(gatewayInvokerMember),
    cloudRunOnlyExpectedGatewayInvoker: byId.get('cloud_run_iam')?.ok === true &&
      uniqueInvokerMembers.length === 1 &&
      unexpectedInvokerMembers.length === 0,
    apiResourcePresent,
    apiConfigPresent,
    gatewayPresent: Boolean(matchingGateway),
    gatewayActive,
  }
  const blockers = Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate)
  const ok = blockers.length === 0

  return {
    ok,
    decision: ok
      ? 'ready_for_signed_in_gateway_route_test'
      : 'blocked_before_signed_in_gateway_route_test',
    target: {
      projectMatched: target.projectId === 'reeditpro',
      regionMatched: target.region === 'us-east1',
      cloudRunServiceNameMatched: target.cloudRunServiceName === 'reeditpro-api-staging',
      apiIdMatched: target.apiId === 'reeditpro-browser-staging',
      gatewayIdMatched: target.gatewayId === 'reeditpro-browser-staging',
    },
    gates,
    counts: {
      enabledRequiredGoogleApis,
      requiredGoogleApis: REQUIRED_GOOGLE_APIS.length,
      cloudRunInvokerBindings: invokerBindings.length,
      cloudRunInvokerMembers: uniqueInvokerMembers.length,
      cloudRunPublicInvokerMembers: publicInvokerMembers.length,
      cloudRunUnexpectedInvokerMembers: unexpectedInvokerMembers.length,
      apiResources: apiResources.length,
      apiConfigs: apiConfigs.length,
      gateways: gateways.length,
    },
    missingRuntimeEnvNames,
    probeStatus: createGoogleApiGatewayReadinessProbePlan(target).map(({ id }) => {
      const result = byId.get(id)
      return {
        id,
        ok: result?.ok === true,
        classification: result?.classification ?? 'unavailable',
        outputByteCount: result?.outputByteCount ?? 0,
      }
    }),
    blockers,
    boundaries: {
      readOnly: true,
      apiEnablementPerformed: false,
      resourceCreationPerformed: false,
      iamMutationPerformed: false,
      deploymentPerformed: false,
      supabaseContacted: false,
      providerCalled: false,
      billingCalled: false,
      secretsPrinted: false,
      rawIamPrincipalsPrinted: false,
    },
  }
}

function assertTarget(target: GoogleApiGatewayReadinessTarget): void {
  if (
    target.projectId !== 'reeditpro' ||
    target.region !== 'us-east1' ||
    target.cloudRunServiceName !== 'reeditpro-api-staging' ||
    target.cloudRunRuntimeServiceAccount !== 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com' ||
    target.apiId !== 'reeditpro-browser-staging' ||
    target.gatewayId !== 'reeditpro-browser-staging' ||
    target.gatewayServiceAccount !== 'reeditpro-api-gateway-staging@reeditpro.iam.gserviceaccount.com'
  ) {
    throw new Error('Google API Gateway readiness target must match the exact reviewed ReEditPro staging lane.')
  }
}

function safeJsonRecord(result: GoogleApiGatewayReadinessProbeResult | undefined): Record<string, unknown> {
  if (!result?.ok) return {}
  try {
    const value = JSON.parse(result.stdout) as unknown
    return isRecord(value) ? value : {}
  } catch {
    return {}
  }
}

function safeJsonArray(result: GoogleApiGatewayReadinessProbeResult | undefined): Record<string, unknown>[] {
  if (!result?.ok) return []
  try {
    const value = JSON.parse(result.stdout) as unknown
    return Array.isArray(value) ? value.filter(isRecord) : []
  } catch {
    return []
  }
}

function lines(value: string | undefined): string[] {
  return (value ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

function stringAt(value: unknown, path: Array<string | number>): string | undefined {
  let current = value
  for (const key of path) {
    if (typeof key === 'number') {
      if (!Array.isArray(current)) return undefined
      current = current[key]
    } else {
      if (!isRecord(current)) return undefined
      current = current[key]
    }
  }
  return typeof current === 'string' ? current : undefined
}

function arrayAt(value: unknown, path: Array<string | number>): unknown[] {
  let current = value
  for (const key of path) {
    if (typeof key === 'number') {
      if (!Array.isArray(current)) return []
      current = current[key]
    } else {
      if (!isRecord(current)) return []
      current = current[key]
    }
  }
  return Array.isArray(current) ? current : []
}

function resourceNameEndsWith(value: Record<string, unknown>, expected: string): boolean {
  return typeof value.name === 'string' && value.name.split('/').at(-1) === expected
}

function isExactCloudRunUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      url.hostname.endsWith('.run.app') &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
