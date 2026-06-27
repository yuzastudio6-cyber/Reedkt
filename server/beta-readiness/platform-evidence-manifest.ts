import { buildToolBetaExecutionReadinessReport } from './tool-beta-execution-readiness'

export type BetaPlatformEvidenceRequirementStatus =
  | 'local_source_proven'
  | 'local_runtime_proven'
  | 'deployed_evidence_required'
  | 'owner_approval_required'

export interface BetaPlatformEvidenceManifestRequirement {
  id: string
  label: string
  status: BetaPlatformEvidenceRequirementStatus
  localProofCommands: string[]
  sourceFiles: string[]
  localEvidence: string[]
  remainingEvidence: string[]
  nextSafeAction: string
  clearsPlatformGate: false
  requiresDeployedEvidence: boolean
  requiresOwnerApproval: boolean
}

export interface BetaPlatformEvidenceManifest {
  manifestId: string
  createdAt: string
  sourceTruth: {
    toolCount: number
    ownerCoverageToolCount: number
    readinessSpecToolCount: number
    productReadyLocalOssCount: number
    externalBetaToolExecutionAllowed: false
    productionToolExecutionAllowed: false
    productionBillingPersistence: string
  }
  requirements: BetaPlatformEvidenceManifestRequirement[]
  localProofCommands: string[]
  remainingRequiredEvidence: string[]
  policy: {
    blockersAreEvidenceGaps: true
    blockersOnlyProtectUnsafeActions: true
    intentionalBlanketBlocksAllowed: false
    safeForwardProgressRequired: true
    nextSafeActionRequiredForBlockers: true
    localProofDoesNotEnableExternalBeta: true
    deployedEvidenceCanClearPlatformBlocker: true
    supabaseClassification: 'no write / environment none / SQL none / migration no'
  }
  notes: string[]
}

