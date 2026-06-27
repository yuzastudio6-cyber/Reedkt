import { PRODUCTION_TOOL_IDS, type ProductionToolId } from '../tool-registry'
import {
  buildCoreRealCheckEvidencePacket,
  type CoreRealCheckEvidenceInput,
  type CoreRealCheckEvidenceResult,
} from '../beta-readiness/core-real-check-evidence'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface BetaToolsCoreRealCheckPreviewEnv {
  REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_NOTES?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_INCLUDE_WARNINGS?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE?: string
}

export interface BetaToolsCoreRealCheckPreviewReport {
  ok: boolean
  previewOnly: true
  readyToRecordAcceptedEvidence: boolean
  acceptedToolIds: ProductionToolId[]
  acceptedToolCount: number
  skippedToolCount: number
  skippedToolResults: CoreRealCheckEvidenceResult['skippedToolResults']
  readinessSummary: CoreRealCheckEvidenceResult['readinessResult']['summary']
  coreToolReadinessReport: NonNullable<CoreRealCheckEvidenceResult['readinessResult']['coreToolReadiness']>['report'] | undefined
  requestedToolIds: ProductionToolId[]
  missingConfiguration: string[]
  confirmationGaps: string[]
  invalidToolIds: string[]
  secretLikeInputPaths: string[]
  warnings: string[]
}

export function runBetaToolsCoreRealCheckPreview(
  env: BetaToolsCoreRealCheckPreviewEnv,
): BetaToolsCoreRealCheckPreviewReport {
  const missingConfiguration = missingRequiredConfiguration(env)
  const invalidToolIds = findInvalidToolIds(env.REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS)
  const acceptProductionReadiness = parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS)
  const acceptProductReadyLocalOss = parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS)
  const requireAcceptedEvidence = parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE)
  const confirmationGaps = [
    ...(acceptProductionReadiness && !parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE)
      ? ['REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true is required when previewing production-readiness acceptance.']
      : []),
    ...(acceptProductReadyLocalOss && !parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE)
      ? ['REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true is required when previewing product-ready local OSS acceptance.']
      : []),
  ]
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: env.REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID,
    projectId: env.REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID,
    sourceId: env.REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID,
    sourceSha: env.REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA,
    notes: env.REEDITPRO_BETA_TOOLS_PREVIEW_NOTES,
  }, 'betaToolsCoreRealCheckPreview')

  if (
    missingConfiguration.length > 0 ||
    invalidToolIds.length > 0 ||
    confirmationGaps.length > 0 ||
    secretLikeInputPaths.length > 0
  ) {
    return emptyBlockedPreviewReport({
      missingConfiguration,
      confirmationGaps,
      invalidToolIds,
      secretLikeInputPaths,
      requestedToolIds: parseKnownToolIds(env.REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS),
    })
  }

  const input = buildPreviewInput(env)
  const result = buildCoreRealCheckEvidencePacket(input)
  const acceptedToolIds = result.acceptedToolEvidence.map((record) => record.toolId as ProductionToolId)
  const readyToRecordAcceptedEvidence = result.acceptedToolEvidence.length > 0 &&
    result.acceptedToolEvidence.every((record) => (
      record.productionReadinessAccepted === acceptProductionReadiness &&
      record.productReadyLocalOss === acceptProductReadyLocalOss
    ))

  if (requireAcceptedEvidence && acceptedToolIds.length === 0) {
    return {
      ...buildPreviewReport(result, acceptedToolIds, input.toolIds ?? [], {
        readyToRecordAcceptedEvidence: false,
        missingConfiguration,
        confirmationGaps,
        invalidToolIds,
        secretLikeInputPaths,
      }),
      warnings: [
        ...previewWarnings(),
        'REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE=true was set, but no tools were accepted by the local preview.',
      ],
    }
  }

  return buildPreviewReport(result, acceptedToolIds, input.toolIds ?? [], {
    readyToRecordAcceptedEvidence,
    missingConfiguration,
    confirmationGaps,
    invalidToolIds,
    secretLikeInputPaths,
  })
}

function buildPreviewInput(env: BetaToolsCoreRealCheckPreviewEnv): CoreRealCheckEvidenceInput {
  return {
    workspaceId: requiredEnv(env, 'REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID'),
    projectId: clean(env.REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID),
    sourceId: clean(env.REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID) ?? 'beta-tools-core-real-check-preview',
    sourceSha: requiredEnv(env, 'REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA'),
    notes: [
      clean(env.REEDITPRO_BETA_TOOLS_PREVIEW_NOTES) ?? 'Collected through beta tools core real-check preview CLI.',
      'Local preview only; no backend evidence was recorded and no beta/production gate was opened.',
    ],
    acceptProductionReadiness: parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS),
    acceptProductReadyLocalOss: parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS),
    includeWarnings: parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_INCLUDE_WARNINGS),
    toolIds: parseToolIds(env.REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS),
  }
}

