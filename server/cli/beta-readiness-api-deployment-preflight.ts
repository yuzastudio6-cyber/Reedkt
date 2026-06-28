import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export type BetaReadinessApiDeploymentPreflightEnv = Record<string, string | undefined>

export interface BetaReadinessApiDeploymentPreflightReport {
  ok: boolean
  readyToVerifyDeployedApi: boolean
  readyForDeployedEvidenceCollectors: boolean
  decision: string
  environment: 'staging' | 'production' | 'invalid'
  plannedService: {
    serviceName: string
    region?: string
    projectId?: string
    serviceAccount?: string
    image?: string
    expectedBaseUrl?: string
  }
  sourceSha?: string
  missingConfiguration: string[]
  missingConfirmations: string[]
  missingSecretBindings: string[]
  valueGaps: string[]
  secretLikeInputPaths: string[]
  requiredEnvironmentVariables: Array<{
    name: string
    secret: boolean
    requiredFor: 'deploy_preflight' | 'collector_handoff'
  }>
  recommendedCommands: string[]
  blockedScopes: string[]
  warnings: string[]
}

const REQUIRED_SECRET_BINDINGS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PROVIDER_GATEWAY_SHARED_SECRET',
  'WORKER_WEBHOOK_SECRET',
] as const

export function buildBetaReadinessApiDeploymentPreflight(
  env: BetaReadinessApiDeploymentPreflightEnv = process.env,
): BetaReadinessApiDeploymentPreflightReport {
  const environment = normalizeEnvironment(env.REEDITPRO_ENV)
  const image = clean(env.REEDITPRO_BETA_API_DEPLOYMENT_IMAGE) ?? buildArtifactImage(env)
  const serviceName = clean(env.REEDITPRO_BETA_API_DEPLOYMENT_SERVICE_NAME) ?? 'reeditpro-api'
  const serviceAccount = buildServiceAccount(env)
  const missingConfiguration = requiredNames(env)
  const missingConfirmations = confirmationGaps(env)
  const missingSecretBindings = REQUIRED_SECRET_BINDINGS
    .filter((name) => !isTrue(env[`REEDITPRO_BETA_API_DEPLOYMENT_${name}_BOUND`]))
    .map((name) => `REEDITPRO_BETA_API_DEPLOYMENT_${name}_BOUND=true is required.`)
  const valueGaps = [
    ...(environment === 'staging' ? [] : ['REEDITPRO_ENV must be staging for beta readiness API deployment evidence.']),
    ...(validHttpsUrl(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL) ? [] : ['REEDITPRO_BETA_EXTERNAL_API_BASE_URL must be the deployed HTTPS API base URL.']),
    ...(clean(env.REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA) === clean(env.REEDITPRO_BETA_API_DEPLOYMENT_SOURCE_SHA)
      ? []
      : ['REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA must match REEDITPRO_BETA_API_DEPLOYMENT_SOURCE_SHA.']),
  ]
  const secretLikeInputPaths = collectSecretLikePaths({
    projectId: env.GCP_PROJECT_ID,
    region: env.GCP_REGION,
    artifactRegion: env.GCP_ARTIFACT_REGION,
    artifactRepository: env.REEDITPRO_ARTIFACT_REPOSITORY,
    imageTag: env.REEDITPRO_IMAGE_TAG,
    sourceSha: env.REEDITPRO_BETA_API_DEPLOYMENT_SOURCE_SHA,
    deployedSourceSha: env.REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA,
    expectedBaseUrl: env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL,
    serviceName: env.REEDITPRO_BETA_API_DEPLOYMENT_SERVICE_NAME,
    serviceAccount: env.REEDITPRO_API_SERVICE_ACCOUNT,
  }, 'betaReadinessApiDeploymentPreflight')
  const readyToVerifyDeployedApi = missingConfiguration.length === 0 &&
    missingConfirmations.length === 0 &&
    missingSecretBindings.length === 0 &&
    valueGaps.length === 0 &&
    secretLikeInputPaths.length === 0
  const readyForDeployedEvidenceCollectors = readyToVerifyDeployedApi

  return {
    ok: readyToVerifyDeployedApi,
    readyToVerifyDeployedApi,
    readyForDeployedEvidenceCollectors,
    decision: readyForDeployedEvidenceCollectors
      ? 'beta_readiness_api_deployment_preflight_passed_ready_for_deployed_evidence_input_manifest'
      : 'beta_readiness_api_deployment_preflight_blocked_missing_staging_api_deployment_inputs',
    environment,
    plannedService: {
      serviceName,
      region: clean(env.GCP_REGION),
      projectId: clean(env.GCP_PROJECT_ID),
      serviceAccount,
      image,
      expectedBaseUrl: clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL),
    },
    sourceSha: clean(env.REEDITPRO_BETA_API_DEPLOYMENT_SOURCE_SHA),
    missingConfiguration,
    missingConfirmations,
    missingSecretBindings,
    valueGaps,
    secretLikeInputPaths,
    requiredEnvironmentVariables: requiredEnvironmentVariables(),
    recommendedCommands: [
      'gh workflow run beta-readiness-api-staging-input-discovery.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell --field confirm_staging_api_input_discovery=READ_STAGING_BETA_API_DEPLOY_INPUTS',
      'gh workflow run beta-readiness-api-staging-deploy.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell --field confirm_staging_api_deploy=DEPLOY_STAGING_BETA_READINESS_API --field source_ref=codex/sound-music-audio-1abc-checkpoint --field source_sha=$REEDITPRO_BETA_API_DEPLOYMENT_SOURCE_SHA --field image_tag=$REEDITPRO_IMAGE_TAG --field artifact_region=$GCP_ARTIFACT_REGION --field artifact_repository=$REEDITPRO_ARTIFACT_REPOSITORY --field deployer_service_account=<owner-approved-deployer-service-account> --field runtime_service_account=$REEDITPRO_API_SERVICE_ACCOUNT --field service_name=reeditpro-api-staging',
      'npm run beta:readiness:api-deployment-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:readiness:external-beta-evidence-collector',
      'npm run beta:readiness:operator-status-api',
    ],
    blockedScopes: [
      'deployed_evidence_collectors_until_api_base_url_and_deployed_source_sha_are_verified',
      'external_beta_until_tool_platform_launch_evidence_and_operator_readback_pass',
      'real_user_media_beta_until_separate_scope_approval_evidence_passes',
      'paid_production_until_separate_paid_production_evidence_collector_passes',
    ],
    warnings: [
      'This preflight does not run gcloud, build images, deploy Cloud Run, read secrets, call the deployed backend, write evidence, write Supabase/GCS, run tools, process media, enable beta, or enable production.',
      'Run the read-only default-branch staging input discovery workflow first; the latest exact-input source-truth run is blocked until Artifact Registry repository access is granted or confirmed for reeditpro-staging-workers and the staging API runtime service account exists or is owner-selected.',
      'The guarded GitHub Actions staging API workflow is workflow_dispatch-only, must be run from the default branch, and requires an exact tools-branch source SHA plus owner-approved service-account inputs.',
      'Passing this preflight only means the API deployment handoff inputs are coherent enough to proceed to deployed evidence input validation.',
    ],
  }
}

