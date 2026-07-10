import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import type { ProductionToolId } from '../tool-registry'
import {
  runBetaToolsCoreRealCheckHydratedPreview,
  type BetaToolsCoreRealCheckHydratedPreviewEnv,
  type BetaToolsCoreRealCheckHydratedPreviewReport,
} from './beta-tools-core-real-check-hydrated-preview'
import {
  runBetaToolsLibassSyntheticBurninQaPreflight,
  type BetaToolsLibassSyntheticBurninQaPreflightEnv,
  type BetaToolsLibassSyntheticBurninQaPreflightReport,
  type LibassSyntheticBurninCommandRunner,
} from './beta-tools-libass-synthetic-burnin-qa-preflight'

export interface BetaToolsLocalAcceptedEvidenceBundleEnv {
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_TIMEOUT_MS?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_RETAIN_TEMP_OUTPUTS?: string
  REEDITPRO_READINESS_PYTHON_BIN?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_VENV_DIR?: string
}

export interface BetaToolsLocalAcceptedEvidenceBundleReport {
  ok: boolean
  previewOnly: true
  noBackendEvidenceRecorded: true
  locallyAcceptedToolIds: ProductionToolId[]
  locallyAcceptedToolCount: number
  coreAcceptedToolIds: ProductionToolId[]
  libassAcceptedToolIds: ProductionToolId[]
  readyToRecordDeployedEvidence: boolean
  remainingGateBlockers: string[]
  nextSafeActions: string[]
  duplicateContext: {
    searchedTerms: string[]
    openDuplicatePrsObserved: number
    historicalContextPrs: number[]
  }
  corePreview: BetaToolsCoreRealCheckHydratedPreviewReport
  libassPreview: BetaToolsLibassSyntheticBurninQaPreflightReport
  missingConfiguration: string[]
  confirmationGaps: string[]
  secretLikeInputPaths: string[]
  warnings: string[]
}

export function runBetaToolsLocalAcceptedEvidenceBundle(
  env: BetaToolsLocalAcceptedEvidenceBundleEnv,
  libassRunner?: LibassSyntheticBurninCommandRunner,
): BetaToolsLocalAcceptedEvidenceBundleReport {
  const corePreview = runBetaToolsCoreRealCheckHydratedPreview(buildCoreEnv(env))
  const libassPreview = runBetaToolsLibassSyntheticBurninQaPreflight(buildLibassEnv(env), libassRunner)
  const coreAcceptedToolIds = corePreview.previewReport?.acceptedToolIds ?? []
  const libassAcceptedToolIds = libassPreview.acceptedToolEvidence.map((record) => record.toolId as ProductionToolId)
  const locallyAcceptedToolIds = uniqueToolIds([...coreAcceptedToolIds, ...libassAcceptedToolIds])
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID,
    projectId: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID,
    sourceId: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID,
    sourceSha: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA,
    notes: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES,
    containerImage: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE,
  }, 'betaToolsLocalAcceptedEvidenceBundle')
  const missingConfiguration = [
    ...bundleMissingConfiguration(env),
    ...(corePreview.previewReport?.missingConfiguration ?? []),
    ...libassPreview.missingConfiguration,
  ]
  const confirmationGaps = [
    ...(corePreview.previewReport?.confirmationGaps ?? []),
    ...libassPreview.confirmationGaps,
  ]
  const ok = corePreview.ok &&
    libassPreview.ok &&
    locallyAcceptedToolIds.length === coreAcceptedToolIds.length + libassAcceptedToolIds.length &&
    missingConfiguration.length === 0 &&
    confirmationGaps.length === 0 &&
    secretLikeInputPaths.length === 0

  return {
    ok,
    previewOnly: true,
    noBackendEvidenceRecorded: true,
    locallyAcceptedToolIds,
    locallyAcceptedToolCount: locallyAcceptedToolIds.length,
    coreAcceptedToolIds,
    libassAcceptedToolIds,
    readyToRecordDeployedEvidence: ok,
    remainingGateBlockers: [
      'deployed_core_real_check_evidence_recording_pending',
      'deployed_libass_qa_evidence_recording_pending',
      'platform_billing_deployment_evidence_pending',
      'launch_owner_approval_evidence_pending',
      'final_operator_status_readback_pending',
    ],
    nextSafeActions: [
      'Run npm run beta:tools:core-real-check-evidence-preflight, then npm run beta:tools:core-real-check-evidence against deployed staging with the same accepted source SHA.',
      'Run npm run beta:tools:libass-synthetic-burnin-qa-evidence-preflight, then npm run beta:tools:libass-synthetic-burnin-qa-evidence against deployed staging.',
      'Run npm run beta:platform:staging-evidence-preflight after platform owner approvals and staging probe inputs exist.',
      'Run npm run beta:readiness:launch-approval-evidence-preflight after launch owner approvals and evidence notes exist.',
      'Rerun npm run beta:readiness:operator-status-api after deployed evidence is recorded; do not enable external beta or production from this local bundle alone.',
    ],
    duplicateContext: {
      searchedTerms: [
        'all core preview evidence',
        'core real check evidence collector',
        'platform staging evidence',
      ],
      openDuplicatePrsObserved: 0,
      historicalContextPrs: [73],
    },
    corePreview,
    libassPreview,
    missingConfiguration,
    confirmationGaps,
    secretLikeInputPaths,
    warnings: [
      'Local bundle only; no backend evidence was recorded.',
      'The core preview uses bounded command/import/package metadata checks only.',
      'The libass QA proof is synthetic-only and must remove temp media artifacts.',
      'This bundle does not process user media, call providers, write Supabase, run workers, activate external beta, or activate production.',
      'Product-ready local OSS evidence remains local until deployed staging evidence recording and operator status readback pass.',
    ],
  }
}

