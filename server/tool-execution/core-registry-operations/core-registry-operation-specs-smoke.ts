import { productionToolProfiles } from '../../tool-registry/production-tool-profiles'
import { getToolQAPolicy } from '../../tool-registry/tool-qa-policy'
import { listProfessionalToolOperationSpecs } from '../professional-tool-operation-spec-registry'
import type {
  ProfessionalToolOperationRequestSchema,
  ProfessionalToolOperationSettingConstraint,
} from '../professional-tool-operation-spec-types'
import { validateCoreRegistryOperationRequestContract } from './core-registry-operation-request-validator'
import {
  CORE_REGISTRY_EXPECTED_DISPOSITIONS,
  DERIVED_CORE_REGISTRY_OPERATION_TOOL_IDS,
  getCoreRegistryOperationSpec,
  listCompleteProfessionalToolOperationSpecs,
  listCoreRegistryOperationSpecs,
  resolveCompleteProfessionalToolOperationSpec,
  resolveCoreRegistryOperationSpec,
  summarizeCompleteProfessionalToolOperationCoverage,
  type CoreRegistryOperationSpec,
  type CoreRegistryOperationToolId,
} from './core-registry-operation-specs'

const failures: string[] = []
const privateInternalRunnerVerifiedToolIds = new Set([
  'd3',
  'duckdb',
  'echarts',
  'ffmpeg',
  'ffprobe',
  'libass',
  'opentimelineio',
  'opencv',
  'polars',
  'pyav',
  'remotion',
  'sharp',
  'vega_lite',
  'vega',
  'satori',
  'svg_js',
  'viz_js',
  'signalsmith_stretch',
  'vapoursynth',
])
const check = (condition: unknown, message: string): void => {
  if (!condition) failures.push(message)
}

const coreSpecs = listCoreRegistryOperationSpecs()
const boundedSpecs = listProfessionalToolOperationSpecs()
const completeSpecs = listCompleteProfessionalToolOperationSpecs()
const summary = summarizeCompleteProfessionalToolOperationCoverage()

const launchCoreCandidates = [
  'ffmpeg',
  'ffprobe',
  'opentimelineio',
  'hyperframe',
  'remotion',
  'libass',
  'sharp',
  'opencv',
  'signalsmith_stretch',
] as const satisfies readonly CoreRegistryOperationToolId[]

const plannedCandidates = [
  'pyav',
  'duckdb',
  'polars',
  'paddleocr',
  'demucs',
  'film',
  'vapoursynth',
] as const satisfies readonly CoreRegistryOperationToolId[]

const exactPolicyBlocked = [
  'mediapipe',
  'soundtouch',
  'rubber_band',
  'essentia',
  'cesium_js',
  'revideo',
] as const satisfies readonly CoreRegistryOperationToolId[]

check(productionToolProfiles.length === 72, 'Production registry must contain exactly 72 profiles for this closure milestone.')
check(boundedSpecs.length === 50, 'Existing bounded catalog must remain exactly 50 specs and must not be modified by this extension.')
check(coreSpecs.length === 22, 'Registry-only extension must contain exactly the derived 22 gaps.')
check(completeSpecs.length === 72, 'Complete operation coverage must be exactly 72 specs.')
check(summary.productionProfileCount === 72, 'Coverage summary must report 72 production profiles.')
check(summary.boundedAdapterSpecCount === 50, 'Coverage summary must report 50 bounded adapter specs.')
check(summary.coreRegistryOnlySpecCount === 22, 'Coverage summary must report 22 registry-only specs.')
check(summary.completeCanonicalSpecCount === 72, 'Coverage summary must report 72 complete canonical specs.')
check(summary.duplicateCanonicalToolIds.length === 0, 'Complete coverage must have zero duplicate canonical tool identities.')
check(summary.duplicateOperationIds.length === 0, 'Complete coverage must have zero duplicate operation identities.')
check(summary.unclassifiedPlannerSelectableToolIds.length === 0, 'Every production registry profile must have an explicit operation disposition.')
check(summary.completeProductReadyCount === 0, 'No registry-only or bounded spec may claim product readiness.')
check(summary.coreRegistryCandidateCount === 16, 'Registry-only extension must contain exactly 16 fixed-contract candidates.')
check(summary.coreRegistryNonCallableCount === 6, 'Registry-only extension must contain exactly six non-callable policy dispositions.')
check(sameValues(summary.coreRegistryPolicyBlockedToolIds, exactPolicyBlocked), 'Policy-blocked tool IDs must match the exact future/license/evaluation/planning policy set.')

