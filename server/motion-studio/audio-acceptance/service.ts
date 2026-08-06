import type {
  CreateMotionStudioAudioIntegrationBindingRequestV1,
  CreateMotionStudioAudioSelectionRequestV1,
  MotionStudioAudioIntegrationBindingReceiptDtoV1,
  MotionStudioAudioSelectionCommitReceiptDtoV1,
  MotionStudioAudioSelectionManifestV1,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import {
  canonicalMotionStudioAudioIntegrationBindingReceiptSchema,
  canonicalMotionStudioAudioSelectionCommitReceiptSchema,
  canonicalMotionStudioAudioSelectionPreparedSourceSchema,
  createMotionStudioAudioIntegrationBindingRequestV1Schema,
  createMotionStudioAudioSelectionRequestV1Schema,
  motionStudioAudioIntegrationBindingReceiptDtoV1Schema,
  motionStudioAudioSelectionCommitReceiptDtoV1Schema,
} from '../../validation/motion-studio-audio-acceptance-schemas'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioProductionRow } from '../commands/types'
import { compileMotionStudioAudioSelectionManifestV1 } from '../audio-production/audio-acceptance-compiler'
import { createSupabaseMotionStudioAudioMixRepository } from '../audio-production/repository'
import type {
  CanonicalMotionStudioAudioSelectionScope,
  CanonicalMotionStudioAudioSelectionTransitionPort,
} from './canonical-audio-selection-transition-port'

const PRIVATE_WARNING =
  'Private Storytelling audio selection and integration only. Provider calls, timeline mutation, video mux, render, export, billing, customer pricing, credits, deployment, and public delivery remain disabled.'

export interface MotionStudioAudioSelectionProductionReaderPort {
  findProduction(productionId: string): Promise<MotionStudioProductionRow | undefined>
}

export interface MotionStudioAudioAcceptanceServiceOptions {
  productionReader?: MotionStudioAudioSelectionProductionReaderPort
  transitionPort?: CanonicalMotionStudioAudioSelectionTransitionPort
  now?: () => Date
}

export class MotionStudioAudioAcceptanceService {
  private readonly actorUserId: string
  private readonly productionReader: MotionStudioAudioSelectionProductionReaderPort
  private readonly transitionPort?: CanonicalMotionStudioAudioSelectionTransitionPort
  private readonly now: () => Date

  constructor(
    context: ServiceContext,
    options: MotionStudioAudioAcceptanceServiceOptions = {},
  ) {
    this.actorUserId = requireVerifiedUser(context)
    this.productionReader = options.productionReader ??
      createSupabaseMotionStudioAudioMixRepository(ensureAdminClient(context))
    this.transitionPort = options.transitionPort ??
      context.canonicalMotionStudioAudioSelectionTransitionPort
    this.now = options.now ?? (() => new Date())
  }

