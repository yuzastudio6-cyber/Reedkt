import {
  getProfessionalToolAdapterBinaryRunnerCommand,
  getProfessionalToolAdapterNodeRunnerPackage,
  getProfessionalToolAdapterPythonRunnerImport,
  getToolQAPolicy,
  listProfessionalToolAdapterContracts,
  productionToolProfiles,
  type ProductionToolId,
} from '../tool-registry'
import {
  getProfessionalToolOperationSpec,
  listProfessionalToolOperationSpecs,
  normalizeProfessionalToolOperationAlias,
  resolveProfessionalToolOperationSpec,
  summarizeProfessionalToolOperationRegistry,
} from './professional-tool-operation-spec-registry'
import {
  validateProfessionalToolOperationRequest,
} from './professional-tool-operation-request-validator'
import type {
  ProfessionalToolOperationRequestSchema,
  ProfessionalToolOperationSettingConstraint,
  ProfessionalToolOperationSpec,
} from './professional-tool-operation-spec-types'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const privateInternalRunnerVerifiedToolIds = new Set<ProductionToolId>([
  'audioflux',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svg_js',
  'pyscenedetect',
  'scipy',
  'pyloudnorm',
  'pydub',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
  'audioread',
  'resampy',
  'pedalboard',
  'mir_eval',
  'mido',
  'pretty_midi',
  'noisereduce',
  'librosa',
  'viz_js',
  'animejs',
  'three_js',
  'lottie',
  'pixijs',
  'konva',
  'babylon_js',
  'playwright',
  'torch_torchvision',
  'transformers',
  'rembg',
  'deepfilternet',
  'music21',
  'kornia',
  'opencolorio',
  'openimageio',
  'streamer_render_pipeline_support',
  'rnnoise',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
])

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return [...left].sort().join('|') === [...right].sort().join('|')
}

const contracts = listProfessionalToolAdapterContracts()
const specs = listProfessionalToolOperationSpecs()
const summary = summarizeProfessionalToolOperationRegistry()
const contractToolIds = contracts.map((contract) => contract.canonicalToolId)
const specToolIds = specs.map((spec) => spec.canonicalToolId)

check(new Set(contractToolIds).size === contracts.length, 'Bounded adapter source contracts must have unique canonical IDs.')
check(new Set(specToolIds).size === specs.length, 'Operation specs must have unique canonical tool IDs.')
check(specs.length === contracts.length, 'Every bounded adapter source contract must have exactly one operation spec.')
check(sameValues(specToolIds, contractToolIds), 'Operation spec coverage must exactly match bounded adapter source contracts.')
check(summary.sourceContractCount === contracts.length, 'Summary source count must derive from source contracts.')
check(summary.canonicalOperationSpecCount === specs.length, 'Summary canonical count must derive from operation specs.')
check(summary.serverCallableCandidateCount + summary.policyBlockedCount === specs.length, 'Every source spec must be callable-candidate or policy-blocked.')
check(summary.productReadyCount === 0, 'No operation spec may claim product readiness before runner tests.')

const expectedPolicyBlocked = productionToolProfiles
  .filter((profile) => contractToolIds.includes(profile.toolId))
  .filter((profile) =>
    profile.productionStatus === 'evaluation_only' ||
    profile.productionStatus === 'future' ||
    profile.productionStatus === 'blocked' ||
    profile.workerType === 'planning_only')
  .map((profile) => profile.toolId)
check(
  sameValues(summary.policyBlockedToolIds, expectedPolicyBlocked),
  'Policy-blocked specs must derive from current production profile policy.',
)
check(getProfessionalToolOperationSpec('transparent_background')?.policyBlocks.includes('evaluation_only') === true, 'transparent-background must remain evaluation-only.')
check(getProfessionalToolOperationSpec('whisper_cpp')?.policyBlocks.includes('evaluation_only') === true, 'whisper.cpp must remain evaluation-only.')
check(getProfessionalToolOperationSpec('deck_gl')?.policyBlocks.includes('future_only') === true, 'deck.gl must remain future-only.')
check(getProfessionalToolOperationSpec('maplibre')?.policyBlocks.includes('planning_only') === true, 'MapLibre must remain non-callable while its worker owner is planning-only.')
check(getProfessionalToolOperationSpec('turf')?.policyBlocks.includes('planning_only') === true, 'Turf must remain non-callable while its worker owner is planning-only.')