check(sameValues(
  DERIVED_CORE_REGISTRY_OPERATION_TOOL_IDS,
  coreSpecs.map((spec) => spec.canonicalToolId),
), 'The 22 specs must be derived exactly from production registry profiles absent from the bounded catalog.')

const completeCanonicalIds = completeSpecs.map((spec) => spec.canonicalToolId)
check(new Set(completeCanonicalIds).size === 72, 'Every complete spec must have one unique canonical identity.')
check(sameValues(
  completeCanonicalIds,
  productionToolProfiles.map((profile) => profile.toolId),
), 'Complete canonical operation identities must exactly cover all production profiles.')

const completeOperationIds = completeSpecs.flatMap((spec) => spec.allowedOperationIds)
check(new Set(completeOperationIds).size === 72, 'Every complete spec must have one globally unique operation ID.')

for (const toolId of launchCoreCandidates) {
  const spec = requireSpec(toolId)
  check(spec.promotionGate === 'launch_core_candidate', `${toolId} must remain a launch-core candidate.`)
  check(spec.callability === 'real_candidate', `${toolId} must have a real fixed-contract candidate spec.`)
  check(spec.disposition === 'edit_operation_candidate', `${toolId} must have an edit-operation candidate disposition.`)
  check(spec.policyBlocks.length === 0, `${toolId} launch candidate must not be mislabeled as a future/evaluation policy block.`)
}

for (const toolId of plannedCandidates) {
  const spec = requireSpec(toolId)
  check(spec.promotionGate === 'planned_candidate', `${toolId} must remain a planned candidate.`)
  check(spec.callability === 'real_candidate', `${toolId} planned profile must have a strict fixed candidate contract.`)
  check(spec.disposition === 'edit_operation_candidate', `${toolId} planned profile must retain a candidate disposition.`)
  check(spec.productReady === false, `${toolId} planned candidate must not imply readiness.`)
}

for (const toolId of exactPolicyBlocked) {
  const spec = requireSpec(toolId)
  check(spec.disposition === 'policy_blocked', `${toolId} must be explicitly non-callable.`)
  check(spec.callability === 'non_callable_policy_disposition', `${toolId} must expose a non-callable disposition.`)
  check(spec.policyBlocks.length > 0, `${toolId} must state at least one exact policy block.`)
  check(spec.policyBlockReasons.length > 0, `${toolId} must state why policy blocks execution.`)
  check(spec.workerRuntime.runtimeClass === 'not_assignable_policy_blocked', `${toolId} must not receive a worker runtime while blocked.`)
  check(spec.workerRuntime.imageRole === 'none_policy_blocked', `${toolId} must not receive a worker image while blocked.`)
}

