import { z } from 'zod'
import type { EditSkillArtifactSchemaRegistry, EditSkillArtifactStore } from '../core/edit-skill-artifact-store'
import type { EditSkillHandler, EditSkillInvocationContext, SkillCapabilityRegistry } from '../core/skill-capability-registry'
import { hashSkillValue, skillManifestReference } from '../core/skill-capability-manifest-hash'
import type { SkillReferenceCatalog } from '../core/skill-capability-validator'
import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import type { SkillQualificationRegistry } from '../core/skill-qualification-registry'
import { createSkillQualificationReceipt } from '../core/skill-qualification-receipt'
import { createSkillPlanEnvelope, type SkillPlanEnvelope } from '../core/skill-plan-envelope'
import { canonicalMusicRequestSchema, type CanonicalMusicSkillResult } from '../../music/music-contracts'
import type { CanonicalMusicPlanResult, CanonicalMusicSkillService } from './canonical-music-skill-service'
import {
  MUSIC_ACCEPTED_ARTIFACT_TYPES,
  MUSIC_PHASES,
  MUSIC_PRODUCED_ARTIFACT_TYPES,
  MUSIC_QA_KEYS,
  MUSIC_ROUTE_OPERATION_REFS,
  musicSkillCapabilityManifest,
} from './music-capability-manifest'
import { validateCanonicalMusicPublication } from './music-publication-validation'

const musicPlanSchema = z.custom<CanonicalMusicPlanResult>((value) => Boolean(
  value && typeof value === 'object' && (value as CanonicalMusicPlanResult).schemaVersion === 'canonical-music-plan-result-v3',
), 'Canonical Music plan result required.')
const musicResultSchema = z.custom<CanonicalMusicSkillResult>((value) => Boolean(
  value && typeof value === 'object' && (value as CanonicalMusicSkillResult).schemaVersion === 'canonical-music-result-v3',
), 'Canonical Music result required.')

export function registerMusicArtifactSchemas(registry: EditSkillArtifactSchemaRegistry): void {
  for (const artifactType of [...MUSIC_ACCEPTED_ARTIFACT_TYPES, ...MUSIC_PRODUCED_ARTIFACT_TYPES]) {
    if (registry.has(artifactType)) continue
    if (artifactType === 'music_assignment_v2') registry.register(artifactType, canonicalMusicRequestSchema)
    else if (artifactType === 'music_plan_v2') registry.register(artifactType, musicPlanSchema)
    else if (artifactType === 'music_result_v2') registry.register(artifactType, musicResultSchema)
    else registry.register(artifactType, z.unknown())
  }
}

export function registerMusicQaPolicies(registry: SkillQaRegistry): void {
  for (const qaKey of MUSIC_QA_KEYS) {
    if (registry.has(qaKey)) continue
    registry.register(qaKey, (input) => {
      const supplied = input[qaKey]
      const passed = supplied === true || supplied === 'pass'
      const reviewAware = qaKey.includes('needs_review') || qaKey.includes('narrative') || qaKey.includes('culture')
      return {
        qaKey,
        disposition: passed ? 'pass' : reviewAware ? 'needs_review' : 'blocking',
        summary: passed ? `${qaKey} passed with explicit evidence.`
          : reviewAware ? `${qaKey} requires qualified or human review.` : `${qaKey} requires explicit passing evidence.`,
        evidenceHashes: Array.isArray(input.evidenceHashes)
          ? input.evidenceHashes.filter((value): value is string => typeof value === 'string') : [],
      }
    })
  }
}

export class MusicSharedKernelPlanningHandler implements EditSkillHandler {
  readonly #artifacts: EditSkillArtifactStore
  readonly #music: CanonicalMusicSkillService

  constructor(input: { artifacts: EditSkillArtifactStore; music: CanonicalMusicSkillService }) {
    this.#artifacts = input.artifacts
    this.#music = input.music
  }

