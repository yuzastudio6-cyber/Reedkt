import { createHash } from 'node:crypto'

import {
  PRODUCTION_TOOL_IDS,
  PRODUCTION_TOOL_QA_POLICIES,
  evaluateToolLicensePolicy,
  evaluateToolModelWeightPolicy,
  getProfessionalToolAdapterBinaryRunnerCommand,
  getProfessionalToolAdapterNodeRunnerPackage,
  getProfessionalToolAdapterPythonRunnerImport,
  getRuntimePolicyForTool,
  getToolQAPolicy,
  listProfessionalToolAdapterContracts,
  productionToolProfiles,
  type ProductionToolId,
  type ProductionToolProfile,
} from '../tool-registry'
import { getProductionToolMeteringProfile } from '../tool-cost-metering/production-tool-cost'
import {
  productionToolReadinessSpecs,
  type ProductionToolReadinessSpec,
} from '../workers/production-readiness'
import { collectSafeLocalToolPresenceProbes } from './safe-local-tool-presence-probe'
import type {
  ProductionToolRuntimeEvidenceRecord,
  ToolInstallationEvidence,
  ToolRuntimeEvidenceAuthorityReport,
  ToolRuntimeEvidenceCoverage,
  ToolRuntimeEvidenceProbeMode,
  ToolRuntimeEvidenceProbeResult,
  ToolRuntimeEvidenceSummary,
} from './tool-runtime-evidence-types'

const CONDITIONAL_EXTERNAL_NETWORK_TOOL_IDS = new Set<ProductionToolId>([
  'hyperframe',
  'playwright',
  'maplibre',
  'deck_gl',
  'cesium_js',
  'revideo',
])

const SOURCE_DOCUMENTS = [
  'open-source-tool-registry.md',
  'tool-settings-catalog.md',
  'launch-tool-stack-update.md',
  'remotion-capability-matrix.md',
  'render-strategy-planner.md',
  'tool-strategy-planner.md',
  'editing-agent-execution-architecture.md',
  'edit-qa-architecture.md',
  'docs/supabase-security-audit-2026-07-10.md',
  'docs/runtime-api-security-hardening-2026-07-10.md',
  'docs/repository-security-exposure-audit-2026-07-10.md',
  'docs/gcs-upload-integrity-hardening-2026-07-10.md',
  'docs/generic-idempotency-hardening-2026-07-10.md',
  'docs/private-local-persistence-hardening-2026-07-10.md',
]

type AuthorityBody = Omit<ToolRuntimeEvidenceAuthorityReport, 'authorityHash'>

export interface VerifyToolRuntimeEvidenceAuthorityResult {
  valid: boolean
  issues: string[]
}