  async createSelection(
    productionId: string,
    rawRequest: CreateMotionStudioAudioSelectionRequestV1,
    rawIdempotencyKey: string,
  ) {
    const request = createMotionStudioAudioSelectionRequestV1Schema.parse(rawRequest)
    const production = await this.requireOwnedProduction(productionId)
    const scope = productionScope(production)
    const port = this.requireTransitionPort()
    const idempotencyKey = requireIdempotencyKey(rawIdempotencyKey)
    const requestHash = sha256CanonicalJson({
      operation: 'create_motion_studio_audio_selection_v1',
      actorUserId: this.actorUserId,
      scope,
      request,
    })
    const replayInput = await port.findExplicitSelectionReplay({
      scope,
      actorUserId: this.actorUserId,
      request,
      requestHash,
      idempotencyKey,
    })
    if (replayInput) {
      const replay = parseSelectionCommitReceipt(replayInput)
      if (replay.idempotencyStatus !== 'exact_replay') {
        blocked(
          'The canonical audio-selection replay did not retain exact idempotency status.',
          'canonical_motion_studio_audio_selection_idempotency',
        )
      }
      assertExplicitSelectionMatchesRequest({
        scope,
        actorUserId: this.actorUserId,
        selectedAt: replay.selectionManifest.selectedAt,
        request,
        manifest: replay.selectionManifest,
      })
      assertSelectionCommitReceipt({
        scope,
        requestHash,
        sourceAuthorityDigest: replay.sourceAuthorityDigest,
        manifest: replay.selectionManifest,
        manifestDigest: replay.selectionManifestDigest,
        receipt: replay,
      })
      return {
        data: { selection: projectSelectionReceipt(replay) },
        warnings: [PRIVATE_WARNING],
      }
    }
    const selectedAt = this.now().toISOString()
    const preparedInput = await port.prepareExplicitSelection({
      scope,
      actorUserId: this.actorUserId,
      selectedAt,
      request,
    })
    if (!preparedInput) {
      blocked(
        'The released MS-012C/MS-012D candidate and current approved-snapshot authority are not ready for explicit selection.',
        'canonical_motion_studio_audio_selection_source',
      )
    }
    const prepared = parsePreparedSource(preparedInput)
    let compiled: ReturnType<typeof compileMotionStudioAudioSelectionManifestV1>
    try {
      compiled = compileMotionStudioAudioSelectionManifestV1(prepared.compilerInput)
    } catch {
      blocked(
        'The canonical audio-selection source failed exact evidence, cost, timing, or dependency compilation.',
        'canonical_motion_studio_audio_selection_compilation',
      )
    }
    assertExplicitSelectionMatchesRequest({
      scope,
      actorUserId: this.actorUserId,
      selectedAt,
      request,
      manifest: compiled.manifest,
    })
    const receiptInput = await port.commitExplicitSelection({
      scope,
      actorUserId: this.actorUserId,
      request,
      requestHash,
      idempotencyKey,
      sourceAuthorityDigest: prepared.sourceAuthorityDigest,
      selectionManifest: compiled.manifest,
      selectionManifestDigest: compiled.manifestDigest,
    })
    const receipt = parseSelectionCommitReceipt(receiptInput)
    assertSelectionCommitReceipt({
      scope,
      requestHash,
      sourceAuthorityDigest: prepared.sourceAuthorityDigest,
      manifest: compiled.manifest,
      manifestDigest: compiled.manifestDigest,
      receipt,
    })
    return {
      data: {
        selection: projectSelectionReceipt(receipt),
      },
      warnings: [PRIVATE_WARNING],
    }
  }

  async createIntegrationBinding(
    productionId: string,
    rawRequest: CreateMotionStudioAudioIntegrationBindingRequestV1,
    rawIdempotencyKey: string,
  ) {
    const request = createMotionStudioAudioIntegrationBindingRequestV1Schema.parse(rawRequest)
    const production = await this.requireOwnedProduction(productionId)
    const scope = productionScope(production)
    const port = this.requireTransitionPort()
    const idempotencyKey = requireIdempotencyKey(rawIdempotencyKey)
    const requestHash = sha256CanonicalJson({
      operation: 'create_motion_studio_audio_integration_binding_v1',
      actorUserId: this.actorUserId,
      scope,
      request,
    })
    const receiptInput = await port.createOrReplayIntegrationBinding({
      scope,
      actorUserId: this.actorUserId,
      request,
      requestHash,
      idempotencyKey,
    })
    const receipt = parseIntegrationBindingReceipt(receiptInput)
    if (
      !sameScope(scope, receipt) ||
      receipt.requestedByActorId !== this.actorUserId ||
      receipt.requestHash !== requestHash ||
      receipt.selectionManifestId !== request.selectionManifestId ||
      receipt.selectionManifestVersion !== request.selectionManifestVersion ||
      receipt.selectionManifestDigest !== request.selectionManifestDigest
    ) {
      blocked(
        'The canonical audio-integration binding changed selection or named-edit authority.',
        'canonical_motion_studio_audio_integration_binding',
      )
    }
    return {
      data: {
        binding: projectIntegrationBindingReceipt(receipt),
      },
      warnings: [PRIVATE_WARNING],
    }
  }