export function buildBetaPlatformEvidenceManifest(): BetaPlatformEvidenceManifest {
  const report = buildToolBetaExecutionReadinessReport()
  const requirements = buildRequirements()
  const localProofCommands = uniqueSorted(requirements.flatMap((requirement) => requirement.localProofCommands))
  const remainingRequiredEvidence = requirements.flatMap((requirement) => requirement.remainingEvidence)

  return {
    manifestId: `beta-platform-evidence-manifest-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    sourceTruth: {
      toolCount: report.totalTools,
      ownerCoverageToolCount: report.ownerCoverageToolCount,
      readinessSpecToolCount: report.readinessSpecToolCount,
      productReadyLocalOssCount: report.productReadyLocalOssCount,
      externalBetaToolExecutionAllowed: false,
      productionToolExecutionAllowed: false,
      productionBillingPersistence: report.productionBillingPersistence,
    },
    requirements,
    localProofCommands,
    remainingRequiredEvidence,
    policy: {
      blockersAreEvidenceGaps: true,
      blockersOnlyProtectUnsafeActions: true,
      intentionalBlanketBlocksAllowed: false,
      safeForwardProgressRequired: true,
      nextSafeActionRequiredForBlockers: true,
      localProofDoesNotEnableExternalBeta: true,
      deployedEvidenceCanClearPlatformBlocker: true,
      supabaseClassification: 'no write / environment none / SQL none / migration no',
    },
    notes: [
      'This manifest converts the shared platform blocker into named evidence requirements and safe follow-up lanes.',
      'It does not run migrations, call Supabase, call Stripe, install packages, execute tools, process media, enable beta, or mark production ready.',
      'Local proof commands can reduce unknowns, but only deployed staging/production evidence plus named owner approvals can clear the platform blocker.',
    ],
  }
}

function buildRequirements(): BetaPlatformEvidenceManifestRequirement[] {
  return [
    {
      id: 'platform_deployed_evidence_verifier_ready',
      label: 'deployed platform evidence verifier is ready',
      status: 'local_runtime_proven',
      localProofCommands: [
        'smoke:beta-readiness-api',
        'smoke:beta-readiness-operator-status-api',
        'smoke:beta-platform-deployed-evidence-verifier',
        'smoke:beta-platform-deployed-evidence-probes',
        'smoke:beta-platform-supabase-deployed-evidence-transport',
        'smoke:beta-platform-staging-evidence-collector-cli',
        'smoke:beta-platform-staging-evidence-preflight',
      ],
      sourceFiles: [
        'server/routes/beta-readiness-routes.ts',
        'server/validation/beta-readiness-schemas.ts',
        'server/beta-readiness/platform-deployed-evidence-verifier.ts',
        'server/beta-readiness/platform-deployed-evidence-probes.ts',
        'server/beta-readiness/platform-supabase-deployed-evidence-transport.ts',
        'server/cli/beta-readiness-operator-status-api.ts',
        'server/cli/beta-platform-staging-evidence-probe.ts',
        'server/cli/beta-platform-staging-evidence-preflight.ts',
        'server/smoke/beta-readiness-api-smoke.ts',
        'server/smoke/beta-readiness-operator-status-api-smoke.ts',
        'server/smoke/beta-platform-deployed-evidence-verifier-smoke.ts',
        'server/smoke/beta-platform-deployed-evidence-probes-smoke.ts',
        'server/smoke/beta-platform-supabase-deployed-evidence-transport-smoke.ts',
        'server/smoke/beta-platform-staging-evidence-collector-cli-smoke.ts',
        'server/smoke/beta-platform-staging-evidence-preflight-smoke.ts',
      ],
      localEvidence: [
        'Verifier source can build a platform evidence packet only when all deployed probes and owner approvals pass.',
        'Smoke coverage proves complete evidence clears the shared platform blocker while partial evidence, missing owner approvals, and secret-like notes fail closed.',
        'Probe transport smoke proves deployed observations map into verifier probes and that failed service-role verification keeps the platform blocker closed.',
        'Supabase deployed transport smoke proves backend-owned table, controlled evidence write/replay, and wallet-settlement RPC probes with explicit persistent-write confirmation.',
        'Staging evidence collector CLI smoke proves deployed route request shape, secret-safe output, production confirmation guard, and require-ready failure behavior.',
        'Staging evidence preflight smoke proves the operator can validate required env vars, owner approvals, redacted attestations, wallet fixture, record confirmations, and secret-like evidence before touching staging.',
        'API smoke proves the authenticated/idempotent route can verify, reject unconfirmed recording, record a ready packet, and replay it without duplicate evidence.',
      ],
      remainingEvidence: [
        'Run the staging evidence preflight with real non-secret operator inputs before contacting the deployed backend.',
        'Run the Supabase deployed transport against real staging or production with backend service-role runtime.',
        'Provide approved staging RLS readback, monitoring, Stripe-boundary, and billing-QA attestations.',
        'Record the resulting evidence packet through the backend evidence route only after all deployed probes pass.',
      ],
      nextSafeAction: 'Run beta:platform:staging-evidence-preflight, then run the Supabase deployed probe transport against staging with backend service-role runtime, approved fixture event, RLS readback evidence, monitoring evidence, billing QA, and owner approvals.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: true,
      requiresOwnerApproval: false,
    },
    {
      id: 'tool_cost_events_migration_deployment',
      label: 'tool_cost_events migration is deployed and verified',
      status: 'deployed_evidence_required',
      localProofCommands: ['smoke:tool-cost-metering'],
      sourceFiles: [
        'supabase/migrations/202606270001_tool_cost_metering_events.sql',
        'server/tool-cost-metering/tool-cost-persistent-store.ts',
      ],
      localEvidence: [
        'Migration source exists for public.tool_cost_events with idempotency and workspace-member RLS policy markers.',
        'Persistent store source fails closed outside mock mode when backend persistence is not configured.',
      ],
      remainingEvidence: [
        'Apply the migration in staging or production.',
        'Record service-owner evidence that inserted rows persist durably in the deployed database.',
      ],
      nextSafeAction: 'Run staging migration deployment and readback evidence packet through backend/service-role paths.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: true,
      requiresOwnerApproval: false,
    },
    {
      id: 'beta_readiness_evidence_backend_only_deployment',
      label: 'beta readiness evidence packets are backend-only in deployment',
      status: 'deployed_evidence_required',
      localProofCommands: ['smoke:beta-platform-rls-readback:sql'],
      sourceFiles: [
        'supabase/migrations/202606270002_beta_readiness_evidence_packets.sql',
        'server/beta-readiness/beta-readiness-evidence-store.ts',
        'server/routes/beta-readiness-routes.ts',
      ],
      localEvidence: [
        'Local SQL smoke proves backend-only evidence packet read/write boundaries in disposable Postgres.',
        'Routes keep evidence writes authenticated and backend-owned.',
      ],
      remainingEvidence: [
        'Apply the evidence-packet migration in staging or production.',
        'Verify authenticated users cannot insert or read backend-only evidence packet rows directly.',
      ],
      nextSafeAction: 'Run deployed RLS readback with a workspace member and non-member account.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: true,
      requiresOwnerApproval: false,
    },
    {
      id: 'wallet_settlement_rpc_deployment',
      label: 'wallet settlement RPC is deployed and transactional',
      status: 'deployed_evidence_required',
      localProofCommands: [
        'smoke:tool-cost-wallet-settlement',
        'smoke:tool-cost-wallet-settlement:sql',
        'smoke:tool-cost-wallet-settlement:service-role',
      ],
      sourceFiles: [
        'supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql',
        'server/tool-cost-metering/tool-cost-wallet-settlement.ts',
        'server/smoke/tool-cost-wallet-settlement-rpc-sql-smoke.ts',
        'server/smoke/tool-cost-wallet-settlement-service-role-smoke.ts',
      ],
      localEvidence: [
        'Local SQL smoke proves billable spend, idempotent replay, non-billable provider failure, service-fee exclusion, Stripe isolation, and RLS metadata.',
        'Service-role smoke proves the non-mock RPC call shape with a controlled fake admin client.',
      ],
      remainingEvidence: [
        'Deploy the RPC and settlement table in staging or production.',
        'Verify service-role settlement against deployed Supabase without exposing service-role secrets.',
      ],
      nextSafeAction: 'Run staging wallet-settlement evidence with billable, replay, refund/release, and non-billable failure cases.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: true,
      requiresOwnerApproval: false,
    },
    {
      id: 'authenticated_rls_member_readback',
      label: 'authenticated RLS member readback is verified in deployment',
      status: 'deployed_evidence_required',
      localProofCommands: ['smoke:beta-platform-rls-readback:sql'],
      sourceFiles: [
        'server/smoke/beta-platform-rls-readback-sql-smoke.ts',
        'supabase/migrations/202606270001_tool_cost_metering_events.sql',
        'supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql',
      ],
      localEvidence: [
        'Disposable local Postgres proves workspace member reads are scoped and non-members read no rows.',
        'Authenticated inserts remain denied locally.',
      ],
      remainingEvidence: [
        'Repeat authenticated readback in staging or production with real auth claims.',
        'Record scoped member and non-member readback evidence.',
      ],
      nextSafeAction: 'Run deployed RLS evidence through backend-owned test accounts.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: true,
      requiresOwnerApproval: false,
    },
    {
      id: 'stripe_boundary_owner_approval',
      label: 'billing owner approves Stripe boundary separation',
      status: 'owner_approval_required',
      localProofCommands: ['smoke:beta-platform-stripe-boundary'],
      sourceFiles: [
        'server/smoke/beta-platform-stripe-boundary-smoke.ts',
        'server/tool-cost-metering/tool-cost-wallet-settlement.ts',
        'server/beta-readiness/platform-billing-qa.ts',
      ],
      localEvidence: [
        'Source smoke verifies no Stripe dependency, import, instantiation, API call, or Stripe URL in tool-cost billing surfaces.',
        'Tool event and wallet settlement metadata preserve stripeCallAttempted=false and serviceFeeIncluded=false.',
      ],
      remainingEvidence: [
        'Record named billing-owner approval that Stripe remains outside tool event recording and settlement.',
        'Confirm service fees remain excluded from tool-owner cost events.',
      ],
      nextSafeAction: 'Collect billing-owner approval and attach it to a backend evidence packet.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: false,
      requiresOwnerApproval: true,
    },
    {
      id: 'monitoring_dashboard_alert_deployment',
      label: 'billing/platform monitoring dashboards and alerts are deployed',
      status: 'deployed_evidence_required',
      localProofCommands: ['smoke:beta-platform-monitoring-catalog'],
      sourceFiles: [
        'server/smoke/beta-platform-monitoring-catalog-smoke.ts',
        'server/observability/production-metrics-catalog.ts',
      ],
      localEvidence: [
        'Source smoke verifies metric and alert templates for event writes, replay, write failures, settlement failures, RLS readback failures, billing QA gaps, and Stripe boundary violations.',
      ],
      remainingEvidence: [
        'Deploy monitoring dashboards and alerts in staging or production.',
        'Record owner evidence that alert routing and thresholds are active.',
      ],
      nextSafeAction: 'Run monitoring deployment/readback evidence and alert-route verification.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: true,
      requiresOwnerApproval: false,
    },
    {
      id: 'staging_billing_qa',
      label: 'staging billing QA is completed',
      status: 'deployed_evidence_required',
      localProofCommands: ['smoke:beta-platform-billing-qa'],
      sourceFiles: [
        'server/beta-readiness/platform-billing-qa.ts',
        'server/smoke/beta-platform-billing-qa-smoke.ts',
      ],
      localEvidence: [
        'Mock-safe billing QA proves event write/replay, summary readback, wallet-settlement skeleton behavior, Stripe separation, and missing evidence naming.',
      ],
      remainingEvidence: [
        'Run the same billing QA scenarios against staging backend and staging Supabase.',
        'Record evidence for idempotent replay, summary readback, settlement, and non-billable failure behavior.',
      ],
      nextSafeAction: 'Execute staging platform billing QA after deployed migrations, RLS, service-role, and monitoring are ready.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: true,
      requiresOwnerApproval: false,
    },
    {
      id: 'named_launch_owner_approvals',
      label: 'deployment, security, storage, model/license, legal, monitoring, and support owners approve the gate',
      status: 'owner_approval_required',
      localProofCommands: [
        'smoke:beta-readiness',
        'smoke:tool-beta-execution-readiness',
        'smoke:beta-readiness-launch-approval-evidence-cli',
        'smoke:beta-readiness-launch-approval-evidence-preflight',
        'smoke:beta-readiness-scope-approval-evidence-cli',
        'smoke:beta-readiness-scope-approval-evidence-preflight',
      ],
      sourceFiles: [
        'server/beta-readiness/beta-go-no-go-policy.ts',
        'server/beta-readiness/tool-beta-execution-readiness.ts',
        'server/cli/beta-readiness-launch-approval-evidence.ts',
        'server/cli/beta-readiness-launch-approval-evidence-preflight.ts',
        'server/cli/beta-readiness-scope-approval-evidence.ts',
        'server/cli/beta-readiness-scope-approval-evidence-preflight.ts',
        'server/smoke/beta-readiness-launch-approval-evidence-cli-smoke.ts',
        'server/smoke/beta-readiness-launch-approval-evidence-preflight-smoke.ts',
        'server/smoke/beta-readiness-scope-approval-evidence-cli-smoke.ts',
        'server/smoke/beta-readiness-scope-approval-evidence-preflight-smoke.ts',
        'docs/tool-beta-execution-readiness-gate.md',
      ],
      localEvidence: [
        'Default readiness reports keep external beta and production false until owner approvals are supplied as explicit evidence.',
        'Launch approval evidence smoke coverage proves the operator packet can clear model/license and deployment checklist blockers while recording named owner approvals.',
        'The launch approval evidence lane intentionally rejects real-user-media beta and paid-production approvals.',
        'Scope approval evidence smoke coverage proves real-user-media beta and paid-production approvals are separate ordered gates with prerequisite readback.',
      ],
      remainingEvidence: [
        'Record model/license approval evidence.',
        'Record named deployment approval.',
        'Record named security approval.',
        'Record named storage/privacy approval.',
        'Record named legal approval.',
        'Record named monitoring approval.',
        'Record named support approval.',
        'After external beta is ready, record named real-user-media beta approval.',
        'After real-user-media beta is ready, record named paid-production approval.',
      ],
      nextSafeAction: 'Run beta:readiness:launch-approval-evidence-preflight, then record the external-beta launch approval packet after every named owner approval/evidence note is present. Later run beta:readiness:scope-approval-evidence-preflight for real_user_media_beta and paid_production only after their prerequisite gates are ready.',
      clearsPlatformGate: false,
      requiresDeployedEvidence: false,
      requiresOwnerApproval: true,
    },
  ]
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}