function unique<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(',')}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`
  }

  throw new Error(`Tool runtime evidence contains unsupported value type: ${typeof value}`)
}

function authorityHash(body: AuthorityBody): string {
  return createHash('sha256').update(canonicalJson(body)).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value as Record<string, unknown>).forEach((entry) => deepFreeze(entry))
  }
  return value
}

function selectionPolicy(profile: ProductionToolProfile): ProductionToolRuntimeEvidenceRecord['selectionPolicy'] {
  if (profile.productionStatus === 'blocked') return 'blocked'
  if (profile.executionMode === 'evaluation_only' || profile.productionStatus === 'needs_license_review') {
    return 'evaluation_or_review_only'
  }
  if (profile.productionStatus === 'future') return 'future'
  if (profile.launchCore && profile.productionStatus === 'launch_core') return 'launch_candidate'
  return 'planned'
}

function installationEvidence(input: {
  probeMode: ToolRuntimeEvidenceProbeMode
  probes: ToolRuntimeEvidenceProbeResult[]
}): ToolInstallationEvidence {
  const presentProbeCount = input.probes.filter((probe) => probe.status === 'present').length
  const absentProbeCount = input.probes.filter((probe) => probe.status === 'absent').length
  const failedProbeCount = input.probes.filter((probe) => probe.status === 'check_failed').length
  let status: ToolInstallationEvidence['status']

  if (input.probeMode === 'disabled') status = 'probe_disabled'
  else if (input.probes.length === 0) status = 'not_checkable_from_current_runtime'
  else if (failedProbeCount > 0 && presentProbeCount === 0) status = 'probe_inconclusive'
  else if (presentProbeCount === input.probes.length) status = 'local_presence_verified'
  else if (presentProbeCount > 0) status = 'local_presence_partial'
  else status = 'local_presence_missing'

  return {
    status,
    currentDeveloperRuntimeOnly: true,
    productionWorkerImageVerified: false,
    deployedRuntimeVerified: false,
    declaredProbeCount: input.probes.length,
    presentProbeCount,
    absentProbeCount,
    failedProbeCount,
    probes: input.probes,
    summary: status === 'local_presence_verified'
      ? 'All declared presence probes passed in this developer backend process; that does not prove a production worker image or authorize execution.'
      : status === 'local_presence_partial'
        ? 'Only part of the declared package/runtime surface is present in this developer backend process.'
        : status === 'local_presence_missing'
          ? 'The declared package/runtime surface is not present in this developer backend process.'
          : status === 'probe_inconclusive'
            ? 'The server-owned presence probe was inconclusive and no installation claim is allowed.'
            : status === 'probe_disabled'
              ? 'Presence probing was disabled; no installation claim is allowed.'
              : 'This registry profile has no safe local presence probe definition; no installation claim is allowed.',
  }
}

function hasRegisteredPresenceProbe(toolId: ProductionToolId): boolean {
  return Boolean(
    getProfessionalToolAdapterNodeRunnerPackage(toolId) ||
    getProfessionalToolAdapterPythonRunnerImport(toolId) ||
    getProfessionalToolAdapterBinaryRunnerCommand(toolId),
  )
}

function buildRecord(input: {
  profile: ProductionToolProfile
  spec: ProductionToolReadinessSpec
  checkedAt: string
  probeMode: ToolRuntimeEvidenceProbeMode
}): ProductionToolRuntimeEvidenceRecord {
  const { profile, spec } = input
  const probes = collectSafeLocalToolPresenceProbes({
    toolId: profile.toolId,
    spec,
    probeMode: input.probeMode,
    checkedAt: input.checkedAt,
  })
  const installation = installationEvidence({ probeMode: input.probeMode, probes })
  const contracts = listProfessionalToolAdapterContracts().filter((contract) => contract.canonicalToolId === profile.toolId)
  const registeredPresenceProbeMapped = hasRegisteredPresenceProbe(profile.toolId)
  const licensePolicy = evaluateToolLicensePolicy(profile)
  const modelWeightPolicy = evaluateToolModelWeightPolicy(profile)
  const licenseWarnings = unique([...licensePolicy.warnings, ...modelWeightPolicy.warnings])
  const licenseBlockers = unique([...licensePolicy.blockingReasons, ...modelWeightPolicy.blockingReasons])
  const licenseStatus = !licensePolicy.allowed || !modelWeightPolicy.allowed
    ? 'blocked'
    : licenseWarnings.length > 0 || profile.commercialUseStatus !== 'allowed'
      ? 'review_required'
      : 'policy_allows_without_owner_approval'
  const runtimePolicy = getRuntimePolicyForTool(profile)
  const qaPolicy = getToolQAPolicy(profile.toolId)
  const meteringProfile = getProductionToolMeteringProfile(profile.toolId)
  const conditionalExternalAccess = CONDITIONAL_EXTERNAL_NETWORK_TOOL_IDS.has(profile.toolId)
  const evaluationBlocked = selectionPolicy(profile) === 'evaluation_or_review_only' || selectionPolicy(profile) === 'blocked'

  const blockers = unique([
    ...(installation.status === 'local_presence_verified'
      ? ['Developer-process package presence is not production worker image evidence.']
      : [`Installation evidence is ${installation.status}.`]),
    'Production build and deployed configuration evidence is not verified.',
    ...(licenseBlockers.length > 0 ? licenseBlockers : []),
    'Explicit owner license approval evidence is not recorded by this authority.',
    ...(profile.modelWeightsRequired ? ['Exact model/checkpoint manifest approval is not recorded.'] : []),
    'Backend service identity and private storage identity are not verified for tool execution.',
    'Deny-by-default worker egress and destination policy are not verified.',
    ...(contracts.length === 0
      ? ['No professional adapter contract covers this production registry tool.']
      : ['Professional adapter coverage proves only a package/import presence boundary, not a product operation.']),
    'Approved-snapshot-bound canonical tool operation execution is not verified.',
    'Opaque worker lease, private artifact output, retry, and fallback execution are not verified.',
    'QA policy exists, but runtime QA artifacts and final-export QA are not verified.',
    'Tool cost estimate metadata exists, but reservation, actual-cost, settlement, release, and refund evidence are not verified.',
    'Live production deployment, observability, and runbook evidence are not verified.',
    ...(evaluationBlocked ? [`Registry selection policy is ${selectionPolicy(profile)}.`] : []),
  ])

  return {
    schemaVersion: 'production-tool-runtime-evidence-record-v1',
    toolId: profile.toolId,
    displayName: profile.displayName,
    registryStatus: profile.productionStatus,
    launchCore: profile.launchCore,
    selectionPolicy: selectionPolicy(profile),
    installation,
    configuration: {
      status: evaluationBlocked ? 'intentionally_blocked' : 'not_verified',
      expectedWorkerTypes: [...spec.expectedWorkerTypes],
      declaredImageRoles: [...spec.imageRoles],
      containerDeclarationMetadataPresent: spec.checkMode.includes('dockerfile_declared'),
      productionBuildConfigurationVerified: false,
      deployedConfigurationVerified: false,
      modelWeightsRequired: profile.modelWeightsRequired,
      exactModelWeightManifestApproved: false,
      configurationNotes: [
        ...profile.productionReadinessNotes,
        'Registry/readiness declarations are metadata, not proof of a built or deployed worker image.',
      ],
      summary: evaluationBlocked
        ? 'This tool is intentionally blocked by launch/evaluation policy and has no approved production configuration.'
        : 'Expected worker/image configuration is declared, but neither the production build nor deployed configuration is verified.',
    },
    license: {
      status: licenseStatus,
      declaredLicense: profile.license,
      licenseFamily: profile.licenseFamily,
      commercialUseStatus: profile.commercialUseStatus,
      licenseRisk: profile.licenseRisk,
      distributionRisk: profile.distributionRisk,
      registryPolicyAllows: licensePolicy.allowed,
      modelWeightPolicyAllows: modelWeightPolicy.allowed,
      explicitOwnerApprovalRecorded: false,
      blockers: licenseBlockers,
      warnings: licenseWarnings,
      summary: licenseStatus === 'blocked'
        ? 'Registry license or model-weight policy blocks production use.'
        : licenseStatus === 'review_required'
          ? 'Registry policy is not a completed owner/legal/build review; production remains blocked.'
          : 'Registry policy has no current blocker, but explicit owner approval evidence is not recorded.',
    },
    credential: {
      status: 'execution_identity_not_verified',
      toolSpecificCredentialRequirement: conditionalExternalAccess ? 'execution_context_dependent' : 'none_declared',
      backendServiceIdentityVerified: false,
      privateStorageIdentityVerified: false,
      secretManagerBindingVerified: false,
      secretsInspected: false,
      credentialValuesRecorded: false,
      summary: 'Presence probes read no credentials. Production worker/service identity and private storage authorization remain unverified.',
    },
    network: {
      status: 'execution_egress_policy_not_verified',
      executionNetworkRequirement: conditionalExternalAccess ? 'conditional_external_access' : 'offline_capable',
      denyByDefaultRequired: true,
      sandboxEgressPolicyVerified: false,
      approvedDestinationAllowlistVerified: false,
      networkAccessedDuringEvidenceCollection: false,
      summary: conditionalExternalAccess
        ? 'The tool may need approved external resources, but no network call ran and no egress allowlist is verified.'
        : 'The tool can be planned for offline work, but the production worker deny-by-default egress policy is not verified.',
    },
    adapterContract: {
      status: contracts.length > 0
        ? 'professional_adapter_contract_present'
        : 'professional_adapter_contract_missing',
      requestedToolNames: contracts.map((contract) => contract.requestedToolName),
      contractCount: contracts.length,
      registeredPresenceProbeMapped,
      contractProductReadyClaim: contracts.some((contract) => contract.productReady),
      contractRequiresApprovedSnapshot: contracts.length > 0 && contracts.every((contract) => contract.requiresApprovedSnapshot),
      frontendExecutionAllowed: false,
      summary: contracts.length > 0
        ? 'A backend adapter contract and presence-probe mapping exist; all current contracts remain productReady=false.'
        : 'This registry tool has no professional adapter contract in the current 50-contract adapter layer.',
    },
    execution: {
      status: registeredPresenceProbeMapped
        ? 'package_presence_probe_only'
        : 'canonical_product_runner_not_verified',
      workerType: profile.workerType,
      executionMode: profile.executionMode,
      approvedSnapshotRequired: runtimePolicy.approvedSnapshotRequired,
      creditReservationRequired: runtimePolicy.creditReservationRequired || profile.workerType === 'render_worker',
      idempotencyRequired: true,
      registeredPresenceProbeMapped,
      approvedSnapshotExecutionBindingVerified: false,
      opaqueWorkerLeaseVerified: false,
      privateArtifactExecutionVerified: false,
      actualToolOperationVerified: false,
      retryFallbackExecutionVerified: false,
      providerCallMade: false,
      mediaProcessed: false,
      renderExecuted: false,
      summary: registeredPresenceProbeMapped
        ? 'A registered runner can verify package/binary presence only; no approved edit operation has been executed or verified.'
        : 'This evidence scope has no canonical product-operation runner proof for the tool.',
    },
    qa: {
      status: 'qa_policy_defined_only',
      gateTypes: [...qaPolicy.gateTypes],
      requiredBeforePreview: [...qaPolicy.requiredBeforePreview],
      requiredBeforeFinalExport: [...qaPolicy.requiredBeforeFinalExport],
      policyDefined: true,
      runtimeQaExecuted: false,
      qaArtifactLineageVerified: false,
      fallbackQaVerified: false,
      finalExportQaVerified: false,
      summary: 'Server QA policy metadata is defined; no runtime QA artifact, fallback QA, or final-export QA was executed.',
    },
    cost: {
      status: meteringProfile ? 'estimate_profile_only' : 'cost_profile_missing',
      meteringProfileDefined: Boolean(meteringProfile),
      catalogExternalBetaEligibilityFlag: Boolean(meteringProfile?.canRunInExternalBeta),
      authorityExternalBetaReady: false,
      serviceFeeIncludedInToolCost: false,
      approvedEstimateBindingVerified: false,
      activeReservationBindingVerified: false,
      actualCostEventVerified: false,
      settlementLedgerVerified: false,
      refundReleasePathVerified: false,
      summary: meteringProfile
        ? 'Estimate/rate-card metadata exists; it does not prove reservation, spend, actual-cost settlement, release, or refund execution.'
        : 'No server-owned metering profile exists for this registry tool.',
    },
    productionReadiness: {
      status: 'blocked',
      productionReady: false,
      externalBetaReady: false,
      localPresenceDoesNotAuthorizeExecution: true,
      blockers,
      nextEvidenceRequired: [
        'Reviewed production image installation and exact build/configuration evidence.',
        'Explicit license, dependency, codec/plugin, and model-weight approval where applicable.',
        'Verified service identity, private artifact authorization, sandbox, and deny-by-default egress.',
        'Canonical approved-snapshot job loader plus tenant-bound opaque worker lease and idempotency evidence.',
        'Tool-specific operation runner with private output lineage and measured retry/fallback behavior.',
        'Runtime QA artifacts linked to expected outputs and final-export gates.',
        'Approved estimate/reservation plus actual-cost settlement, release, and refund evidence.',
        'Deployed security, observability, load, failure-recovery, and runbook evidence.',
      ],
      summary: 'Production and external-beta execution are fail-closed; local presence or catalog metadata cannot unlock this tool.',
    },
  }
}

function coverageFor(records: ProductionToolRuntimeEvidenceRecord[]): ToolRuntimeEvidenceCoverage {
  const profileIds = new Set(productionToolProfiles.map((profile) => profile.toolId))
  const specIds = new Set(productionToolReadinessSpecs.map((spec) => spec.toolId))
  const qaPolicyIds = new Set(PRODUCTION_TOOL_IDS.filter((toolId) => Object.hasOwn(PRODUCTION_TOOL_QA_POLICIES, toolId)))
  const meteringProfileIds = new Set(PRODUCTION_TOOL_IDS.filter((toolId) => Boolean(getProductionToolMeteringProfile(toolId))))
  const contracts = listProfessionalToolAdapterContracts()
  const contractIds = new Set(contracts.map((contract) => contract.canonicalToolId))
  const registeredProbeIds = new Set(PRODUCTION_TOOL_IDS.filter((toolId) => hasRegisteredPresenceProbe(toolId)))

  return {
    registryToolIds: PRODUCTION_TOOL_IDS.length,
    registryProfiles: productionToolProfiles.length,
    readinessSpecs: productionToolReadinessSpecs.length,
    qaPolicies: qaPolicyIds.size,
    meteringProfiles: meteringProfileIds.size,
    professionalAdapterContracts: contracts.length,
    professionalAdapterToolIds: contractIds.size,
    registeredPresenceProbeMappings: registeredProbeIds.size,
    records: records.length,
    missingProfileToolIds: PRODUCTION_TOOL_IDS.filter((toolId) => !profileIds.has(toolId)),
    missingReadinessSpecToolIds: PRODUCTION_TOOL_IDS.filter((toolId) => !specIds.has(toolId)),
    missingQaPolicyToolIds: PRODUCTION_TOOL_IDS.filter((toolId) => !qaPolicyIds.has(toolId)),
    missingMeteringProfileToolIds: PRODUCTION_TOOL_IDS.filter((toolId) => !meteringProfileIds.has(toolId)),
    missingProfessionalAdapterContractToolIds: PRODUCTION_TOOL_IDS.filter((toolId) => !contractIds.has(toolId)),
    missingRegisteredPresenceProbeToolIds: PRODUCTION_TOOL_IDS.filter((toolId) => !registeredProbeIds.has(toolId)),
  }
}

function summaryFor(records: ProductionToolRuntimeEvidenceRecord[]): ToolRuntimeEvidenceSummary {
  return {
    localPresenceVerifiedTools: records.filter((record) => record.installation.status === 'local_presence_verified').map((record) => record.toolId),
    localPresencePartialTools: records.filter((record) => record.installation.status === 'local_presence_partial').map((record) => record.toolId),
    localPresenceMissingTools: records.filter((record) => record.installation.status === 'local_presence_missing').map((record) => record.toolId),
    localPresenceNotCheckableTools: records.filter((record) => (
      record.installation.status === 'not_checkable_from_current_runtime' ||
      record.installation.status === 'probe_disabled' ||
      record.installation.status === 'probe_inconclusive'
    )).map((record) => record.toolId),
    licensePolicyBlockedTools: records.filter((record) => record.license.status === 'blocked').map((record) => record.toolId),
    licenseReviewRequiredTools: records.filter((record) => record.license.status === 'review_required').map((record) => record.toolId),
    modelWeightApprovalRequiredTools: records.filter((record) => record.configuration.modelWeightsRequired).map((record) => record.toolId),
    catalogExternalBetaFlaggedTools: records.filter((record) => record.cost.catalogExternalBetaEligibilityFlag).map((record) => record.toolId),
    authorityExternalBetaReadyTools: [],
    productionReadyTools: [],
    blockedTools: records.map((record) => record.toolId),
  }
}

export function createToolRuntimeEvidenceAuthority(input: {
  probeMode?: ToolRuntimeEvidenceProbeMode
} = {}): ToolRuntimeEvidenceAuthorityReport {
  const probeMode = input.probeMode ?? 'disabled'
  const checkedAt = new Date().toISOString()
  const profilesById = new Map(productionToolProfiles.map((profile) => [profile.toolId, profile]))
  const specsById = new Map(productionToolReadinessSpecs.map((spec) => [spec.toolId, spec]))
  const records = PRODUCTION_TOOL_IDS.flatMap((toolId) => {
    const profile = profilesById.get(toolId)
    const spec = specsById.get(toolId)
    if (!profile || !spec) return []
    return [buildRecord({ profile, spec, checkedAt, probeMode })]
  })
  const body: AuthorityBody = {
    schemaVersion: 'server-tool-runtime-evidence-authority-v1',
    authorityMode: 'read_only_fail_closed',
    probeMode,
    checkedAt,
    evidenceScope: 'current_backend_process_local_presence_only',
    credentialsRead: false,
    networkCallsMade: false,
    providerCallsMade: false,
    mediaProcessed: false,
    rendersExecuted: false,
    cloudStateChanged: false,
    databaseStateChanged: false,
    coverage: coverageFor(records),
    records,
    summary: summaryFor(records),
    globalBlockers: [
      'Current developer-host presence probes do not verify any production worker container or deployed Cloud Run job.',
      'Canonical production database/RLS, distributed idempotency, and tenant-bound worker lease evidence remain unresolved.',
      'Live GCS bucket IAM, generation-bound artifact delivery, malware isolation, and worker service identity are unverified.',
      'Tool-specific approved-snapshot operations, runtime QA, render/export integration, and failure recovery are unverified.',
      'Actual cost settlement, reservation spend/release/refund, and production billing ledgers are unverified.',
      'Source-level security hardening does not prove live Supabase, GCS, GitHub, worker, or deployment security.',
    ],
    sourceDocuments: [...SOURCE_DOCUMENTS],
    limitations: [
      'Safe local probing performs only bounded command version, Node resolution, and isolated Python module-spec checks.',
      'Node target packages and Python target modules are not imported. Command probes execute only server-owned version/help arguments; no media/product operation is executed.',
      'No network, provider, cloud, database, storage, render, billing, or credential operation is performed.',
      'Package presence does not prove configuration, license approval, model approval, runtime correctness, QA, security, or production readiness.',
      'The 50-contract professional adapter layer is narrower than the 72-tool production registry; missing contracts remain explicit.',
    ],
  }

  return deepFreeze({
    ...body,
    authorityHash: authorityHash(body),
  })
}

export function verifyToolRuntimeEvidenceAuthority(
  report: ToolRuntimeEvidenceAuthorityReport,
): VerifyToolRuntimeEvidenceAuthorityResult {
  const { authorityHash: claimedHash, ...body } = report
  const issues: string[] = []
  const recordIds = report.records.map((record) => record.toolId)
  const expectedIds = new Set(PRODUCTION_TOOL_IDS)

  if (authorityHash(body) !== claimedHash) issues.push('Authority hash does not match the report body.')
  if (report.schemaVersion !== 'server-tool-runtime-evidence-authority-v1') issues.push('Authority schema version is unsupported.')
  if (report.authorityMode !== 'read_only_fail_closed') issues.push('Authority mode must remain read_only_fail_closed.')
  if (recordIds.length !== PRODUCTION_TOOL_IDS.length) issues.push('Authority does not contain exactly one record per registry tool.')
  if (new Set(recordIds).size !== recordIds.length) issues.push('Authority contains duplicate tool records.')
  if (recordIds.some((toolId) => !expectedIds.has(toolId))) issues.push('Authority contains an unknown tool ID.')
  if (PRODUCTION_TOOL_IDS.some((toolId) => !recordIds.includes(toolId))) issues.push('Authority is missing a registry tool ID.')
  if (report.records.some((record) => record.productionReadiness.productionReady)) issues.push('Authority must not mark a tool production-ready without production evidence.')
  if (report.records.some((record) => record.productionReadiness.externalBetaReady)) issues.push('Authority must not mark a tool external-beta-ready without production evidence.')
  if (report.summary.productionReadyTools.length > 0 || report.summary.authorityExternalBetaReadyTools.length > 0) {
    issues.push('Authority summary contains an unauthorized ready tool.')
  }
  if (
    report.credentialsRead ||
    report.networkCallsMade ||
    report.providerCallsMade ||
    report.mediaProcessed ||
    report.rendersExecuted ||
    report.cloudStateChanged ||
    report.databaseStateChanged
  ) {
    issues.push('Read-only evidence authority reports a forbidden side effect.')
  }
  if (report.records.some((record) => record.installation.probes.some((probe) => (
    probe.networkAccessed ||
    probe.credentialsRead ||
    probe.packageCodeImported ||
    probe.toolOperationExecuted ||
    probe.mediaProcessed ||
    probe.publicArtifactCreated
  )))) {
    issues.push('A local presence probe reports a forbidden side effect.')
  }
  if (report.probeMode === 'disabled' && report.records.some((record) => (
    record.installation.probes.some((probe) => probe.presenceProbeExecuted)
  ))) {
    issues.push('Disabled evidence report claims that a presence probe executed.')
  }
  if (report.probeMode === 'safe_local_presence' && report.records.some((record) => (
    record.installation.probes.some((probe) => !probe.presenceProbeExecuted)
  ))) {
    issues.push('Safe local evidence report contains an unexecuted declared presence probe.')
  }
  if (report.coverage.records !== report.records.length) issues.push('Coverage record count is inconsistent.')

  return { valid: issues.length === 0, issues }
}
