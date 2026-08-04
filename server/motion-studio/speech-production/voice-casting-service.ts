import type {
  ApplyMotionStudioCommandRequest,
  MotionStudioArtifactDto,
  MotionStudioProductionDto,
  MotionStudioVoiceCastingWorkspaceDto,
  SelectMotionStudioNarratorForPlanningRequest,
} from '../../../src/types/motion-studio'
import {
  motionStudioVoiceBibleSchema,
  motionStudioVoiceCastingWorkspaceDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createMotionStudioCommandService, type MotionStudioCommandService } from '../commands'
import {
  loadMotionStudioVoiceCastingCatalogProjection,
  type MotionStudioVoiceCastingCatalogProjection,
} from './voice-casting-catalog'

const VOICE_CASTING_WARNING =
  'Narrator choice updates the Voice Bible draft only. No plan approval, provider call, speech generation, customer-credit change, timeline mutation, render, export, or delivery occurs.'

type VoiceCastingCommandAuthority = Pick<
  MotionStudioCommandService,
  'getProductionById' | 'getArtifactByKind' | 'applyCommand'
>

export interface MotionStudioVoiceCastingServiceDependencies {
  commandAuthority?: VoiceCastingCommandAuthority
  loadCatalog?: () => Promise<MotionStudioVoiceCastingCatalogProjection>
}

export class MotionStudioVoiceCastingService {
  private readonly commandAuthority: VoiceCastingCommandAuthority
  private readonly loadCatalog: () => Promise<MotionStudioVoiceCastingCatalogProjection>

  constructor(context: ServiceContext, dependencies: MotionStudioVoiceCastingServiceDependencies = {}) {
    this.commandAuthority = dependencies.commandAuthority ?? createMotionStudioCommandService(context)
    this.loadCatalog = dependencies.loadCatalog ?? (() =>
      loadMotionStudioVoiceCastingCatalogProjection(process.cwd()))
  }

  async getWorkspace(productionId: string) {
    const production = (await this.commandAuthority.getProductionById(productionId)).data.production
    const voiceBibleArtifact = await this.readVoiceBibleArtifact(productionId)
    const workspace = await this.compileWorkspace(production, voiceBibleArtifact)
    return { data: { voiceCastingWorkspace: workspace }, warnings: [VOICE_CASTING_WARNING] }
  }

  async selectNarratorForPlanning(
    productionId: string,
    request: SelectMotionStudioNarratorForPlanningRequest,
    idempotencyKey: string,
  ) {
    const production = (await this.commandAuthority.getProductionById(productionId)).data.production
    const voiceBibleArtifact = await this.readVoiceBibleArtifact(productionId)
    const workspace = await this.compileWorkspace(production, voiceBibleArtifact)
    if (
      !workspace.selectionAllowed ||
      !workspace.catalogVersion ||
      !workspace.voiceBible?.currentDraftVersion ||
      !voiceBibleArtifact?.currentDraft
    ) {
      throw new ApiError(
        'MOTION_STUDIO_APPROVAL_BLOCKED',
        'Narrator direction cannot change until one editable generated-speech Voice Bible draft and its safe catalog are available.',
        409,
      )
    }
    if (request.catalogVersion !== workspace.catalogVersion) {
      throw new ApiError('MOTION_STUDIO_CONFLICT', 'Narrator choices changed while this selection was open. Refresh and choose again.', 409)
    }
    if (
      request.voiceBibleBaseVersionId !== workspace.voiceBible.currentDraftVersion.versionId ||
      request.voiceBibleBaseVersionDigest !== workspace.voiceBible.currentDraftVersion.contentDigest
    ) {
      throw new ApiError('MOTION_STUDIO_CONFLICT', 'The Voice Bible changed while this narrator choice was open. Refresh and choose again.', 409)
    }
    const catalog = await this.loadCatalog()
    if (catalog.catalogVersion !== request.catalogVersion || !catalog.resolve(request.candidateReference)) {
      throw new ApiError('MOTION_STUDIO_CONFLICT', 'The selected narrator is no longer part of this exact catalog version.', 409)
    }

    const command: ApplyMotionStudioCommandRequest = {
      baseVersionId: request.voiceBibleBaseVersionId,
      baseVersionDigest: request.voiceBibleBaseVersionDigest,
      operations: [{
        operationId: `voice-casting:${sha256CanonicalJson(request).slice(0, 32)}`,
        kind: 'set_property',
        targetPath: '/data/voiceProfileReference',
        value: request.candidateReference,
      }],
      reason: 'Use the explicitly selected narrator as planning direction in the current Voice Bible draft.',
    }
    const applied = await this.commandAuthority.applyCommand(
      productionId,
      voiceBibleArtifact.id,
      command,
      idempotencyKey,
      'user',
    )
    if (applied.data.result.status !== 'applied') {
      throw new ApiError('MOTION_STUDIO_CONFLICT', applied.data.result.message, 409)
    }
    const refreshedArtifact = await this.readVoiceBibleArtifact(productionId)
    const refreshed = await this.compileWorkspace(production, refreshedArtifact)
    if (
      refreshed.selectedCandidateReference !== request.candidateReference ||
      refreshed.state !== 'selected_for_planning' ||
      !refreshedArtifact?.currentDraftVersion ||
      refreshedArtifact.currentDraftVersion.versionId !== applied.data.result.newVersionId ||
      refreshedArtifact.currentDraftVersion.contentDigest !== applied.data.result.newVersionDigest
    ) {
      throw new ApiError('INTERNAL_ERROR', 'Narrator planning choice could not be read back from the exact Voice Bible version.', 500, undefined, { internal: true })
    }
    return {
      data: {
        receipt: {
          updatedVoiceBibleVersion: {
            artifactId: voiceBibleArtifact.id,
            versionId: applied.data.result.newVersionId,
            versionNumber: refreshedArtifact.currentDraftVersion.versionNumber,
            contentDigest: applied.data.result.newVersionDigest,
          },
          workspace: refreshed,
          planApproved: false as const,
          providerCallMade: false as const,
          speechGenerated: false as const,
          customerCreditsChanged: false as const,
        },
      },
      warnings: [VOICE_CASTING_WARNING],
    }
  }