for (const spec of coreSpecs) {
  const profile = productionToolProfiles.find((item) => item.toolId === spec.canonicalToolId)
  const expected = CORE_REGISTRY_EXPECTED_DISPOSITIONS[
    spec.canonicalToolId as CoreRegistryOperationToolId
  ]
  check(Boolean(profile), `${spec.canonicalToolId} must retain production registry lineage.`)
  if (!profile) continue

  check(spec.disposition === expected.disposition, `${spec.canonicalToolId} disposition must exactly match the immutable matrix.`)
  check(spec.promotionGate === expected.promotionGate, `${spec.canonicalToolId} promotion gate must exactly match the immutable matrix.`)
  check(spec.callability === expected.callability, `${spec.canonicalToolId} callability must exactly match the immutable matrix.`)
  check(sameValues(spec.policyBlocks, expected.policyBlocks), `${spec.canonicalToolId} policy block set must exactly match the immutable matrix.`)
  check(spec.coverageSource === 'production_registry_without_bounded_adapter_contract', `${spec.canonicalToolId} must identify registry-only source lineage.`)
  check(spec.fixedContractOnly, `${spec.canonicalToolId} must be a fixed-contract-only spec.`)
  check(spec.allowedOperationIds.length === 1, `${spec.canonicalToolId} must expose exactly one authoritative operation identity.`)
  check(spec.requestSchema.properties.operationId.const === spec.allowedOperationIds[0], `${spec.canonicalToolId} request schema must pin the operation identity.`)
  check(spec.workerRuntime.registryWorkerType === profile.workerType, `${spec.canonicalToolId} worker ownership must match the registry profile.`)
  check(sameValues(
    spec.declaredPrivateInputArtifactKinds,
    profile.inputTypes.filter((kind) => kind !== 'none'),
  ), `${spec.canonicalToolId} private inputs must derive from the registry profile.`)
  check(sameValues(
    spec.declaredPrivateOutputArtifactKinds,
    profile.outputTypes.filter((kind) => kind !== 'none'),
  ), `${spec.canonicalToolId} private outputs must derive from the registry profile.`)

  check(spec.productReady === false, `${spec.canonicalToolId} must remain productReady=false.`)
  const privateRunnerVerified = privateInternalRunnerVerifiedToolIds.has(spec.canonicalToolId)
  check(spec.privateInternalExecutionReady === privateRunnerVerified,
    `${spec.canonicalToolId} private runner readiness must match actual confined execution evidence.`)
  check(spec.runnerTestEvidenceStatus ===
    (privateRunnerVerified ? 'private_internal_verified' : 'not_verified'),
  `${spec.canonicalToolId} runner evidence status must match actual private evidence.`)
  check(spec.entrypoint.implementationStatus ===
    (privateRunnerVerified ? 'private_internal_runner_verified' : 'declared_not_runner_tested'),
  `${spec.canonicalToolId} entrypoint status must match actual private runner evidence.`)
  check(spec.frontendExecutionAllowed === false, `${spec.canonicalToolId} operation contract must not authorize frontend execution.`)
  check(spec.requiresApprovedSnapshot, `${spec.canonicalToolId} must require an approved snapshot.`)
  check(spec.requiresApprovedWorkItem, `${spec.canonicalToolId} must require an approved work item.`)
  check(spec.requiresOpaqueWorkerLease, `${spec.canonicalToolId} must require an opaque worker lease.`)
  check(spec.requiresPrivateArtifacts, `${spec.canonicalToolId} must require private manifest artifacts.`)

  check(spec.requestSchema.additionalProperties === false, `${spec.canonicalToolId} request must reject extra fields.`)
  check(spec.requestSchema.properties.settings.additionalProperties === false, `${spec.canonicalToolId} settings must reject extra fields.`)
  check(spec.requestSchema.arbitraryCommandAllowed === false, `${spec.canonicalToolId} must reject arbitrary commands.`)
  check(spec.requestSchema.arbitraryArgumentsAllowed === false, `${spec.canonicalToolId} must reject arbitrary arguments.`)
  check(spec.requestSchema.arbitraryCodeAllowed === false, `${spec.canonicalToolId} must reject arbitrary code.`)
  check(spec.requestSchema.arbitraryEnvironmentAllowed === false, `${spec.canonicalToolId} must reject arbitrary environment variables.`)
  check(spec.requestSchema.arbitraryPathsAllowed === false, `${spec.canonicalToolId} must reject arbitrary paths.`)
  check(spec.requestSchema.arbitraryUrlsAllowed === false, `${spec.canonicalToolId} must reject arbitrary URLs.`)
  check(spec.requestSchema.rawChatOrPromptAllowed === false, `${spec.canonicalToolId} must reject raw chat/prompt input.`)
  check(spec.requestSchema.callerSelectedWorkspaceOrProjectAllowed === false, `${spec.canonicalToolId} must derive scope server-side.`)
  check(spec.requestSchema.properties.artifactBindings.serverManifestResolutionRequired, `${spec.canonicalToolId} inputs must resolve through the private manifest.`)
  check(spec.requestSchema.properties.artifactBindings.literalPathsAllowed === false, `${spec.canonicalToolId} must reject literal artifact paths.`)
  check(spec.requestSchema.properties.artifactBindings.literalUrlsAllowed === false, `${spec.canonicalToolId} must reject literal artifact URLs.`)

  check(spec.entrypoint.serverOwned, `${spec.canonicalToolId} entrypoint must be server-owned.`)
  check(spec.entrypoint.fixedInvocationProfileId.startsWith(`entrypoint.${spec.canonicalToolId}.`), `${spec.canonicalToolId} must have a tool-specific fixed invocation profile.`)
  check(!spec.entrypoint.callerSuppliedExecutableAllowed, `${spec.canonicalToolId} must reject caller executables.`)
  check(!spec.entrypoint.callerSuppliedArgumentsAllowed, `${spec.canonicalToolId} must reject caller arguments.`)
  check(!spec.entrypoint.shellAllowed, `${spec.canonicalToolId} must not expose a shell.`)
  check(!spec.entrypoint.dynamicImportSpecifierAllowed, `${spec.canonicalToolId} must reject dynamic import names.`)

  check(spec.networkPolicy.mode === 'offline_required', `${spec.canonicalToolId} must be an offline operation contract.`)
  check(spec.networkPolicy.denyByDefault, `${spec.canonicalToolId} network policy must fail closed.`)
  check(!spec.networkPolicy.packageOrModelDownloadsAllowed, `${spec.canonicalToolId} may not download packages/models at runtime.`)
  check(!spec.networkPolicy.providerCallsAllowed, `${spec.canonicalToolId} may not call providers.`)
  check(!spec.networkPolicy.callerSuppliedTargetsAllowed, `${spec.canonicalToolId} may not accept caller network targets.`)
  check(!spec.networkPolicy.rawUrlsAllowed, `${spec.canonicalToolId} may not accept raw URLs.`)
  check(spec.resourceCeilings.timeoutMs > 0, `${spec.canonicalToolId} must have a positive timeout ceiling.`)
  check(spec.resourceCeilings.maxAttemptsPerApprovedWorkItem > 0 && spec.resourceCeilings.maxAttemptsPerApprovedWorkItem <= 3, `${spec.canonicalToolId} must have bounded attempts.`)
  check(spec.resourceCeilings.memoryMiBLimit > 0, `${spec.canonicalToolId} must have a memory ceiling.`)
  check(spec.resourceCeilings.maxInputBytes > 0, `${spec.canonicalToolId} must have an input-byte ceiling.`)
  check(spec.resourceCeilings.maxOutputBytes > 0, `${spec.canonicalToolId} must have an output-byte ceiling.`)
  check(spec.resourceCeilings.maxNetworkRequests === 0, `${spec.canonicalToolId} must permit zero network requests.`)
  check(spec.resourceCeilings.maxNetworkResponseBytes === 0, `${spec.canonicalToolId} must permit zero network response bytes.`)

  check(spec.licenseGate.registryStatus === profile.productionStatus, `${spec.canonicalToolId} license gate must retain registry status.`)
  check(spec.licenseGate.evidenceRecordRequired, `${spec.canonicalToolId} must require license evidence.`)
  check(spec.licenseGate.blocksUntilSatisfied, `${spec.canonicalToolId} license gate must fail closed.`)
  check(spec.modelGate.modelWeightsRequired === profile.modelWeightPolicy.required, `${spec.canonicalToolId} model gate must match registry policy.`)
  check(spec.requestSchema.required.includes('modelManifestId') === profile.modelWeightPolicy.required, `${spec.canonicalToolId} model manifest request field must match model policy.`)
  check(!spec.modelGate.downloadAtRuntimeAllowed, `${spec.canonicalToolId} model downloads must be blocked.`)
  check(!spec.modelGate.callerSelectedModelAllowed, `${spec.canonicalToolId} caller-selected models must be blocked.`)
  check(spec.modelGate.serverMountedModelOnly, `${spec.canonicalToolId} models must be server-mounted.`)
  check(!spec.credentialGate.callerSuppliedCredentialsAllowed, `${spec.canonicalToolId} may not accept caller credentials.`)
  check(!spec.credentialGate.providerCredentialsAllowed, `${spec.canonicalToolId} may not use provider credentials.`)
  check(!spec.credentialGate.secretValuesInRequestAllowed, `${spec.canonicalToolId} may not accept request secrets.`)

  const qaPolicy = getToolQAPolicy(spec.canonicalToolId)
  check(sameValues(spec.qa.gateTypes, qaPolicy.gateTypes), `${spec.canonicalToolId} QA gates must match the registry QA source.`)
  check(sameValues(spec.qa.requiredBeforePreview, qaPolicy.requiredBeforePreview), `${spec.canonicalToolId} preview QA gates must match source policy.`)
  check(sameValues(spec.qa.requiredBeforeFinalExport, qaPolicy.requiredBeforeFinalExport), `${spec.canonicalToolId} export QA gates must match source policy.`)
  check(spec.qa.runtimeQaEvidenceRequired, `${spec.canonicalToolId} must require runtime QA evidence.`)
  check(spec.qa.outputArtifactLineageRequired, `${spec.canonicalToolId} must require output lineage.`)
  check(spec.costEvidence.estimateLineItemRequiredBeforeExecution, `${spec.canonicalToolId} must require estimate lineage.`)
  check(spec.costEvidence.activeReservationRequiredBeforeExecution, `${spec.canonicalToolId} must require reservation lineage.`)
  check(spec.costEvidence.actualCostEventRequiredAfterActualWork, `${spec.canonicalToolId} must require actual tool-cost evidence after real work.`)
  check(spec.costEvidence.actualInternalToolCostOnly, `${spec.canonicalToolId} cost evidence must contain internal tool cost only.`)
  check(spec.costEvidence.serviceFeeIncluded === false, `${spec.canonicalToolId} cost evidence must exclude service fees.`)
  check(spec.costEvidence.walletMutationAllowedByRunner === false, `${spec.canonicalToolId} runner may not mutate wallets.`)
  check(spec.costEvidence.settlementAllowedByRunner === false, `${spec.canonicalToolId} runner may not settle credits.`)
  check(spec.fallback.fallbackMustExistInApprovedSnapshot, `${spec.canonicalToolId} fallbacks must be preapproved.`)
  check(spec.fallback.fallbackMustPreserveArtifactContract, `${spec.canonicalToolId} fallback must preserve artifact contracts.`)
  check(spec.fallback.fallbackMayNotIncreaseCostWithoutNewApproval, `${spec.canonicalToolId} fallback may not silently overrun cost.`)
  check(!spec.fallback.automaticProviderSubstitutionAllowed, `${spec.canonicalToolId} may not substitute providers automatically.`)
  check(!spec.fallback.aiVideoFallbackAllowed, `${spec.canonicalToolId} may not silently fall back to AI video.`)
  check(spec.fallback.unresolvedRequiredFailureBlocksFinalExport, `${spec.canonicalToolId} unresolved required failures must block export.`)

  for (const alias of spec.aliases) {
    check(resolveCoreRegistryOperationSpec(alias)?.canonicalToolId === spec.canonicalToolId, `${alias} must resolve to the one canonical registry-only identity ${spec.canonicalToolId}.`)
    check(resolveCompleteProfessionalToolOperationSpec(alias)?.canonicalToolId === spec.canonicalToolId, `${alias} must resolve identically in complete 72-tool coverage.`)
  }

  const request = buildValidRequest(spec)
  const validation = validateCoreRegistryOperationRequestContract(spec.canonicalToolId, request)
  if (spec.disposition === 'policy_blocked') {
    check(!validation.ok && validation.errors[0]?.code === 'policy_blocked', `${spec.canonicalToolId} must fail closed before request execution.`)
  } else {
    check(validation.ok, `${spec.canonicalToolId} strict request fixture must pass contract validation: ${validation.ok ? '' : validation.errors.map((item) => item.message).join(' ')}`)
  }
}

