export const SIGNED_IN_PRIVATE_MEDIA_STORAGE_CONTRACT_VERSION =
  'signed-in-private-media-storage-readiness-v1' as const

export const SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES = [
  'source-media',
  'generated-assets',
  'processed-media',
  'previews',
  'exports',
  'thumbnails',
  'qa-artifacts',
  'worker-temp',
] as const

export type SignedInPrivateMediaBucketPurpose =
  typeof SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES[number]

type BucketProbeId = `bucket_${SignedInPrivateMediaBucketPurpose}`
type BucketIamProbeId = `bucket_iam_${SignedInPrivateMediaBucketPurpose}`

export type SignedInPrivateMediaStorageProbeId =
  | 'enabled_services'
  | 'runtime_service_account'
  | 'runtime_service_account_iam'
  | BucketProbeId
  | BucketIamProbeId

export interface SignedInPrivateMediaStorageTarget {
  projectId: 'reeditpro'
  region: 'us-east1'
  appOrigin: 'https://yuzastudio6-cyber.github.io'
  runtimeServiceAccount: 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com'
  bucketPrefix: 'reeditpro-staging-reeditpro-us-east1'
}

export const REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET = {
  projectId: 'reeditpro',
  region: 'us-east1',
  appOrigin: 'https://yuzastudio6-cyber.github.io',
  runtimeServiceAccount: 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com',
  bucketPrefix: 'reeditpro-staging-reeditpro-us-east1',
} satisfies SignedInPrivateMediaStorageTarget

export interface SignedInPrivateMediaStorageProbePlanItem {
  id: SignedInPrivateMediaStorageProbeId
  command: 'gcloud'
  args: string[]
  readOnly: true
}

export interface SignedInPrivateMediaStorageProbeResult {
  id: SignedInPrivateMediaStorageProbeId
  ok: boolean
  exitCode: number | null
  classification:
    | 'passed'
    | 'service_disabled'
    | 'permission_denied'
    | 'not_found'
    | 'timeout'
    | 'unavailable'
    | 'failed'
  stdout: string
  outputByteCount: number
}

export interface SignedInPrivateMediaStorageReadinessReport {
  schemaVersion: 1
  contractVersion: typeof SIGNED_IN_PRIVATE_MEDIA_STORAGE_CONTRACT_VERSION
  ok: boolean
  decision:
    | 'ready_for_same_sha_gateway_storage_configuration'
    | 'blocked_before_same_sha_gateway_storage_configuration'
  evidenceClass: 'live_read_only_google_cloud_configuration_evidence'
  target: {
    projectMatched: boolean
    regionMatched: boolean
    appOriginMatched: boolean
    runtimeServiceAccountMatched: boolean
    bucketPrefixMatched: boolean
  }
  gates: {
    requiredGoogleApisEnabled: boolean
    runtimeServiceAccountReady: boolean
    runtimeCanSignBlob: boolean
    allBucketsResolved: boolean
    allBucketsRegional: boolean
    allBucketsStandardStorageClass: boolean
    allBucketsUniformAccess: boolean
    allBucketsPublicAccessPrevented: boolean
    allBucketsStagingLabeled: boolean
    allBucketsSoftDeleteProtected: boolean
    allBucketsLifecycleBounded: boolean
    sourceBucketCorsExact: boolean
    runtimeBucketRolesPresent: boolean
    publicBucketPrincipalsAbsent: boolean
  }
  counts: {
    requiredGoogleApis: number
    enabledRequiredGoogleApis: number
    requiredBuckets: number
    resolvedBuckets: number
    exactBucketConfigurations: number
    runtimeBucketRoleBindings: number
    publicBucketPrincipalBindings: number
  }
  blockers: string[]
  probeStatus: Array<{
    id: SignedInPrivateMediaStorageProbeId
    ok: boolean
    classification: SignedInPrivateMediaStorageProbeResult['classification']
    outputByteCount: number
  }>
  boundaries: {
    readOnly: true
    objectBytesRead: false
    objectWritten: false
    objectDeleted: false
    signedUrlCreated: false
    resumableSessionCreated: false
    cloudMutated: false
    supabaseContacted: false
    providerCalled: false
    customerBillingCalled: false
    secretsPrinted: false
    rawIamPrincipalsPrinted: false
    largeMediaDistributedFinalizationVerified: false
    productionReady: false
  }
}

const REQUIRED_GOOGLE_APIS = [
  'iamcredentials.googleapis.com',
  'storage.googleapis.com',
] as const

const EXPECTED_LIFECYCLE_AGE_DAYS: Record<SignedInPrivateMediaBucketPurpose, number> = {
  'source-media': 30,
  'generated-assets': 14,
  'processed-media': 14,
  previews: 7,
  exports: 30,
  thumbnails: 30,
  'qa-artifacts': 14,
  'worker-temp': 1,
}

