import { PRODUCTION_TOOL_IDS, type ProductionToolId } from '../tool-registry'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import {
  buildBetaToolsCoreRealCheckEvidenceRequest,
  type BetaToolsCoreRealCheckEvidenceEnv,
} from './beta-tools-core-real-check-evidence'

export interface BetaToolsCoreRealCheckEvidencePreflightReport {
  ok: boolean
  readyToRunCli: boolean
  readyToRecordAcceptedEvidence: boolean
  plannedEndpoint?: string
  collectorCommand: 'npm run beta:tools:core-real-check-evidence'
  missingConfiguration: string[]
  confirmationGaps: string[]
  invalidToolIds: string[]
  secretLikeInputPaths: string[]
  requestShape: {
    workspaceIdPresent: boolean
    projectIdPresent: boolean
    sourceId: string
    sourceShaPresent: boolean
    requestedToolIds: string[]
    includeWarnings: boolean
    acceptProductionReadiness: boolean
    acceptProductReadyLocalOss: boolean
    requireAcceptedEvidence: boolean
  }
  requiredEnvironmentVariables: Array<{
    name: keyof BetaToolsCoreRealCheckEvidenceEnv
    secret: boolean
    requiredFor: 'collector_call' | 'blocker_reducing_packet'
  }>
  warnings: string[]
}

export function buildBetaToolsCoreRealCheckEvidencePreflight(
  env: BetaToolsCoreRealCheckEvidenceEnv,
): BetaToolsCoreRealCheckEvidencePreflightReport {
  const missingCollectorConfiguration = missingCoreConfiguration(env)
  const invalidToolIds = findInvalidToolIds(env.REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS)
  let request: ReturnType<typeof buildBetaToolsCoreRealCheckEvidenceRequest> | undefined
  let requestError: string | undefined

  try {
    if (missingCollectorConfiguration.length === 0 && invalidToolIds.length === 0) {
      request = buildBetaToolsCoreRealCheckEvidenceRequest(env)
    }
  } catch (error) {
    requestError = error instanceof Error ? error.message : 'Unable to build core real-check evidence request.'
  }

  const acceptProductionReadiness = isTrue(env.REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS)
  const acceptProductReadyLocalOss = isTrue(env.REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS)
  const requireAcceptedEvidence = isTrue(env.REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE)
  const confirmationGaps = [
    ...(acceptProductionReadiness && !isTrue(env.REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE)
      ? ['REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true is required when accepting production readiness.']
      : []),
    ...(acceptProductReadyLocalOss && !isTrue(env.REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE)
      ? ['REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true is required when accepting product-ready local OSS evidence.']
      : []),
  ]
  const blockerReducingConfigurationGaps = [
    ...(requestError ? [requestError] : []),
    ...(clean(env.REEDITPRO_BETA_TOOLS_SOURCE_SHA) ? [] : ['REEDITPRO_BETA_TOOLS_SOURCE_SHA is required for source-traceable accepted tool evidence.']),
    ...(acceptProductionReadiness ? [] : ['REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS=true is required to reduce production-readiness blockers for passed checks.']),
    ...(acceptProductReadyLocalOss ? [] : ['REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS=true is required to reduce product-ready local OSS blockers for passed checks.']),
    ...(requireAcceptedEvidence ? [] : ['REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE=true is required so the CLI fails closed when no tools are accepted.']),
  ]
  const secretLikeInputPaths = collectSecretLikePaths({
    notes: buildPreflightNotes(env),
  }, 'betaToolsCoreRealCheckEvidencePreflight')
  const readyToRunCli = missingCollectorConfiguration.length === 0 &&
    invalidToolIds.length === 0 &&
    requestError === undefined &&
    secretLikeInputPaths.length === 0
  const readyToRecordAcceptedEvidence = readyToRunCli &&
    confirmationGaps.length === 0 &&
    blockerReducingConfigurationGaps.length === 0

  return {
    ok: readyToRunCli,
    readyToRunCli,
    readyToRecordAcceptedEvidence,
    plannedEndpoint: plannedEndpoint(env),
    collectorCommand: 'npm run beta:tools:core-real-check-evidence',
    missingConfiguration: unique([
      ...missingCollectorConfiguration,
      ...blockerReducingConfigurationGaps,
    ]),
    confirmationGaps,
    invalidToolIds,
    secretLikeInputPaths,
    requestShape: {
      workspaceIdPresent: Boolean(request?.workspaceId ?? clean(env.REEDITPRO_BETA_TOOLS_WORKSPACE_ID)),
      projectIdPresent: Boolean(request?.projectId ?? clean(env.REEDITPRO_BETA_TOOLS_PROJECT_ID)),
      sourceId: request?.sourceId ?? clean(env.REEDITPRO_BETA_TOOLS_SOURCE_ID) ?? 'beta-tools-core-real-check-evidence-cli',
      sourceShaPresent: Boolean(request?.sourceSha ?? clean(env.REEDITPRO_BETA_TOOLS_SOURCE_SHA)),
      requestedToolIds: request?.toolIds ?? parseKnownToolIds(env.REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS),
      includeWarnings: request?.includeWarnings ?? isTrue(env.REEDITPRO_BETA_TOOLS_INCLUDE_WARNINGS),
      acceptProductionReadiness,
      acceptProductReadyLocalOss,
      requireAcceptedEvidence,
    },
    requiredEnvironmentVariables: requiredEnvironmentVariables(),
    warnings: [
      'This preflight does not call the deployed backend, run tool checks, process media, write evidence, enable beta, or enable production.',
      'Bearer tokens are checked only for presence and are never printed.',
      'readyToRecordAcceptedEvidence=true means the operator input is complete enough to run the core real-check evidence CLI; the deployed backend still decides which tools pass.',
    ],
  }
}