const hyperframe = requireSpec('hyperframe')
check(hyperframe.workerRuntime.runtimeClass === 'not_assignable_policy_blocked', 'Hyperframe must not claim a backend worker runtime.')
check(hyperframe.workerRuntime.imageDefinition === 'frontend_preview_boundary_no_backend_worker_assigned', 'Hyperframe must remain an explicit preview-boundary handoff.')
check(!hyperframe.declaredPrivateInputArtifactKinds.includes('source_media'), 'Hyperframe must not accept source media processing input.')
check(!hyperframe.declaredPrivateInputArtifactKinds.includes('video'), 'Hyperframe must not accept video processing input.')

check(requireSpec('ffmpeg').entrypoint.commandName === 'ffmpeg', 'FFmpeg must use one server-owned fixed binary identity.')
check(requireSpec('ffprobe').entrypoint.commandName === 'ffprobe', 'ffprobe must use one server-owned fixed binary identity.')
check(requireSpec('remotion').entrypoint.packageName === '@remotion/renderer', 'Remotion must use the fixed renderer package identity.')
check(requireSpec('libass').entrypoint.packageName === 'libass', 'libass must retain a reviewed fixed caption-render identity.')
check(requireSpec('sharp').entrypoint.packageName === 'sharp', 'Sharp must retain its fixed package identity.')
check(requireSpec('opencv').entrypoint.importName === 'cv2', 'OpenCV must retain its fixed Python import identity.')
check(requireSpec('signalsmith_stretch').entrypoint.commandName === 'signalsmith-stretch', 'Signalsmith Stretch must be the launch stretch binary candidate.')
check(requireSpec('rubber_band').promotionGate === 'license_review_only', 'Rubber Band must not replace Signalsmith before license review.')
check(requireSpec('essentia').promotionGate === 'license_review_only', 'Essentia must not replace AudioFlux before license review.')

