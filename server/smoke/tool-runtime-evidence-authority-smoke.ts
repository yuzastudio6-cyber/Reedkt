import assert from 'node:assert/strict'

import {
  NON_E2E_TOOL_CAPABILITY_IDS,
  PRODUCTION_TOOL_IDS,
  listProfessionalToolAdapterContracts,
} from '../tool-registry'
import {
  createToolRuntimeEvidenceAuthority,
  verifyToolRuntimeEvidenceAuthority,
  type ToolRuntimeEvidenceAuthorityReport,
} from '../tool-runtime-evidence'

const safeLocalReport = createToolRuntimeEvidenceAuthority({ probeMode: 'safe_local_presence' })
const verification = verifyToolRuntimeEvidenceAuthority(safeLocalReport)

assert.equal(verification.valid, true, verification.issues.join(' '))
assert.match(safeLocalReport.authorityHash, /^[a-f0-9]{64}$/u)
assert.equal(Object.isFrozen(safeLocalReport), true)
assert.equal(Object.isFrozen(safeLocalReport.records), true)
assert.equal(Object.isFrozen(safeLocalReport.records[0]), true)

assert.equal(safeLocalReport.coverage.registryToolIds, 50)
assert.equal(safeLocalReport.coverage.registryProfiles, 50)
assert.equal(safeLocalReport.coverage.readinessSpecs, 50)
assert.equal(safeLocalReport.coverage.qaPolicies, 50)
assert.equal(safeLocalReport.coverage.meteringProfiles, 50)
assert.equal(safeLocalReport.coverage.records, 50)
assert.equal(safeLocalReport.records.length, PRODUCTION_TOOL_IDS.length)
assert.deepEqual(safeLocalReport.coverage.missingProfileToolIds, [])
assert.deepEqual(safeLocalReport.coverage.missingReadinessSpecToolIds, [])
assert.deepEqual(safeLocalReport.coverage.missingQaPolicyToolIds, [])
assert.deepEqual(safeLocalReport.coverage.missingMeteringProfileToolIds, [])

const contracts = listProfessionalToolAdapterContracts()
assert.equal(contracts.length, 38)
assert.equal(safeLocalReport.coverage.professionalAdapterContracts, 38)
assert.equal(safeLocalReport.coverage.professionalAdapterToolIds, 38)
assert.equal(safeLocalReport.coverage.registeredPresenceProbeMappings, 38)
assert.equal(safeLocalReport.coverage.missingProfessionalAdapterContractToolIds.length, 12)
assert.equal(safeLocalReport.coverage.missingRegisteredPresenceProbeToolIds.length, 12)

for (const contract of contracts) {
  const record = safeLocalReport.records.find((item) => item.toolId === contract.canonicalToolId)
  assert.ok(record, `Missing authority record for contract tool ${contract.canonicalToolId}.`)
  assert.equal(record.adapterContract.status, 'professional_adapter_contract_present')
  assert.equal(record.adapterContract.registeredPresenceProbeMapped, true)
  assert.equal(record.adapterContract.contractProductReadyClaim, false)
  assert.equal(record.adapterContract.contractRequiresApprovedSnapshot, true)
  assert.equal(record.execution.status, 'package_presence_probe_only')
  assert.equal(record.execution.actualToolOperationVerified, false)
  assert.equal(record.productionReadiness.productionReady, false)
}

for (const record of safeLocalReport.records) {
  assert.equal(record.schemaVersion, 'production-tool-runtime-evidence-record-v1')
  assert.equal(record.installation.currentDeveloperRuntimeOnly, true)
  assert.equal(record.installation.productionWorkerImageVerified, false)
  assert.equal(record.installation.deployedRuntimeVerified, false)
  assert.equal(record.configuration.productionBuildConfigurationVerified, false)
  assert.equal(record.configuration.deployedConfigurationVerified, false)
  assert.equal(record.configuration.exactModelWeightManifestApproved, false)
  assert.equal(record.license.explicitOwnerApprovalRecorded, false)
  assert.equal(record.credential.backendServiceIdentityVerified, false)
  assert.equal(record.credential.privateStorageIdentityVerified, false)
  assert.equal(record.credential.secretManagerBindingVerified, false)
  assert.equal(record.credential.secretsInspected, false)
  assert.equal(record.credential.credentialValuesRecorded, false)
  assert.equal(record.network.sandboxEgressPolicyVerified, false)
  assert.equal(record.network.approvedDestinationAllowlistVerified, false)
  assert.equal(record.network.networkAccessedDuringEvidenceCollection, false)
  assert.equal(record.execution.approvedSnapshotExecutionBindingVerified, false)
  assert.equal(record.execution.opaqueWorkerLeaseVerified, false)
  assert.equal(record.execution.privateArtifactExecutionVerified, false)
  assert.equal(record.execution.actualToolOperationVerified, false)
  assert.equal(record.execution.providerCallMade, false)
  assert.equal(record.execution.mediaProcessed, false)
  assert.equal(record.execution.renderExecuted, false)
  assert.equal(record.qa.policyDefined, true)
  assert.equal(record.qa.runtimeQaExecuted, false)
  assert.equal(record.qa.qaArtifactLineageVerified, false)
  assert.equal(record.qa.finalExportQaVerified, false)
  assert.equal(record.cost.serviceFeeIncludedInToolCost, false)
  assert.equal(record.cost.authorityExternalBetaReady, false)
  assert.equal(record.cost.approvedEstimateBindingVerified, false)
  assert.equal(record.cost.activeReservationBindingVerified, false)
  assert.equal(record.cost.actualCostEventVerified, false)
  assert.equal(record.cost.settlementLedgerVerified, false)
  assert.equal(record.cost.refundReleasePathVerified, false)
  assert.equal(record.productionReadiness.status, 'blocked')
  assert.equal(record.productionReadiness.productionReady, false)
  assert.equal(record.productionReadiness.externalBetaReady, false)
  assert.ok(record.productionReadiness.blockers.length >= 8)
  assert.ok(record.productionReadiness.nextEvidenceRequired.length >= 8)

  for (const probe of record.installation.probes) {
    assert.equal(probe.presenceProbeExecuted, true)
    assert.equal(probe.networkAccessed, false)
    assert.equal(probe.credentialsRead, false)
    assert.equal(probe.packageCodeImported, false)
    assert.equal(probe.toolOperationExecuted, false)
    assert.equal(probe.mediaProcessed, false)
    assert.equal(probe.publicArtifactCreated, false)
  }
}

