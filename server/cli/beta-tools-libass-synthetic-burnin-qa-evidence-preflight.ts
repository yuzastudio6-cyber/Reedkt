import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import type { BetaToolsLibassSyntheticBurninQaPreflightEnv } from './beta-tools-libass-synthetic-burnin-qa-preflight'

export interface BetaToolsLibassSyntheticBurninQaEvidenceEnv extends BetaToolsLibassSyntheticBurninQaPreflightEnv {
  REEDITPRO_BETA_LIBASS_BURNIN_QA_API_BASE_URL?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_BEARER_TOKEN?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE?: string
}

export interface BetaToolsLibassSyntheticBurninQaEvidencePreflightReport {
  ok: boolean
  readyToRunCli: boolean
  readyToRecordAcceptedEvidence: boolean
  plannedEndpoint?: string
  collectorCommand: 'npm run beta:tools:libass-synthetic-burnin-qa-evidence'
  duplicateContext: {
    openHistoricalPr: 73
    classification: 'historical_activation_private_media_context_not_current_beta_source_truth'
  }
  missingConfiguration: string[]
  confirmationGaps: string[]
  secretLikeInputPaths: string[]
  requestShape: {
    workspaceIdPresent: boolean
    projectIdPresent: boolean
    sourceId: string
    sourceShaPresent: boolean
    mode: 'host' | 'docker'
    containerImagePresent: boolean
    acceptProductionReadiness: boolean
    acceptProductReadyLocalOss: boolean
    requireAcceptedEvidence: boolean
    requireRecordedEvidence: boolean
  }
  requiredEnvironmentVariables: Array<{
    name: keyof BetaToolsLibassSyntheticBurninQaEvidenceEnv
    secret: boolean
    requiredFor: 'collector_call' | 'blocker_reducing_packet'
  }>
  warnings: string[]
}

export function buildBetaToolsLibassSyntheticBurninQaEvidencePreflight(
  env: BetaToolsLibassSyntheticBurninQaEvidenceEnv,
): BetaToolsLibassSyntheticBurninQaEvidencePreflightReport {
  const mode = parseMode(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_MODE)
  const missingConfiguration = unique([
    ...missingCollectorConfiguration(env),
    ...missingQaConfiguration(env, mode),
  ])
  const confirmationGaps = confirmationGapsFor(env)
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID,
    projectId: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID,
    sourceId: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID,
    sourceSha: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA,
    notes: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_NOTES,
    containerImage: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE,
  }, 'betaToolsLibassSyntheticBurninQaEvidencePreflight')
  const readyToRunCli = missingConfiguration.length === 0 &&
    confirmationGaps.length === 0 &&
    secretLikeInputPaths.length === 0
  const readyToRecordAcceptedEvidence = readyToRunCli &&
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE) &&
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE)

  return {
    ok: readyToRunCli,
    readyToRunCli,
    readyToRecordAcceptedEvidence,
    plannedEndpoint: plannedEndpoint(env),
    collectorCommand: 'npm run beta:tools:libass-synthetic-burnin-qa-evidence',
    duplicateContext: {
      openHistoricalPr: 73,
      classification: 'historical_activation_private_media_context_not_current_beta_source_truth',
    },
    missingConfiguration,
    confirmationGaps,
    secretLikeInputPaths,
    requestShape: {
      workspaceIdPresent: Boolean(clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID)),
      projectIdPresent: Boolean(clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID)),
      sourceId: clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID) ?? 'beta-tools-libass-synthetic-burnin-qa',
      sourceShaPresent: Boolean(clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA)),
      mode,
      containerImagePresent: Boolean(clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE)),
      acceptProductionReadiness: isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS),
      acceptProductReadyLocalOss: isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS),
      requireAcceptedEvidence: isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE),
      requireRecordedEvidence: isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE),
    },
    requiredEnvironmentVariables: requiredEnvironmentVariables(),
    warnings: [
      'This preflight does not call the deployed backend, run libass, create media, write evidence, enable beta, or enable production.',
      'Bearer tokens are checked only for presence and are never printed.',
      'The collector first runs the synthetic-only libass burn-in QA preflight locally, then posts the accepted evidence packet to /v1/beta-readiness/evidence.',
      'A recorded libass evidence packet still does not clear shared platform billing/deployment evidence or launch approvals by itself.',
    ],
  }
}

function missingCollectorConfiguration(env: BetaToolsLibassSyntheticBurninQaEvidenceEnv): string[] {
  return [
    missingEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_IDEMPOTENCY_KEY'),
  ].filter((item): item is string => Boolean(item))
}

function missingQaConfiguration(
  env: BetaToolsLibassSyntheticBurninQaEvidenceEnv,
  mode: 'host' | 'docker',
): string[] {
  return [
    missingEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA'),
    mode === 'docker' ? missingEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE') : undefined,
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE)
      ? undefined
      : 'REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE=true is required so the collector fails closed when QA does not produce evidence.',
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE)
      ? undefined
      : 'REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE=true is required so the collector fails closed when deployed readback does not include libass evidence.',
  ].filter((item): item is string => Boolean(item))
}

function confirmationGapsFor(env: BetaToolsLibassSyntheticBurninQaEvidenceEnv): string[] {
  return [
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS)
      ? undefined
      : 'REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS=true is required to reduce production-readiness blockers.',
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE)
      ? undefined
      : 'REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true is required to confirm production-readiness acceptance.',
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS)
      ? undefined
      : 'REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS=true is required to reduce product-ready local OSS blockers for libass.',
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE)
      ? undefined
      : 'REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true is required to confirm product-ready local OSS acceptance.',
    isTrue(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_RETAIN_TEMP_OUTPUTS)
      ? 'Retaining temp outputs is not allowed for the beta libass burn-in QA evidence collector.'
      : undefined,
  ].filter((item): item is string => Boolean(item))
}

function requiredEnvironmentVariables(): BetaToolsLibassSyntheticBurninQaEvidencePreflightReport['requiredEnvironmentVariables'] {
  return [
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_API_BASE_URL', secret: false, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_BEARER_TOKEN', secret: true, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_IDEMPOTENCY_KEY', secret: false, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE', secret: false, requiredFor: 'blocker_reducing_packet' },
  ]
}

function plannedEndpoint(env: BetaToolsLibassSyntheticBurninQaEvidenceEnv): string | undefined {
  const baseUrl = clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_API_BASE_URL)
  return baseUrl ? `${baseUrl.replace(/\/+$/, '')}/v1/beta-readiness/evidence` : undefined
}

function missingEnv(env: BetaToolsLibassSyntheticBurninQaEvidenceEnv, name: keyof BetaToolsLibassSyntheticBurninQaEvidenceEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function parseMode(value: string | undefined): 'host' | 'docker' {
  return clean(value) === 'docker' ? 'docker' : 'host'
}

function isTrue(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaToolsLibassSyntheticBurninQaEvidencePreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exitCode = 1
}
