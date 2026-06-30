import { execFileSync } from 'node:child_process'
import { PRODUCTION_TOOL_IDS, type ProductionToolId } from '../tool-registry'
import {
  buildCoreRealCheckEvidencePacket,
  type CoreRealCheckEvidenceInput,
  type CoreRealCheckEvidenceResult,
} from '../beta-readiness/core-real-check-evidence'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

const TEMPLATE_DECISION = 'beta_tools_core_real_check_preview_template_passed_ready_for_local_operator_preview'
const NON_SECRET_PLACEHOLDER = '<operator supplied non-secret value>'
const LOCAL_DEFAULT_SOURCE_ID = 'beta-tools-core-real-check-local-defaults'

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
  REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE?: string
  REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE?: string
}

export interface BetaToolsCoreRealCheckPreviewOptions {
  localDefaults?: boolean
  sourceSha?: string
}

export interface BetaToolsCoreRealCheckPreviewTemplateReport {
  ok: true
  decision: typeof TEMPLATE_DECISION
  previewOnly: true
  recordsBackendEvidence: false
  defaultToolScope: 'all_production_tools_when_tool_ids_unset'
  valuePolicy: {
    workspaceId: 'operator_non_secret_value'
    projectId: 'operator_optional_non_secret_value'
    sourceSha: 'operator_current_source_sha'
    toolIds: 'optional_comma_separated_production_tool_ids'
    acceptanceMode: 'bounded_accepted_evidence_only'
    productReadyLocalOss: false
  }
  envTemplate: string
  recommendedCommands: string[]
  blockedScopeConfirmations: {
    backendEvidenceRecorded: false
    deployedBackendCalled: false
    toolExecutionRecorded: false
    mediaProcessed: false
    dockerRan: false
    supabaseWritesRan: false
    gcsWritesRan: false
    externalBetaEnabled: false
    realUserMediaBetaEnabled: false
    paidProductionEnabled: false
  }
  warnings: string[]
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
  localDefaultsApplied: boolean
  localDefaultedInputNames: string[]
  missingConfiguration: string[]
  confirmationGaps: string[]
  invalidToolIds: string[]
  secretLikeInputPaths: string[]
  warnings: string[]
}

export function buildBetaToolsCoreRealCheckPreviewTemplate(): BetaToolsCoreRealCheckPreviewTemplateReport {
  const envTemplate = [
    '# ReEditPro beta tools core real-check preview template',
    '# Local preview only. Fill in an operator shell; do not commit completed values.',
    '# This does not call the deployed backend, record evidence, process media, run Docker, enable beta, or enable production.',
    '',
    `export REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID="${NON_SECRET_PLACEHOLDER}"`,
    'export REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID="<optional non-secret project id>"',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID="beta-tools-core-real-check-preview"',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA="<current source sha under review>"',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_NOTES="Local no-write bounded accepted evidence preview; no backend evidence recorded."',
    '# Leave empty to preview all production registry tools, or set a comma-separated subset like hyperframe,remotion.',
    '# Warning-status tools such as libass are handled by their separate QA/bundle lane, so warnings stay excluded here.',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS=""',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_INCLUDE_WARNINGS="false"',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE="true"',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE="true"',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS="false"',
    'export REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE="true"',
    '',
    '# Run after filling values:',
    '# npm run beta:tools:core-real-check-preview',
    '',
    '# No-secret local bounded preview shortcut; fills only non-secret local IDs, current git SHA,',
    '# bounded-accepted confirmations, and product-ready=false:',
    '# npm run beta:tools:core-real-check-preview -- --local-defaults',
    '',
    '# For Python-backed core tools, hydrate the gitignored readiness venv first:',
    '# npm run tools:readiness:install-core-python',
    '# npm run beta:tools:core-real-check-preview:hydrated -- --local-defaults',
  ].join('\n')

  return {
    ok: true,
    decision: TEMPLATE_DECISION,
    previewOnly: true,
    recordsBackendEvidence: false,
    defaultToolScope: 'all_production_tools_when_tool_ids_unset',
    valuePolicy: {
      workspaceId: 'operator_non_secret_value',
      projectId: 'operator_optional_non_secret_value',
      sourceSha: 'operator_current_source_sha',
      toolIds: 'optional_comma_separated_production_tool_ids',
      acceptanceMode: 'bounded_accepted_evidence_only',
      productReadyLocalOss: false,
    },
    envTemplate,
    recommendedCommands: [
      'npm run beta:tools:core-real-check-preview -- --local-defaults',
      'npm run beta:tools:core-real-check-preview',
      'npm run tools:readiness:install-core-python',
      'npm run beta:tools:core-real-check-preview:hydrated -- --local-defaults',
      'npm run beta:tools:core-real-check-preview:hydrated',
      'npm run beta:tools:local-accepted-evidence-bundle',
    ],
    blockedScopeConfirmations: {
      backendEvidenceRecorded: false,
      deployedBackendCalled: false,
      toolExecutionRecorded: false,
      mediaProcessed: false,
      dockerRan: false,
      supabaseWritesRan: false,
      gcsWritesRan: false,
      externalBetaEnabled: false,
      realUserMediaBetaEnabled: false,
      paidProductionEnabled: false,
    },
    warnings: [
      'Template values must be filled outside source control.',
      'Bounded accepted evidence is not product-ready local OSS acceptance.',
      'A passing local preview still requires deployed staging evidence recording and product-ready QA before beta/production gates can open.',
    ],
  }
}