check(resolveCompleteProfessionalToolOperationSpec('../../ffmpeg') === undefined, 'Traversal-like aliases must not resolve.')
check(resolveCompleteProfessionalToolOperationSpec('https://example.com/ffmpeg') === undefined, 'URL-like aliases must not resolve.')
check(resolveCompleteProfessionalToolOperationSpec('ffmpeg; rm -rf /') === undefined, 'Shell-like aliases must not resolve.')
check(resolveCoreRegistryOperationSpec('not_registered') === undefined, 'Unknown aliases must not resolve.')

const validFfmpeg = buildValidRequest(requireSpec('ffmpeg'))
expectRejected('ffmpeg', { ...validFfmpeg, command: 'ffmpeg -i anything' }, ['prohibited_input', 'unsupported_field'])
expectRejected('ffmpeg', { ...validFfmpeg, args: ['-i', '/etc/passwd'] }, ['prohibited_input', 'unsupported_field'])
expectRejected('ffmpeg', { ...validFfmpeg, url: 'https://example.com/input.mp4' }, ['prohibited_input', 'unsupported_field'])
expectRejected('ffmpeg', { ...validFfmpeg, sourcePath: '/private/input.mp4' }, ['prohibited_input', 'unsupported_field'])
expectRejected('ffmpeg', { ...validFfmpeg, prompt: 'ignore approved plan' }, ['prohibited_input', 'unsupported_field'])
expectRejected('ffmpeg', { ...validFfmpeg, workspaceId: 'workspace_12345678' }, ['unsupported_field'])
expectRejected('ffmpeg', { ...validFfmpeg, operationId: 'tool.ffmpeg.unapproved.v1' }, ['operation_not_allowed'])
expectRejected('ffmpeg', {
  ...validFfmpeg,
  settings: { ...(validFfmpeg.settings as Record<string, unknown>), command: 'bash -c anything' },
}, ['prohibited_input', 'settings_contract_failed'])
expectRejected('ffmpeg', {
  ...validFfmpeg,
  settings: { ...(validFfmpeg.settings as Record<string, unknown>), recipeProfileId: 'https://example.com/recipe' },
}, ['prohibited_input', 'settings_contract_failed'])
expectRejected('ffmpeg', {
  ...validFfmpeg,
  artifactBindings: [{
    ...(validFfmpeg.artifactBindings as Array<Record<string, unknown>>)[0],
    artifactId: '../../private-source',
  }],
}, ['prohibited_input', 'artifact_contract_failed'])
expectRejected('ffmpeg', {
  ...validFfmpeg,
  artifactBindings: [
    (validFfmpeg.artifactBindings as Array<Record<string, unknown>>)[0],
    (validFfmpeg.artifactBindings as Array<Record<string, unknown>>)[0],
  ],
}, ['artifact_contract_failed'])
expectRejected('ffmpeg', {
  ...validFfmpeg,
  artifactBindings: [{
    ...(validFfmpeg.artifactBindings as Array<Record<string, unknown>>)[0],
    sha256: 'not-a-sha256',
  }],
}, ['artifact_contract_failed'])
expectRejected('ffmpeg', {
  ...validFfmpeg,
  artifactBindings: [{
    ...(validFfmpeg.artifactBindings as Array<Record<string, unknown>>)[0],
    byteLength: requireSpec('ffmpeg').resourceCeilings.maxInputBytes + 1,
  }],
}, ['artifact_contract_failed'])
expectRejected('ffmpeg', {
  ...validFfmpeg,
  artifactBindings: [{
    ...(validFfmpeg.artifactBindings as Array<Record<string, unknown>>)[0],
    path: '/tmp/input.mp4',
  }],
}, ['prohibited_input', 'artifact_contract_failed'])