const SOURCE_CORS_METHODS = ['GET', 'HEAD', 'PUT'] as const
const SOURCE_CORS_HEADERS = [
  'Content-Range',
  'Content-Type',
  'ETag',
  'Range',
  'x-goog-generation',
  'x-goog-hash',
  'x-goog-if-generation-match',
  'x-goog-metageneration',
] as const

export function signedInPrivateMediaBucketName(
  target: SignedInPrivateMediaStorageTarget,
  purpose: SignedInPrivateMediaBucketPurpose,
): string {
  assertTarget(target)
  return `${target.bucketPrefix}-${purpose}`
}

export function createSignedInPrivateMediaStorageProbePlan(
  target: SignedInPrivateMediaStorageTarget,
): SignedInPrivateMediaStorageProbePlanItem[] {
  assertTarget(target)
  const projectArgs = [`--project=${target.projectId}`, '--quiet']
  const probes: SignedInPrivateMediaStorageProbePlanItem[] = [
    {
      id: 'enabled_services',
      command: 'gcloud',
      args: ['services', 'list', '--enabled', ...projectArgs, '--format=value(config.name)'],
      readOnly: true,
    },
    {
      id: 'runtime_service_account',
      command: 'gcloud',
      args: [
        'iam', 'service-accounts', 'describe', target.runtimeServiceAccount,
        ...projectArgs, '--format=json',
      ],
      readOnly: true,
    },
    {
      id: 'runtime_service_account_iam',
      command: 'gcloud',
      args: [
        'iam', 'service-accounts', 'get-iam-policy', target.runtimeServiceAccount,
        ...projectArgs, '--format=json',
      ],
      readOnly: true,
    },
  ]

  for (const purpose of SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES) {
    const bucket = `gs://${signedInPrivateMediaBucketName(target, purpose)}`
    probes.push(
      {
        id: `bucket_${purpose}`,
        command: 'gcloud',
        args: ['storage', 'buckets', 'describe', bucket, ...projectArgs, '--format=json'],
        readOnly: true,
      },
      {
        id: `bucket_iam_${purpose}`,
        command: 'gcloud',
        args: ['storage', 'buckets', 'get-iam-policy', bucket, ...projectArgs, '--format=json'],
        readOnly: true,
      },
    )
  }
  return probes
}