  private requireTransitionPort(): CanonicalMotionStudioAudioSelectionTransitionPort {
    if (!this.transitionPort) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Storytelling audio selection is waiting for the canonical atomic selection and work-graph adapter.',
        503,
        { requiredGate: 'canonical_motion_studio_audio_selection_transition_port' },
      )
    }
    return this.transitionPort
  }

  private async requireOwnedProduction(productionId: string): Promise<MotionStudioProductionRow> {
    const production = await this.productionReader.findProduction(productionId)
    if (!production || production.module_id !== 'storytelling') {
      throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Storytelling production was not found.', 404)
    }
    if (production.owner_id !== this.actorUserId) {
      throw new ApiError(
        'WORKSPACE_ACCESS_DENIED',
        'This private Storytelling audio production belongs to another workspace member.',
        403,
      )
    }
    if (production.status === 'archived') {
      blocked(
        'Archived Storytelling productions cannot change audio selection or integration.',
        'motion_studio_storytelling_production_current',
      )
    }
    return production
  }
}

export function createMotionStudioAudioAcceptanceService(context: ServiceContext) {
  return new MotionStudioAudioAcceptanceService(context)
}

function assertExplicitSelectionMatchesRequest(input: {
  scope: CanonicalMotionStudioAudioSelectionScope
  actorUserId: string
  selectedAt: string
  request: CreateMotionStudioAudioSelectionRequestV1
  manifest: MotionStudioAudioSelectionManifestV1
}): void {
  const { manifest, request } = input
  if (
    !sameScope(input.scope, manifest) ||
    manifest.selectedByActorId !== input.actorUserId ||
    manifest.selectedAt !== input.selectedAt ||
    manifest.decisionReason !== request.decisionReason ||
    manifest.selectionManifestVersion !==
      request.expectedCurrentSelection.nextSelectionManifestVersion
  ) {
    blocked(
      'The canonical audio selection changed actor, scope, reason, timestamp, or compare-and-swap version.',
      'canonical_motion_studio_audio_selection_request_match',
    )
  }
  if (request.expectedCurrentSelection.state === 'none') {
    if (manifest.supersedesSelectionManifestId !== undefined) {
      blocked(
        'The first audio selection cannot silently supersede another manifest.',
        'canonical_motion_studio_audio_selection_compare_and_swap',
      )
    }
  } else if (
    manifest.supersedesSelectionManifestId !==
    request.expectedCurrentSelection.selectionManifestId
  ) {
    blocked(
      'The replacement audio selection does not supersede the exact expected manifest.',
      'canonical_motion_studio_audio_selection_compare_and_swap',
    )
  }

  const narrationBySegment = new Map(
    manifest.selectedNarration.map((selection) => [selection.voiceSegmentId, selection]),
  )
  if (narrationBySegment.size !== request.narrationChoices.length) {
    autoSelectionBlocked()
  }
  for (const choice of request.narrationChoices) {
    const selected = narrationBySegment.get(choice.voiceSegmentId)
    if (
      !selected ||
      selected.selectedTakeId !== choice.selectedTakeId ||
      selected.candidateAuthority.candidateId !== choice.selectedTakeId ||
      selected.selectionMethod !== 'explicit_human_review' ||
      selected.firstOrOnlyTakeAutoSelected !== false ||
      selected.selectedByActorId !== input.actorUserId ||
      selected.selectedAt !== input.selectedAt ||
      selected.decisionReason !== choice.decisionReason
    ) autoSelectionBlocked()
  }

  const roles = new Map(manifest.optionalRoleDecisions.map((decision) => [decision.role, decision]))
  if (roles.size !== request.optionalRoleDecisions.length) autoSelectionBlocked()
  for (const requested of request.optionalRoleDecisions) {
    const selected = roles.get(requested.role)
    if (
      !selected ||
      selected.decision !== requested.decision ||
      selected.decidedByActorId !== input.actorUserId ||
      selected.decidedAt !== input.selectedAt ||
      selected.reason !== requested.decisionReason
    ) autoSelectionBlocked()
    const actualCandidateIds = selected.selections.map((selection) => selection.candidateId)
    if (!sameSet(actualCandidateIds, requested.candidateIds)) autoSelectionBlocked()
    for (const stem of selected.selections) {
      if (
        stem.selectionMethod !== 'explicit_human_review' ||
        stem.autoSelected !== false ||
        stem.selectedByActorId !== input.actorUserId ||
        stem.selectedAt !== input.selectedAt ||
        stem.decisionReason !== requested.decisionReason
      ) autoSelectionBlocked()
    }
  }
}