function missingCoreConfiguration(env: BetaToolsCoreRealCheckEvidenceEnv): string[] {
  return [
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_IDEMPOTENCY_KEY'),
  ].filter((item): item is string => Boolean(item))
}

function missingEnv(env: BetaToolsCoreRealCheckEvidenceEnv, name: keyof BetaToolsCoreRealCheckEvidenceEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function plannedEndpoint(env: BetaToolsCoreRealCheckEvidenceEnv): string | undefined {
  const baseUrl = clean(env.REEDITPRO_BETA_TOOLS_API_BASE_URL)
  if (!baseUrl) return undefined
  return `${baseUrl.replace(/\/+$/, '')}/v1/beta-readiness/evidence/core-real-check`
}

function findInvalidToolIds(value: string | undefined): string[] {
  const requestedToolIds = parseRawToolIds(value)
  if (requestedToolIds.length === 0) return []
  const knownToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
  return requestedToolIds.filter((toolId) => !knownToolIds.has(toolId))
}

function parseKnownToolIds(value: string | undefined): ProductionToolId[] {
  const invalidToolIds = new Set(findInvalidToolIds(value))
  return parseRawToolIds(value).filter((toolId) => !invalidToolIds.has(toolId)) as ProductionToolId[]
}

function parseRawToolIds(value: string | undefined): string[] {
  const rawToolIds = clean(value)
  if (!rawToolIds) return []
  return [...new Set(rawToolIds.split(',').map((toolId) => toolId.trim()).filter(Boolean))]
}

function buildPreflightNotes(env: BetaToolsCoreRealCheckEvidenceEnv): string[] {
  const note = clean(env.REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES)
  return note ? [note] : []
}

function requiredEnvironmentVariables(): BetaToolsCoreRealCheckEvidencePreflightReport['requiredEnvironmentVariables'] {
  return [
    { name: 'REEDITPRO_BETA_TOOLS_API_BASE_URL', secret: false, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_TOOLS_BEARER_TOKEN', secret: true, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_TOOLS_WORKSPACE_ID', secret: false, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_TOOLS_IDEMPOTENCY_KEY', secret: false, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_TOOLS_SOURCE_SHA', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE', secret: false, requiredFor: 'blocker_reducing_packet' },
    { name: 'REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE', secret: false, requiredFor: 'blocker_reducing_packet' },
  ]
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
  const report = buildBetaToolsCoreRealCheckEvidencePreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyToRunCli || !report.readyToRecordAcceptedEvidence) {
    process.exitCode = 1
  }
}
