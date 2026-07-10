export interface BetaPlatformStagingEvidenceProbeEnv {
  REEDITPRO_BETA_PLATFORM_API_BASE_URL?: string
  REEDITPRO_BETA_PLATFORM_BEARER_TOKEN?: string
  REEDITPRO_BETA_PLATFORM_WORKSPACE_ID?: string
  REEDITPRO_BETA_PLATFORM_PROJECT_ID?: string
  REEDITPRO_BETA_PLATFORM_SOURCE_ID?: string
  REEDITPRO_BETA_PLATFORM_SOURCE_SHA?: string
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT?: string
  REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES?: string
  REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID?: string
  REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE?: string
  REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE?: string
  REEDITPRO_BETA_PLATFORM_CONFIRM_PRODUCTION_PROBE?: string
  REEDITPRO_BETA_PLATFORM_REQUIRE_READY?: string
  REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY?: string
  REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT?: string
  REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY?: string
  REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE?: string
  REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL?: string
  REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING?: string
  REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT?: string
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED?: string
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE?: string
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED?: string
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE?: string
  REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED?: string
  REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE?: string
  REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED?: string
  REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE?: string
}

export interface BetaPlatformStagingEvidenceProbeRequest {
  workspaceId: string
  projectId?: string
  sourceId: string
  sourceSha?: string
  environment: 'staging' | 'production'
  ownerApprovals: {
    billingOwnerStripeBoundaryApproved: boolean
    deploymentApproved: boolean
    securityApproved: boolean
    storageApproved: boolean
    legalApproved: boolean
    monitoringApproved: boolean
    supportApproved: boolean
  }
  notes: string[]
  allowPersistentProbeWrites: boolean
  walletSettlementProbeToolCostEventId?: string
  attestedProbes: Array<{
    id:
      | 'authenticated_rls_member_readback_verified'
      | 'stripe_boundary_owner_verified'
      | 'monitoring_deployment_verified'
      | 'staging_billing_qa_verified'
    status: 'passed'
    evidence: string[]
    nextAction: string
  }>
  recordEvidence: boolean
  confirmRecordEvidence: boolean
}

export interface BetaPlatformStagingEvidenceProbeRunResult {
  ok: boolean
  status: number
  endpoint: string
  evidencePacketReady: boolean
  externalBetaAllowed: boolean
  productionAllowed: boolean
  missingEvidence: string[]
  ownerApprovalGaps: string[]
  checkStatuses: Record<string, string>
  warnings: string[]
}