  private async readVoiceBibleArtifact(productionId: string): Promise<MotionStudioArtifactDto | undefined> {
    try {
      return (await this.commandAuthority.getArtifactByKind(productionId, 'voice_bible')).data.artifact
    } catch (error) {
      if (error instanceof ApiError && error.code === 'MOTION_STUDIO_NOT_FOUND') return undefined
      throw error
    }
  }

  private async compileWorkspace(
    production: MotionStudioProductionDto,
    artifact: MotionStudioArtifactDto | undefined,
  ): Promise<MotionStudioVoiceCastingWorkspaceDto> {
    if (!artifact) {
      return this.parseWorkspace({
        productionId: production.id,
        projectId: production.projectId,
        editSessionId: production.editSessionId,
        state: 'not_prepared',
        candidates: [],
        selectionAllowed: false,
        notice: 'Prepare narrator direction in Chat before choosing a production voice.',
        localCandidateOnly: true,
      })
    }
    const current = artifact.currentDraft ?? artifact.currentApproved
    if (!current) {
      throw new ApiError('INTERNAL_ERROR', 'Voice Bible artifact has no readable current version.', 500, undefined, { internal: true })
    }
    const parsed = motionStudioVoiceBibleSchema.safeParse(current.payload.data)
    if (
      !parsed.success ||
      parsed.data.productionId !== production.id ||
      parsed.data.projectId !== production.projectId ||
      parsed.data.editSessionId !== production.editSessionId
    ) {
      throw new ApiError('INTERNAL_ERROR', 'Voice Bible payload does not match this Storytelling production.', 500, undefined, { internal: true })
    }
    const voiceBible = parsed.data
    const base = {
      productionId: production.id,
      projectId: production.projectId,
      editSessionId: production.editSessionId,
      candidates: [] as MotionStudioVoiceCastingWorkspaceDto['candidates'],
      voiceBible: {
        artifactId: artifact.id,
        providerCapability: voiceBible.providerCapability,
        ...(artifact.currentDraftVersion ? { currentDraftVersion: artifact.currentDraftVersion } : {}),
        ...(artifact.currentApprovedVersion ? { currentApprovedVersion: artifact.currentApprovedVersion } : {}),
      },
      selectionAllowed: false,
      localCandidateOnly: true as const,
    }
    if (voiceBible.providerCapability === 'uploaded_narration') {
      return this.parseWorkspace({
        ...base,
        state: 'uploaded_narration',
        notice: 'This story uses uploaded narration, so a generated narrator is not selected here.',
      })
    }

    let catalog: MotionStudioVoiceCastingCatalogProjection
    try {
      catalog = await this.loadCatalog()
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      return this.parseWorkspace({
        ...base,
        state: 'catalog_unavailable',
        notice: 'Narrator choices are temporarily unavailable. The Voice Bible was not changed.',
      })
    }

    const selectedCandidate = voiceBible.voiceProfileReference
      ? catalog.resolve(voiceBible.voiceProfileReference)
      : undefined
    const locked = !artifact.currentDraftVersion
    return this.parseWorkspace({
      ...base,
      state: locked
        ? 'locked_read_only'
        : selectedCandidate
          ? 'selected_for_planning'
          : 'ready',
      catalogVersion: catalog.catalogVersion,
      candidates: catalog.candidates,
      ...(selectedCandidate ? { selectedCandidateReference: voiceBible.voiceProfileReference } : {}),
      selectionAllowed: !locked,
      notice: locked
        ? 'The current Voice Bible is approved or locked. Request a revision in Chat to change narrator direction.'
        : selectedCandidate
          ? 'This narrator is part of the current Voice Bible draft. The plan is still unapproved and no speech has been generated.'
          : 'Choose a narrator for the Voice Bible draft. This planning choice does not generate speech or use credits.',
    })
  }

  private parseWorkspace(value: MotionStudioVoiceCastingWorkspaceDto): MotionStudioVoiceCastingWorkspaceDto {
    const parsed = motionStudioVoiceCastingWorkspaceDtoSchema.safeParse(value)
    if (!parsed.success) {
      throw new ApiError('INTERNAL_ERROR', 'Narrator workspace violated its browser-safe contract.', 500, undefined, { internal: true })
    }
    return parsed.data
  }
}

export function createMotionStudioVoiceCastingService(context: ServiceContext) {
  return new MotionStudioVoiceCastingService(context)
}