export function evaluateSignedInPrivateMediaStorageReadiness(
  target: SignedInPrivateMediaStorageTarget,
  results: SignedInPrivateMediaStorageProbeResult[],
): SignedInPrivateMediaStorageReadinessReport {
  assertTarget(target)
  const byId = new Map(results.map((result) => [result.id, result]))
  const enabledServices = new Set(lines(byId.get('enabled_services')?.stdout))
  const enabledRequiredGoogleApis = REQUIRED_GOOGLE_APIS
    .filter((api) => enabledServices.has(api)).length
  const runtimeAccount = safeJsonRecord(byId.get('runtime_service_account'))
  const runtimeEmail = stringAt(runtimeAccount, ['email'])
  const runtimeDisabled = booleanAt(runtimeAccount, ['disabled'])
  const runtimeIam = safeJsonRecord(byId.get('runtime_service_account_iam'))
  const runtimeMember = `serviceAccount:${target.runtimeServiceAccount}`
  const runtimeCanSignBlob = hasRoleMember(
    runtimeIam,
    'roles/iam.serviceAccountTokenCreator',
    runtimeMember,
  )

  let resolvedBuckets = 0
  let exactBucketConfigurations = 0
  let runtimeBucketRoleBindings = 0
  let publicBucketPrincipalBindings = 0
  let allBucketsRegional = true
  let allBucketsStandardStorageClass = true
  let allBucketsUniformAccess = true
  let allBucketsPublicAccessPrevented = true
  let allBucketsStagingLabeled = true
  let allBucketsSoftDeleteProtected = true
  let allBucketsLifecycleBounded = true
  let sourceBucketCorsExact = false

  for (const purpose of SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES) {
    const bucketResult = byId.get(`bucket_${purpose}`)
    const bucket = safeJsonRecord(bucketResult)
    const expectedName = signedInPrivateMediaBucketName(target, purpose)
    const resolved = bucketResult?.ok === true && stringAt(bucket, ['name']) === expectedName
    if (resolved) resolvedBuckets += 1

    const regional = stringAt(bucket, ['location']).toLowerCase() === target.region
    const standardStorageClass = stringAt(bucket, ['storageClass']).toUpperCase() === 'STANDARD'
    const uniform = booleanAt(bucket, ['iamConfiguration', 'uniformBucketLevelAccess', 'enabled']) === true
    const pap = stringAt(bucket, ['iamConfiguration', 'publicAccessPrevention']).toLowerCase() === 'enforced'
    const labels = recordAt(bucket, ['labels'])
    const labeled = labels.app === 'reeditpro' && labels.env === 'staging' &&
      labels.lane === 'signed-in-private-media'
    const softDeleteSeconds = numberAt(bucket, ['softDeletePolicy', 'retentionDurationSeconds'])
    const softDelete = softDeleteSeconds === 604_800
    const lifecycle = hasExactDeleteAge(bucket, EXPECTED_LIFECYCLE_AGE_DAYS[purpose])
    const versioningDisabled = booleanAt(bucket, ['versioning', 'enabled']) !== true

    allBucketsRegional &&= regional
    allBucketsStandardStorageClass &&= standardStorageClass
    allBucketsUniformAccess &&= uniform
    allBucketsPublicAccessPrevented &&= pap
    allBucketsStagingLabeled &&= labeled
    allBucketsSoftDeleteProtected &&= softDelete
    allBucketsLifecycleBounded &&= lifecycle && versioningDisabled
    if (
      resolved &&
      regional &&
      standardStorageClass &&
      uniform &&
      pap &&
      labeled &&
      softDelete &&
      lifecycle &&
      versioningDisabled
    ) {
      exactBucketConfigurations += 1
    }
    if (purpose === 'source-media') sourceBucketCorsExact = hasExactSourceCors(bucket, target.appOrigin)

    const iam = safeJsonRecord(byId.get(`bucket_iam_${purpose}`))
    const expectedRole = purpose === 'source-media'
      ? 'roles/storage.objectUser'
      : 'roles/storage.objectViewer'
    if (hasRoleMember(iam, expectedRole, runtimeMember)) runtimeBucketRoleBindings += 1
    publicBucketPrincipalBindings += countPublicMembers(iam)
  }

  const gates = {
    requiredGoogleApisEnabled: enabledRequiredGoogleApis === REQUIRED_GOOGLE_APIS.length,
    runtimeServiceAccountReady: runtimeEmail === target.runtimeServiceAccount && runtimeDisabled !== true,
    runtimeCanSignBlob,
    allBucketsResolved: resolvedBuckets === SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES.length,
    allBucketsRegional,
    allBucketsStandardStorageClass,
    allBucketsUniformAccess,
    allBucketsPublicAccessPrevented,
    allBucketsStagingLabeled,
    allBucketsSoftDeleteProtected,
    allBucketsLifecycleBounded,
    sourceBucketCorsExact,
    runtimeBucketRolesPresent: runtimeBucketRoleBindings === SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES.length,
    publicBucketPrincipalsAbsent: publicBucketPrincipalBindings === 0,
  }
  const blockers = Object.entries(gates)
    .filter(([, ok]) => !ok)
    .map(([id]) => id)
  const ok = blockers.length === 0

  return {
    schemaVersion: 1,
    contractVersion: SIGNED_IN_PRIVATE_MEDIA_STORAGE_CONTRACT_VERSION,
    ok,
    decision: ok
      ? 'ready_for_same_sha_gateway_storage_configuration'
      : 'blocked_before_same_sha_gateway_storage_configuration',
    evidenceClass: 'live_read_only_google_cloud_configuration_evidence',
    target: {
      projectMatched: target.projectId === 'reeditpro',
      regionMatched: target.region === 'us-east1',
      appOriginMatched: target.appOrigin === 'https://yuzastudio6-cyber.github.io',
      runtimeServiceAccountMatched:
        target.runtimeServiceAccount === 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com',
      bucketPrefixMatched: target.bucketPrefix === 'reeditpro-staging-reeditpro-us-east1',
    },
    gates,
    counts: {
      requiredGoogleApis: REQUIRED_GOOGLE_APIS.length,
      enabledRequiredGoogleApis,
      requiredBuckets: SIGNED_IN_PRIVATE_MEDIA_BUCKET_PURPOSES.length,
      resolvedBuckets,
      exactBucketConfigurations,
      runtimeBucketRoleBindings,
      publicBucketPrincipalBindings,
    },
    blockers,
    probeStatus: createSignedInPrivateMediaStorageProbePlan(target).map(({ id }) => {
      const result = byId.get(id)
      return {
        id,
        ok: result?.ok === true,
        classification: result?.classification ?? 'unavailable',
        outputByteCount: result?.outputByteCount ?? 0,
      }
    }),
    boundaries: {
      readOnly: true,
      objectBytesRead: false,
      objectWritten: false,
      objectDeleted: false,
      signedUrlCreated: false,
      resumableSessionCreated: false,
      cloudMutated: false,
      supabaseContacted: false,
      providerCalled: false,
      customerBillingCalled: false,
      secretsPrinted: false,
      rawIamPrincipalsPrinted: false,
      largeMediaDistributedFinalizationVerified: false,
      productionReady: false,
    },
  }
}

