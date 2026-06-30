import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { buildBetaReadinessBlockerLedger } from './beta-readiness-blocker-ledger'

const LOCAL_ACCEPTED_BUNDLE_PATH = 'docs/beta-readiness/local-accepted-evidence-bundle/2026-06-29-current-source-16-tool-local-accepted-evidence-bundle.json'
const EXTERNAL_BETA_OPERATOR_TEMPLATE_PATH = 'docs/beta-readiness/external-beta-operator-input-template/2026-06-29-184f-external-beta-operator-input-template.json'

export interface BetaReadinessBlockerCloseoutQueueBatch {
  batchId: string
  title: string
  order: number
  clearanceType: string
  rowCount: number
  canRunWithoutOperatorSecrets: boolean
  canEnableBetaOrProduction: false
  sourceEvidence: string[]
  nextCommands: string[]
  blockedUntil: string[]
}

export interface BetaReadinessBlockerCloseoutQueueReport {
  reportId: string
  createdAt: string
  decision: 'beta_readiness_blocker_closeout_queue_passed_ready_for_operator_evidence_collection'
  sourceTruth: {
    currentCentralSha: string
    blockerLedgerRows: number
    duplicateBlockerRows: number
    toolRows: number
    platformRows: number
    checklistRows: number
    goNoGoRows: number
    productReadyLocalOssCount: number
    externalBetaAllowed: false
    realUserMediaBetaAllowed: false
    paidProductionAllowed: false
    localAcceptedEvidenceBundlePath: string
    locallyAcceptedToolCount: number
    locallyAcceptedToolIds: string[]
    readyToRecordDeployedEvidence: boolean
    operatorTemplatePath: string
    requiredOperatorInputs: number
    pendingOperatorInputsInBlankEnv: number
    humanActionablePendingOperatorInputs: number
    autoFillablePendingOperatorInputs: number
  }
  blockerCounts: {
    byClearanceType: Record<string, number>
    byBlockerId: Record<string, number>
  }
  batches: BetaReadinessBlockerCloseoutQueueBatch[]
  blockedScopeConfirmations: {
    deployedBackendCalled: false
    toolExecutionRan: false
    dockerRan: false
    mediaProcessed: false
    supabaseWritesRan: false
    gcsWritesRan: false
    externalBetaEnabled: false
    realUserMediaBetaEnabled: false
    paidProductionEnabled: false
    publicArtifactsCreated: false
    signedUrlsCreated: false
  }
  supabaseClassification: {
    write: 'no write'
    environment: 'none'
    sql: 'none'
    migration: 'no'
  }
  warnings: string[]
}

