import { callDeepSeekDryRunCase } from './deepseek-dry-run-client'
import {
  buildCompletedArtifactManifest,
  buildInitialArtifactManifest,
  uploadModelProviderDryRunLocalArtifacts,
  writeModelProviderDryRunDocs,
  writeModelProviderDryRunLocalArtifacts,
  writeModelProviderDryRunReports,
} from './model-provider-dry-run-artifacts'
import { buildModelProviderDryRunCommandPlan } from './model-provider-dry-run-command-plan'
import { buildModelProviderDryRunIamPlan } from './model-provider-dry-run-iam-plan'
import {
  MODEL_PROVIDER_DRY_RUN_POLICY,
  MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV,
  MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV_VALUES,
  buildModelProviderDryRunRunId,
} from './model-provider-dry-run-policy'
import {
  buildFailClosedReport,
  buildModelProviderDryRunDocs,
  buildReadinessReport,
  buildSupabaseMilestoneSyncReport,
} from './model-provider-dry-run-report-builder'
import { buildModelProviderDryRunQaSummary } from './model-provider-dry-run-qa-summary'
import { buildModelProviderDryRunSourceAudit } from './model-provider-dry-run-source-audit'
import type {
  ModelProviderDryRunCase,
  ModelProviderDryRunDecision,
  ModelProviderDryRunExecutionOptions,
  ModelProviderDryRunReports,
  ModelProviderDryRunStatus,
  NormalizedProviderResponse,
  ProviderCallResult,
  ProviderSecretResolution,
  ValidationResult,
} from './model-provider-dry-run-types'
import { buildProviderCostUsageReport } from './provider-cost-usage-normalizer'
import {
  buildRequestRedactionReport,
  buildResponseRedactionReport,
  validateDryRunRequestRedaction,
  validateDryRunResponseRedaction,
} from './provider-redaction-validator'
import { normalizeProviderResponse, buildNormalizedResponseReport } from './provider-response-normalizer'
import { buildSchemaValidationReport, validateProviderResponseSchemas } from './provider-response-schema-validator'
import { buildSafeSecretResolutionReport, resolveProviderSecretsFromSecretManager } from './provider-secret-resolver'
import { callQwenDryRunCase } from './qwen-dry-run-client'
import { buildModelProviderSyntheticDryRunCases, buildSyntheticDryRunCaseReport } from './synthetic-dry-run-case-builder'

function asBoolean(value: unknown): boolean {
  return value === true
}

function uniqueStrings(items: string[]): string[] {
  return [...new Set(items)]
}

function checkRequiredEnvironment(): { passed: boolean; blockers: string[] } {
  const blockers = MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV.flatMap((name) => {
    const expected = MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV_VALUES[name]
    return process.env[name] === expected ? [] : [`env_mismatch:${name}`]
  })
  return { passed: blockers.length === 0, blockers }
}

function buildSkippedProviderCallResults(cases: ModelProviderDryRunCase[], blocker: string): ProviderCallResult[] {
  return cases.map((dryRunCase) => ({
    caseId: dryRunCase.caseId,
    providerId: dryRunCase.providerId,
    modelId: dryRunCase.modelId,
    status: 'skipped',
    latencyMs: 0,
    blocker,
  }))
}

function buildProviderResultsReport(results: ProviderCallResult[]) {
  const nonSkipped = results.filter((result) => result.status !== 'skipped')
  const status = nonSkipped.length === 0
    ? 'skipped'
    : results.every((result) => result.status === 'passed') ? 'passed' : 'blocked'
  return {
    phase: 'MODEL_DRYRUN_1',
    status,
    providerCallsAttempted: nonSkipped.length,
    providerCallsPassed: results.filter((result) => result.status === 'passed').length,
    rawProviderResponsesCommitted: false,
    results: results.map((result) => ({
      caseId: result.caseId,
      providerId: result.providerId,
      modelId: result.modelId,
      status: result.status,
      httpStatus: result.httpStatus ?? null,
      latencyMs: result.latencyMs,
      finishReason: result.finishReason ?? null,
      promptTokens: result.usage?.promptTokens ?? null,
      completionTokens: result.usage?.completionTokens ?? null,
      totalTokens: result.usage?.totalTokens ?? null,
      rawContentPresentProcessLocalOnly: Boolean(result.rawContent),
      rawContentCommitted: false,
      blocker: result.blocker ?? null,
    })),
    blockers: results.flatMap((result) => result.status === 'blocked' ? [`${result.caseId}:${result.blocker ?? 'blocked'}`] : []),
  }
}

