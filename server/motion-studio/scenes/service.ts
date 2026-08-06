import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import {
  motionStudioLayerPlanSchema,
  motionStudioMotionDnaSchema,
  motionStudioMotionLanguageDefinitionSchema,
  motionStudioNarrativeFunctionDefinitionSchema,
  motionStudioPreparedScriptSchema,
  motionStudioSceneDocumentSchema,
  motionStudioSceneGraphSchema,
  motionStudioSceneRecipeSchema,
  validateMotionStudioDeepValue,
} from '../../../src/lib/motion-studio/contracts'
import type {
  CreateMotionStudioSceneDraftRequest,
  CreateMotionStudioTimelineProposalRequest,
  LayerPlan,
  MotionLanguageDefinition,
  MotionStudioArtifactKind,
  MotionStudioArtifactPayload,
  MotionStudioSceneArtifactSummaryDto,
  MotionStudioSceneWorkspaceDto,
  NarrativeFunctionDefinition,
  SceneDocument,
  SceneRecipe,
  SceneRecipeInstantiation,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type {
  MotionStudioArtifactRow,
  MotionStudioArtifactVersionRow,
  MotionStudioProductionRow,
} from '../commands/types'
import {
  projectStorytellingSceneContinuityReview,
  type StorytellingSceneContinuityCurrentAuthority,
  verifyStorytellingStoryContinuityGrammarDigest,
} from '../style-system'
import {
  compileMotionStudioSceneDocument,
  MOTION_STUDIO_SCENE_COMPILER_ID,
  MOTION_STUDIO_SCENE_COMPILER_VERSION,
} from './compiler'
import { createSupabaseMotionStudioSceneRepository } from './repository'
import type {
  MotionStudioApprovedSnapshotRow,
  MotionStudioRecipeInstantiationRow,
  MotionStudioSceneRepository,
} from './types'
import { proposalDto, versionReference } from './types'

const LOCAL_WARNING = 'Scene authoring and timeline proposals are local canonical candidates. They do not mutate the existing timeline, render media, call providers, or activate billing.'
const SCENE_SUMMARY_KINDS = [
  'scene_graph', 'scene_recipe', 'layer_plan', 'scene_document',
  'motion_language', 'narrative_function',
] as const satisfies readonly MotionStudioSceneArtifactSummaryDto['kind'][]
const SCENE_READ_KINDS = [
  ...SCENE_SUMMARY_KINDS,
  'motion_dna', 'prepared_script',
] as const satisfies readonly MotionStudioArtifactKind[]

export class MotionStudioSceneService {
  private readonly actorUserId: string
  private readonly repository: MotionStudioSceneRepository

  constructor(context: ServiceContext, repository?: MotionStudioSceneRepository) {
    this.actorUserId = requireVerifiedUser(context)
    this.repository = repository ?? createSupabaseMotionStudioSceneRepository(ensureAdminClient(context))
  }

  async getSceneWorkspace(productionId: string) {
    const production = await this.requireOwnedProduction(productionId)
    return { data: { sceneWorkspace: await this.readSceneWorkspace(production) }, warnings: [LOCAL_WARNING] }
  }

  async createSceneDraft(
    productionId: string,
    request: CreateMotionStudioSceneDraftRequest,
    idempotencyKey: string,
  ) {
    const production = await this.requireOwnedProduction(productionId)
    const snapshot = await this.requireSnapshot(production, request.approvedSnapshotId)
    const snapshotAuthority = parseSnapshotAuthority(snapshot)
    const languageVersion = await this.requireArtifactVersion(production, request.motionLanguageVersionId, 'motion_language')
    const narrativeVersion = await this.requireArtifactVersion(production, request.narrativeFunctionVersionId, 'narrative_function')
    const language = parseArtifactData(languageVersion, motionStudioMotionLanguageDefinitionSchema, 'Motion Language')
    const narrativeFunction = parseArtifactData(narrativeVersion, motionStudioNarrativeFunctionDefinitionSchema, 'Narrative Function')
    requireSemanticArtifactIdentity(language.id, languageVersion, 'Motion Language')
    requireSemanticArtifactIdentity(narrativeFunction.id, narrativeVersion, 'Narrative Function')

    const ids = {
      scene: randomUUID(),
      chapter: randomUUID(),
      shot: randomUUID(),
      layer: randomUUID(),
      route: randomUUID(),
      instantiation: randomUUID(),
    }
    const ownership = {
      workspaceId: production.workspace_id,
      projectId: production.project_id,
      editSessionId: production.edit_session_id,
    }
    const range = { startAnchorId: request.startAnchorId, endAnchorId: request.endAnchorId }
    requireApprovedAnchorRange(snapshotAuthority, range)

    const graph = {
      ...ownership,
      id: 'pending-scene-graph-artifact',
      productionId,
      chapterIds: [ids.chapter],
      chapters: [{ id: ids.chapter, title: request.title, purpose: request.semanticPurpose, sceneIds: [ids.scene] }],
      scenes: [{
        id: ids.scene,
        chapterId: ids.chapter,
        title: request.title,
        semanticPurpose: request.semanticPurpose,
        productionMode: request.productionMode,
        timing: range,
        shotIds: [ids.shot],
        requiredAssetIds: [...request.assetIds],
        approvalStatus: 'draft' as const,
      }],
      shots: [{
        id: ids.shot,
        sceneId: ids.scene,
        narrativePurpose: request.semanticPurpose,
        timing: range,
        visualConcept: `${request.title}: ${request.layerType.replaceAll('_', ' ')}`,
        productionRouteId: ids.route,
        assetIds: [...request.assetIds],
        referenceContractIds: [],
        exactTextRequired: ['text', 'caption', 'chart', 'map'].includes(request.layerType),
        exactDataRequired: ['chart', 'map'].includes(request.layerType),
        riskScore: request.layerType === 'generated_video' ? 0.8 : 0.2,
      }],
    }
    const layerPlan: LayerPlan = {
      ...ownership,
      id: 'pending-layer-plan-artifact',
      productionId,
      sceneId: ids.scene,
      layers: [{
        id: ids.layer,
        layerType: request.layerType,
        assetIds: [...request.assetIds],
        timing: range,
        zIndex: request.zIndex,
        relationshipIds: [],
        extensions: [],
      }],
    }
    const motionLanguage = {
      motionLanguageId: language.id,
      motionLanguageVersion: language.version,
      motionLanguageDigest: language.contentDigest,
    }
    const narrativeReference = {
      narrativeFunctionId: narrativeFunction.id,
      narrativeFunctionVersion: narrativeFunction.version,
      narrativeFunctionDigest: narrativeFunction.contentDigest,
    }
    const recipeDefinitionDigest = sha256CanonicalJson({
      definitionVersion: '1.0.0',
      productionMode: request.productionMode,
      layerType: request.layerType,
      motionLanguage,
      narrativeFunction: narrativeReference,
      compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    })
    const recipe: SceneRecipe = {
      id: 'pending-scene-recipe-artifact',
      definitionVersion: '1.0.0',
      definitionDigest: recipeDefinitionDigest,
      name: `${request.title} · ${request.layerType.replaceAll('_', ' ')}`,
      scope: 'workspace_private',
      workspaceId: production.workspace_id,
      compatibleProductionModes: [request.productionMode],
      requiredInputArtifactKinds: ['scene_document', 'layer_plan', 'motion_language', 'narrative_function'],
      outputArtifactKinds: ['timeline_proposal'],
      professionalSkillIds: ['motion.compose_scene'],
      toolCapabilityIds: [capabilityForLayer(request.layerType)],
      qualityGateIds: ['render_timeline_integrity'],
      fallbackPolicyIds: ['request_user_review'],
      approvalClass: 'stage',
      costClass: 'no_incremental_provider_cost',
      compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
      arbitraryCodeAllowed: false,
      brollWorkflowEmbedded: false,
      compatibleMotionLanguages: [motionLanguage],
      compatibleNarrativeFunctions: [narrativeReference],
      immutable: true,
    }
    const authoringInputDigest = sha256CanonicalJson({
      request,
      snapshotId: snapshot.id,
      snapshotDigest: snapshot.snapshot_digest,
      languageVersion: versionReference(languageVersion),
      narrativeFunctionVersion: versionReference(narrativeVersion),
      sceneId: ids.scene,
      instantiationId: ids.instantiation,
      compilerId: MOTION_STUDIO_SCENE_COMPILER_ID,
      compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    })
    const sceneDocument: SceneDocument = {
      ...ownership,
      id: 'pending-scene-document-artifact',
      productionId,
      approvedSnapshotId: snapshot.id,
      sceneId: ids.scene,
      semanticPurpose: request.semanticPurpose,
      productionMode: request.productionMode,
      timingAuthority: snapshotAuthority.timingAuthority,
      timing: range,
      assetIds: [...request.assetIds],
      layerPlanVersion: {
        artifactId: '00000000-0000-4000-8000-000000000001',
        versionId: '00000000-0000-4000-8000-000000000002',
        versionNumber: 1,
        contentDigest: '0'.repeat(64),
      },
      keyframes: [],
      designTokenReferences: [],
      maskAssetIds: request.layerType === 'mask' ? [...request.assetIds] : [],
      effectCapabilityIds: request.layerType === 'effect' ? [capabilityForLayer(request.layerType)] : [],
      audioCueIds: [],
      propertyLockIds: [],
      manualOverrideIds: [],
      productionRouteIds: [ids.route],
      recipeInstantiationIds: [ids.instantiation],
      compilerFingerprint: {
        compilerId: MOTION_STUDIO_SCENE_COMPILER_ID,
        compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
        inputDigest: authoringInputDigest,
      },
      brollReferences: [],
    }

    assertValid(motionStudioSceneGraphSchema, graph, 'Scene Graph')
    assertValid(motionStudioLayerPlanSchema, layerPlan, 'LayerPlan')
    assertValid(motionStudioSceneRecipeSchema, recipe, 'Scene Recipe')
    assertValid(motionStudioSceneDocumentSchema, sceneDocument, 'SceneDocument template')
    const createdAt = new Date().toISOString()
    const receipt = await this.repository.createSceneDraft({
      production,
      request,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash: requestHash('scene-drafts', productionId, request),
      createdAt,
      instantiationId: ids.instantiation,
      graphPayload: artifactPayload('scene_graph', graph),
      layerPlanPayload: artifactPayload('layer_plan', layerPlan),
      recipePayload: artifactPayload('scene_recipe', recipe),
      sceneDocumentPayload: artifactPayload('scene_document', sceneDocument),
      motionLanguageVersion: languageVersion,
      narrativeFunctionVersion: narrativeVersion,
    })
    return {
      data: { receipt, sceneWorkspace: await this.readSceneWorkspace(production) },
      warnings: [LOCAL_WARNING],
    }
  }

  async createTimelineProposal(
    productionId: string,
    request: CreateMotionStudioTimelineProposalRequest,
    idempotencyKey: string,
  ) {
    const production = await this.requireOwnedProduction(productionId)
    const snapshot = await this.requireSnapshot(production, request.approvedSnapshotId)
    const snapshotAuthority = parseSnapshotAuthority(snapshot)
    if (snapshotAuthority.baseTimeline.id !== request.targetTimelineManifestId) {
      throw new ApiError('MOTION_STUDIO_CONFLICT', 'The target timeline changed after it was selected.', 409)
    }
    const sceneVersion = await this.requireArtifactVersion(production, request.sceneDocumentVersionId, 'scene_document')
    if (sceneVersion.artifact_id !== request.sceneDocumentArtifactId || sceneVersion.content_digest !== request.sceneDocumentContentDigest) {
      throw new ApiError('MOTION_STUDIO_CONFLICT', 'The exact SceneDocument version or digest changed after it was selected.', 409)
    }
    const sceneDocument = parseArtifactData(sceneVersion, motionStudioSceneDocumentSchema, 'SceneDocument')
    const currentContinuityAuthority = await this.readCurrentStoryContinuityAuthority(production)
    if (sceneDocument.storyContinuity || currentContinuityAuthority) {
      const continuityReview = projectSceneContinuityReview({
        production,
        document: sceneDocument,
        documentState: sceneVersion.state,
        currentContinuityAuthority,
        currentApprovedSnapshot: {
          id: snapshot.id,
          timingAuthorityDigest: snapshotAuthority.timingAuthority.timingAuthorityDigest,
        },
      })
      if (!['ready_for_review', 'approved_locked'].includes(continuityReview.state)) {
        throw new ApiError(
          'MOTION_STUDIO_CONFLICT',
          `${continuityReview.title}. ${continuityReview.nextAction.label}.`,
          409,
        )
      }
    }
    const layerVersion = await this.requireArtifactVersion(production, sceneDocument.layerPlanVersion.versionId, 'layer_plan')
    if (
      layerVersion.artifact_id !== sceneDocument.layerPlanVersion.artifactId ||
      layerVersion.version_number !== sceneDocument.layerPlanVersion.versionNumber ||
      layerVersion.content_digest !== sceneDocument.layerPlanVersion.contentDigest
    ) throw new ApiError('MOTION_STUDIO_CONFLICT', 'The exact LayerPlan authority no longer matches the SceneDocument.', 409)
    const layerPlan = parseArtifactData(layerVersion, motionStudioLayerPlanSchema, 'LayerPlan')
    const instanceRows = await this.repository.findRecipeInstantiations(productionId, sceneDocument.recipeInstantiationIds)
    const recipeRows = await this.repository.findRecipeVersions(productionId, instanceRows.map((row) => row.recipe_version_id))
    const languageVersions = await this.repository.findArtifactVersions(productionId, instanceRows.map((row) => row.motion_language_version_id))
    const narrativeVersions = await this.repository.findArtifactVersions(productionId, instanceRows.map((row) => row.narrative_function_version_id))
    const languages = languageVersions.map((version) => parseArtifactData(version, motionStudioMotionLanguageDefinitionSchema, 'Motion Language'))
    const narrativeFunctions = narrativeVersions.map((version) => parseArtifactData(version, motionStudioNarrativeFunctionDefinitionSchema, 'Narrative Function'))
    const recipeVersions = recipeRows.map((row) => ({
      version: {
        artifactId: row.recipe_artifact_id,
        versionId: row.artifact_version_id,
        versionNumber: row.version_number,
        contentDigest: row.definition_digest,
      },
      recipe: assertValid(motionStudioSceneRecipeSchema, row.definition_json, 'Scene Recipe'),
    }))
    const instances = instanceRows.map((row) => mapRecipeInstantiation(row, recipeRows, languages, narrativeFunctions))

    const compiled = compileMotionStudioSceneDocument({
      approvedSnapshotId: snapshot.id,
      approvedSnapshotDigest: snapshot.snapshot_digest,
      approvedTimingAuthority: snapshotAuthority.timingAuthority,
      baseTimeline: snapshotAuthority.baseTimeline,
      anchorFrames: snapshotAuthority.anchorFrames,
      sourceSceneDocumentVersion: versionReference(sceneVersion),
      sceneDocument,
      layerPlanVersion: versionReference(layerVersion),
      layerPlan,
      recipeInstantiations: instances,
      recipeVersions,
      motionLanguages: languages,
      narrativeFunctions,
    })
    const persisted = await this.repository.persistTimelineProposal({
      production,
      request,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash: requestHash('timeline-proposals', productionId, request),
      sourceVersion: sceneVersion,
      timingAuthorityDigest: sceneDocument.timingAuthority.timingAuthorityDigest,
      compilerVersion: compiled.compilerFingerprint.compilerVersion,
      inputDigest: compiled.compilerFingerprint.inputDigest,
      outputDigest: compiled.compilerFingerprint.outputDigest!,
      operations: compiled.operations,
      warnings: compiled.warnings,
    })
    return {
      data: { proposal: proposalDto(persisted), sceneWorkspace: await this.readSceneWorkspace(production) },
      warnings: [LOCAL_WARNING],
    }
  }

  private async readSceneWorkspace(production: MotionStudioProductionRow): Promise<MotionStudioSceneWorkspaceDto> {
    const [artifacts, proposals, snapshot] = await Promise.all([
      this.repository.listArtifacts(production.id, SCENE_READ_KINDS),
      this.repository.listTimelineProposals(production.id),
      this.repository.findLatestSnapshot(production),
    ])
    const versionIds = artifacts.flatMap((artifact) => [artifact.current_draft_version_id, artifact.current_approved_version_id])
      .filter((value): value is string => Boolean(value))
    const versions = await this.repository.findArtifactVersions(production.id, versionIds)
    const byId = new Map(versions.map((version) => [version.id, version]))
    const currentContinuityAuthority = resolveCurrentStoryContinuityAuthority(production, artifacts, byId)
    const blockers: string[] = []
    let latestApprovedSnapshot: MotionStudioSceneWorkspaceDto['latestApprovedSnapshot']
    let currentApprovedSnapshot: { id: string; timingAuthorityDigest: string } | undefined
    if (!snapshot) blockers.push('An approved plan snapshot is required before scene authoring.')
    if (snapshot) {
      try {
        const authority = parseSnapshotAuthority(snapshot)
        currentApprovedSnapshot = {
          id: snapshot.id,
          timingAuthorityDigest: authority.timingAuthority.timingAuthorityDigest,
        }
        latestApprovedSnapshot = {
          id: snapshot.id,
          targetTimelineManifestId: authority.baseTimeline.id,
          timingAuthorityDigest: authority.timingAuthority.timingAuthorityDigest,
          frameRate: authority.timingAuthority.frameRate,
          timingAnchors: Object.entries(authority.anchorFrames)
            .map(([id, frame]) => ({ id, frame }))
            .sort((left, right) => left.frame - right.frame || left.id.localeCompare(right.id)),
        }
      } catch (error) {
        blockers.push(error instanceof ApiError ? error.message : 'The approved snapshot has no deterministic timeline authority.')
      }
    }
    const sceneDetailsById = new Map<string, {
      exactDataRequired: boolean
      exactTextRequired: boolean
      shotCount: number
      title: string
    }>()
    const layerDetailsBySceneId = new Map<string, {
      assetIds: readonly string[]
      layerCount: number
      layerTypes: NonNullable<MotionStudioSceneArtifactSummaryDto['layerTypes']>
    }>()
    for (const artifact of artifacts) {
      const versionId = artifact.current_draft_version_id ?? artifact.current_approved_version_id
      const version = versionId ? byId.get(versionId) : undefined
      if (!version) continue
      if (artifact.kind === 'scene_graph') {
        const graph = motionStudioSceneGraphSchema.safeParse(version.payload_json.data)
        if (!graph.success) continue
        for (const scene of graph.data.scenes) {
          const shots = graph.data.shots.filter((shot) => shot.sceneId === scene.id)
          sceneDetailsById.set(scene.id, {
            exactDataRequired: shots.some((shot) => shot.exactDataRequired),
            exactTextRequired: shots.some((shot) => shot.exactTextRequired),
            shotCount: shots.length,
            title: scene.title,
          })
        }
      }
      if (artifact.kind === 'layer_plan') {
        const layerPlan = motionStudioLayerPlanSchema.safeParse(version.payload_json.data)
        if (!layerPlan.success) continue
        layerDetailsBySceneId.set(layerPlan.data.sceneId, {
          assetIds: [...new Set(layerPlan.data.layers.flatMap((layer) => layer.assetIds))],
          layerCount: layerPlan.data.layers.length,
          layerTypes: [...new Set(layerPlan.data.layers.map((layer) => layer.layerType))],
        })
      }
    }
    const summaries = artifacts.flatMap((artifact): MotionStudioSceneArtifactSummaryDto[] => {
      const versionId = artifact.current_draft_version_id ?? artifact.current_approved_version_id
      const version = versionId ? byId.get(versionId) : undefined
      if (!version || !isSceneSummaryKind(artifact.kind)) return []
      const data = version.payload_json.data as Record<string, unknown>
      if (artifact.kind === 'scene_document') {
        const document = motionStudioSceneDocumentSchema.safeParse(data)
        if (!document.success) {
          if (plainRecord(data).storyContinuity !== undefined) {
            throw new ApiError(
              'MOTION_STUDIO_APPROVAL_BLOCKED',
              'Scene continuity could not be verified against the exact SceneDocument.',
              409,
            )
          }
          return [{
            artifactId: artifact.id,
            kind: artifact.kind,
            version: versionReference(version),
            state: version.state,
            label: summaryLabel(artifact.kind, data),
            ...(typeof data.sceneId === 'string' ? { sceneId: data.sceneId } : {}),
          }]
        }
        const sceneDetails = sceneDetailsById.get(document.data.sceneId)
        const layerDetails = layerDetailsBySceneId.get(document.data.sceneId)
        const storyContinuityReview = document.data.storyContinuity || currentContinuityAuthority
          ? projectSceneContinuityReview({
              production,
              document: document.data,
              documentState: version.state,
              currentContinuityAuthority,
              currentApprovedSnapshot,
            })
          : undefined
        return [{
          artifactId: artifact.id,
          kind: artifact.kind,
          version: versionReference(version),
          state: version.state,
          label: sceneDetails?.title ?? document.data.semanticPurpose,
          sceneId: document.data.sceneId,
          ...(sceneDetails?.title ? { sceneTitle: sceneDetails.title } : {}),
          semanticPurpose: document.data.semanticPurpose,
          productionMode: document.data.productionMode,
          timing: document.data.timing,
          shotCount: sceneDetails?.shotCount ?? 0,
          layerTypes: layerDetails?.layerTypes ?? [],
          layerCount: layerDetails?.layerCount ?? 0,
          assetCount: new Set([...document.data.assetIds, ...(layerDetails?.assetIds ?? [])]).size,
          keyframeCount: document.data.keyframes.length,
          exactTextRequired: sceneDetails?.exactTextRequired ?? false,
          exactDataRequired: sceneDetails?.exactDataRequired ?? false,
          ...(storyContinuityReview ? { storyContinuityReview } : {}),
        }]
      }
      return [{
        artifactId: artifact.id,
        kind: artifact.kind,
        version: versionReference(version),
        state: version.state,
        label: summaryLabel(artifact.kind, data),
        ...(typeof data.sceneId === 'string' ? { sceneId: data.sceneId } : {}),
      }]
    })
    const languageCount = summaries.filter((item) => item.kind === 'motion_language').length
    const narrativeCount = summaries.filter((item) => item.kind === 'narrative_function').length
    const documentCount = summaries.filter((item) => item.kind === 'scene_document').length
    if (!languageCount) blockers.push('An exact Motion Language version is required.')
    if (!narrativeCount) blockers.push('An exact Narrative Function version is required.')
    if (!documentCount) blockers.push('Create a SceneDocument before compiling a timeline proposal.')
    const canAuthor = Boolean(latestApprovedSnapshot && languageCount && narrativeCount)
    const canCompile = Boolean(latestApprovedSnapshot && documentCount)
    return {
      productionId: production.id,
      artifacts: summaries,
      proposals: proposals.map(proposalDto),
      ...(latestApprovedSnapshot ? { latestApprovedSnapshot } : {}),
      readiness: { canAuthor, canCompile, blockers: [...new Set(blockers)] },
      localCandidateOnly: true,
    }
  }

  private async requireOwnedProduction(productionId: string): Promise<MotionStudioProductionRow> {
    const production = await this.repository.findProduction(productionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio production was not found.', 404)
    if (production.owner_id !== this.actorUserId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Motion Studio scene access is owner-private in the current canonical model.', 403)
    }
    if (production.status === 'archived') throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Archived Motion Studio productions are immutable.', 409)
    return production
  }

  private async requireSnapshot(production: MotionStudioProductionRow, snapshotId: string) {
    const snapshot = await this.repository.findSnapshot(production, snapshotId)
    if (!snapshot) throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'The exact approved snapshot is unavailable for this production.', 409)
    return snapshot
  }

  private async requireArtifactVersion(
    production: MotionStudioProductionRow,
    versionId: string,
    kind: MotionStudioArtifactKind,
  ): Promise<MotionStudioArtifactVersionRow> {
    const version = await this.repository.findArtifactVersion(production.id, versionId)
    if (!version || version.kind !== kind) {
      throw new ApiError('MOTION_STUDIO_NOT_FOUND', `The exact ${kind.replaceAll('_', ' ')} version was not found.`, 404)
    }
    return version
  }

  private async readCurrentStoryContinuityAuthority(
    production: MotionStudioProductionRow,
  ): Promise<StorytellingSceneContinuityCurrentAuthority | undefined> {
    const artifacts = await this.repository.listArtifacts(production.id, ['motion_dna', 'prepared_script'])
    const versionIds = artifacts.flatMap((artifact) => [
      artifact.current_draft_version_id,
      artifact.current_approved_version_id,
    ]).filter((value): value is string => Boolean(value))
    const versions = await this.repository.findArtifactVersions(production.id, versionIds)
    return resolveCurrentStoryContinuityAuthority(
      production,
      artifacts,
      new Map(versions.map((version) => [version.id, version])),
    )
  }
}

export function createMotionStudioSceneService(context: ServiceContext): MotionStudioSceneService {
  return new MotionStudioSceneService(context)
}

export interface MotionStudioSnapshotAuthority {
  baseTimeline: TimelineManifest
  timingAuthority: SceneDocument['timingAuthority']
  anchorFrames: Record<string, number>
}

const timelineSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  editPlanId: z.string().min(1),
  approvedSnapshotId: z.string().min(1).optional(),
  mediaAssetId: z.string().min(1),
  version: z.string().min(1),
  timelineFormat: z.enum(['reeditpro_timeline', 'opentimelineio', 'hyperframe_timeline', 'remotion_composition_manifest']),
  durationSeconds: z.number().finite().positive(),
  clips: z.array(z.object({
    id: z.string().min(1), sourceMediaAssetId: z.string().min(1),
    sourceRange: timeRangeSchema(), timelineRange: timeRangeSchema(),
    trackId: z.string().min(1), metadata: z.record(z.string(), z.unknown()).optional(),
  }).strict()),
  audioLayers: z.array(timelineLayerSchema()),
  captionLayers: z.array(timelineLayerSchema()),
  overlayLayers: z.array(timelineLayerSchema()),
  maskLayers: z.array(timelineLayerSchema()),
  colorOperations: z.array(z.object({
    id: z.string().min(1), targetClipId: z.string().min(1).optional(), operationType: z.string().min(1), settings: z.record(z.string(), z.unknown()),
  }).strict()),
  renderNotes: z.array(z.string()),
  sourceReferences: z.array(z.object({
    storageBucketPurpose: z.enum(['source_media', 'proxy_media', 'analysis_artifacts', 'transcripts', 'masks', 'generated_assets', 'previews', 'final_exports', 'worker_temp', 'qa_artifacts']),
    storageObjectPath: z.string().min(1), sourceOfTruth: z.boolean(),
  }).strict()),
  createdAt: z.string().min(1),
}).strict()

