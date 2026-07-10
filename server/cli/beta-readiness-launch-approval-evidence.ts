import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface BetaReadinessLaunchApprovalEvidenceEnv {
  REEDITPRO_BETA_LAUNCH_API_BASE_URL?: string
  REEDITPRO_BETA_LAUNCH_BEARER_TOKEN?: string
  REEDITPRO_BETA_LAUNCH_WORKSPACE_ID?: string
  REEDITPRO_BETA_LAUNCH_PROJECT_ID?: string
  REEDITPRO_BETA_LAUNCH_SOURCE_ID?: string
  REEDITPRO_BETA_LAUNCH_SOURCE_SHA?: string
  REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT?: string
  REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE?: string
  REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE?: string
  REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE?: string
  REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE?: string
  REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE?: string
  REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE?: string
  REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_REAL_USER_MEDIA_BETA?: string
  REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION?: string
  REEDITPRO_BETA_LAUNCH_REQUIRE_EXTERNAL_BETA_READY?: string
}

export interface BetaReadinessLaunchApprovalEvidencePacket {
  workspaceId: string
  projectId?: string
  checklistEvidence: Array<{
    itemId: 'model_weights_not_approved' | 'gcp_deployment_not_done'
    sourceId: string
    sourceSha?: string
    status: 'passed'
    notes: string[]
  }>
  approvals: {
    deploymentApproved: true
    securityApproved: true
    storageApproved: true
    modelLicensesApproved: true
    legalApproved: true
    monitoringApproved: true
    supportApproved: true
  }
}

export interface BetaReadinessLaunchApprovalEvidenceRunResult {
  ok: boolean
  status: number
  endpoint: string
  replayed?: boolean
  evidencePacketId?: string
  evidencePacketCount?: number
  externalBetaAllowed?: boolean
  realUserMediaBetaAllowed?: boolean
  paidProductionAllowed?: boolean
  toolExecutionExternalBetaAllowed?: boolean
  productionToolExecutionAllowed?: boolean
  blockers?: number
  warnings: string[]
}

export type BetaReadinessLaunchApprovalEvidenceFetch = (
  url: string,
  init: {
    method: 'POST'
    headers: Record<string, string>
    body: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaReadinessLaunchApprovalEvidenceFromEnv(
  env: BetaReadinessLaunchApprovalEvidenceEnv,
  fetchImpl: BetaReadinessLaunchApprovalEvidenceFetch = fetch as BetaReadinessLaunchApprovalEvidenceFetch,
): Promise<BetaReadinessLaunchApprovalEvidenceRunResult> {
  const baseUrl = requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_API_BASE_URL').replace(/\/+$/, '')
  const bearerToken = requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_BEARER_TOKEN')
  const idempotencyKey = requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY')
  const request = buildBetaReadinessLaunchApprovalEvidencePacket(env)
  assertNoSecretLikeLaunchApprovalRequest(request)
  const endpoint = `${baseUrl}/v1/beta-readiness/evidence`

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(request),
  })
  const payload = await response.json()
  const result = summarizeLaunchApprovalEvidenceResponse(endpoint, response.status, payload)

  if (parseBoolean(env.REEDITPRO_BETA_LAUNCH_REQUIRE_EXTERNAL_BETA_READY) && result.externalBetaAllowed !== true) {
    throw new Error('Launch approval evidence was recorded/read back, but external beta is still not ready.')
  }

  return result
}

