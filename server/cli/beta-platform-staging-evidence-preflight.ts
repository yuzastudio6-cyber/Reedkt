import {
  buildBetaPlatformStagingEvidenceProbeRequest,
  type BetaPlatformStagingEvidenceProbeEnv,
  type BetaPlatformStagingEvidenceProbeRequest,
} from './beta-platform-staging-evidence-probe'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface BetaPlatformStagingEvidencePreflightReport {
  ok: boolean
  environment: 'staging' | 'production' | 'invalid'
  readyToRunCollector: boolean
  readyToRecordEvidencePacket: boolean
  plannedEndpoint?: string
  collectorCommand: 'npm run beta:platform:staging-evidence-probe'
  missingConfiguration: string[]
  missingOwnerApprovals: string[]
  missingAttestations: string[]
  secretLikeInputPaths: string[]
  requestShape: {
    workspaceIdPresent: boolean
    projectIdPresent: boolean
    sourceId: string
    sourceShaPresent: boolean
    allowPersistentProbeWrites: boolean
    walletSettlementFixturePresent: boolean
    recordEvidence: boolean
    confirmRecordEvidence: boolean
    requireReady: boolean
    attestedProbeCount: number
  }
  requiredEnvironmentVariables: Array<{
    name: keyof BetaPlatformStagingEvidenceProbeEnv
    secret: boolean
    requiredFor: 'collector_call' | 'complete_packet'
  }>
  warnings: string[]
}

const expectedAttestationIds: Array<BetaPlatformStagingEvidenceProbeRequest['attestedProbes'][number]['id']> = [
  'authenticated_rls_member_readback_verified',
  'stripe_boundary_owner_verified',
  'monitoring_deployment_verified',
  'staging_billing_qa_verified',
]

export function buildBetaPlatformStagingEvidencePreflight(
  env: BetaPlatformStagingEvidenceProbeEnv,
): BetaPlatformStagingEvidencePreflightReport {
  const missingConfiguration = missingCollectorConfiguration(env)
  let request: BetaPlatformStagingEvidenceProbeRequest | undefined
  let requestError: string | undefined

  try {
    if (missingConfiguration.length === 0) {
      request = buildBetaPlatformStagingEvidenceProbeRequest(env)
    }
  } catch (error) {
    requestError = error instanceof Error ? error.message : 'Unable to build staging evidence probe request.'
  }

  const environment = normalizeEnvironment(env.REEDITPRO_BETA_PLATFORM_ENVIRONMENT)
  const ownerApprovalGaps = request ? missingOwnerApprovals(request) : []
  const missingAttestations = request ? missingRequiredAttestations(request) : [...expectedAttestationIds]
  const secretLikeInputPaths = request ? collectSecretLikePaths(request, 'betaPlatformStagingEvidenceProbeRequest') : []
  const sourceShaPresent = Boolean(request?.sourceSha)
  const allowPersistentProbeWrites = request?.allowPersistentProbeWrites === true
  const walletSettlementFixturePresent = Boolean(request?.walletSettlementProbeToolCostEventId)
  const recordEvidence = request?.recordEvidence === true
  const confirmRecordEvidence = request?.confirmRecordEvidence === true
  const requireReady = isTrue(env.REEDITPRO_BETA_PLATFORM_REQUIRE_READY)
  const completePacketConfigurationGaps = [
    ...(requestError ? [requestError] : []),
    ...(environment !== 'staging' ? ['REEDITPRO_BETA_PLATFORM_ENVIRONMENT must be staging for this beta evidence preflight.'] : []),
    ...(sourceShaPresent ? [] : ['REEDITPRO_BETA_PLATFORM_SOURCE_SHA is required for source-traceable deployed evidence.']),
    ...(allowPersistentProbeWrites ? [] : ['REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES=true is required for service-role write/replay/wallet probes.']),
    ...(walletSettlementFixturePresent ? [] : ['REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID is required for the wallet-settlement staging fixture probe.']),
    ...(recordEvidence ? [] : ['REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE=true is required to persist the complete evidence packet.']),
    ...(confirmRecordEvidence ? [] : ['REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE=true is required to persist the complete evidence packet.']),
    ...(requireReady ? [] : ['REEDITPRO_BETA_PLATFORM_REQUIRE_READY=true is required so the collector fails closed on incomplete evidence.']),
  ]
  const readyToRunCollector = missingConfiguration.length === 0 && !requestError && secretLikeInputPaths.length === 0
  const readyToRecordEvidencePacket = readyToRunCollector &&
    completePacketConfigurationGaps.length === 0 &&
    ownerApprovalGaps.length === 0 &&
    missingAttestations.length === 0

  return {
    ok: readyToRunCollector,
    environment,
    readyToRunCollector,
    readyToRecordEvidencePacket,
    plannedEndpoint: plannedEndpoint(env),
    collectorCommand: 'npm run beta:platform:staging-evidence-probe',
    missingConfiguration: unique([
      ...missingConfiguration,
      ...completePacketConfigurationGaps,
    ]),
    missingOwnerApprovals: ownerApprovalGaps,
    missingAttestations,
    secretLikeInputPaths,
    requestShape: {
      workspaceIdPresent: Boolean(request?.workspaceId),
      projectIdPresent: Boolean(request?.projectId),
      sourceId: request?.sourceId ?? 'unavailable',
      sourceShaPresent,
      allowPersistentProbeWrites,
      walletSettlementFixturePresent,
      recordEvidence,
      confirmRecordEvidence,
      requireReady,
      attestedProbeCount: request?.attestedProbes.length ?? 0,
    },
    requiredEnvironmentVariables: requiredEnvironmentVariables(),
    warnings: [
      'This preflight does not call the deployed backend, run Supabase probes, execute tools, process media, enable beta, or enable production.',
      'Bearer tokens and service-role secrets are checked only for presence and are never printed.',
      'readyToRecordEvidencePacket=true means the operator input is complete enough to run the collector; the deployed backend still decides whether evidence is valid.',
    ],
  }
}