export function parseSnapshotAuthority(snapshot: MotionStudioApprovedSnapshotRow): MotionStudioSnapshotAuthority {
  const root = snapshot.snapshot_json
  const plan = plainRecord(root.plan)
  const timing = plainRecord(root.masterTimingPlan)
  const frame = plainRecord(root.confirmedOutputFrame)
  const parsedTimeline = timelineSchema.safeParse(plan.timelineManifest)
  if (!parsedTimeline.success) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'The approved snapshot does not contain the existing deterministic TimelineManifest.', 409)
  }
  const anchors = z.array(z.object({ id: z.string().min(1), frame: z.number().int().nonnegative().refine(Number.isSafeInteger) }).strict())
    .min(2).safeParse(timing.motionStudioAnchors)
  const frameParsed = z.object({
    id: z.string().min(1),
    aspectRatio: z.string().regex(/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/),
    fpsNumerator: z.number().int().positive().refine(Number.isSafeInteger),
    fpsDenominator: z.number().int().positive().refine(Number.isSafeInteger),
    width: z.number().int().positive().refine(Number.isSafeInteger),
    height: z.number().int().positive().refine(Number.isSafeInteger),
  }).passthrough().safeParse(frame)
  const timingParsed = z.object({
    id: z.string().min(1),
    versionId: z.string().min(1),
    durationFrames: z.number().int().positive().refine(Number.isSafeInteger),
  }).passthrough().safeParse(timing)
  if (!anchors.success || !frameParsed.success || !timingParsed.success) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'The approved snapshot is missing exact frame or timing-anchor authority.', 409)
  }
  const unstructuredTimelineValues = {
    clipMetadata: parsedTimeline.data.clips.map((clip) => clip.metadata ?? {}),
    layerMetadata: [
      ...parsedTimeline.data.audioLayers,
      ...parsedTimeline.data.captionLayers,
      ...parsedTimeline.data.overlayLayers,
      ...parsedTimeline.data.maskLayers,
    ].map((layer) => layer.metadata),
    colorSettings: parsedTimeline.data.colorOperations.map((operation) => operation.settings),
    renderNotes: parsedTimeline.data.renderNotes,
    sourceReferences: parsedTimeline.data.sourceReferences,
  }
  const safe = validateMotionStudioDeepValue(unstructuredTimelineValues)
  if (!safe.ok) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'The approved timeline contains unsafe unstructured values.', 409, {
      validationPaths: safe.errors,
    })
  }
  const frameRate = frameParsed.data.fpsNumerator / frameParsed.data.fpsDenominator
  if (Math.abs(parsedTimeline.data.durationSeconds * frameRate - timingParsed.data.durationFrames) > 0.000001) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'The approved TimelineManifest duration differs from the MasterTimingPlan.', 409)
  }
  const anchorFrames = Object.fromEntries(anchors.data.map((anchor) => [anchor.id, anchor.frame]))
  if (Object.keys(anchorFrames).length !== anchors.data.length) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'MasterTimingPlan anchor IDs must be unique.', 409)
  }
  const timingAuthorityDigest = sha256CanonicalJson({ frame: frameParsed.data, timing: timingParsed.data, anchors: anchors.data })
  return {
    baseTimeline: { ...parsedTimeline.data, approvedSnapshotId: snapshot.id } as TimelineManifest,
    timingAuthority: {
      masterTimingPlanVersionId: timingParsed.data.versionId,
      confirmedFrameId: frameParsed.data.id,
      timingAuthorityDigest,
      frameRate,
      width: frameParsed.data.width,
      height: frameParsed.data.height,
      aspectRatio: frameParsed.data.aspectRatio,
      durationFrames: timingParsed.data.durationFrames,
      timebase: `${frameParsed.data.fpsNumerator}/${frameParsed.data.fpsDenominator}`,
    },
    anchorFrames,
  }
}