const operationIds = new Set<string>()
const normalizedAliases = new Map<string, ProductionToolId>()
for (const spec of specs) {
  const contract = contracts.find((item) => item.canonicalToolId === spec.canonicalToolId)
  const profile = productionToolProfiles.find((item) => item.toolId === spec.canonicalToolId)
  check(Boolean(contract), `${spec.canonicalToolId} must retain source contract lineage.`)
  check(Boolean(profile), `${spec.canonicalToolId} must retain production profile lineage.`)
  if (!contract || !profile) continue

  check(spec.allowedOperationIds.length === 1, `${spec.canonicalToolId} must declare exactly one authoritative operation ID.`)
  check(!operationIds.has(spec.allowedOperationIds[0]), `${spec.canonicalToolId} operation ID must be globally unique.`)
  operationIds.add(spec.allowedOperationIds[0])
  check(spec.requestSchema.properties.operationId.const === spec.allowedOperationIds[0], `${spec.canonicalToolId} request schema must pin its operation ID.`)
  check(spec.requestedToolName === contract.requestedToolName, `${spec.canonicalToolId} requested name must match source truth.`)
  check(sameValues(spec.declaredPrivateInputArtifactKinds, contract.privateInputManifestKinds), `${spec.canonicalToolId} input artifact kinds must match its bounded contract.`)
  check(sameValues(spec.declaredPrivateOutputArtifactKinds, contract.privateOutputManifestKinds), `${spec.canonicalToolId} output artifact kinds must match its bounded contract.`)
  check(spec.workerRuntime.registryWorkerType === profile.workerType, `${spec.canonicalToolId} worker owner must match its production profile.`)
  check(spec.frontendExecutionAllowed === false, `${spec.canonicalToolId} must never execute in the frontend.`)
  check(spec.productReady === false, `${spec.canonicalToolId} must remain productReady=false without runner evidence.`)
  const privateRunnerVerified = privateInternalRunnerVerifiedToolIds.has(spec.canonicalToolId)
  check(spec.privateInternalExecutionReady === privateRunnerVerified,
    `${spec.canonicalToolId} private readiness must match confined runner evidence.`)
  check(spec.runnerTestEvidenceStatus ===
    (privateRunnerVerified ? 'private_internal_verified' : 'not_verified'),
  `${spec.canonicalToolId} runner status must match confined runner evidence.`)
  check(spec.requiresApprovedSnapshot && spec.requiresApprovedWorkItem, `${spec.canonicalToolId} must require approved snapshot/work-item lineage.`)
  check(spec.requiresOpaqueWorkerLease, `${spec.canonicalToolId} must require an opaque worker lease.`)

  check(spec.requestSchema.additionalProperties === false, `${spec.canonicalToolId} request schema must reject extra fields.`)
  check(spec.requestSchema.properties.settings.additionalProperties === false, `${spec.canonicalToolId} settings must reject extra fields.`)
  check(spec.requestSchema.arbitraryCommandAllowed === false, `${spec.canonicalToolId} must reject arbitrary commands.`)
  check(spec.requestSchema.arbitraryArgumentsAllowed === false, `${spec.canonicalToolId} must reject arbitrary arguments.`)
  check(spec.requestSchema.arbitraryCodeAllowed === false, `${spec.canonicalToolId} must reject arbitrary code.`)
  check(spec.requestSchema.arbitraryPathsAllowed === false, `${spec.canonicalToolId} must reject arbitrary paths.`)
  check(spec.requestSchema.arbitraryUrlsAllowed === false, `${spec.canonicalToolId} must reject arbitrary URLs.`)
  check(spec.requestSchema.callerSelectedWorkspaceOrProjectAllowed === false, `${spec.canonicalToolId} must derive tenant scope server-side.`)
  check(spec.requestSchema.properties.artifactBindings.serverManifestResolutionRequired, `${spec.canonicalToolId} inputs must resolve through the approved private manifest.`)
  check(spec.requestSchema.properties.artifactBindings.literalPathsAllowed === false, `${spec.canonicalToolId} must reject literal artifact paths.`)
  check(spec.requestSchema.properties.artifactBindings.literalUrlsAllowed === false, `${spec.canonicalToolId} must reject literal artifact URLs.`)

  check(spec.entrypoint.serverOwned, `${spec.canonicalToolId} entrypoint must be server-owned.`)
  check(spec.entrypoint.implementationStatus ===
    (privateRunnerVerified ? 'private_internal_runner_verified' : 'declared_not_runner_tested'),
  `${spec.canonicalToolId} entrypoint status must match confined runner evidence.`)
  check(!spec.entrypoint.callerSuppliedExecutableAllowed, `${spec.canonicalToolId} must reject caller executables.`)
  check(!spec.entrypoint.callerSuppliedArgumentsAllowed, `${spec.canonicalToolId} must reject caller arguments.`)
  check(!spec.entrypoint.shellAllowed, `${spec.canonicalToolId} must never use a caller shell.`)
  check(!spec.entrypoint.dynamicImportSpecifierAllowed, `${spec.canonicalToolId} must reject dynamic import names.`)
  verifyRegisteredEntrypointIdentity(spec)

  check(spec.networkPolicy.denyByDefault, `${spec.canonicalToolId} network must be deny-by-default.`)
  check(!spec.networkPolicy.packageOrModelDownloadsAllowed, `${spec.canonicalToolId} may not download packages/models at runtime.`)
  check(!spec.networkPolicy.providerCallsAllowed, `${spec.canonicalToolId} operation may not call providers.`)
  check(!spec.networkPolicy.callerSuppliedTargetsAllowed, `${spec.canonicalToolId} may not accept caller network targets.`)
  check(!spec.networkPolicy.rawUrlsAllowed, `${spec.canonicalToolId} may not accept raw URLs.`)
  check(spec.resourceCeilings.timeoutMs > 0, `${spec.canonicalToolId} must have a positive timeout.`)
  check(spec.resourceCeilings.maxAttemptsPerApprovedWorkItem > 0, `${spec.canonicalToolId} must have bounded attempts.`)
  check(spec.resourceCeilings.maxAttemptsPerApprovedWorkItem <= 3, `${spec.canonicalToolId} may not have an unbounded retry loop.`)
  check(spec.resourceCeilings.memoryMiBLimit > 0, `${spec.canonicalToolId} must have a memory ceiling.`)
  check(spec.resourceCeilings.maxInputBytes > 0, `${spec.canonicalToolId} must have an input-byte ceiling.`)
  check(spec.resourceCeilings.maxOutputBytes > 0, `${spec.canonicalToolId} must have an output-byte ceiling.`)
  if (spec.networkPolicy.mode === 'offline_required') {
    check(spec.resourceCeilings.maxNetworkRequests === 0, `${spec.canonicalToolId} offline operations must permit zero network requests.`)
    check(spec.resourceCeilings.maxNetworkResponseBytes === 0, `${spec.canonicalToolId} offline operations must permit zero network bytes.`)
    check(!spec.requestSchema.required.includes('networkGrantId'), `${spec.canonicalToolId} offline request must not require a network grant.`)
  } else {
    check(spec.networkPolicy.networkGrantRequired, `${spec.canonicalToolId} conditional network must require a grant.`)
    check(spec.requestSchema.required.includes('networkGrantId'), `${spec.canonicalToolId} conditional network schema must require its grant.`)
    check(spec.resourceCeilings.maxNetworkRequests > 0, `${spec.canonicalToolId} conditional network must retain a finite request ceiling.`)
  }

  check(spec.licenseGate.evidenceRecordRequired, `${spec.canonicalToolId} must require license evidence.`)
  check(spec.licenseGate.blocksUntilSatisfied, `${spec.canonicalToolId} license gate must fail closed.`)
  check(spec.modelGate.downloadAtRuntimeAllowed === false, `${spec.canonicalToolId} may not download model weights.`)
  check(spec.modelGate.callerSelectedModelAllowed === false, `${spec.canonicalToolId} may not accept caller-selected models.`)
  check(spec.modelGate.serverMountedModelOnly, `${spec.canonicalToolId} model inputs must be server-mounted.`)
  check(spec.modelGate.modelWeightsRequired === profile.modelWeightPolicy.required, `${spec.canonicalToolId} model gate must match source profile.`)
  check(spec.requestSchema.required.includes('modelManifestId') === profile.modelWeightPolicy.required, `${spec.canonicalToolId} model manifest field must match model policy.`)
  check(!spec.credentialGate.callerSuppliedCredentialsAllowed, `${spec.canonicalToolId} may not accept caller credentials.`)
  check(!spec.credentialGate.providerCredentialsAllowed, `${spec.canonicalToolId} may not use provider credentials.`)
  check(!spec.credentialGate.secretValuesInRequestAllowed, `${spec.canonicalToolId} may not accept secret values.`)

  const qaPolicy = getToolQAPolicy(spec.canonicalToolId)
  check(sameValues(spec.qa.gateTypes, qaPolicy.gateTypes), `${spec.canonicalToolId} QA gates must match source policy.`)
  check(spec.qa.runtimeQaEvidenceRequired, `${spec.canonicalToolId} must require runtime QA evidence.`)
  check(spec.qa.outputArtifactLineageRequired, `${spec.canonicalToolId} must require output lineage.`)
  check(spec.costEvidence.estimateLineItemRequiredBeforeExecution, `${spec.canonicalToolId} must require estimate lineage.`)
  check(spec.costEvidence.activeReservationRequiredBeforeExecution, `${spec.canonicalToolId} must require active reservation lineage.`)
  check(spec.costEvidence.actualCostEventRequiredAfterActualWork, `${spec.canonicalToolId} must require an actual cost event after work.`)
  check(spec.costEvidence.actualInternalToolCostOnly, `${spec.canonicalToolId} cost event must remain internal tool cost only.`)
  check(spec.costEvidence.serviceFeeIncluded === false, `${spec.canonicalToolId} tool cost must exclude service fees.`)
  check(spec.costEvidence.walletMutationAllowedByRunner === false, `${spec.canonicalToolId} runner may not mutate wallets.`)
  check(spec.costEvidence.settlementAllowedByRunner === false, `${spec.canonicalToolId} runner may not settle credits.`)
  check(spec.fallback.fallbackMustExistInApprovedSnapshot, `${spec.canonicalToolId} fallback must be preapproved.`)
  check(spec.fallback.fallbackMayNotIncreaseCostWithoutNewApproval, `${spec.canonicalToolId} fallback may not silently overrun cost.`)
  check(spec.fallback.aiVideoFallbackAllowed === false, `${spec.canonicalToolId} controlled tool must not silently fallback to AI video.`)
  check(spec.fallback.unresolvedRequiredFailureBlocksFinalExport, `${spec.canonicalToolId} unresolved required failure must block export.`)

  for (const alias of spec.aliases) {
    const normalized = normalizeProfessionalToolOperationAlias(alias)
    check(Boolean(normalized), `${spec.canonicalToolId} alias must normalize safely: ${alias}`)
    const previous = normalizedAliases.get(normalized)
    check(!previous || previous === spec.canonicalToolId, `Alias ${alias} must not map to multiple canonical specs.`)
    normalizedAliases.set(normalized, spec.canonicalToolId)
    check(resolveProfessionalToolOperationSpec(alias)?.canonicalToolId === spec.canonicalToolId, `Alias ${alias} must resolve to ${spec.canonicalToolId}.`)
  }

  const request = buildValidRequest(spec)
  const validation = validateProfessionalToolOperationRequest(spec.canonicalToolId, request)
  if (spec.disposition === 'policy_blocked') {
    check(!validation.ok && validation.errors[0]?.code === 'policy_blocked', `${spec.canonicalToolId} must fail closed at policy before request execution.`)
  } else {
    check(validation.ok, `${spec.canonicalToolId} authoritative request fixture must pass: ${validation.ok ? '' : validation.errors.map((item) => item.message).join(' ')}`)
  }
}

