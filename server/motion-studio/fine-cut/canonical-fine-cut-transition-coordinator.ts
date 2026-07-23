import { ApiError } from '../../errors/api-error'
import {
  canonicalMotionStudioFineCutAuthorizationV1Schema,
  canonicalMotionStudioFineCutCommitReceiptV1Schema,
  createCanonicalMotionStudioFineCutRequestV1Schema,
  type CanonicalMotionStudioFineCutCommitReceiptV1,
  type CreateCanonicalMotionStudioFineCutRequestV1,
} from '../../validation/motion-studio-fine-cut-transition-schemas'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  compileMotionStudioFineCutManifestV1,
  type MotionStudioFineCutCompilerResultV1,
} from './compiler'
import type {
  CanonicalMotionStudioFineCutAuthorizationV1,
} from '../../validation/motion-studio-fine-cut-transition-schemas'
import type {
  CanonicalMotionStudioFineCutScope,
  CanonicalMotionStudioFineCutTransitionPort,
} from './canonical-fine-cut-transition-port'

export interface CreateOrReplayCanonicalMotionStudioFineCutInputV1 {
  scope: CanonicalMotionStudioFineCutScope
  actorUserId: string
  request: unknown
  idempotencyKey: string
}

export class CanonicalMotionStudioFineCutTransitionCoordinator {
  private readonly port: CanonicalMotionStudioFineCutTransitionPort
  private readonly now: () => Date

  constructor(
    port: CanonicalMotionStudioFineCutTransitionPort,
    now: () => Date = () => new Date(),
  ) {
    this.port = port
    this.now = now
  }

  async createOrReplayFineCut(
    input: CreateOrReplayCanonicalMotionStudioFineCutInputV1,
  ): Promise<CanonicalMotionStudioFineCutCommitReceiptV1> {
    const request = createCanonicalMotionStudioFineCutRequestV1Schema.parse(input.request)
    const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
    assertScope(input.scope)
    assertIdentity(input.actorUserId, 'actorUserId')

    // Authorization deliberately precedes replay and every authoritative read.
    const authorization = canonicalMotionStudioFineCutAuthorizationV1Schema.parse(
      await this.port.authorizeScope({
        scope: input.scope,
        actorUserId: input.actorUserId,
        access: 'write',
      }),
    )
    assertAuthorization(input.scope, input.actorUserId, authorization)
    const authorizationDigest = sha256CanonicalJson(authorization)
    const requestHash = sha256CanonicalJson({
      operation: 'create_or_replay_canonical_motion_studio_fine_cut_v1',
      scope: input.scope,
      actorUserId: input.actorUserId,
      request,
    })

    const replayInput = await this.port.findFineCutReplay({
      authorization,
      authorizationDigest,
      actorUserId: input.actorUserId,
      request,
      requestHash,
      idempotencyKey,
    })
    if (replayInput) {
      const replay = canonicalMotionStudioFineCutCommitReceiptV1Schema.parse(replayInput)
      if (replay.idempotencyStatus !== 'exact_replay') {
        blocked('Fine Cut replay did not retain exact idempotency status.')
      }
      assertCommitReceipt({
        scope: input.scope,
        actorUserId: input.actorUserId,
        authorization,
        authorizationDigest,
        requestHash,
        request,
        receipt: replay,
      })
      return replay
    }

    const compiledAt = this.now().toISOString()
    const prepared = await this.port.prepareCurrentFineCutSource({
      authorization,
      authorizationDigest,
      actorUserId: input.actorUserId,
      request,
      compiledAt,
    })
    if (!prepared) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'The exact released Storytelling snapshot, timeline, audio, assets, QA, rights and cost authority are not ready for Fine Cut.',
        503,
        { requiredGate: 'canonical_motion_studio_fine_cut_released_source' },
      )
    }
    if (
      prepared.schemaVersion !== 'canonical-motion-studio-fine-cut-prepared-source-v1' ||
      prepared.authorizationDigest !== authorizationDigest ||
      prepared.evidenceClass !== 'canonical_backend_verified_runtime' ||
      prepared.releaseClass !== 'private_fine_cut_release' ||
      prepared.exactCurrentAuthorityReverified !== true ||
      prepared.approvedSnapshotReverified !== true ||
      prepared.timelineRenderAndAudioReverified !== true ||
      prepared.requiredAssetsQaRightsAndCostReverified !== true ||
      prepared.compilerInput.compiledAt !== compiledAt ||
      prepared.compilerInput.sourceRevalidation.sourceAuthorityDigest !==
        prepared.sourceAuthorityDigest
    ) {
      blocked('Fine Cut source preparation did not preserve exact released authority.')
    }

    let compiled: MotionStudioFineCutCompilerResultV1
    try {
      compiled = compileMotionStudioFineCutManifestV1(prepared.compilerInput)
    } catch {
      blocked('Fine Cut source failed strict current-authority compilation.')
    }
    assertCompiledManifest({
      scope: input.scope,
      authorization,
      request,
      compiled,
    })
    const receipt = canonicalMotionStudioFineCutCommitReceiptV1Schema.parse(
      await this.port.commitFineCut({
        authorization,
        authorizationDigest,
        actorUserId: input.actorUserId,
        request,
        requestHash,
        idempotencyKey,
        sourceAuthorityDigest: prepared.sourceAuthorityDigest,
        manifest: compiled.manifest,
        manifestDigest: compiled.manifestDigest,
      }),
    )
    if (receipt.idempotencyStatus !== 'inserted') {
      blocked('A new Fine Cut transaction returned a non-insert disposition.')
    }
    assertCommitReceipt({
      scope: input.scope,
      actorUserId: input.actorUserId,
      authorization,
      authorizationDigest,
      requestHash,
      request,
      receipt,
      sourceAuthorityDigest: prepared.sourceAuthorityDigest,
      compiled,
    })
    return receipt
  }
}