function timeRangeSchema() {
  return z.object({
    startSeconds: z.number().finite().nonnegative(),
    endSeconds: z.number().finite().positive(),
    startFrame: z.number().int().nonnegative().optional(),
    endFrame: z.number().int().positive().optional(),
  }).strict()
}

function timelineLayerSchema() {
  return z.object({
    id: z.string().min(1), layerType: z.string().min(1), timelineRange: timeRangeSchema(),
    artifactIds: z.array(z.string()), metadata: z.record(z.string(), z.unknown()),
  }).strict()
}

function mapRecipeInstantiation(
  row: MotionStudioRecipeInstantiationRow,
  recipes: readonly { id: string; recipe_artifact_id: string; version_number: number; definition_version: string; definition_digest: string; definition_json: Record<string, unknown> }[],
  languages: readonly MotionLanguageDefinition[],
  narrativeFunctions: readonly NarrativeFunctionDefinition[],
): SceneRecipeInstantiation {
  const recipe = recipes.find((candidate) => candidate.id === row.recipe_version_id)
  const language = languages.find((definition) => definition.id === row.motion_language_artifact_id)
  const narrative = narrativeFunctions.find((definition) => definition.id === row.narrative_function_artifact_id)
  if (!recipe || !language || !narrative) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Recipe instantiation semantic authority is incomplete.', 409)
  }
  const semanticRecipe = assertValid(motionStudioSceneRecipeSchema, recipe.definition_json, 'Scene Recipe')
  if (
    row.recipe_semantic_digest !== semanticRecipe.definitionDigest ||
    row.motion_language_semantic_digest !== language.contentDigest ||
    row.narrative_function_semantic_digest !== narrative.contentDigest
  ) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Recipe instantiation semantic digests no longer match their exact definitions.', 409)
  }
  return {
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    editSessionId: row.edit_session_id,
    id: row.id,
    productionId: row.production_id,
    sceneDocumentVersionId: row.scene_document_version_id,
    sceneId: row.scene_id,
    recipeVersion: {
      artifactId: recipe.recipe_artifact_id,
      versionId: recipe.id,
      versionNumber: recipe.version_number,
      contentDigest: recipe.definition_digest,
    },
    recipeDefinitionVersion: row.recipe_definition_version,
    recipeDefinitionDigest: semanticRecipe.definitionDigest,
    recipeInputDigest: row.recipe_input_digest,
    motionLanguage: {
      motionLanguageId: language.id,
      motionLanguageVersion: language.version,
      motionLanguageDigest: language.contentDigest,
    },
    narrativeFunction: {
      narrativeFunctionId: narrative.id,
      narrativeFunctionVersion: narrative.version,
      narrativeFunctionDigest: narrative.contentDigest,
    },
    productionMode: row.production_mode,
    inputArtifactDigests: row.input_artifact_digests,
    outputBindingIds: row.output_binding_ids,
    approvalStatus: 'approved',
    immutable: true,
  }
}