const playwright = requireSpec('playwright')
check(playwright.networkPolicy.mode === 'offline_required', 'Current private Playwright operation must remain fixed-template and zero-network.')
check(playwright.credentialGate.captureAuthorizationRequired, 'Playwright must require approved capture authorization.')
check(playwright.requestSchema.required.includes('captureAuthorizationId'), 'Playwright request must bind capture authorization by opaque ID.')

const maplibre = requireSpec('maplibre')
check(maplibre.networkPolicy.mode === 'conditional_approved_destination', 'Future MapLibre execution must use conditional approved tile destinations.')
check(maplibre.networkPolicy.approvedDestinationKinds.includes('server_authorized_map_tile_proxy'), 'MapLibre may use only the server-authorized map tile proxy class.')
check(maplibre.disposition === 'policy_blocked', 'MapLibre must not be callable before worker promotion.')

const modelTools = specs.filter((spec) => spec.modelGate.modelWeightsRequired)
check(modelTools.length > 0, 'Model-backed operation coverage must not be empty.')
for (const spec of modelTools) {
  check(spec.modelGate.exactManifestRequired, `${spec.canonicalToolId} must require exact model manifest evidence.`)
  check(spec.modelGate.checkpointHashRequired, `${spec.canonicalToolId} must require checkpoint hashes.`)
  check(spec.modelGate.commercialUseApprovalRequired, `${spec.canonicalToolId} must require model commercial-use approval.`)
}