assert.equal(safeLocalReport.summary.productionReadyTools.length, 0)
assert.equal(safeLocalReport.summary.authorityExternalBetaReadyTools.length, 0)
assert.equal(safeLocalReport.summary.blockedTools.length, 50)
assert.equal(safeLocalReport.summary.modelWeightApprovalRequiredTools.length, 2)
assert.ok(safeLocalReport.summary.catalogExternalBetaFlaggedTools.length > 0)
assert.equal(safeLocalReport.credentialsRead, false)
assert.equal(safeLocalReport.networkCallsMade, false)
assert.equal(safeLocalReport.providerCallsMade, false)
assert.equal(safeLocalReport.mediaProcessed, false)
assert.equal(safeLocalReport.rendersExecuted, false)
assert.equal(safeLocalReport.cloudStateChanged, false)
assert.equal(safeLocalReport.databaseStateChanged, false)

const ffmpeg = safeLocalReport.records.find((record) => record.toolId === 'ffmpeg')
assert.ok(ffmpeg)
assert.equal(ffmpeg.network.executionNetworkRequirement, 'offline_capable')
assert.ok(ffmpeg.installation.probes.some((probe) => probe.target === 'ffmpeg'))

const playwright = safeLocalReport.records.find((record) => record.toolId === 'playwright')
assert.ok(playwright)
assert.equal(playwright.network.executionNetworkRequirement, 'conditional_external_access')

for (const toolId of ['audioflux', 'signalsmith_stretch'] as const) {
  const record = safeLocalReport.records.find((item) => item.toolId === toolId)
  assert.ok(record)
  assert.equal(record.selectionPolicy, 'launch_candidate')
  assert.equal(record.productionReadiness.productionReady, false)
}

for (const toolId of NON_E2E_TOOL_CAPABILITY_IDS) {
  assert.equal(
    safeLocalReport.records.some((item) => String(item.toolId) === toolId),
    false,
    `${toolId} must not receive a production runtime-evidence record.`,
  )
}

const disabledReport = createToolRuntimeEvidenceAuthority({ probeMode: 'disabled' })
assert.equal(verifyToolRuntimeEvidenceAuthority(disabledReport).valid, true)
assert.equal(disabledReport.summary.localPresenceVerifiedTools.length, 0)
assert.equal(disabledReport.records.every((record) => record.installation.status === 'probe_disabled'), true)
assert.equal(disabledReport.records.every((record) => (
  record.installation.probes.every((probe) => probe.status === 'not_checked')
)), true)
assert.equal(disabledReport.records.every((record) => (
  record.installation.probes.every((probe) => probe.presenceProbeExecuted === false)
)), true)

const tampered = JSON.parse(JSON.stringify(safeLocalReport)) as ToolRuntimeEvidenceAuthorityReport
tampered.records[0].displayName = 'tampered'
const tamperVerification = verifyToolRuntimeEvidenceAuthority(tampered)
assert.equal(tamperVerification.valid, false)
assert.ok(tamperVerification.issues.includes('Authority hash does not match the report body.'))

console.log(JSON.stringify({
  smoke: 'tool-runtime-evidence-authority',
  status: 'passed',
  registryTools: safeLocalReport.coverage.registryToolIds,
  adapterContracts: safeLocalReport.coverage.professionalAdapterContracts,
  adapterToolIds: safeLocalReport.coverage.professionalAdapterToolIds,
  adapterContractGaps: safeLocalReport.coverage.missingProfessionalAdapterContractToolIds.length,
  localPresenceVerified: safeLocalReport.summary.localPresenceVerifiedTools.length,
  localPresencePartial: safeLocalReport.summary.localPresencePartialTools.length,
  localPresenceMissing: safeLocalReport.summary.localPresenceMissingTools.length,
  localPresenceNotCheckable: safeLocalReport.summary.localPresenceNotCheckableTools.length,
  licensePolicyBlocked: safeLocalReport.summary.licensePolicyBlockedTools.length,
  licenseReviewRequired: safeLocalReport.summary.licenseReviewRequiredTools.length,
  modelWeightApprovalRequired: safeLocalReport.summary.modelWeightApprovalRequiredTools.length,
  catalogExternalBetaFlagged: safeLocalReport.summary.catalogExternalBetaFlaggedTools.length,
  authorityExternalBetaReady: safeLocalReport.summary.authorityExternalBetaReadyTools.length,
  productionReady: safeLocalReport.summary.productionReadyTools.length,
  authorityHash: safeLocalReport.authorityHash,
}, null, 2))