function buildCoreEnv(env: BetaToolsLocalAcceptedEvidenceBundleEnv): BetaToolsCoreRealCheckHydratedPreviewEnv {
  return {
    REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID,
    REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID,
    REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID: sourceId(env, 'core-real-check'),
    REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA,
    REEDITPRO_BETA_TOOLS_PREVIEW_NOTES: notes(env),
    REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS,
    REEDITPRO_BETA_TOOLS_PREVIEW_INCLUDE_WARNINGS: 'false',
    REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS,
    REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE,
    REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS,
    REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE,
    REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE,
    REEDITPRO_READINESS_PYTHON_BIN: env.REEDITPRO_READINESS_PYTHON_BIN,
    REEDITPRO_BETA_TOOLS_PREVIEW_VENV_DIR: env.REEDITPRO_BETA_TOOLS_PREVIEW_VENV_DIR,
  }
}

function buildLibassEnv(env: BetaToolsLocalAcceptedEvidenceBundleEnv): BetaToolsLibassSyntheticBurninQaPreflightEnv {
  return {
    REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID: sourceId(env, 'libass-synthetic-burnin-qa'),
    REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_NOTES: notes(env),
    REEDITPRO_BETA_LIBASS_BURNIN_QA_MODE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_TIMEOUT_MS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_TIMEOUT_MS,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_RETAIN_TEMP_OUTPUTS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_RETAIN_TEMP_OUTPUTS,
  }
}

function bundleMissingConfiguration(env: BetaToolsLocalAcceptedEvidenceBundleEnv): string[] {
  return [
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA'),
    isTrue(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE)
      ? undefined
      : 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE=true is required so the bundle fails closed when core evidence is missing.',
    isTrue(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE)
      ? undefined
      : 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE=true is required so the bundle fails closed when libass evidence is missing.',
  ].filter((item): item is string => Boolean(item))
}

function missingEnv(env: BetaToolsLocalAcceptedEvidenceBundleEnv, name: keyof BetaToolsLocalAcceptedEvidenceBundleEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function sourceId(env: BetaToolsLocalAcceptedEvidenceBundleEnv, suffix: string): string {
  const base = clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID) ?? 'beta-tools-local-accepted-evidence-bundle'
  return `${base}:${suffix}`
}

function notes(env: BetaToolsLocalAcceptedEvidenceBundleEnv): string {
  return clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES) ??
    'Local accepted evidence bundle for core real-check and libass synthetic QA.'
}

function uniqueToolIds(toolIds: ProductionToolId[]): ProductionToolId[] {
  return [...new Set(toolIds)]
}

function isTrue(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runBetaToolsLocalAcceptedEvidenceBundle(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exitCode = 1
}