check(resolveProfessionalToolOperationSpec('../../d3') === undefined, 'Traversal-like tool names must not resolve.')
check(resolveProfessionalToolOperationSpec('https://example.com/d3') === undefined, 'URL-like tool names must not resolve.')
check(resolveProfessionalToolOperationSpec('d3; rm -rf /') === undefined, 'Shell-like tool names must not resolve.')
check(resolveProfessionalToolOperationSpec('not_registered') === undefined, 'Unknown tool names must not resolve.')

const validD3 = buildValidRequest(requireSpec('d3'))
expectRejected('d3', { ...validD3, command: 'ffmpeg' }, ['prohibited_input', 'unsupported_field'])
expectRejected('d3', { ...validD3, args: ['--anything'] }, ['prohibited_input', 'unsupported_field'])
expectRejected('d3', { ...validD3, url: 'https://example.com' }, ['prohibited_input', 'unsupported_field'])
expectRejected('d3', { ...validD3, sourcePath: '/etc/passwd' }, ['prohibited_input', 'unsupported_field'])
expectRejected('d3', { ...validD3, workspaceId: 'workspace_12345678' }, ['unsupported_field'])
expectRejected('d3', { ...validD3, operationId: 'tool.d3.unapproved.v1' }, ['operation_not_allowed'])
expectRejected('d3', {
  ...validD3,
  settings: { ...(validD3.settings as Record<string, unknown>), command: 'node -e bad' },
}, ['prohibited_input', 'settings_contract_failed'])
expectRejected('d3', {
  ...validD3,
  settings: { ...(validD3.settings as Record<string, unknown>), themeProfileId: 'https://example.com/theme' },
}, ['prohibited_input', 'settings_contract_failed'])
expectRejected('d3', {
  ...validD3,
  artifactBindings: [{
    ...(validD3.artifactBindings as Array<Record<string, unknown>>)[0],
    artifactId: '../../private-source',
  }],
}, ['artifact_contract_failed', 'prohibited_input'])