function assertSelectionCommitReceipt(input: {
  scope: CanonicalMotionStudioAudioSelectionScope
  requestHash: string
  sourceAuthorityDigest: string
  manifest: MotionStudioAudioSelectionManifestV1
  manifestDigest: string
  receipt: ReturnType<typeof canonicalMotionStudioAudioSelectionCommitReceiptSchema.parse>
}): void {
  if (
    !sameScope(input.scope, input.receipt) ||
    input.receipt.requestHash !== input.requestHash ||
    input.receipt.sourceAuthorityDigest !== input.sourceAuthorityDigest ||
    input.receipt.selectionManifestDigest !== input.manifestDigest ||
    sha256CanonicalJson(input.receipt.selectionManifest) !== input.manifestDigest ||
    sha256CanonicalJson(input.receipt.selectionManifest) !==
      sha256CanonicalJson(input.manifest)
  ) {
    blocked(
      'The committed audio selection failed exact atomic readback verification.',
      'canonical_motion_studio_audio_selection_commit_readback',
    )
  }
}

function projectSelectionReceipt(
  receipt: ReturnType<typeof canonicalMotionStudioAudioSelectionCommitReceiptSchema.parse>,
): MotionStudioAudioSelectionCommitReceiptDtoV1 {
  const manifest = receipt.selectionManifest
  return motionStudioAudioSelectionCommitReceiptDtoV1Schema.parse({
    schemaVersion: 'motion-studio.audio-selection-commit-receipt.dto.v1',
    productionId: manifest.productionId,
    selectionManifestId: manifest.selectionManifestId,
    selectionManifestVersion: manifest.selectionManifestVersion,
    selectionManifestDigest: receipt.selectionManifestDigest,
    approvedSnapshotId: manifest.approvedSnapshotId,
    approvedSnapshotDigest: manifest.approvedSnapshotDigest,
    state: 'selected_pending_integration',
    selectedNarrationSegmentCount: manifest.selectedNarration.length,
    selectedOptionalStemCount: manifest.optionalRoleDecisions.reduce(
      (count, decision) => count + decision.selections.length,
      0,
    ),
    optionalRoleDecisions: manifest.optionalRoleDecisions.map((decision) => ({
      role: decision.role,
      decision: decision.decision,
      selectedCandidateCount: decision.selections.length,
    })),
    idempotencyStatus: receipt.idempotencyStatus,
    immutable: true,
    selectionExplicit: true,
    firstOrOnlyCandidateAutoSelected: false,
    mixStarted: false,
    timelineMutationPerformed: false,
    renderPerformed: false,
    exportPerformed: false,
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationPerformed: false,
    billingMutationPerformed: false,
  })
}