function missingCollectorConfiguration(env: BetaPlatformStagingEvidenceProbeEnv): string[] {
  return [
    missingEnv(env, 'REEDITPRO_BETA_PLATFORM_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_BETA_PLATFORM_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_BETA_PLATFORM_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY'),
  ].filter((item): item is string => Boolean(item))
}

function missingEnv(env: BetaPlatformStagingEvidenceProbeEnv, name: keyof BetaPlatformStagingEvidenceProbeEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function missingOwnerApprovals(request: BetaPlatformStagingEvidenceProbeRequest): string[] {
  const approvals = request.ownerApprovals
  return [
    ...(approvals.billingOwnerStripeBoundaryApproved ? [] : ['billing owner Stripe-boundary approval']),
    ...(approvals.deploymentApproved ? [] : ['deployment owner approval']),
    ...(approvals.securityApproved ? [] : ['security owner approval']),
    ...(approvals.storageApproved ? [] : ['storage/privacy owner approval']),
    ...(approvals.legalApproved ? [] : ['legal owner approval']),
    ...(approvals.monitoringApproved ? [] : ['monitoring owner approval']),
    ...(approvals.supportApproved ? [] : ['support owner approval']),
  ]
}

function missingRequiredAttestations(request: BetaPlatformStagingEvidenceProbeRequest): string[] {
  const suppliedIds = new Set(request.attestedProbes.map((probe) => probe.id))
  return expectedAttestationIds.filter((id) => !suppliedIds.has(id))
}

function plannedEndpoint(env: BetaPlatformStagingEvidenceProbeEnv): string | undefined {
  const baseUrl = clean(env.REEDITPRO_BETA_PLATFORM_API_BASE_URL)
  if (!baseUrl) return undefined
  return `${baseUrl.replace(/\/+$/, '')}/v1/beta-readiness/platform-deployed-evidence/probe`
}

function requiredEnvironmentVariables(): BetaPlatformStagingEvidencePreflightReport['requiredEnvironmentVariables'] {
  return [
    { name: 'REEDITPRO_BETA_PLATFORM_API_BASE_URL', secret: false, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_PLATFORM_BEARER_TOKEN', secret: true, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_PLATFORM_WORKSPACE_ID', secret: false, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY', secret: false, requiredFor: 'collector_call' },
    { name: 'REEDITPRO_BETA_PLATFORM_SOURCE_SHA', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_REQUIRE_READY', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED', secret: false, requiredFor: 'complete_packet' },
    { name: 'REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE', secret: false, requiredFor: 'complete_packet' },
  ]
}

function normalizeEnvironment(value: string | undefined): BetaPlatformStagingEvidencePreflightReport['environment'] {
  const environment = clean(value) ?? 'staging'
  if (environment === 'staging' || environment === 'production') return environment
  return 'invalid'
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
  const report = buildBetaPlatformStagingEvidencePreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyToRunCollector || !report.readyToRecordEvidencePacket) {
    process.exitCode = 1
  }
}