const validModelRequest = buildValidRequest(requireSpec('sam2'))
const { modelManifestId: _removedModelManifestId, ...withoutModelManifest } = validModelRequest
check(_removedModelManifestId !== undefined, 'Model fixture must include its manifest ID.')
expectRejected('sam2', withoutModelManifest, ['missing_field'])

const cyclic: Record<string, unknown> = {}
cyclic.self = cyclic
expectRejected('d3', cyclic, ['invalid_json_object'])

console.log(JSON.stringify({
  ok: true,
  sourceContractCount: summary.sourceContractCount,
  canonicalOperationSpecCount: summary.canonicalOperationSpecCount,
  serverCallableCandidateCount: summary.serverCallableCandidateCount,
  editOperationCandidateCount: summary.editOperationCandidateCount,
  readinessOperationCandidateCount: summary.readinessOperationCandidateCount,
  policyBlockedCount: summary.policyBlockedCount,
  policyBlockedToolIds: summary.policyBlockedToolIds,
  requestedNameAliasCount: summary.requestedNameAliasCount,
  resolverAliasCount: summary.resolverAliasCount,
  productReadyCount: summary.productReadyCount,
  adversarialRequestClassesChecked: [
    'command',
    'args',
    'url',
    'path',
    'caller_scope',
    'operation_spoof',
    'nested_command',
    'nested_url',
    'artifact_traversal',
    'missing_model_manifest',
    'cyclic_non_json',
  ],
}, null, 2))

function requireSpec(toolId: ProductionToolId): ProfessionalToolOperationSpec {
  const spec = getProfessionalToolOperationSpec(toolId)
  check(Boolean(spec), `Missing operation spec for ${toolId}.`)
  return spec as ProfessionalToolOperationSpec
}