export function renderBetaToolsCoreRealCheckPreviewTemplateMarkdown(report: BetaToolsCoreRealCheckPreviewTemplateReport): string {
  return [
    '# Beta Tools Core Real-Check Preview Template',
    '',
    `Decision: \`${report.decision}\``,
    '',
    `Preview only: \`${report.previewOnly}\``,
    `Records backend evidence: \`${report.recordsBackendEvidence}\``,
    `Default tool scope: \`${report.defaultToolScope}\``,
    `Product-ready local OSS acceptance: \`${report.valuePolicy.productReadyLocalOss}\``,
    '',
    '## Environment Template',
    '',
    '```bash',
    report.envTemplate,
    '```',
    '',
    '## Recommended Commands',
    '',
    ...report.recommendedCommands.map((command) => `- \`${command}\``),
    '',
    '## Boundary',
    '',
    'This template did not call the deployed backend, record evidence, process media, run Docker, write Supabase/GCS, enable external beta, enable real-user-media beta, or enable paid production.',
  ].join('\n')
}

export function runBetaToolsCoreRealCheckPreview(
  env: BetaToolsCoreRealCheckPreviewEnv,
  options: BetaToolsCoreRealCheckPreviewOptions = {},
): BetaToolsCoreRealCheckPreviewReport {
  const localDefaults = applyLocalDefaults(env, options)
  const previewEnv = localDefaults.env
  const missingConfiguration = missingRequiredConfiguration(previewEnv)
  const invalidToolIds = findInvalidToolIds(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS)
  const acceptBoundedAcceptedEvidence = parseBoolean(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE)
  const acceptProductionReadiness = effectiveProductionReadinessAcceptance(previewEnv)
  const acceptProductReadyLocalOss = parseBoolean(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS)
  const requireAcceptedEvidence = parseBoolean(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE)
  const confirmationGaps = [
    ...(parseBoolean(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS) && !parseBoolean(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE)
      ? ['REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true is required when previewing production-readiness acceptance.']
      : []),
    ...(acceptBoundedAcceptedEvidence && !parseBoolean(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE)
      ? ['REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE=true is required when previewing bounded accepted evidence.']
      : []),
    ...(acceptProductReadyLocalOss && !parseBoolean(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE)
      ? ['REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true is required when previewing product-ready local OSS acceptance.']
      : []),
  ]
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID,
    projectId: previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID,
    sourceId: previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID,
    sourceSha: previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA,
    notes: previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_NOTES,
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
      requestedToolIds: parseKnownToolIds(previewEnv.REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS),
      localDefaultsApplied: localDefaults.applied,
      localDefaultedInputNames: localDefaults.inputNames,
    })
  }

  const input = buildPreviewInput(previewEnv)
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
        localDefaultsApplied: localDefaults.applied,
        localDefaultedInputNames: localDefaults.inputNames,
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
    localDefaultsApplied: localDefaults.applied,
    localDefaultedInputNames: localDefaults.inputNames,
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
    acceptProductionReadiness: effectiveProductionReadinessAcceptance(env),
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
    localDefaultsApplied: boolean
    localDefaultedInputNames: string[]
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
    localDefaultsApplied: options.localDefaultsApplied,
    localDefaultedInputNames: options.localDefaultedInputNames,
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
  localDefaultsApplied: boolean
  localDefaultedInputNames: string[]
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
    localDefaultsApplied: options.localDefaultsApplied,
    localDefaultedInputNames: options.localDefaultedInputNames,
    missingConfiguration: options.missingConfiguration,
    confirmationGaps: options.confirmationGaps,
    invalidToolIds: options.invalidToolIds,
    secretLikeInputPaths: options.secretLikeInputPaths,
    warnings: previewWarnings(),
  }
}