export function buildBetaReadinessBlockerCloseoutQueue(options: {
  currentCentralSha?: string
  createdAt?: string
} = {}): BetaReadinessBlockerCloseoutQueueReport {
  const ledger = buildBetaReadinessBlockerLedger()
  const localBundle = readJson(LOCAL_ACCEPTED_BUNDLE_PATH)
  const operatorTemplate = readJson(EXTERNAL_BETA_OPERATOR_TEMPLATE_PATH)
  const byClearanceType = countBy(ledger.rows.map((row) => row.clearanceType))
  const byBlockerId = countBy(ledger.rows.map((row) => row.blockerId))
  const acceptedToolIds = stringArray(localBundle.locallyAcceptedToolIds)
  const requiredOperatorInputs = numberValue(operatorTemplate.inputCounts?.required)
  const pendingOperatorInputsInBlankEnv = numberValue(operatorTemplate.inputCounts?.currentlyPendingInBlankEnvironment)
  const pendingTemplateInputs = arrayValue(operatorTemplate.requiredInputs).filter((input) => input.present !== true)
  const humanActionablePendingOperatorInputs = pendingTemplateInputs.filter(isHumanActionableOperatorInput).length
  const autoFillablePendingOperatorInputs = pendingTemplateInputs.length - humanActionablePendingOperatorInputs

  return {
    reportId: 'beta-readiness-blocker-closeout-queue-2026-06-29',
    createdAt: options.createdAt ?? new Date().toISOString(),
    decision: 'beta_readiness_blocker_closeout_queue_passed_ready_for_operator_evidence_collection',
    sourceTruth: {
      currentCentralSha: options.currentCentralSha ?? resolveCurrentCentralSha(),
      blockerLedgerRows: ledger.totalRows,
      duplicateBlockerRows: ledger.duplicateRowKeys.length,
      toolRows: ledger.toolRows,
      platformRows: ledger.platformRows,
      checklistRows: ledger.checklistRows,
      goNoGoRows: ledger.goNoGoRows,
      productReadyLocalOssCount: ledger.productReadyLocalOssCount,
      externalBetaAllowed: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      localAcceptedEvidenceBundlePath: LOCAL_ACCEPTED_BUNDLE_PATH,
      locallyAcceptedToolCount: numberValue(localBundle.locallyAcceptedToolCount),
      locallyAcceptedToolIds: acceptedToolIds,
      readyToRecordDeployedEvidence: localBundle.readyToRecordDeployedEvidence === true,
      operatorTemplatePath: EXTERNAL_BETA_OPERATOR_TEMPLATE_PATH,
      requiredOperatorInputs,
      pendingOperatorInputsInBlankEnv,
      humanActionablePendingOperatorInputs,
      autoFillablePendingOperatorInputs,
    },
    blockerCounts: {
      byClearanceType,
      byBlockerId,
    },
    batches: buildBatches(
      byClearanceType,
      byBlockerId,
      acceptedToolIds,
      requiredOperatorInputs,
      pendingOperatorInputsInBlankEnv,
      humanActionablePendingOperatorInputs,
      autoFillablePendingOperatorInputs,
    ),
    blockedScopeConfirmations: {
      deployedBackendCalled: false,
      toolExecutionRan: false,
      dockerRan: false,
      mediaProcessed: false,
      supabaseWritesRan: false,
      gcsWritesRan: false,
      externalBetaEnabled: false,
      realUserMediaBetaEnabled: false,
      paidProductionEnabled: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
    },
    supabaseClassification: {
      write: 'no write',
      environment: 'none',
      sql: 'none',
      migration: 'no',
    },
    warnings: [
      'This closeout queue is metadata only; it does not record evidence, call deployed services, run tools, process media, or enable beta/production.',
      'Track B local accepted evidence is ready to be recorded against deployed staging, but it is not itself a product-ready or launch approval.',
      'Operator secrets, owner attestations, deployed evidence recording, final readback, real-user-media approval, and paid-production approval remain separate gates.',
      'Blockers remain scoped to named unsafe beta/production actions; safe blocker-reduction work remains allowed.',
    ],
  }
}