export type StagingEvidenceFetch = (
  url: string,
  init: {
    method: 'POST'
    headers: Record<string, string>
    body: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaPlatformStagingEvidenceProbeFromEnv(
  env: BetaPlatformStagingEvidenceProbeEnv,
  fetchImpl: StagingEvidenceFetch = fetch as StagingEvidenceFetch,
): Promise<BetaPlatformStagingEvidenceProbeRunResult> {
  const baseUrl = requiredEnv(env, 'REEDITPRO_BETA_PLATFORM_API_BASE_URL').replace(/\/+$/, '')
  const bearerToken = requiredEnv(env, 'REEDITPRO_BETA_PLATFORM_BEARER_TOKEN')
  const idempotencyKey = requiredEnv(env, 'REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY')
  const request = buildBetaPlatformStagingEvidenceProbeRequest(env)
  const endpoint = `${baseUrl}/v1/beta-readiness/platform-deployed-evidence/probe`

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
  const result = summarizeProbeResponse(endpoint, response.status, payload)

  if (parseBoolean(env.REEDITPRO_BETA_PLATFORM_REQUIRE_READY) && !result.evidencePacketReady) {
    throw new Error(`Staging platform evidence packet is not ready: ${result.missingEvidence.join('; ') || 'unknown missing evidence'}`)
  }

  return result
}

export function buildBetaPlatformStagingEvidenceProbeRequest(
  env: BetaPlatformStagingEvidenceProbeEnv,
): BetaPlatformStagingEvidenceProbeRequest {
  const environment = clean(env.REEDITPRO_BETA_PLATFORM_ENVIRONMENT) ?? 'staging'
  if (environment !== 'staging' && environment !== 'production') {
    throw new Error('REEDITPRO_BETA_PLATFORM_ENVIRONMENT must be staging or production.')
  }
  if (environment === 'production' && !parseBoolean(env.REEDITPRO_BETA_PLATFORM_CONFIRM_PRODUCTION_PROBE)) {
    throw new Error('Production platform probe requires REEDITPRO_BETA_PLATFORM_CONFIRM_PRODUCTION_PROBE=true.')
  }

  return {
    workspaceId: requiredEnv(env, 'REEDITPRO_BETA_PLATFORM_WORKSPACE_ID'),
    projectId: clean(env.REEDITPRO_BETA_PLATFORM_PROJECT_ID),
    sourceId: clean(env.REEDITPRO_BETA_PLATFORM_SOURCE_ID) ?? 'beta-platform-staging-evidence-probe-cli',
    sourceSha: clean(env.REEDITPRO_BETA_PLATFORM_SOURCE_SHA),
    environment,
    ownerApprovals: {
      billingOwnerStripeBoundaryApproved: parseBoolean(env.REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY),
      deploymentApproved: parseBoolean(env.REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT),
      securityApproved: parseBoolean(env.REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY),
      storageApproved: parseBoolean(env.REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE),
      legalApproved: parseBoolean(env.REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL),
      monitoringApproved: parseBoolean(env.REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING),
      supportApproved: parseBoolean(env.REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT),
    },
    notes: [
      'Collected through beta platform staging evidence probe CLI.',
      'CLI output is sanitized and does not include bearer tokens or service-role secrets.',
    ],
    allowPersistentProbeWrites: parseBoolean(env.REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES),
    walletSettlementProbeToolCostEventId: clean(env.REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID),
    attestedProbes: buildAttestedProbes(env),
    recordEvidence: parseBoolean(env.REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE),
    confirmRecordEvidence: parseBoolean(env.REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE),
  }
}

export function summarizeProbeResponse(
  endpoint: string,
  status: number,
  payload: unknown,
): BetaPlatformStagingEvidenceProbeRunResult {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const report = isRecord(data.report) ? data.report : {}
  const checks = Array.isArray(report.checks) ? report.checks : []
  const checkStatuses: Record<string, string> = {}
  for (const check of checks) {
    if (isRecord(check) && typeof check.id === 'string' && typeof check.status === 'string') {
      checkStatuses[check.id] = check.status
    }
  }

  return {
    ok: Boolean(isRecord(payload) && payload.ok === true),
    status,
    endpoint,
    evidencePacketReady: report.evidencePacketReady === true,
    externalBetaAllowed: report.externalBetaAllowed === true,
    productionAllowed: report.productionAllowed === true,
    missingEvidence: stringArray(report.missingEvidence),
    ownerApprovalGaps: stringArray(report.ownerApprovalGaps),
    checkStatuses,
    warnings: stringArray(isRecord(payload) ? payload.warnings : undefined),
  }
}

function buildAttestedProbes(
  env: BetaPlatformStagingEvidenceProbeEnv,
): BetaPlatformStagingEvidenceProbeRequest['attestedProbes'] {
  return [
    attestedProbe(
      'authenticated_rls_member_readback_verified',
      env.REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED,
      env.REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE,
      'Run staging member/non-member RLS readback and provide evidence.',
    ),
    attestedProbe(
      'stripe_boundary_owner_verified',
      env.REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED,
      env.REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE,
      'Collect billing-owner Stripe-boundary evidence.',
    ),
    attestedProbe(
      'monitoring_deployment_verified',
      env.REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED,
      env.REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE,
      'Deploy and verify monitoring dashboards and alert routing.',
    ),
    attestedProbe(
      'staging_billing_qa_verified',
      env.REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED,
      env.REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE,
      'Run staging billing QA and provide evidence.',
    ),
  ].filter((probe): probe is BetaPlatformStagingEvidenceProbeRequest['attestedProbes'][number] => Boolean(probe))
}

function attestedProbe(
  id: BetaPlatformStagingEvidenceProbeRequest['attestedProbes'][number]['id'],
  verified: string | undefined,
  evidence: string | undefined,
  nextAction: string,
): BetaPlatformStagingEvidenceProbeRequest['attestedProbes'][number] | undefined {
  if (!parseBoolean(verified)) return undefined
  const evidenceText = clean(evidence)
  if (!evidenceText) {
    throw new Error(`${id} requires a non-secret evidence note.`)
  }
  return {
    id,
    status: 'passed',
    evidence: [evidenceText],
    nextAction,
  }
}

function requiredEnv(env: BetaPlatformStagingEvidenceProbeEnv, name: keyof BetaPlatformStagingEvidenceProbeEnv): string {
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaPlatformStagingEvidenceProbeFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Beta platform staging evidence probe failed.')
    process.exitCode = 1
  }
}