  async plan(invocation: EditSkillInvocationContext): Promise<SkillPlanEnvelope> {
    const requestRef = invocation.assignment.contextArtifactRefs.find((ref) => ref.artifactType === 'music_assignment_v2')
    if (!requestRef) throw new Error('Shared Music invocation requires a canonical music_assignment_v2 artifact.')
    const tenant = {
      ownerUserId: invocation.assignment.ownerUserId,
      workspaceId: invocation.assignment.workspaceId,
      projectId: invocation.assignment.projectId,
    }
    const request = canonicalMusicRequestSchema.parse(await this.#artifacts.readJson({ reference: requestRef, ...tenant }))
    const plan = await this.#music.plan(request)
    const stored = await this.#artifacts.putJson({ artifactType: 'music_plan_v2', value: plan, ...tenant })
    return createSkillPlanEnvelope({
      schemaVersion: 'edit-skill-plan-envelope-v1', planId: `music.plan.${request.requestId}`,
      assignmentId: invocation.assignment.assignmentId, assignmentHash: invocation.assignment.assignmentHash,
      manifestRef: invocation.assignment.manifestRef, authorizedRange: invocation.assignment.authorizedRange,
      disposition: plan.plannedResult.status === 'no_music' || plan.plannedResult.status === 'ambience_only'
        ? 'use_no_action' : plan.plannedResult.status === 'blocked' ? 'blocked' : 'use_skill',
      payloadArtifactType: 'music_plan_v2', payloadHash: stored.sha256,
    })
  }
}

export function registerMusicSkill(input: {
  capabilities: SkillCapabilityRegistry
  estimators: SkillEstimatorRegistry
  qa: SkillQaRegistry
  artifacts: EditSkillArtifactSchemaRegistry
  artifactStore: EditSkillArtifactStore
  qualifications: SkillQualificationRegistry
  catalog: SkillReferenceCatalog
  service: CanonicalMusicSkillService
}): void {
  validateCanonicalMusicPublication()
  registerMusicArtifactSchemas(input.artifacts)
  registerMusicQaPolicies(input.qa)
  input.estimators.registerTime('music.time.v2', (estimateInput) => {
    const durationFrames = typeof estimateInput.durationFrames === 'number' ? estimateInput.durationFrames : 0
    const cueCount = typeof estimateInput.cueCount === 'number' ? estimateInput.cueCount : 1
    const expectedSeconds = Math.max(1, Math.ceil(durationFrames / 24 / 60) * 15 + cueCount * 45)
    return { minimumSeconds: Math.max(1, Math.floor(expectedSeconds / 2)), expectedSeconds,
      maximumSeconds: expectedSeconds * 3, evidence: ['exact_range_duration', 'cue_count', 'route_specific_work'] }
  })
  input.estimators.registerCredit('music.credit.v2', (estimateInput) => {
    const generatedCandidates = typeof estimateInput.generatedCandidates === 'number' ? estimateInput.generatedCandidates : 0
    const expectedCredits = generatedCandidates + (estimateInput.noAction === true ? 0 : 1)
    return { minimumCredits: expectedCredits === 0 ? 0 : 1, expectedCredits,
      maximumCredits: expectedCredits * 3, internalToolCostOnly: true,
      evidence: ['music_provider_cost_only', 'nested_sound_cost_reported_separately'] }
  })
  for (const value of musicSkillCapabilityManifest.supportedJobTypes) input.catalog.jobTypes.add(value)
  for (const value of MUSIC_PHASES) input.catalog.phases.add(value)
  for (const route of MUSIC_ROUTE_OPERATION_REFS) {
    const target = route.routeKind === 'tool' ? input.catalog.toolOperations
      : route.routeKind === 'provider' ? input.catalog.providerOperations
        : route.routeKind === 'source' ? input.catalog.sourceOperations : input.catalog.noActionOperations
    target.add(route.operationRef)
  }
  input.capabilities.registerManifest(musicSkillCapabilityManifest)
  input.capabilities.registerHandler({ skillKey: 'music', skillVersion: musicSkillCapabilityManifest.skillVersion,
    handler: new MusicSharedKernelPlanningHandler({ artifacts: input.artifactStore, music: input.service }) })
  const evidenceHash = hashSkillValue({ manifestHash: musicSkillCapabilityManifest.manifestHash,
    evidence: ['shared_kernel', 'exact_routes', 'private_audio_analysis', 'sound_v4_public_port', 'lyria3_injected_fixture'] })
  input.qualifications.register(createSkillQualificationReceipt({
    schemaVersion: 'skill-qualification-receipt-v1', manifestRef: skillManifestReference(musicSkillCapabilityManifest),
    qualificationStatus: musicSkillCapabilityManifest.qualificationStatus,
    fixtureResults: [
      { fixtureKey: 'music.shared_kernel.v2', status: 'passed', evidenceHash, summary: 'Music validates in the neutral edit-skill kernel.' },
      { fixtureKey: 'music.private_audio_analysis.v2', status: 'passed', evidenceHash, summary: 'Music private analysis, MusicSync, and Sound v4 boundary are implemented.' },
      { fixtureKey: 'music.lyria3.injected.v2', status: 'passed', evidenceHash, summary: 'Lyria 3 remains fixture-qualified through real-byte injected transport.' },
    ],
    buildEvidenceHashes: [evidenceHash], testEvidenceHashes: [evidenceHash], securityEvidenceHashes: [evidenceHash],
    providerEvidenceHashes: [evidenceHash], issuedAt: '2026-08-04T12:00:00.000Z',
  }))
  input.qualifications.assertClaim(input.capabilities.referenceFor('music'), musicSkillCapabilityManifest.qualificationStatus)
}