function parseArtifactData<T>(row: MotionStudioArtifactVersionRow, schema: z.ZodType<T>, label: string): T {
  return assertValid(schema, row.payload_json.data, label)
}

function assertValid<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', `${label} failed strict contract validation.`, 409, {
      validationPaths: parsed.error.issues.map((issue) => issue.path.join('.') || '$'),
    })
  }
  return parsed.data
}

function requireSemanticArtifactIdentity(id: string, row: MotionStudioArtifactVersionRow, label: string): void {
  if (id !== row.artifact_id) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', `${label} semantic identity must equal its artifact identity.`, 409)
  }
}

function resolveCurrentStoryContinuityAuthority(
  production: MotionStudioProductionRow,
  artifacts: readonly MotionStudioArtifactRow[],
  versionsById: ReadonlyMap<string, MotionStudioArtifactVersionRow>,
): StorytellingSceneContinuityCurrentAuthority | undefined {
  const motionDnaVersion = resolveCurrentArtifactVersion(artifacts, versionsById, 'motion_dna')
  if (!motionDnaVersion || plainRecord(motionDnaVersion.payload_json.data).storyContinuityGrammar === undefined) {
    return undefined
  }
  const motionDna = parseArtifactData(motionDnaVersion, motionStudioMotionDnaSchema, 'Motion DNA')
  requireSemanticArtifactIdentity(motionDna.id, motionDnaVersion, 'Motion DNA')
  assertExactProductionScope(production, motionDna, 'Motion DNA')
  const grammar = motionDna.storyContinuityGrammar
  if (!grammar || !verifyStorytellingStoryContinuityGrammarDigest(grammar)) {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      'The current story flow failed exact source verification.',
      409,
    )
  }
  assertExactProductionScope(production, grammar, 'Story continuity')

  const preparedScriptVersion = resolveCurrentArtifactVersion(artifacts, versionsById, 'prepared_script')
  if (!preparedScriptVersion) return undefined
  const preparedScript = parseArtifactData(preparedScriptVersion, motionStudioPreparedScriptSchema, 'Prepared Script')
  requireSemanticArtifactIdentity(preparedScript.id, preparedScriptVersion, 'Prepared Script')
  assertExactProductionScope(production, preparedScript, 'Prepared Script')

  return {
    workspaceId: production.workspace_id,
    projectId: production.project_id,
    editSessionId: production.edit_session_id,
    productionId: production.id,
    motionDnaVersion: versionReference(motionDnaVersion),
    preparedScriptVersion: versionReference(preparedScriptVersion),
    grammarDigest: grammar.grammarDigest,
  }
}