function buildPreviewReport(
  result: CoreRealCheckEvidenceResult,
  acceptedToolIds: ProductionToolId[],
  requestedToolIds: ProductionToolId[],
  options: {
    readyToRecordAcceptedEvidence: boolean
    missingConfiguration: string[]
    confirmationGaps: string[]
    invalidToolIds: string[]
    secretLikeInputPaths: string[]
  },
): BetaToolsCoreRealCheckPreviewReport {
  const ok = options.readyToRecordAcceptedEvidence &&
    options.missingConfiguration.length === 0 &&
    options.confirmationGaps.length === 0 &&
    options.invalidToolIds.length === 0 &&
    options.secretLikeInputPaths.length === 0

  return {
    ok,
    previewOnly: true,
    readyToRecordAcceptedEvidence: options.readyToRecordAcceptedEvidence,
    acceptedToolIds,
    acceptedToolCount: acceptedToolIds.length,
    skippedToolCount: result.skippedToolResults.length,
    skippedToolResults: result.skippedToolResults,
    readinessSummary: result.readinessResult.summary,
    coreToolReadinessReport: result.readinessResult.coreToolReadiness?.report,
    requestedToolIds,
    missingConfiguration: options.missingConfiguration,
    confirmationGaps: options.confirmationGaps,
    invalidToolIds: options.invalidToolIds,
    secretLikeInputPaths: options.secretLikeInputPaths,
    warnings: previewWarnings(),
  }
}

function emptyBlockedPreviewReport(options: {
  missingConfiguration: string[]
  confirmationGaps: string[]
  invalidToolIds: string[]
  secretLikeInputPaths: string[]
  requestedToolIds: ProductionToolId[]
}): BetaToolsCoreRealCheckPreviewReport {
  return {
    ok: false,
    previewOnly: true,
    readyToRecordAcceptedEvidence: false,
    acceptedToolIds: [],
    acceptedToolCount: 0,
    skippedToolCount: 0,
    skippedToolResults: [],
    readinessSummary: {
      totalSpecs: 0,
      statuses: {
        passed: 0,
        warning: 0,
        missing: 0,
        blocked: 0,
        not_installed: 0,
        future_only: 0,
        evaluation_only: 0,
        needs_license_review: 0,
        pending_manual_review: 0,
        not_checked: 0,
      },
      launchCoreTools: [],
      missingTools: [],
      futureOnlyTools: [],
      evaluationOnlyTools: [],
      modelWeightTools: [],
      productionBlockedTools: [],
      notes: [],
    },
    coreToolReadinessReport: undefined,
    requestedToolIds: options.requestedToolIds,
    missingConfiguration: options.missingConfiguration,
    confirmationGaps: options.confirmationGaps,
    invalidToolIds: options.invalidToolIds,
    secretLikeInputPaths: options.secretLikeInputPaths,
    warnings: previewWarnings(),
  }
}

function previewWarnings(): string[] {
  return [
    'Local preview only; no backend evidence was recorded.',
    'Checks are bounded command/import/package metadata checks only.',
    'This command must not process media, call providers, run Docker, write Supabase, enable beta, or enable production.',
    'A passing preview still requires deployed staging evidence recording through beta:tools:core-real-check-evidence.',
  ]
}

function missingRequiredConfiguration(env: BetaToolsCoreRealCheckPreviewEnv): string[] {
  return [
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA'),
    parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS)
      ? undefined
      : 'REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS=true is required to preview blocker-reducing production readiness evidence.',
    parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS)
      ? undefined
      : 'REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS=true is required to preview product-ready local OSS evidence.',
    parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE)
      ? undefined
      : 'REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE=true is required so the preview fails closed when no tools pass.',
  ].filter((item): item is string => Boolean(item))
}

function missingEnv(env: BetaToolsCoreRealCheckPreviewEnv, name: keyof BetaToolsCoreRealCheckPreviewEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function parseToolIds(value: string | undefined): ProductionToolId[] | undefined {
  const rawToolIds = parseKnownToolIds(value)
  return rawToolIds.length > 0 ? rawToolIds : undefined
}

function parseKnownToolIds(value: string | undefined): ProductionToolId[] {
  const invalidToolIds = new Set(findInvalidToolIds(value))
  return parseRawToolIds(value).filter((toolId) => !invalidToolIds.has(toolId)) as ProductionToolId[]
}

function findInvalidToolIds(value: string | undefined): string[] {
  const requestedToolIds = parseRawToolIds(value)
  if (requestedToolIds.length === 0) return []
  const knownToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
  return requestedToolIds.filter((toolId) => !knownToolIds.has(toolId))
}

function parseRawToolIds(value: string | undefined): string[] {
  const rawToolIds = clean(value)
  if (!rawToolIds) return []
  return [...new Set(rawToolIds.split(',').map((toolId) => toolId.trim()).filter(Boolean))]
}

function requiredEnv(env: BetaToolsCoreRealCheckPreviewEnv, name: keyof BetaToolsCoreRealCheckPreviewEnv): string {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runBetaToolsCoreRealCheckPreview(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyToRecordAcceptedEvidence) {
    process.exitCode = 1
  }
}