export function buildBetaReadinessLaunchApprovalEvidencePacket(
  env: BetaReadinessLaunchApprovalEvidenceEnv,
): BetaReadinessLaunchApprovalEvidencePacket {
  if (!parseBoolean(env.REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL)) {
    throw new Error('External beta launch approval evidence requires REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL=true.')
  }
  if (parseBoolean(env.REEDITPRO_BETA_LAUNCH_APPROVE_REAL_USER_MEDIA_BETA)) {
    throw new Error('Real-user-media beta approval is intentionally not supported by this external-beta launch approval evidence lane.')
  }
  if (parseBoolean(env.REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION)) {
    throw new Error('Paid production approval is intentionally not supported by this external-beta launch approval evidence lane.')
  }
  assertRequiredApprovals(env)

  const sourceId = clean(env.REEDITPRO_BETA_LAUNCH_SOURCE_ID) ?? 'beta-readiness-launch-approval-evidence-cli'
  const sourceSha = clean(env.REEDITPRO_BETA_LAUNCH_SOURCE_SHA)
  const ownerNotes = buildOwnerEvidenceNotes(env)

  return {
    workspaceId: requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_WORKSPACE_ID'),
    projectId: clean(env.REEDITPRO_BETA_LAUNCH_PROJECT_ID),
    checklistEvidence: [
      {
        itemId: 'model_weights_not_approved',
        sourceId: `${sourceId}:model-license-approval`,
        sourceSha,
        status: 'passed',
        notes: [
          requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE'),
          'Model/license approval is accepted only for the external-beta gate; this does not approve paid production.',
        ],
      },
      {
        itemId: 'gcp_deployment_not_done',
        sourceId: `${sourceId}:deployment-approval`,
        sourceSha,
        status: 'passed',
        notes: ownerNotes,
      },
    ],
    approvals: {
      deploymentApproved: true,
      securityApproved: true,
      storageApproved: true,
      modelLicensesApproved: true,
      legalApproved: true,
      monitoringApproved: true,
      supportApproved: true,
    },
  }
}

export function summarizeLaunchApprovalEvidenceResponse(
  endpoint: string,
  status: number,
  payload: unknown,
): BetaReadinessLaunchApprovalEvidenceRunResult {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const packet = isRecord(data.packet) ? data.packet : {}
  const report = isRecord(data.report) ? data.report : {}
  const goNoGo = isRecord(report.goNoGo) ? report.goNoGo : {}
  const toolExecutionReadiness = isRecord(report.toolExecutionReadiness) ? report.toolExecutionReadiness : {}
  return {
    ok: Boolean(isRecord(payload) && payload.ok === true),
    status,
    endpoint,
    replayed: booleanValue(data.replayed),
    evidencePacketId: stringValue(packet.id),
    evidencePacketCount: numberValue(data.evidencePacketCount),
    externalBetaAllowed: booleanValue(goNoGo.externalBetaAllowed),
    realUserMediaBetaAllowed: booleanValue(goNoGo.realUserMediaBetaAllowed),
    paidProductionAllowed: booleanValue(goNoGo.paidProductionAllowed),
    toolExecutionExternalBetaAllowed: booleanValue(toolExecutionReadiness.externalBetaToolExecutionAllowed),
    productionToolExecutionAllowed: booleanValue(toolExecutionReadiness.productionToolExecutionAllowed),
    blockers: Array.isArray(report.blockers) ? report.blockers.length : undefined,
    warnings: stringArray(isRecord(payload) ? payload.warnings : undefined),
  }
}

function assertRequiredApprovals(env: BetaReadinessLaunchApprovalEvidenceEnv): void {
  const missing = [
    ['deployment', env.REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT],
    ['security', env.REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY],
    ['storage/privacy', env.REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE],
    ['model/license', env.REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES],
    ['legal', env.REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL],
    ['monitoring', env.REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING],
    ['support', env.REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT],
  ].filter(([, value]) => !parseBoolean(value)).map(([label]) => label)
  if (missing.length > 0) {
    throw new Error(`Missing external-beta owner approvals: ${missing.join(', ')}.`)
  }
}

function buildOwnerEvidenceNotes(env: BetaReadinessLaunchApprovalEvidenceEnv): string[] {
  return [
    `Deployment owner approval: ${requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE')}`,
    `Security owner approval: ${requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE')}`,
    `Storage/privacy owner approval: ${requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE')}`,
    `Legal owner approval: ${requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE')}`,
    `Monitoring owner approval: ${requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE')}`,
    `Support owner approval: ${requiredEnv(env, 'REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE')}`,
    'These owner approvals are accepted only for external beta readiness; real-user-media beta and paid production remain separately blocked.',
  ]
}

function assertNoSecretLikeLaunchApprovalRequest(request: BetaReadinessLaunchApprovalEvidencePacket): void {
  const secretPaths = collectSecretLikePaths(request, 'betaReadinessLaunchApprovalEvidence')
  if (secretPaths.length > 0) {
    throw new Error(`Launch approval evidence contains secret-like fields: ${secretPaths.join(', ')}`)
  }
}

function requiredEnv(env: BetaReadinessLaunchApprovalEvidenceEnv, name: keyof BetaReadinessLaunchApprovalEvidenceEnv): string {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaReadinessLaunchApprovalEvidenceFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Beta readiness launch approval evidence CLI failed.')
    process.exitCode = 1
  }
}