function resolveCurrentArtifactVersion(
  artifacts: readonly MotionStudioArtifactRow[],
  versionsById: ReadonlyMap<string, MotionStudioArtifactVersionRow>,
  kind: Extract<MotionStudioArtifactKind, 'motion_dna' | 'prepared_script'>,
): MotionStudioArtifactVersionRow | undefined {
  const candidates = artifacts.filter((artifact) => artifact.kind === kind &&
    Boolean(artifact.current_draft_version_id ?? artifact.current_approved_version_id))
  if (candidates.length > 1) {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      `The current ${kind.replaceAll('_', ' ')} authority is ambiguous.`,
      409,
    )
  }
  const artifact = candidates[0]
  const versionId = artifact?.current_draft_version_id ?? artifact?.current_approved_version_id
  if (!artifact || !versionId) return undefined
  const version = versionsById.get(versionId)
  if (!version || version.kind !== kind || version.artifact_id !== artifact.id) {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      `The current ${kind.replaceAll('_', ' ')} version is unavailable.`,
      409,
    )
  }
  return version
}

function assertExactProductionScope(
  production: MotionStudioProductionRow,
  value: { workspaceId: string; projectId: string; editSessionId: string; productionId: string },
  label: string,
): void {
  if (value.workspaceId !== production.workspace_id || value.projectId !== production.project_id ||
      value.editSessionId !== production.edit_session_id || value.productionId !== production.id) {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      `${label} changed the exact workspace, project, edit, or production identity.`,
      409,
    )
  }
}

