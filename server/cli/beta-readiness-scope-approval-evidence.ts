import {
  buildOperatorStatusEndpoint,
  summarizeOperatorStatusApiResponse,
} from './beta-readiness-operator-status-api'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export type BetaReadinessScopeApprovalMode = 'real_user_media_beta' | 'paid_production'

export interface BetaReadinessScopeApprovalEvidenceEnv {
  REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_BEARER_TOKEN?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_PROJECT_ID?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_ID?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_SHA?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_MODE?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE?: string
  REEDITPRO_BETA_SCOPE_APPROVAL_REQUIRE_TARGET_READY?: string
}

export interface BetaReadinessScopeApprovalEvidencePacket {
  workspaceId: string
  projectId?: string
  scopeApprovalEvidence: Array<{
    scope: BetaReadinessScopeApprovalMode
    sourceId: string
    sourceSha?: string
    status: 'passed'
    notes: string[]
  }>
  approvals: {
    realUserMediaBetaApproved?: true
    paidProductionApproved?: true
  }
}

export interface BetaReadinessScopeApprovalEvidenceRunResult {
  ok: boolean
  mode: BetaReadinessScopeApprovalMode
  status: number
  endpoint: string
  prerequisiteEndpoint: string
  replayed?: boolean
  evidencePacketId?: string
  evidencePacketCount?: number
  externalBetaAllowed?: boolean
  realUserMediaBetaAllowed?: boolean
  paidProductionAllowed?: boolean
  prerequisiteReady: boolean
  targetReady?: boolean
  warnings: string[]
}

export type BetaReadinessScopeApprovalEvidenceFetch = (
  url: string,
  init: {
    method: 'GET' | 'POST'
    headers: Record<string, string>
    body?: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaReadinessScopeApprovalEvidenceFromEnv(
  env: BetaReadinessScopeApprovalEvidenceEnv,
  fetchImpl: BetaReadinessScopeApprovalEvidenceFetch = fetch as BetaReadinessScopeApprovalEvidenceFetch,
): Promise<BetaReadinessScopeApprovalEvidenceRunResult> {
  const baseUrl = requiredEnv(env, 'REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL').replace(/\/+$/, '')
  const bearerToken = requiredEnv(env, 'REEDITPRO_BETA_SCOPE_APPROVAL_BEARER_TOKEN')
  const workspaceId = requiredEnv(env, 'REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID')
  const idempotencyKey = requiredEnv(env, 'REEDITPRO_BETA_SCOPE_APPROVAL_IDEMPOTENCY_KEY')
  const mode = parseMode(env.REEDITPRO_BETA_SCOPE_APPROVAL_MODE)
  const request = buildBetaReadinessScopeApprovalEvidencePacket(env)
  assertNoSecretLikeScopeApprovalRequest(request)

  const prerequisiteEndpoint = buildOperatorStatusEndpoint(baseUrl, workspaceId)
  const prerequisiteResponse = await fetchImpl(prerequisiteEndpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      accept: 'application/json',
    },
  })
  const prerequisitePayload = await prerequisiteResponse.json()
  const prerequisite = summarizeOperatorStatusApiResponse(prerequisiteEndpoint, prerequisiteResponse.status, prerequisitePayload)
  assertPrerequisiteReady(mode, prerequisite)

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
  const result = summarizeScopeApprovalEvidenceResponse(mode, prerequisiteEndpoint, endpoint, response.status, payload)

  if (parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_REQUIRE_TARGET_READY) && result.targetReady !== true) {
    throw new Error(`${mode} approval evidence was recorded/read back, but the target gate is still not ready.`)
  }

  return result
}