const validDemucs = buildValidRequest(requireSpec('demucs'))
const { modelManifestId: removedModelManifestId, ...demucsWithoutModelManifest } = validDemucs
check(removedModelManifestId !== undefined, 'Demucs valid fixture must include a model manifest ID.')
expectRejected('demucs', demucsWithoutModelManifest, ['missing_field'])

const validHyperframe = buildValidRequest(hyperframe)
expectRejected('hyperframe', {
  ...validHyperframe,
  settings: {
    ...(validHyperframe.settings as Record<string, unknown>),
    sourceMediaProcessingAllowed: true,
  },
}, ['settings_contract_failed'])

for (const toolId of exactPolicyBlocked) {
  const result = validateCoreRegistryOperationRequestContract(toolId, buildValidRequest(requireSpec(toolId)))
  check(!result.ok && result.errors[0]?.code === 'policy_blocked', `${toolId} adversarial call attempt must fail at policy disposition.`)
}

const cyclic: Record<string, unknown> = {}
cyclic.self = cyclic
expectRejected('ffmpeg', cyclic, ['invalid_json_object'])

if (failures.length > 0) {
  throw new Error(`Core registry operation specs smoke failed:\n- ${failures.join('\n- ')}`)
}

console.log(JSON.stringify({
  ok: true,
  productionProfileCount: summary.productionProfileCount,
  boundedAdapterSpecCount: summary.boundedAdapterSpecCount,
  registryOnlySpecCount: summary.coreRegistryOnlySpecCount,
  completeCanonicalSpecCount: summary.completeCanonicalSpecCount,
  registryOnlyCandidateCount: summary.coreRegistryCandidateCount,
  registryOnlyNonCallableCount: summary.coreRegistryNonCallableCount,
  launchCoreCandidateToolIds: launchCoreCandidates,
  plannedCandidateToolIds: plannedCandidates,
  policyBlockedToolIds: exactPolicyBlocked,
  duplicateCanonicalToolIds: summary.duplicateCanonicalToolIds,
  duplicateOperationIds: summary.duplicateOperationIds,
  unclassifiedPlannerSelectableToolIds: summary.unclassifiedPlannerSelectableToolIds,
  completeProductReadyCount: summary.completeProductReadyCount,
  adversarialRequestClassesChecked: [
    'arbitrary_command',
    'arbitrary_arguments',
    'raw_url',
    'literal_path',
    'raw_prompt',
    'caller_scope',
    'operation_spoof',
    'nested_command',
    'nested_url',
    'artifact_traversal',
    'duplicate_artifact_identity',
    'invalid_artifact_hash',
    'artifact_byte_ceiling',
    'artifact_extra_path',
    'missing_model_manifest',
    'hyperframe_source_processing_escalation',
    'future_license_evaluation_call_attempts',
    'cyclic_non_json',
  ],
}, null, 2))