function projectSceneContinuityReview(input: {
  production: MotionStudioProductionRow
  document: SceneDocument
  documentState: MotionStudioArtifactVersionRow['state']
  currentContinuityAuthority?: StorytellingSceneContinuityCurrentAuthority
  currentApprovedSnapshot?: { id: string; timingAuthorityDigest: string }
}): NonNullable<MotionStudioSceneArtifactSummaryDto['storyContinuityReview']> {
  try {
    return projectStorytellingSceneContinuityReview({
      scope: {
        workspaceId: input.production.workspace_id,
        projectId: input.production.project_id,
        editSessionId: input.production.edit_session_id,
        productionId: input.production.id,
      },
      sceneDocument: input.document,
      sceneDocumentState: input.documentState,
      ...(input.currentContinuityAuthority
        ? { currentAuthority: input.currentContinuityAuthority }
        : {}),
      ...(input.currentApprovedSnapshot
        ? { currentApprovedSnapshot: input.currentApprovedSnapshot }
        : {}),
    })
  } catch {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      'Scene continuity could not be verified against the current story authority.',
      409,
    )
  }
}

function requireApprovedAnchorRange(authority: MotionStudioSnapshotAuthority, range: { startAnchorId: string; endAnchorId: string }): void {
  const start = authority.anchorFrames[range.startAnchorId]
  const end = authority.anchorFrames[range.endAnchorId]
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= end) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Scene timing must use an advancing pair of approved MasterTimingPlan anchors.', 409)
  }
}