function requiredNames(env: BetaReadinessApiDeploymentPreflightEnv): string[] {
  return [
    'GCP_PROJECT_ID',
    'GCP_REGION',
    'GCP_ARTIFACT_REGION',
    'REEDITPRO_ENV',
    'REEDITPRO_ARTIFACT_REPOSITORY',
    'REEDITPRO_IMAGE_TAG',
    'REEDITPRO_API_SERVICE_ACCOUNT',
    'REEDITPRO_BETA_API_DEPLOYMENT_SOURCE_SHA',
    'REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA',
    'REEDITPRO_BETA_EXTERNAL_API_BASE_URL',
  ].filter((name) => !clean(env[name]))
    .map((name) => `${name} is required.`)
}

function confirmationGaps(env: BetaReadinessApiDeploymentPreflightEnv): string[] {
  return [
    ['REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_STAGING_ONLY', 'staging-only API deployment confirmation'],
    ['REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_NO_ALLOW_UNAUTHENTICATED', 'no-allow-unauthenticated confirmation'],
    ['REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_SECRET_BINDINGS', 'Secret Manager binding confirmation'],
    ['REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_NO_RUNTIME_TOOL_EXECUTION', 'no runtime/tool/media execution confirmation'],
  ].filter(([name]) => !isTrue(env[name]))
    .map(([name, label]) => `${name}=true is required for ${label}.`)
}

function requiredEnvironmentVariables(): BetaReadinessApiDeploymentPreflightReport['requiredEnvironmentVariables'] {
  return [
    { name: 'GCP_PROJECT_ID', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'GCP_REGION', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'GCP_ARTIFACT_REGION', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_ENV', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_ARTIFACT_REPOSITORY', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_IMAGE_TAG', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_API_SERVICE_ACCOUNT', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_SOURCE_SHA', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA', secret: false, requiredFor: 'collector_handoff' },
    { name: 'REEDITPRO_BETA_EXTERNAL_API_BASE_URL', secret: false, requiredFor: 'collector_handoff' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_SUPABASE_URL_BOUND', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_SUPABASE_SERVICE_ROLE_KEY_BOUND', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_PROVIDER_GATEWAY_SHARED_SECRET_BOUND', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_WORKER_WEBHOOK_SECRET_BOUND', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_STAGING_ONLY', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_NO_ALLOW_UNAUTHENTICATED', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_SECRET_BINDINGS', secret: false, requiredFor: 'deploy_preflight' },
    { name: 'REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_NO_RUNTIME_TOOL_EXECUTION', secret: false, requiredFor: 'deploy_preflight' },
  ]
}

function buildArtifactImage(env: BetaReadinessApiDeploymentPreflightEnv): string | undefined {
  const artifactRegion = clean(env.GCP_ARTIFACT_REGION)
  const projectId = clean(env.GCP_PROJECT_ID)
  const repository = clean(env.REEDITPRO_ARTIFACT_REPOSITORY)
  const tag = clean(env.REEDITPRO_IMAGE_TAG)
  if (!artifactRegion || !projectId || !repository || !tag) return undefined
  return `${artifactRegion}-docker.pkg.dev/${projectId}/${repository}/reeditpro-api:${tag}`
}

function buildServiceAccount(env: BetaReadinessApiDeploymentPreflightEnv): string | undefined {
  const account = clean(env.REEDITPRO_API_SERVICE_ACCOUNT)
  const projectId = clean(env.GCP_PROJECT_ID)
  if (!account || !projectId) return undefined
  if (account.includes('@')) return account
  return `${account}@${projectId}.iam.gserviceaccount.com`
}

function normalizeEnvironment(value: string | undefined): BetaReadinessApiDeploymentPreflightReport['environment'] {
  const environment = clean(value)
  if (environment === 'staging' || environment === 'production') return environment
  return 'invalid'
}

function validHttpsUrl(value: string | undefined): boolean {
  const cleaned = clean(value)
  if (!cleaned) return false
  try {
    const url = new URL(cleaned)
    return url.protocol === 'https:' && !url.hostname.endsWith('.example')
  } catch {
    return false
  }
}

function isTrue(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessApiDeploymentPreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyForDeployedEvidenceCollectors) {
    process.exitCode = 1
  }
}
