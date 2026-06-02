import type { PrivateSearxngConfig, PrivateSearxngQaGateId, PrivateSearxngSafety } from './private-searxng-service-types'

export const privateSearxngServiceConfig: PrivateSearxngConfig = {
  phase: '49F',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  serviceName: 'reeditpro-staging-private-searxng',
  serviceMode: 'private_controlled_searxng',
  provider: 'searxng',
  controlledQuery: 'ReeditPro open source video editing planning',
  maxResults: 5,
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-web-search/phase49f',
  imageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-private-searxng',
  imageTag: 'staging-private-searxng-001',
  targetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-private-searxng:staging-private-searxng-001',
  officialSearxngImage: 'docker.io/searxng/searxng:latest',
  officialSearxngIndexDigest: 'sha256:0872beb1d495d41f2dda73d7aea83746657afdd2be3010eb1b11f5a541555c9e',
  officialSearxngAmd64Digest: 'sha256:1e35b727bdf12b211635c0f00262fe0c2187be34e32d5cb9bb597f5740976a91',
  cpu: '1',
  memory: '1Gi',
  minInstances: '0',
  maxInstances: '1',
  containerPort: '8080',
  approvedPhase49ERunId: 'phase49e-20260602T155154',
  approvedPhase49EReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49e/phase49e-20260602T155154/reports/phase49e-report.json',
  approvedPhase49EManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/phase49e-20260602T155154/manifest/private-web-search-capture-e2e-manifest.json',
}

export const privateSearxngSafetyFlags: PrivateSearxngSafety = {
  paidProvidersAllowed: false,
  publicSearxngInstanceAllowed: false,
  publicUnauthenticatedAccessAllowed: false,
  broadCrawlingAllowed: false,
  browserCaptureAllowed: false,
  readabilityExtractionAllowed: false,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
  gpuAllowed: false,
  modelWeightsAllowed: false,
}

export const privateSearxngQaGateIds: PrivateSearxngQaGateId[] = [
  'phase49e_evidence',
  'private_service_deployed_or_resolved',
  'service_access_control',
  'searxng_api_health',
  'controlled_query',
  'result_normalization',
  'artifact_privacy',
  'blocked_features',
]

export const privateSearxngRequiredScripts = [
  'activation:private-searxng-service',
  'activation:private-searxng-service:report',
  'activation:private-searxng-service:iam-plan',
  'smoke:activation-private-searxng-service',
] as const

export const privateSearxngRequiredDocs = [
  'docs/activation-private-searxng-service-runbook.md',
  'docs/activation-private-searxng-service-policy.md',
  'docs/activation-private-searxng-service-artifact-policy.md',
  'docs/activation-private-searxng-service-qa-policy.md',
  'docs/activation-phase-49f-private-searxng-service-results.md',
] as const

export function makePrivateSearxngRunId(now = new Date()): string {
  return `phase49f-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function privateSearxngArtifactPrefix(runId: string): string {
  return `${privateSearxngServiceConfig.artifactPrefixBase}/${runId}`
}

export function validatePrivateSearxngServiceExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  paidProvidersAllowed?: string
  publicSearxngInstanceAllowed?: string
  publicUnauthenticatedAccessAllowed?: string
  broadCrawlingAllowed?: string
  browserCaptureAllowed?: string
  readabilityExtractionAllowed?: string
  publicArtifactAllowed?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadMediaReady?: string
}): { allowed: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId !== 'reeditpro') blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (input.activeProject && input.activeProject !== 'reeditpro') blockers.push('Active gcloud project must be reeditpro.')
  if (input.region !== 'us-central1') blockers.push('GCP_REGION must be us-central1.')
  if (input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_PRIVATE_SEARXNG_SERVICE_VALIDATION=true is required for Phase 49F execution.')
  if ((input.paidProvidersAllowed ?? 'false') !== 'false') blockers.push('Paid providers must remain disabled.')
  if ((input.publicSearxngInstanceAllowed ?? 'false') !== 'false') blockers.push('Public SearXNG instances must remain blocked.')
  if ((input.publicUnauthenticatedAccessAllowed ?? 'false') !== 'false') blockers.push('Public unauthenticated access must remain blocked.')
  if ((input.broadCrawlingAllowed ?? 'false') !== 'false') blockers.push('Broad crawling must remain blocked.')
  if ((input.browserCaptureAllowed ?? 'false') !== 'false') blockers.push('Browser capture must remain blocked.')
  if ((input.readabilityExtractionAllowed ?? 'false') !== 'false') blockers.push('Readability extraction must remain blocked.')
  if ((input.publicArtifactAllowed ?? 'false') !== 'false') blockers.push('Public artifacts must remain blocked.')
  if ((input.productionReady ?? 'false') !== 'false') blockers.push('Production readiness must remain false.')
  if ((input.externalBetaReady ?? 'false') !== 'false') blockers.push('External beta readiness must remain false.')
  if ((input.paidProductionReady ?? 'false') !== 'false') blockers.push('Paid production readiness must remain false.')
  if ((input.broadMediaReady ?? 'false') !== 'false') blockers.push('Broad media readiness must remain false.')
  if (!input.confirmation) warnings.push('Static report mode does not require confirmation; execution does.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