function artifactPayload(kind: MotionStudioArtifactKind, data: unknown): MotionStudioArtifactPayload {
  return {
    schemaVersion: `motion-studio.${kind.replaceAll('_', '-')}.v1`,
    data: data as MotionStudioArtifactPayload['data'],
    references: [],
    extensions: [],
  }
}

function requestHash(operation: string, productionId: string, body: unknown): string {
  return sha256CanonicalJson({ method: 'POST', path: `/v1/motion-studio/productions/${productionId}/${operation}`, body })
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Motion Studio scene APIs require a verified bearer identity.', 401)
  }
  return userId
}

function plainRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function capabilityForLayer(layerType: CreateMotionStudioSceneDraftRequest['layerType']): string {
  const capabilities: Record<CreateMotionStudioSceneDraftRequest['layerType'], string> = {
    source_footage: 'timeline.compose_source_footage',
    image: 'motion.compose_image_layer',
    generated_video: 'motion.compose_generated_video_asset',
    text: 'remotion.precise_typography',
    caption: 'remotion.caption_layer',
    map: 'remotion.map_scene',
    chart: 'remotion.chart_scene',
    mask: 'motion.compose_existing_mask',
    audio: 'timeline.compose_audio_layer',
    effect: 'remotion.deterministic_effect',
  }
  return capabilities[layerType]
}

function isSceneSummaryKind(kind: MotionStudioArtifactKind): kind is MotionStudioSceneArtifactSummaryDto['kind'] {
  return SCENE_SUMMARY_KINDS.includes(kind as typeof SCENE_SUMMARY_KINDS[number])
}

function summaryLabel(kind: MotionStudioSceneArtifactSummaryDto['kind'], data: Record<string, unknown>): string {
  const preferred = [data.name, data.title, data.semanticPurpose, data.sceneId, data.id]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
  return preferred ?? kind.replaceAll('_', ' ')
}
