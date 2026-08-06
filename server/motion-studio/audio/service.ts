import { motionStudioAudioWorkspaceDtoSchema } from '../../../src/lib/motion-studio/contracts'
import type { MotionStudioAudioWorkspaceDto } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createSupabaseMotionStudioAudioRepository } from './repository'
import type {
  CompiledMotionStudioAudioAuthority,
  MotionStudioAudioRepository,
} from './types'

const INTERNAL_PERSISTENCE_PATH = '/v1/internal/motion-studio/audio-authorities'
const REVIEW_ONLY_WARNING = 'Audio is planned and reviewable only. No provider, media, alignment, mix, timeline, render, billing, pricing, or credit execution occurred.'

export const MOTION_STUDIO_AUDIO_EXECUTION_BOUNDARY = Object.freeze({
  localFixtureOnly: true as const,
  browserAudioWriteAllowed: false as const,
  providerCallMade: false as const,
  mediaExecutionPerformed: false as const,
  alignmentExecutionPerformed: false as const,
  mixExecutionPerformed: false as const,
  timelineMutationPerformed: false as const,
  renderPerformed: false as const,
  providerCostMicros: 0 as const,
  maximumAuthorizedProviderCostMicros: 0 as const,
  customerPricingIncluded: false as const,
  customerCreditsIncluded: false as const,
})

export class MotionStudioAudioService {
  private readonly actorUserId: string
  private readonly repository: MotionStudioAudioRepository

  constructor(context: ServiceContext, repository?: MotionStudioAudioRepository) {
    this.actorUserId = requireVerifiedUser(context)
    this.repository = repository ?? createSupabaseMotionStudioAudioRepository(ensureAdminClient(context))
  }

  async getWorkspace(productionId: string) {
    const audioWorkspace = await this.repository.getWorkspace({
      productionId,
      actorUserId: this.actorUserId,
    })
    assertWorkspaceBoundary(audioWorkspace)
    return {
      data: {
        audioWorkspace,
        executionBoundary: MOTION_STUDIO_AUDIO_EXECUTION_BOUNDARY,
      },
      warnings: [REVIEW_ONLY_WARNING],
    }
  }

  /**
   * Internal-only fixture seam. It is deliberately not mounted as an HTTP
   * route: the browser cannot author bundle, provider, media, QA, or cost
   * authority. A server compiler must produce the exact validated bundle.
   */
  async persistServerCompiledAuthority(
    compiled: CompiledMotionStudioAudioAuthority,
    idempotencyKey: string,
  ) {
    assertCompiledBoundary(compiled, this.actorUserId)
    const requestHash = sha256CanonicalJson({
      method: 'POST',
      path: INTERNAL_PERSISTENCE_PATH,
      inputDigest: compiled.inputDigest,
      outputDigest: compiled.outputDigest,
    })
    const receipt = await this.repository.persistAuthority({
      ...compiled,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    if (
      receipt.productionId !== compiled.bundle.productionId ||
      receipt.approvedSnapshotId !== compiled.bundle.approvedSnapshotId ||
      receipt.preparedScriptVersionId !== compiled.bundle.preparedScriptArtifactVersion.versionId ||
      receipt.voiceBibleVersionId !== compiled.bundle.voiceBible.voiceBibleArtifactVersion.versionId ||
      receipt.musicBibleVersionId !== compiled.bundle.musicBible.musicBibleArtifactVersion.versionId ||
      receipt.mixPlanVersionId !== compiled.bundle.mixPlan.mixPlanArtifactVersion.versionId ||
      receipt.inputDigest !== compiled.inputDigest ||
      receipt.outputDigest !== compiled.outputDigest ||
      receipt.providerCostMicros !== 0 || receipt.providerCallMade ||
      receipt.mediaExecutionPerformed || receipt.customerPricingIncluded ||
      receipt.customerCreditsIncluded || !receipt.localFixtureOnly
    ) internalInvalid('Audio persistence receipt changed exact compiler authority or execution boundary.')
    return receipt
  }
}

export function createMotionStudioAudioService(context: ServiceContext) {
  return new MotionStudioAudioService(context)
}

function assertWorkspaceBoundary(workspace: MotionStudioAudioWorkspaceDto): void {
  const parsed = motionStudioAudioWorkspaceDtoSchema.safeParse(workspace)
  if (!parsed.success) internalInvalid('Audio workspace did not satisfy the strict browser-safe contract.')
  if (
    workspace.state !== 'review_only' ||
    !workspace.audioAuthority.executionBoundary.localFixtureOnly ||
    workspace.audioAuthority.executionBoundary.providerCallMade ||
    workspace.audioAuthority.executionBoundary.mediaExecutionPerformed ||
    workspace.audioAuthority.executionBoundary.alignmentExecutionPerformed ||
    workspace.audioAuthority.executionBoundary.mixExecutionPerformed ||
    workspace.audioAuthority.executionBoundary.timelineMutationPerformed ||
    workspace.audioAuthority.executionBoundary.renderPerformed ||
    workspace.audioAuthority.executionBoundary.providerCostMicros !== 0 ||
    workspace.audioAuthority.executionBoundary.maximumAuthorizedProviderCostMicros !== 0 ||
    workspace.audioAuthority.executionBoundary.customerPricingIncluded ||
    workspace.audioAuthority.executionBoundary.customerCreditsIncluded
  ) internalInvalid('Audio workspace exceeded the local review-only boundary.')
}

function assertCompiledBoundary(
  compiled: CompiledMotionStudioAudioAuthority,
  actorUserId: string,
): void {
  if (
    compiled.providerCallMade || compiled.mediaExecutionPerformed ||
    compiled.providerCostMicros !== 0 || compiled.customerPricingIncluded ||
    compiled.customerCreditsIncluded ||
    compiled.bundle.takeSelections.some((selection) => selection.selectedByActorId !== actorUserId)
  ) internalInvalid('Server-compiled audio authority exceeded its zero-execution fixture boundary.')
  assertWorkspaceBoundary({
    workspaceId: compiled.bundle.workspaceId,
    projectId: compiled.bundle.projectId,
    editSessionId: compiled.bundle.editSessionId,
    productionId: compiled.bundle.productionId,
    audioAuthority: compiled.bundle,
    state: 'review_only',
    warning: REVIEW_ONLY_WARNING,
  })
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Storytelling audio authority requires a verified bearer identity.', 401)
  }
  return userId
}

function internalInvalid(message: string): never {
  throw new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