function assertCompiledManifest(input: {
  scope: CanonicalMotionStudioFineCutScope
  authorization: CanonicalMotionStudioFineCutAuthorizationV1
  request: CreateCanonicalMotionStudioFineCutRequestV1
  compiled: MotionStudioFineCutCompilerResultV1
}): void {
  const manifest = input.compiled.manifest
  if (
    !sameScope(input.scope, manifest) ||
    manifest.productionRecordVersion !== input.authorization.productionRecordVersion ||
    sha256CanonicalJson(manifest) !== input.compiled.manifestDigest
  ) blocked('Compiled Fine Cut changed exact production ownership or digest authority.')

  const expected = input.request.expectedCurrentFineCut
  if (expected.state === 'none') {
    if (
      manifest.fineCutVersion !== 1 ||
      manifest.supersedesFineCutVersionId !== undefined
    ) blocked('The initial Fine Cut failed its from-empty compare-and-swap authority.')
    return
  }
  if (
    manifest.fineCutId !== expected.fineCutId ||
    manifest.fineCutVersion !== expected.nextFineCutVersion ||
    manifest.supersedesFineCutVersionId !== expected.fineCutVersionId
  ) blocked('The successor Fine Cut failed exact compare-and-swap lineage.')
}

function assertCommitReceipt(input: {
  scope: CanonicalMotionStudioFineCutScope
  actorUserId: string
  authorization: CanonicalMotionStudioFineCutAuthorizationV1
  authorizationDigest: string
  requestHash: string
  request: CreateCanonicalMotionStudioFineCutRequestV1
  receipt: CanonicalMotionStudioFineCutCommitReceiptV1
  sourceAuthorityDigest?: string
  compiled?: MotionStudioFineCutCompilerResultV1
}): void {
  const receipt = input.receipt
  if (
    !sameScope(input.scope, receipt) ||
    receipt.actorUserId !== input.actorUserId ||
    receipt.fineCutManifest.productionRecordVersion !==
      input.authorization.productionRecordVersion ||
    receipt.authorizationDigest !== input.authorizationDigest ||
    receipt.requestHash !== input.requestHash ||
    sha256CanonicalJson(receipt.fineCutManifest) !== receipt.fineCutManifestDigest ||
    receipt.sourceAuthorityDigest !== receipt.fineCutManifest.sourceAuthorityDigest ||
    (input.sourceAuthorityDigest !== undefined &&
      receipt.sourceAuthorityDigest !== input.sourceAuthorityDigest) ||
    (input.compiled !== undefined &&
      (receipt.fineCutManifestDigest !== input.compiled.manifestDigest ||
        sha256CanonicalJson(receipt.fineCutManifest) !==
          sha256CanonicalJson(input.compiled.manifest)))
  ) blocked('Committed Fine Cut failed exact atomic readback verification.')
  assertRequestLineage(input.request, receipt)
}

function assertRequestLineage(
  request: CreateCanonicalMotionStudioFineCutRequestV1,
  receipt: CanonicalMotionStudioFineCutCommitReceiptV1,
): void {
  const manifest = receipt.fineCutManifest
  const expected = request.expectedCurrentFineCut
  if (expected.state === 'none') {
    if (manifest.fineCutVersion !== 1 || manifest.supersedesFineCutVersionId) {
      blocked('Committed Fine Cut no longer matches the expected empty current state.')
    }
    return
  }
  if (
    manifest.fineCutId !== expected.fineCutId ||
    manifest.fineCutVersion !== expected.nextFineCutVersion ||
    manifest.supersedesFineCutVersionId !== expected.fineCutVersionId
  ) blocked('Committed Fine Cut no longer matches the expected successor lineage.')
}

function assertAuthorization(
  scope: CanonicalMotionStudioFineCutScope,
  actorUserId: string,
  authorization: CanonicalMotionStudioFineCutAuthorizationV1,
): void {
  if (
    !sameScope(scope, authorization) ||
    authorization.actorUserId !== actorUserId ||
    authorization.authorizationBeforeIdempotency !== true ||
    authorization.exactStorytellingProductionReverified !== true
  ) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Fine Cut authorization does not match this exact Storytelling production.',
      403,
    )
  }
}

function sameScope(
  expected: CanonicalMotionStudioFineCutScope,
  actual: CanonicalMotionStudioFineCutScope,
): boolean {
  return expected.workspaceId === actual.workspaceId &&
    expected.projectId === actual.projectId &&
    expected.editSessionId === actual.editSessionId &&
    expected.productionId === actual.productionId
}

function assertScope(scope: CanonicalMotionStudioFineCutScope): void {
  assertIdentity(scope.workspaceId, 'workspaceId')
  assertIdentity(scope.projectId, 'projectId')
  assertIdentity(scope.editSessionId, 'editSessionId')
  assertIdentity(scope.productionId, 'productionId')
}

function assertIdentity(value: string, field: string): void {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u.test(value) ||
    value.includes('..')
  ) {
    throw new ApiError('VALIDATION_FAILED', `Invalid ${field}.`, 400)
  }
}

function requireIdempotencyKey(value: string): string {
  const key = value.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/u.test(key) || key.includes('..')) {
    throw new ApiError('VALIDATION_FAILED', 'A bounded idempotency key is required.', 400)
  }
  return key
}

function blocked(message: string): never {
  throw new ApiError(
    'MOTION_STUDIO_APPROVAL_BLOCKED',
    message,
    409,
    { requiredGate: 'canonical_motion_studio_fine_cut_transition' },
  )
}