export function buildBetaReadinessScopeApprovalEvidencePacket(
  env: BetaReadinessScopeApprovalEvidenceEnv,
): BetaReadinessScopeApprovalEvidencePacket {
  const mode = parseMode(env.REEDITPRO_BETA_SCOPE_APPROVAL_MODE)
  const sourceId = clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_ID) ?? 'beta-readiness-scope-approval-evidence-cli'
  const sourceSha = clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_SHA)
  const workspaceId = requiredEnv(env, 'REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID')
  const projectId = clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_PROJECT_ID)

  if (mode === 'real_user_media_beta') {
    if (!parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA)) {
      throw new Error('Real-user-media beta approval requires REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA=true.')
    }
    if (parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION)) {
      throw new Error('Paid production approval is not part of the real-user-media beta scope approval lane.')
    }
    const evidence = requiredEnv(env, 'REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE')
    return {
      workspaceId,
      projectId,
      scopeApprovalEvidence: [{
        scope: 'real_user_media_beta',
        sourceId: `${sourceId}:real-user-media-beta-approval`,
        sourceSha,
        status: 'passed',
        notes: [
          evidence,
          'Real-user-media beta approval requires external beta to already be ready.',
          'This approval does not approve paid production, run tools, process media, or bypass user-media privacy policy.',
        ],
      }],
      approvals: {
        realUserMediaBetaApproved: true,
      },
    }
  }

  if (!parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION)) {
    throw new Error('Paid production approval requires REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION=true.')
  }
  if (parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA)) {
    throw new Error('Real-user-media beta approval must be recorded before the paid production scope approval lane.')
  }
  const evidence = requiredEnv(env, 'REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE')
  return {
    workspaceId,
    projectId,
    scopeApprovalEvidence: [{
      scope: 'paid_production',
      sourceId: `${sourceId}:paid-production-approval`,
      sourceSha,
      status: 'passed',
      notes: [
        evidence,
        'Paid production approval requires real-user-media beta to already be ready.',
        'This approval does not run tools, process media, charge users, deploy production, or bypass billing settlement policy by itself.',
      ],
    }],
    approvals: {
      paidProductionApproved: true,
    },
  }
}

export function summarizeScopeApprovalEvidenceResponse(
  mode: BetaReadinessScopeApprovalMode,
  prerequisiteEndpoint: string,
  endpoint: string,
  status: number,
  payload: unknown,
): BetaReadinessScopeApprovalEvidenceRunResult {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const packet = isRecord(data.packet) ? data.packet : {}
  const report = isRecord(data.report) ? data.report : {}
  const goNoGo = isRecord(report.goNoGo) ? report.goNoGo : {}
  const externalBetaAllowed = booleanValue(goNoGo.externalBetaAllowed)
  const realUserMediaBetaAllowed = booleanValue(goNoGo.realUserMediaBetaAllowed)
  const paidProductionAllowed = booleanValue(goNoGo.paidProductionAllowed)
  const targetReady = mode === 'real_user_media_beta' ? realUserMediaBetaAllowed : paidProductionAllowed

  return {
    ok: Boolean(isRecord(payload) && payload.ok === true),
    mode,
    status,
    endpoint,
    prerequisiteEndpoint,
    replayed: booleanValue(data.replayed),
    evidencePacketId: stringValue(packet.id),
    evidencePacketCount: numberValue(data.evidencePacketCount),
    externalBetaAllowed,
    realUserMediaBetaAllowed,
    paidProductionAllowed,
    prerequisiteReady: mode === 'real_user_media_beta' ? externalBetaAllowed === true : realUserMediaBetaAllowed === true,
    targetReady,
    warnings: [
      ...stringArray(isRecord(payload) ? payload.warnings : undefined),
      mode === 'real_user_media_beta'
        ? 'Real-user-media beta approval does not approve paid production.'
        : 'Paid production approval does not run tools, process media, charge users, or deploy production by itself.',
    ],
  }
}

function assertPrerequisiteReady(
  mode: BetaReadinessScopeApprovalMode,
  prerequisite: {
    ok: boolean
    readyForExternalBeta?: boolean
    readyForRealUserMediaBeta?: boolean
  },
): void {
  if (!prerequisite.ok) {
    throw new Error('Scope approval prerequisite status readback failed.')
  }
  if (mode === 'real_user_media_beta' && prerequisite.readyForExternalBeta !== true) {
    throw new Error('Real-user-media beta approval requires external beta to already be ready.')
  }
  if (mode === 'paid_production' && prerequisite.readyForRealUserMediaBeta !== true) {
    throw new Error('Paid production approval requires real-user-media beta to already be ready.')
  }
}

function assertNoSecretLikeScopeApprovalRequest(request: BetaReadinessScopeApprovalEvidencePacket): void {
  const secretPaths = collectSecretLikePaths(request, 'betaReadinessScopeApprovalEvidence')
  if (secretPaths.length > 0) {
    throw new Error(`Scope approval evidence contains secret-like fields: ${secretPaths.join(', ')}`)
  }
}

function parseMode(value: string | undefined): BetaReadinessScopeApprovalMode {
  if (value === 'real_user_media_beta' || value === 'paid_production') return value
  throw new Error('REEDITPRO_BETA_SCOPE_APPROVAL_MODE must be real_user_media_beta or paid_production.')
}

function requiredEnv(env: BetaReadinessScopeApprovalEvidenceEnv, name: keyof BetaReadinessScopeApprovalEvidenceEnv): string {
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
    const result = await runBetaReadinessScopeApprovalEvidenceFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Beta readiness scope approval evidence CLI failed.')
    process.exitCode = 1
  }
}