function requireSpec(toolId: CoreRegistryOperationToolId): CoreRegistryOperationSpec {
  const spec = getCoreRegistryOperationSpec(toolId)
  check(Boolean(spec), `Missing registry-only operation spec for ${toolId}.`)
  if (!spec) throw new Error(`Missing registry-only operation spec for ${toolId}.`)
  return spec
}

function buildValidRequest(spec: CoreRegistryOperationSpec): Record<string, unknown> {
  const schema = spec.requestSchema
  const request: Record<string, unknown> = {
    operationId: spec.allowedOperationIds[0],
    approvedSnapshotId: 'snapshot_12345678',
    approvedSnapshotHash: 'a'.repeat(64),
    workItemId: 'workitem_12345678',
    workItemHash: 'b'.repeat(64),
    creditEstimateId: 'estimate_12345678',
    creditReservationId: 'reservation_12345678',
    workerLeaseId: 'lease_12345678',
    idempotencyKey: 'idempotency_12345678',
    artifactBindings: buildArtifactBindings(schema),
    settings: buildSettings(schema),
  }
  if (schema.required.includes('modelManifestId')) request.modelManifestId = 'modelmanifest_12345678'
  return request
}

function buildArtifactBindings(
  schema: ProfessionalToolOperationRequestSchema,
): Array<Record<string, unknown>> {
  const kinds = schema.properties.artifactBindings.items.properties.kind.enum ?? []
  if (schema.properties.artifactBindings.minItems === 0) return []
  return [{
    artifactId: 'artifact_12345678',
    kind: kinds[0],
    sha256: 'c'.repeat(64),
    byteLength: Math.min(1_024, schema.properties.artifactBindings.items.properties.byteLength.maximum ?? 1_024),
  }]
}