function buildBatches(
  byClearanceType: Record<string, number>,
  byBlockerId: Record<string, number>,
  acceptedToolIds: string[],
  requiredOperatorInputs: number,
  pendingOperatorInputsInBlankEnv: number,
  humanActionablePendingOperatorInputs: number,
  autoFillablePendingOperatorInputs: number,
): BetaReadinessBlockerCloseoutQueueBatch[] {
  return [
    {
      batchId: 'operator_value_collection',
      title: 'Collect exact operator values outside source control',
      order: 1,
      clearanceType: 'operator_input_collection',
      rowCount: pendingOperatorInputsInBlankEnv,
      canRunWithoutOperatorSecrets: false,
      canEnableBetaOrProduction: false,
      sourceEvidence: [
        `${EXTERNAL_BETA_OPERATOR_TEMPLATE_PATH} (${requiredOperatorInputs} required inputs, ${pendingOperatorInputsInBlankEnv} pending in blank env: ${humanActionablePendingOperatorInputs} human-actionable, ${autoFillablePendingOperatorInputs} auto-fillable constants/keys)`,
      ],
      nextCommands: [
        'npm run beta:readiness:external-beta-operator-input-template -- --status',
        'npm run beta:readiness:external-beta-operator-autofill-env',
        'npm run beta:readiness:external-beta-operator-human-input-checklist',
        'npm run beta:readiness:external-beta-operator-local-env-preflight',
        'npm run beta:readiness:external-beta-operator-input-template',
        'npm run beta:readiness:owner-approval-intake-status',
        'REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight',
        'npm run beta:readiness:deployed-evidence-input-manifest',
      ],
      blockedUntil: [
        `Operators review the value-free pending-input status, supply the ${humanActionablePendingOperatorInputs} human-actionable values (bearer token, workspace/project IDs, wallet settlement event ID, non-secret owner evidence notes, explicit approval confirmations, and technical verification confirmations) in the local ignored .env.reeditpro-beta-operator.local file, run chmod 600 on that file, validate that file with the operator local-env preflight, validate owner approvals from that same owner-only file, and export the auto-fillable constants/idempotency keys from an operator shell or secret manager session.`,
      ],
    },
    {
      batchId: 'trackb_deployed_tool_evidence_recording',
      title: 'Record the 16-tool Track B accepted evidence bundle against deployed staging',
      order: 2,
      clearanceType: 'deployed_tool_evidence',
      rowCount: acceptedToolIds.length,
      canRunWithoutOperatorSecrets: false,
      canEnableBetaOrProduction: false,
      sourceEvidence: [
        `${LOCAL_ACCEPTED_BUNDLE_PATH} (${acceptedToolIds.length} locally accepted tools, readyToRecordDeployedEvidence=true)`,
      ],
      nextCommands: [
        'npm run beta:tools:local-accepted-evidence-collector',
        'npm run beta:readiness:external-beta-evidence-collector',
        'npm run beta:readiness:operator-status-api',
      ],
      blockedUntil: [
        'The deployed collector records core tool evidence and libass evidence idempotently, then operator status readback confirms the accepted evidence from staging.',
      ],
    },
    {
      batchId: 'registry_bounded_runtime_evidence',
      title: 'Close bounded command/import/container proof gaps for the full production registry',
      order: 3,
      clearanceType: 'bounded_local_proof',
      rowCount: (byBlockerId.readiness_not_passed ?? 0) + (byBlockerId.real_execution_not_verified ?? 0),
      canRunWithoutOperatorSecrets: true,
      canEnableBetaOrProduction: false,
      sourceEvidence: [
        'Current blocker ledger readiness_not_passed and real_execution_not_verified rows.',
      ],
      nextCommands: [
        'npm run beta:tools:core-real-check-preview -- --env-template',
        'npm run beta:tools:core-real-check-preview',
        'npm run beta:tools:core-real-check-preview:hydrated',
        'npm run beta:tools:local-accepted-evidence-bundle',
      ],
      blockedUntil: [
        'Every registry tool has accepted bounded runtime evidence or an explicit source-truth exclusion; no user media or product runtime proof is implied.',
      ],
    },
    {
      batchId: 'product_ready_qa_acceptance',
      title: 'Run QA acceptance after real bounded evidence exists',
      order: 4,
      clearanceType: 'diagnostics_or_qa',
      rowCount: byBlockerId.product_ready_acceptance_missing ?? byClearanceType.diagnostics_or_qa ?? 0,
      canRunWithoutOperatorSecrets: true,
      canEnableBetaOrProduction: false,
      sourceEvidence: [
        'Current blocker ledger product_ready_acceptance_missing rows.',
      ],
      nextCommands: [
        'npm run smoke:tool-beta-execution-readiness',
        'npm run smoke:beta-readiness',
        'npm run smoke:beta-readiness-api',
      ],
      blockedUntil: [
        'QA accepts exact bounded evidence per tool and product-ready local OSS remains explicitly scoped, reviewed, and counted from evidence.',
      ],
    },
    {
      batchId: 'deployed_platform_evidence',
      title: 'Record deployed platform evidence for billing persistence and staging readiness',
      order: 5,
      clearanceType: 'deployed_platform_evidence',
      rowCount: byClearanceType.deployed_platform_evidence ?? 0,
      canRunWithoutOperatorSecrets: false,
      canEnableBetaOrProduction: false,
      sourceEvidence: [
        'Current platform blocker: production_billing_deployment_unverified.',
      ],
      nextCommands: [
        'npm run beta:platform:staging-evidence-preflight',
        'npm run beta:platform:staging-evidence-probe',
        'npm run beta:readiness:operator-status-api',
      ],
      blockedUntil: [
        'Migration deployment, service-role write path, RLS member readback, idempotent replay, wallet settlement, Stripe boundary, monitoring, billing QA, and owner approvals are recorded from deployed staging.',
      ],
    },
    {
      batchId: 'owner_launch_approvals',
      title: 'Collect model/license, deployment, security, storage, legal, monitoring, and support approvals',
      order: 6,
      clearanceType: 'owner_approval',
      rowCount: byClearanceType.owner_approval ?? 0,
      canRunWithoutOperatorSecrets: false,
      canEnableBetaOrProduction: false,
      sourceEvidence: [
        'Current checklist and go/no-go owner approval blockers.',
      ],
      nextCommands: [
        'npm run beta:readiness:owner-approval-env-template',
        'npm run beta:readiness:launch-approval-evidence-preflight',
        'npm run beta:readiness:launch-approval-evidence',
      ],
      blockedUntil: [
        'Named owners provide non-secret evidence notes and explicit approvals; model/checkpoint licensing remains approved only for the named external-beta scope.',
      ],
    },
    {
      batchId: 'post_external_beta_scope_escalation',
      title: 'Escalate separately to real-user-media beta and paid production after external beta passes',
      order: 7,
      clearanceType: 'scope_approval',
      rowCount: 2,
      canRunWithoutOperatorSecrets: false,
      canEnableBetaOrProduction: false,
      sourceEvidence: [
        'Current go/no-go policy keeps real-user-media beta and paid production separate from external beta.',
      ],
      nextCommands: [
        'REEDITPRO_BETA_SCOPE_APPROVAL_MODE=real_user_media_beta npm run beta:readiness:scope-approval-evidence-preflight',
        'REEDITPRO_BETA_SCOPE_APPROVAL_MODE=paid_production npm run beta:readiness:scope-approval-evidence-preflight',
        'npm run beta:readiness:paid-production-evidence-collector',
      ],
      blockedUntil: [
        'External beta has passed, then separate real-user-media and paid-production approval/evidence packets pass with final readback.',
      ],
    },
  ]
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function resolveCurrentCentralSha(): string {
  const envSha = cleanSha(process.env.REEDITPRO_BETA_BLOCKER_CLOSEOUT_CURRENT_SOURCE_SHA) ??
    cleanSha(process.env.REEDITPRO_BETA_CURRENT_SOURCE_SHA) ??
    cleanSha(process.env.GITHUB_SHA)
  if (envSha) return envSha

  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      },
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'unknown_current_source_sha'
  }
}

function cleanSha(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return /^[0-9a-f]{40}$/.test(trimmed) ? trimmed : undefined
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function arrayValue(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function isHumanActionableOperatorInput(input: any): boolean {
  const name = typeof input?.name === 'string' ? input.name : ''
  return (
    isOwnerApprovalConfirmationName(name) ||
    isTechnicalVerificationConfirmationName(name) ||
    isOperatorConfirmationName(name) ||
    input?.valuePolicy === 'operator_secret_or_sensitive' ||
    input?.valuePolicy === 'operator_non_secret_value' ||
    input?.valuePolicy === 'owner_evidence_note'
  )
}

function isOwnerApprovalConfirmationName(name: string): boolean {
  return name.includes('_APPROVE_') || name === 'REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL'
}

function isTechnicalVerificationConfirmationName(name: string): boolean {
  return name.endsWith('_VERIFIED')
}

function isOperatorConfirmationName(name: string): boolean {
  return (
    name.includes('_CONFIRM_') ||
    name.includes('_REQUIRE_') ||
    name.includes('_ACCEPT_') ||
    name.endsWith('_RECORD_EVIDENCE') ||
    name === 'REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES'
  )
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}