function buildSkippedNormalizedReport(cases: ModelProviderDryRunCase[], blocker: string) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: 'skipped',
    rawProviderResponsesCommitted: false,
    normalizedResponseCount: 0,
    responses: cases.map((dryRunCase) => ({
      caseId: dryRunCase.caseId,
      providerId: dryRunCase.providerId,
      modelId: dryRunCase.modelId,
      schemaId: dryRunCase.schemaId,
      status: 'skipped',
      blocker,
      normalizedKeys: [],
      executionAllowed: false,
      rawProviderResponseIncluded: false,
    })),
    blockers: [],
  }
}

function buildSkippedValidationReport(cases: ModelProviderDryRunCase[], blocker: string) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: 'skipped',
    validationErrorsFailClosed: true,
    results: cases.map((dryRunCase) => ({
      caseId: dryRunCase.caseId,
      status: 'skipped',
      blockers: [],
      warnings: [blocker],
    })),
    blockers: [],
  }
}

function buildSkippedResponseRedactionReport(cases: ModelProviderDryRunCase[], blocker: string) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: 'skipped',
    rawProviderResponsesCommitted: false,
    normalizedSyntheticResponsesOnly: true,
    results: cases.map((dryRunCase) => ({
      caseId: dryRunCase.caseId,
      status: 'skipped',
      blockers: [],
      warnings: [blocker],
    })),
    blockers: [],
  }
}

function buildReports(input: {
  runId: string
  execute: boolean
  sourceAudit: Record<string, unknown>
  cases: ModelProviderDryRunCase[]
  requestRedaction: ValidationResult
  secretResolutions: ProviderSecretResolution[]
  providerResults: ProviderCallResult[]
  normalizedResponses: NormalizedProviderResponse[]
  schemaValidation: ValidationResult[]
  responseRedaction: ValidationResult[]
  artifactManifest: Record<string, unknown>
  supabaseMilestoneSync: Record<string, unknown>
  status: ModelProviderDryRunStatus
  decision: ModelProviderDryRunDecision
  blockers: string[]
  warnings: string[]
  failClosedBlockers: string[]
}): ModelProviderDryRunReports {
  const normalizedReport = input.normalizedResponses.length > 0
    ? buildNormalizedResponseReport(input.normalizedResponses)
    : buildSkippedNormalizedReport(input.cases, input.execute ? 'normalization_not_reached' : 'report_only_provider_calls_not_attempted')
  const schemaReport = input.schemaValidation.length > 0
    ? buildSchemaValidationReport(input.schemaValidation)
    : buildSkippedValidationReport(input.cases, input.execute ? 'schema_validation_not_reached' : 'report_only_provider_calls_not_attempted')
  const responseRedactionReport = input.responseRedaction.length > 0
    ? buildResponseRedactionReport(input.responseRedaction)
    : buildSkippedResponseRedactionReport(input.cases, input.execute ? 'response_redaction_not_reached' : 'report_only_provider_calls_not_attempted')

  const qaSummary = buildModelProviderDryRunQaSummary({
    requestRedaction: input.requestRedaction,
    schemaValidation: input.schemaValidation,
    responseRedaction: input.responseRedaction,
    artifactStatus: String(input.artifactManifest.status),
    supabaseSyncStatus: String(input.supabaseMilestoneSync.status),
    execute: input.execute,
  })

  return {
    sourceAudit: input.sourceAudit,
    policy: {
      ...MODEL_PROVIDER_DRY_RUN_POLICY,
      commandPlan: buildModelProviderDryRunCommandPlan(),
      iamPlan: buildModelProviderDryRunIamPlan(),
    },
    syntheticCases: buildSyntheticDryRunCaseReport(),
    requestRedaction: buildRequestRedactionReport(input.requestRedaction),
    secretResolution: buildSafeSecretResolutionReport(input.secretResolutions),
    providerResults: buildProviderResultsReport(input.providerResults),
    normalizedResponses: normalizedReport,
    schemaValidation: schemaReport,
    responseRedaction: responseRedactionReport,
    costUsage: buildProviderCostUsageReport(input.providerResults),
    failClosed: buildFailClosedReport({
      sourceAuthorization: asBoolean(input.sourceAudit.liveSyntheticProviderCallAuthorization),
      envPassed: !input.failClosedBlockers.some((blocker) => blocker.startsWith('env_mismatch:')),
      requestRedactionPassed: input.requestRedaction.status === 'passed',
      secretsPassed: input.secretResolutions.every((secret) => secret.status === 'passed' || secret.status === 'skipped'),
      providerCallsPassed: input.providerResults.every((result) => result.status === 'passed' || result.status === 'skipped'),
      schemaPassed: input.schemaValidation.length === 0 || input.schemaValidation.every((result) => result.status === 'passed'),
      responseRedactionPassed: input.responseRedaction.length === 0 || input.responseRedaction.every((result) => result.status === 'passed'),
      artifactsPassed: String(input.artifactManifest.status) === 'passed' || String(input.artifactManifest.status) === 'skipped',
      execute: input.execute,
      blockers: input.failClosedBlockers,
    }),
    artifactManifest: input.artifactManifest,
    supabaseMilestoneSync: input.supabaseMilestoneSync,
    qaSummary,
    readinessReport: buildReadinessReport({
      runId: input.runId,
      execute: input.execute,
      status: input.status,
      decision: input.decision,
      blockers: input.blockers,
      warnings: input.warnings,
    }),
  }
}