function buildSettings(schema: ProfessionalToolOperationRequestSchema): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  for (const key of schema.properties.settings.required) {
    const constraint = schema.properties.settings.properties[key]
    output[key] = sampleConstraint(constraint)
  }
  return output
}

function sampleConstraint(constraint: ProfessionalToolOperationSettingConstraint): unknown {
  if (constraint.type === 'string') {
    if (constraint.const !== undefined) return constraint.const
    if (constraint.enum && constraint.enum.length > 0) return constraint.enum[0]
    return 'approved_12345678'
  }
  if (constraint.type === 'boolean') return constraint.const ?? false
  if (constraint.enum && constraint.enum.length > 0) return constraint.enum[0]
  return constraint.minimum ?? 0
}

function expectRejected(
  toolId: CoreRegistryOperationToolId,
  request: unknown,
  expectedCodes: readonly string[],
): void {
  const result = validateCoreRegistryOperationRequestContract(toolId, request)
  check(!result.ok, `${toolId} adversarial request must be rejected.`)
  if (result.ok) return
  const actualCodes = new Set(result.errors.map((item) => item.code))
  for (const expectedCode of expectedCodes) {
    check(actualCodes.has(expectedCode as never), `${toolId} adversarial request must include ${expectedCode}; got ${[...actualCodes].join(', ')}.`)
  }
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.length === sortedRight.length && sortedLeft.every((value, index) => value === sortedRight[index])
}