function projectIntegrationBindingReceipt(
  receipt: ReturnType<typeof canonicalMotionStudioAudioIntegrationBindingReceiptSchema.parse>,
): MotionStudioAudioIntegrationBindingReceiptDtoV1 {
  const initialStatuses = new Set(['blocked', 'queued', 'ready'])
  return motionStudioAudioIntegrationBindingReceiptDtoV1Schema.parse({
    schemaVersion: 'motion-studio.audio-integration-binding-receipt.dto.v1',
    productionId: receipt.productionId,
    bindingId: receipt.bindingId,
    selectionManifestId: receipt.selectionManifestId,
    selectionManifestVersion: receipt.selectionManifestVersion,
    selectionManifestDigest: receipt.selectionManifestDigest,
    approvedSnapshotId: receipt.approvedSnapshotId,
    approvedSnapshotDigest: receipt.approvedSnapshotDigest,
    state: receipt.jobs.every((job) => initialStatuses.has(job.status))
      ? 'queued_private_audio_integration'
      : 'resumable_private_audio_integration',
    jobs: receipt.jobs.map((job) => ({
      stage: job.stage,
      jobId: job.jobId,
      status: job.status,
      dependencyJobIds: job.dependencyJobIds,
    })),
    idempotencyStatus: receipt.idempotencyStatus,
    canonicalPackageQueue: true,
    selectionRevalidated: true,
    existingReservationReused: true,
    graphCreatedAtomically: true,
    automaticCandidateSelectionPerformed: false,
    providerCallPerformed: false,
    timelineMutationPerformed: false,
    videoMuxPerformed: false,
    renderPerformed: false,
    exportPerformed: false,
    publicDeliveryPerformed: false,
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationPerformed: false,
    billingMutationPerformed: false,
  })
}

function parsePreparedSource(input: unknown) {
  const parsed = canonicalMotionStudioAudioSelectionPreparedSourceSchema.safeParse(input)
  if (!parsed.success) {
    blocked(
      'The canonical audio-selection source returned an invalid or unreleased authority envelope.',
      'canonical_motion_studio_audio_selection_source',
    )
  }
  return parsed.data
}

function parseSelectionCommitReceipt(input: unknown) {
  const parsed = canonicalMotionStudioAudioSelectionCommitReceiptSchema.safeParse(input)
  if (!parsed.success) {
    blocked(
      'The canonical audio-selection transaction did not return a valid immutable receipt.',
      'canonical_motion_studio_audio_selection_commit',
    )
  }
  return parsed.data
}

function parseIntegrationBindingReceipt(input: unknown) {
  const parsed = canonicalMotionStudioAudioIntegrationBindingReceiptSchema.safeParse(input)
  if (!parsed.success) {
    blocked(
      'The canonical audio-integration transaction did not return the exact two-job work graph.',
      'canonical_motion_studio_audio_integration_binding',
    )
  }
  return parsed.data
}

function productionScope(
  production: MotionStudioProductionRow,
): CanonicalMotionStudioAudioSelectionScope {
  return {
    workspaceId: production.workspace_id,
    projectId: production.project_id,
    editSessionId: production.edit_session_id,
    productionId: production.id,
  }
}

function sameScope(
  expected: CanonicalMotionStudioAudioSelectionScope,
  actual: CanonicalMotionStudioAudioSelectionScope,
): boolean {
  return expected.workspaceId === actual.workspaceId &&
    expected.projectId === actual.projectId &&
    expected.editSessionId === actual.editSessionId &&
    expected.productionId === actual.productionId
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return new Set(left).size === left.length && new Set(right).size === right.length &&
    left.length === right.length && left.every((value) => right.includes(value))
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError(
      'AUTH_INVALID',
      'Private Storytelling audio selection requires a verified bearer identity.',
      401,
    )
  }
  return userId
}

function requireIdempotencyKey(value: string): string {
  const key = value.trim()
  if (
    key.length < 8 || key.length > 240 ||
    Array.from(key).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A stable audio-transition idempotency key is required.', 400)
  }
  return key
}

function autoSelectionBlocked(): never {
  blocked(
    'Canonical audio selection must match only the candidates the user explicitly chose.',
    'canonical_motion_studio_audio_explicit_human_selection',
  )
}

function blocked(message: string, requiredGate: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, { requiredGate })
}