async function callProviderForCase(input: {
  dryRunCase: ModelProviderDryRunCase
  secrets: ProviderSecretResolution[]
}): Promise<ProviderCallResult> {
  const secret = input.secrets.find((item) => item.providerId === input.dryRunCase.providerId)
  if (!secret?.value) {
    return {
      caseId: input.dryRunCase.caseId,
      providerId: input.dryRunCase.providerId,
      modelId: input.dryRunCase.modelId,
      status: 'blocked',
      latencyMs: 0,
      blocker: 'secret_payload_unavailable',
    }
  }
  return input.dryRunCase.providerId === 'qwen_dashscope'
    ? callQwenDryRunCase({ dryRunCase: input.dryRunCase, apiKey: secret.value })
    : callDeepSeekDryRunCase({ dryRunCase: input.dryRunCase, apiKey: secret.value })
}

export async function executeModelProviderDryRun(options: ModelProviderDryRunExecutionOptions): Promise<{
  exitCode: number
  reports: ModelProviderDryRunReports
}> {
  const runId = options.runId ?? buildModelProviderDryRunRunId()
  const execute = options.execute
  const cases = buildModelProviderSyntheticDryRunCases()
  const sourceAudit = buildModelProviderDryRunSourceAudit(runId)
  const requestRedaction = validateDryRunRequestRedaction(cases)
  const supabaseMilestoneSync = buildSupabaseMilestoneSyncReport(execute)

  if (!execute) {
    const secretResolutions = await resolveProviderSecretsFromSecretManager({ execute: false })
    const reports = buildReports({
      runId,
      execute,
      sourceAudit,
      cases,
      requestRedaction,
      secretResolutions,
      providerResults: buildSkippedProviderCallResults(cases, 'report_only_provider_calls_not_attempted'),
      normalizedResponses: [],
      schemaValidation: [],
      responseRedaction: [],
      artifactManifest: buildInitialArtifactManifest(runId, execute),
      supabaseMilestoneSync,
      status: 'skipped',
      decision: 'report_only_not_executed',
      blockers: [],
      warnings: ['report_only_mode_provider_calls_not_attempted'],
      failClosedBlockers: [],
    })
    await maybeWriteReportsAndDocs(options, reports)
    return { exitCode: 0, reports }
  }

  const authorizationBlockers = asBoolean(sourceAudit.liveSyntheticProviderCallAuthorization)
    ? []
    : ['blocked_missing_live_synthetic_provider_authorization']
  const envCheck = checkRequiredEnvironment()
  const earlyBlockers = uniqueStrings([
    ...authorizationBlockers,
    ...envCheck.blockers,
    ...requestRedaction.blockers.map((blocker) => `request_redaction:${blocker}`),
  ])
  if (earlyBlockers.length > 0) {
    const secretResolutions = await resolveProviderSecretsFromSecretManager({ execute: false })
    const decision: ModelProviderDryRunDecision = authorizationBlockers.length > 0
      ? 'blocked_missing_live_synthetic_provider_authorization'
      : 'blocked_missing_execution_confirmations'
    const reports = buildReports({
      runId,
      execute,
      sourceAudit,
      cases,
      requestRedaction,
      secretResolutions,
      providerResults: buildSkippedProviderCallResults(cases, 'execute_gate_failed_before_provider_calls'),
      normalizedResponses: [],
      schemaValidation: [],
      responseRedaction: [],
      artifactManifest: buildInitialArtifactManifest(runId, execute),
      supabaseMilestoneSync,
      status: 'blocked',
      decision,
      blockers: earlyBlockers,
      warnings: [],
      failClosedBlockers: earlyBlockers,
    })
    await maybeWriteReportsAndDocs(options, reports)
    return { exitCode: 1, reports }
  }

  const secretResolutions = await resolveProviderSecretsFromSecretManager({
    execute: true,
    projectId: process.env.GCP_PROJECT_ID,
  })
  const secretBlockers = uniqueStrings(
    secretResolutions.flatMap((secret) => secret.status === 'passed' ? [] : [secret.blocker ?? `secret_resolution_failed:${secret.secretName}`]),
  )
  if (secretBlockers.length > 0) {
    const reports = buildReports({
      runId,
      execute,
      sourceAudit,
      cases,
      requestRedaction,
      secretResolutions,
      providerResults: buildSkippedProviderCallResults(cases, 'secret_resolution_failed_before_provider_calls'),
      normalizedResponses: [],
      schemaValidation: [],
      responseRedaction: [],
      artifactManifest: buildInitialArtifactManifest(runId, execute),
      supabaseMilestoneSync,
      status: 'blocked',
      decision: 'blocked_secret_resolution_failed',
      blockers: secretBlockers,
      warnings: [],
      failClosedBlockers: secretBlockers,
    })
    await maybeWriteReportsAndDocs(options, reports)
    return { exitCode: 1, reports }
  }

  const providerResults: ProviderCallResult[] = []
  for (const dryRunCase of cases) {
    providerResults.push(await callProviderForCase({ dryRunCase, secrets: secretResolutions }))
  }
  const providerBlockers = providerResults.flatMap((result) => result.status === 'passed' ? [] : [`${result.caseId}:${result.blocker ?? 'provider_call_failed'}`])
  const normalizedResponses = providerResults.map((result) => {
    const dryRunCase = cases.find((item) => item.caseId === result.caseId)
    if (!dryRunCase) throw new Error(`Missing dry-run case for ${result.caseId}`)
    return normalizeProviderResponse(dryRunCase, result)
  })
  const schemaValidation = validateProviderResponseSchemas(normalizedResponses)
  const responseRedaction = validateDryRunResponseRedaction(normalizedResponses)
  const schemaBlockers = schemaValidation.flatMap((result) => result.blockers.map((blocker) => `${result.caseId ?? 'unknown'}:${blocker}`))
  const redactionBlockers = responseRedaction.flatMap((result) => result.blockers.map((blocker) => `${result.caseId ?? 'unknown'}:${blocker}`))
  const validationBlockers = uniqueStrings([...providerBlockers, ...schemaBlockers, ...redactionBlockers])

  if (validationBlockers.length > 0) {
    const decision: ModelProviderDryRunDecision = providerBlockers.length > 0
      ? 'blocked_provider_call_failed'
      : schemaBlockers.length > 0 ? 'blocked_schema_validation_failed' : 'blocked_redaction_validation_failed'
    const reports = buildReports({
      runId,
      execute,
      sourceAudit,
      cases,
      requestRedaction,
      secretResolutions,
      providerResults,
      normalizedResponses,
      schemaValidation,
      responseRedaction,
      artifactManifest: buildInitialArtifactManifest(runId, execute),
      supabaseMilestoneSync,
      status: 'blocked',
      decision,
      blockers: validationBlockers,
      warnings: [],
      failClosedBlockers: validationBlockers,
    })
    await maybeWriteReportsAndDocs(options, reports)
    return { exitCode: 1, reports }
  }

  const preArtifactReports = buildReports({
    runId,
    execute,
    sourceAudit,
    cases,
    requestRedaction,
    secretResolutions,
    providerResults,
    normalizedResponses,
    schemaValidation,
    responseRedaction,
    artifactManifest: buildInitialArtifactManifest(runId, execute),
    supabaseMilestoneSync,
    status: 'partial',
    decision: 'partial_supabase_milestone_sync_unavailable',
    blockers: [],
    warnings: ['supabase_milestone_sync_approved_path_unavailable'],
    failClosedBlockers: [],
  })
  const localArtifact = await writeModelProviderDryRunLocalArtifacts({ runId, reports: preArtifactReports })
  const upload = localArtifact.status === 'passed'
    ? await uploadModelProviderDryRunLocalArtifacts({ runId, localArtifactDir: localArtifact.localArtifactDir })
    : { status: 'blocked' as const, uploadedPrefixes: [], blocker: localArtifact.blocker ?? 'local_private_artifact_write_failed' }

  const artifactBlockers = [localArtifact.blocker, upload.blocker].filter((item): item is string => Boolean(item))
  const artifactManifest = buildCompletedArtifactManifest({
    runId,
    localStatus: localArtifact.status,
    uploadStatus: upload.status,
    localArtifactDir: localArtifact.localArtifactDir,
    uploadedPrefixes: upload.uploadedPrefixes,
    blockers: artifactBlockers,
  })
  const artifactPassed = artifactBlockers.length === 0
  const decision: ModelProviderDryRunDecision = artifactPassed
    ? 'partial_supabase_milestone_sync_unavailable'
    : 'blocked_artifact_upload_failed'
  const status: ModelProviderDryRunStatus = artifactPassed ? 'partial' : 'blocked'
  const finalReports = buildReports({
    runId,
    execute,
    sourceAudit,
    cases,
    requestRedaction,
    secretResolutions,
    providerResults,
    normalizedResponses,
    schemaValidation,
    responseRedaction,
    artifactManifest,
    supabaseMilestoneSync,
    status,
    decision,
    blockers: artifactBlockers,
    warnings: artifactPassed ? ['supabase_milestone_sync_approved_path_unavailable'] : [],
    failClosedBlockers: artifactBlockers,
  })
  await maybeWriteReportsAndDocs(options, finalReports)
  if (artifactPassed) {
    await writeModelProviderDryRunLocalArtifacts({ runId, reports: finalReports })
    await uploadModelProviderDryRunLocalArtifacts({ runId, localArtifactDir: localArtifact.localArtifactDir })
  }
  return { exitCode: artifactPassed ? 0 : 1, reports: finalReports }
}

async function writeReportsAndDocs(reports: ModelProviderDryRunReports): Promise<void> {
  await writeModelProviderDryRunReports(reports)
  await writeModelProviderDryRunDocs(buildModelProviderDryRunDocs(reports))
}

async function maybeWriteReportsAndDocs(
  options: ModelProviderDryRunExecutionOptions,
  reports: ModelProviderDryRunReports,
): Promise<void> {
  if (options.writeArtifacts === false) return
  await writeReportsAndDocs(reports)
}