function assertTarget(target: SignedInPrivateMediaStorageTarget): void {
  if (
    target.projectId !== REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET.projectId ||
    target.region !== REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET.region ||
    target.appOrigin !== REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET.appOrigin ||
    target.runtimeServiceAccount !==
      REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET.runtimeServiceAccount ||
    target.bucketPrefix !== REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET.bucketPrefix
  ) {
    throw new Error('Private media storage target must match the exact reviewed ReEditPro staging lane.')
  }
}

function hasExactSourceCors(bucket: Record<string, unknown>, origin: string): boolean {
  const cors = arrayAt(bucket, ['cors']).filter(isRecord)
  return cors.length === 1 && cors.some((rule) =>
    equalStringSets(arrayAt(rule, ['origin']), [origin]) &&
    equalStringSets(arrayAt(rule, ['method']), SOURCE_CORS_METHODS, (value) => value.toUpperCase()) &&
    equalStringSets(arrayAt(rule, ['responseHeader']), SOURCE_CORS_HEADERS, (value) => value.toLowerCase()) &&
    numberAt(rule, ['maxAgeSeconds']) === 3_600)
}

function hasExactDeleteAge(bucket: Record<string, unknown>, age: number): boolean {
  const rules = arrayAt(bucket, ['lifecycle', 'rule']).filter(isRecord)
  return rules.length === 1 && rules.some((rule) =>
    stringAt(rule, ['action', 'type']) === 'Delete' &&
    numberAt(rule, ['condition', 'age']) === age)
}

function hasRoleMember(policy: Record<string, unknown>, role: string, member: string): boolean {
  return arrayAt(policy, ['bindings']).filter(isRecord).some((binding) =>
    binding.role === role &&
    arrayAt(binding, ['members']).includes(member) &&
    Object.keys(recordAt(binding, ['condition'])).length === 0)
}

function countPublicMembers(policy: Record<string, unknown>): number {
  const publicMembers = new Set(['allUsers', 'allAuthenticatedUsers'])
  return arrayAt(policy, ['bindings']).filter(isRecord).reduce((count, binding) =>
    count + arrayAt(binding, ['members']).filter((member) =>
      typeof member === 'string' && publicMembers.has(member)).length, 0)
}

function safeJsonRecord(result: SignedInPrivateMediaStorageProbeResult | undefined): Record<string, unknown> {
  if (!result?.ok) return {}
  try {
    const value = JSON.parse(result.stdout) as unknown
    return isRecord(value) ? value : {}
  } catch {
    return {}
  }
}

function recordAt(value: unknown, path: Array<string | number>): Record<string, unknown> {
  const resolved = valueAt(value, path)
  return isRecord(resolved) ? resolved : {}
}

function arrayAt(value: unknown, path: Array<string | number>): unknown[] {
  const resolved = valueAt(value, path)
  return Array.isArray(resolved) ? resolved : []
}

function stringAt(value: unknown, path: Array<string | number>): string {
  const resolved = valueAt(value, path)
  return typeof resolved === 'string' ? resolved : ''
}

function booleanAt(value: unknown, path: Array<string | number>): boolean | undefined {
  const resolved = valueAt(value, path)
  if (typeof resolved === 'boolean') return resolved
  if (typeof resolved === 'string' && /^(?:true|false)$/i.test(resolved)) {
    return resolved.toLowerCase() === 'true'
  }
  return undefined
}

function numberAt(value: unknown, path: Array<string | number>): number | undefined {
  const resolved = valueAt(value, path)
  if (typeof resolved === 'number' && Number.isFinite(resolved)) return resolved
  if (typeof resolved === 'string' && /^\d+$/.test(resolved)) return Number(resolved)
  return undefined
}

function valueAt(value: unknown, path: Array<string | number>): unknown {
  let current = value
  for (const segment of path) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined
      current = current[segment]
    } else {
      if (!isRecord(current)) return undefined
      current = current[segment]
    }
  }
  return current
}

function equalStringSets(
  actual: unknown[],
  expected: readonly string[],
  normalize: (value: string) => string = (value) => value,
): boolean {
  const normalizedActual = actual
    .filter((value): value is string => typeof value === 'string')
    .map(normalize)
    .sort()
  const normalizedExpected = expected.map(normalize).sort()
  return normalizedActual.length === normalizedExpected.length &&
    normalizedActual.every((value, index) => value === normalizedExpected[index])
}

function lines(value: string | undefined): string[] {
  return (value ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
