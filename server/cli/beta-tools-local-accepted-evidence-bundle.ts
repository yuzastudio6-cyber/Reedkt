import { execFileSync } from 'node:child_process'
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
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE?: string
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

export interface BetaToolsLocalAcceptedEvidenceBundleOptions {
  localDefaults?: boolean
  sourceSha?: string
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
  localDefaultsApplied: boolean
  localDefaultedInputNames: string[]
  missingConfiguration: string[]
  confirmationGaps: string[]
  secretLikeInputPaths: string[]
  warnings: string[]
}

const LOCAL_DEFAULT_SOURCE_ID = 'beta-tools-local-accepted-evidence-bundle-local-defaults'
const LOCAL_DEFAULT_LIBASS_CONTAINER_IMAGE =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001'
const LOCAL_DEFAULT_CORE_TOOL_IDS = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'hyperframe',
  'remotion',
  'sharp',
  'duckdb',
  'polars',
  'pyscenedetect',
  'opencv',
  'opencolorio',
  'openimageio',
  'audioflux',
  'signalsmith_stretch',
].join(',')

export function runBetaToolsLocalAcceptedEvidenceBundle(
  env: BetaToolsLocalAcceptedEvidenceBundleEnv,
  libassRunner?: LibassSyntheticBurninCommandRunner,
  options: BetaToolsLocalAcceptedEvidenceBundleOptions = {},
): BetaToolsLocalAcceptedEvidenceBundleReport {
  const localDefaults = applyLocalDefaults(env, options)
  const bundleEnv = localDefaults.env
  const corePreview = runBetaToolsCoreRealCheckHydratedPreview(buildCoreEnv(bundleEnv))
  const libassPreview = runBetaToolsLibassSyntheticBurninQaPreflight(buildLibassEnv(bundleEnv), libassRunner)
  const coreAcceptedToolIds = corePreview.previewReport?.acceptedToolIds ?? []
  const libassAcceptedToolIds = libassPreview.acceptedToolEvidence.map((record) => record.toolId as ProductionToolId)
  const locallyAcceptedToolIds = uniqueToolIds([...coreAcceptedToolIds, ...libassAcceptedToolIds])
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: bundleEnv.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID,
    projectId: bundleEnv.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID,
    sourceId: bundleEnv.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID,
    sourceSha: bundleEnv.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA,
    notes: bundleEnv.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES,
    containerImage: bundleEnv.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE,
  }, 'betaToolsLocalAcceptedEvidenceBundle')
  const missingConfiguration = [
    ...bundleMissingConfiguration(bundleEnv),
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
    localDefaultsApplied: localDefaults.applied,
    localDefaultedInputNames: localDefaults.inputNames,
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

function applyLocalDefaults(
  env: BetaToolsLocalAcceptedEvidenceBundleEnv,
  options: BetaToolsLocalAcceptedEvidenceBundleOptions,
): {
  env: BetaToolsLocalAcceptedEvidenceBundleEnv
  applied: boolean
  inputNames: string[]
} {
  if (options.localDefaults !== true) {
    return {
      env,
      applied: false,
      inputNames: [],
    }
  }

  const next: BetaToolsLocalAcceptedEvidenceBundleEnv = { ...env }
  const inputNames: string[] = []
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID', 'local-accepted-evidence-bundle-workspace')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID', 'local-accepted-evidence-bundle-project')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID', LOCAL_DEFAULT_SOURCE_ID)
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA', clean(options.sourceSha) ?? resolveCurrentGitSha())
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES', 'Local no-secret bounded accepted evidence bundle; no backend evidence recorded.')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS', LOCAL_DEFAULT_CORE_TOOL_IDS)
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE', 'true')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE', 'true')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS', 'false')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE', 'true')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE', 'true')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE', 'docker')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE', LOCAL_DEFAULT_LIBASS_CONTAINER_IMAGE)
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_TIMEOUT_MS', '60000')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_RETAIN_TEMP_OUTPUTS', 'false')

  return {
    env: next,
    applied: true,
    inputNames,
  }
}

function setDefault(
  env: BetaToolsLocalAcceptedEvidenceBundleEnv,
  inputNames: string[],
  name: keyof BetaToolsLocalAcceptedEvidenceBundleEnv,
  value: string | undefined,
): void {
  if (clean(env[name])) return
  if (!clean(value)) return
  env[name] = value
  inputNames.push(name)
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
    REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE,
    REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE,
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
    REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE,
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

function resolveCurrentGitSha(): string | undefined {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        DEVELOPER_DIR: process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
      },
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return undefined
  }
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runBetaToolsLocalAcceptedEvidenceBundle(process.env, undefined, {
    localDefaults: process.argv.includes('--local-defaults'),
  })
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exitCode = 1
}