function verifyRegisteredEntrypointIdentity(spec: ProfessionalToolOperationSpec): void {
  const nodePackage = getProfessionalToolAdapterNodeRunnerPackage(spec.canonicalToolId)
  const pythonImport = getProfessionalToolAdapterPythonRunnerImport(spec.canonicalToolId)
  const binaryCommand = getProfessionalToolAdapterBinaryRunnerCommand(spec.canonicalToolId)
  const mappingCount = [nodePackage, pythonImport, binaryCommand].filter(Boolean).length
  check(mappingCount === 1, `${spec.canonicalToolId} must map to exactly one registered presence-probe runtime identity.`)
  if (nodePackage) {
    check(spec.entrypoint.kind === 'node_library', `${spec.canonicalToolId} must retain its Node library identity.`)
    check(spec.entrypoint.packageName === nodePackage, `${spec.canonicalToolId} Node package identity must match the registered source.`)
  }
  if (pythonImport) {
    check(spec.entrypoint.kind === 'python_library', `${spec.canonicalToolId} must retain its Python library identity.`)
    check(spec.entrypoint.packageName === pythonImport.packageName, `${spec.canonicalToolId} Python package identity must match registered source.`)
    check(spec.entrypoint.importName === pythonImport.importName, `${spec.canonicalToolId} Python import identity must match registered source.`)
  }
  if (binaryCommand) {
    check(spec.entrypoint.kind === 'fixed_binary', `${spec.canonicalToolId} must retain its fixed binary identity.`)
    check(spec.entrypoint.packageName === binaryCommand.packageName, `${spec.canonicalToolId} binary package identity must match registered source.`)
    check(spec.entrypoint.commandName === binaryCommand.commandName, `${spec.canonicalToolId} binary command identity must match registered source.`)
  }
}

function buildValidRequest(spec: ProfessionalToolOperationSpec): Record<string, unknown> {
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
  if (schema.required.includes('networkGrantId')) request.networkGrantId = 'networkgrant_12345678'
  if (schema.required.includes('captureAuthorizationId')) request.captureAuthorizationId = 'captureauth_12345678'
  return request
}

function buildArtifactBindings(schema: ProfessionalToolOperationRequestSchema): Array<Record<string, unknown>> {
  const artifactSchema = schema.properties.artifactBindings
  if (artifactSchema.minItems === 0) return []
  const kind = artifactSchema.items.properties.kind.enum?.[0]
  check(Boolean(kind), 'Required artifact binding must declare at least one allowed kind.')
  return [{
    artifactId: 'artifact_12345678',
    kind,
    sha256: 'c'.repeat(64),
    byteLength: 1,
  }]
}

function buildSettings(schema: ProfessionalToolOperationRequestSchema): Record<string, unknown> {
  const settings: Record<string, unknown> = {}
  for (const key of schema.properties.settings.required) {
    const constraint = schema.properties.settings.properties[key]
    check(Boolean(constraint), `Required setting ${key} must have a constraint.`)
    if (constraint) settings[key] = validSettingValue(constraint)
  }
  return settings
}

function validSettingValue(constraint: ProfessionalToolOperationSettingConstraint): unknown {
  if (constraint.type === 'string') {
    if (constraint.const !== undefined) return constraint.const
    if (constraint.enum?.length) return constraint.enum[0]
    if (constraint.pattern === '^[a-f0-9]{64}$') return 'd'.repeat(64)
    return 'profile_12345678'
  }
  if (constraint.type === 'boolean') return constraint.const ?? true
  if (constraint.enum?.length) return constraint.enum[0]
  return constraint.minimum ?? 0
}

function expectRejected(
  requestedToolName: string,
  request: unknown,
  expectedCodes: string[],
): void {
  const result = validateProfessionalToolOperationRequest(requestedToolName, request)
  check(!result.ok, `${requestedToolName} adversarial request must be rejected.`)
  if (result.ok) return
  const actualCodes = new Set(result.errors.map((item) => item.code))
  check(
    expectedCodes.some((code) => actualCodes.has(code as never)),
    `${requestedToolName} rejection must include one of ${expectedCodes.join(', ')}; got ${[...actualCodes].join(', ')}.`,
  )
}