function applyLocalDefaults(
  env: BetaToolsCoreRealCheckPreviewEnv,
  options: BetaToolsCoreRealCheckPreviewOptions,
): {
  env: BetaToolsCoreRealCheckPreviewEnv
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

  const next: BetaToolsCoreRealCheckPreviewEnv = { ...env }
  const inputNames: string[] = []
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID', 'local-bounded-preview-workspace')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID', 'local-bounded-preview-project')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID', LOCAL_DEFAULT_SOURCE_ID)
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA', clean(options.sourceSha) ?? resolveCurrentGitSha())
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_NOTES', 'Local no-secret bounded accepted evidence preview; no backend evidence recorded.')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_INCLUDE_WARNINGS', 'false')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE', 'true')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE', 'true')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS', 'false')
  setDefault(next, inputNames, 'REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE', 'true')

  return {
    env: next,
    applied: true,
    inputNames,
  }
}

function setDefault(
  env: BetaToolsCoreRealCheckPreviewEnv,
  inputNames: string[],
  name: keyof BetaToolsCoreRealCheckPreviewEnv,
  value: string | undefined,
): void {
  if (clean(env[name])) return
  if (!clean(value)) return
  env[name] = value
  inputNames.push(name)
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

function previewWarnings(): string[] {
  return [
    'Local preview only; no backend evidence was recorded.',
    'Checks are bounded command/import/package metadata checks only.',
    'This command must not process media, call providers, run Docker, write Supabase, enable beta, or enable production.',
    'A passing preview still requires deployed staging evidence recording through beta:tools:core-real-check-evidence.',
  ]
}

function missingRequiredConfiguration(env: BetaToolsCoreRealCheckPreviewEnv): string[] {
  const hasAcceptedEvidenceMode = effectiveProductionReadinessAcceptance(env) ||
    parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS)
  return [
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA'),
    hasAcceptedEvidenceMode
      ? undefined
      : 'REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE=true or REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS=true is required to preview blocker-reducing accepted evidence.',
    parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE)
      ? undefined
      : 'REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE=true is required so the preview fails closed when no tools pass.',
  ].filter((item): item is string => Boolean(item))
}

function effectiveProductionReadinessAcceptance(env: BetaToolsCoreRealCheckPreviewEnv): boolean {
  return parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS) ||
    parseBoolean(env.REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE)
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
  if (process.argv.includes('--env-template')) {
    console.log(buildBetaToolsCoreRealCheckPreviewTemplate().envTemplate)
  } else if (process.argv.includes('--template-markdown')) {
    console.log(renderBetaToolsCoreRealCheckPreviewTemplateMarkdown(buildBetaToolsCoreRealCheckPreviewTemplate()))
  } else {
    const report = runBetaToolsCoreRealCheckPreview(process.env, {
      localDefaults: process.argv.includes('--local-defaults'),
    })
    console.log(JSON.stringify(report, null, 2))
    if (!report.readyToRecordAcceptedEvidence) {
      process.exitCode = 1
    }
  }
}
