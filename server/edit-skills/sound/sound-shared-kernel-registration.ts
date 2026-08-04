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
import { createSkillResultEnvelope, type SkillResultEnvelope } from '../core/skill-result-envelope'
import { timelineRateDisplayFps } from '../core/timeline-rate'
import { canonicalSoundRequestSchema, type CanonicalSoundResult } from '../../sound/sound-contracts'
import { SOUND_ACCEPTED_ARTIFACT_TYPES, SOUND_PHASES, SOUND_PRODUCED_ARTIFACT_TYPES,
  SOUND_QA_KEYS, SOUND_ROUTE_OPERATION_REFS, SOUND_SUPPORTED_JOB_TYPES,
  soundSkillCapabilityManifest } from './sound-capability-manifest'
import type { CanonicalSoundPlanResult, CanonicalSoundSkillService } from './canonical-sound-skill-service'
import { validateCanonicalSoundPublication } from './sound-publication-validation'

const soundPlanSchema = z.custom<CanonicalSoundPlanResult>((value) => Boolean(
  value && typeof value === 'object' &&
  (value as CanonicalSoundPlanResult).schemaVersion === 'canonical-sound-plan-result-v1',
), 'Canonical Sound plan result required.')
const soundResultSchema = z.custom<CanonicalSoundResult>((value) => Boolean(
  value && typeof value === 'object' &&
  (value as CanonicalSoundResult).schemaVersion === 'canonical-sound-result-v1',
), 'Canonical Sound result required.')

export function registerSoundArtifactSchemas(registry: EditSkillArtifactSchemaRegistry): void {
  for (const artifactType of [...SOUND_ACCEPTED_ARTIFACT_TYPES, ...SOUND_PRODUCED_ARTIFACT_TYPES]) {
    if (registry.has(artifactType)) continue
    if (artifactType === 'sound_assignment_v2') registry.register(artifactType, canonicalSoundRequestSchema)
    else if (artifactType === 'sound_plan_v2') registry.register(artifactType, soundPlanSchema)
    else if (artifactType === 'sound_result_v2') registry.register(artifactType, soundResultSchema)
    else registry.register(artifactType, z.unknown())
  }
}

export function registerSoundQaPolicies(registry: SkillQaRegistry): void {
  for (const qaKey of SOUND_QA_KEYS) {
    if (registry.has(qaKey)) continue
    registry.register(qaKey, (input) => {
      const supplied = input[qaKey]
      const passed = supplied === true || supplied === 'pass'
      const perceptual = qaKey.includes('perceptual')
      return {
        qaKey,
        disposition: passed ? 'pass' : perceptual ? 'needs_review' : 'blocking',
        summary: passed ? `${qaKey} passed with explicit evidence.`
          : perceptual ? `${qaKey} requires evidence-backed human or qualified perceptual review.`
            : `${qaKey} requires explicit passing evidence.`,
        evidenceHashes: Array.isArray(input.evidenceHashes)
          ? input.evidenceHashes.filter((value): value is string => typeof value === 'string') : [],
      }
    })
  }
}

export class SoundSharedKernelPlanningHandler implements EditSkillHandler {
  readonly #artifacts: EditSkillArtifactStore
  readonly #sound: CanonicalSoundSkillService

  constructor(input: { artifacts: EditSkillArtifactStore; sound: CanonicalSoundSkillService }) {
    this.#artifacts = input.artifacts
    this.#sound = input.sound
  }

  async plan(invocation: EditSkillInvocationContext): Promise<SkillPlanEnvelope> {
    const requestRef = invocation.assignment.contextArtifactRefs.find(
      (ref) => ref.artifactType === 'sound_assignment_v2')
    if (!requestRef) throw new Error('Shared Sound invocation requires a canonical sound_assignment_v2 artifact.')
    const tenant = {
      ownerUserId: invocation.assignment.ownerUserId,
      workspaceId: invocation.assignment.workspaceId,
      projectId: invocation.assignment.projectId,
    }
    const request = canonicalSoundRequestSchema.parse(await this.#artifacts.readJson({ reference: requestRef, ...tenant }))
    const plan = await this.#sound.plan(request)
    const stored = await this.#artifacts.putJson({ artifactType: 'sound_plan_v2', value: plan, ...tenant })
    const status = plan.controller.result.status
    return createSkillPlanEnvelope({
      schemaVersion: 'edit-skill-plan-envelope-v1',
      planId: `sound.plan.${request.requestId}`,
      assignmentId: invocation.assignment.assignmentId,
      assignmentHash: invocation.assignment.assignmentHash,
      manifestRef: invocation.assignment.manifestRef,
      authorizedRange: invocation.assignment.authorizedRange,
      disposition: status === 'no_sound' ? 'use_no_action'
        : status === 'blocked' ? 'blocked'
          : status === 'needs_visual_revision' ? 'needs_other_skill' : 'use_skill',
      payloadArtifactType: 'sound_plan_v2',
      payloadHash: stored.sha256,
      ...(status === 'needs_visual_revision' ? { dependencySkillKey: 'transition' } : {}),
    })
  }
}

export function projectCanonicalSoundResultEnvelope(input: {
  invocation: EditSkillInvocationContext
  plan: SkillPlanEnvelope
  result: CanonicalSoundResult
}): SkillResultEnvelope {
  return createSkillResultEnvelope({
    schemaVersion: 'edit-skill-result-envelope-v1',
    resultId: `sound.result.${input.result.requestId}`,
    planId: input.plan.planId,
    planHash: input.plan.planHash,
    assignmentId: input.invocation.assignment.assignmentId,
    assignmentHash: input.invocation.assignment.assignmentHash,
    manifestRef: input.invocation.assignment.manifestRef,
    authorizedRange: input.invocation.assignment.authorizedRange,
    disposition: input.result.status === 'completed' ? 'selected'
      : input.result.status === 'no_sound' ? 'use_no_action'
        : input.result.status === 'needs_visual_revision' ? 'needs_other_skill'
          : input.result.status === 'blocked' || input.result.status === 'stale' ? 'blocked' : 'deferred',
    resultArtifactType: 'sound_result_v2',
    resultArtifactHash: hashSkillValue(input.result),
    qaEvidenceHashes: input.result.actualExecutionEvidence
      ? [input.result.finalCompositionHandoff?.qaEvidenceHash ?? hashSkillValue(input.result.qaReport)] : [],
    mutationRanges: input.result.modifiedAudioRanges.map((range) => ({
      startFrameInclusive: range.startFrame,
      endFrameExclusive: range.endFrameExclusive,
      timelineRate: input.result.timelineRate,
      fps: timelineRateDisplayFps(input.result.timelineRate),
    })),
  })
}

export function registerSoundSkill(input: {
  capabilities: SkillCapabilityRegistry
  estimators: SkillEstimatorRegistry
  qa: SkillQaRegistry
  artifacts: EditSkillArtifactSchemaRegistry
  artifactStore: EditSkillArtifactStore
  qualifications: SkillQualificationRegistry
  catalog: SkillReferenceCatalog
  service: CanonicalSoundSkillService
}): void {
  validateCanonicalSoundPublication()
  registerSoundArtifactSchemas(input.artifacts)
  registerSoundQaPolicies(input.qa)
  input.estimators.registerTime('sound.time.v3', (estimateInput) => {
    const durationFrames = typeof estimateInput.durationFrames === 'number' ? estimateInput.durationFrames : 0
    const expectedSeconds = Math.max(1, Math.ceil(durationFrames / 24)) +
      (estimateInput.providerRequired === true ? 120 : 10)
    return {
      minimumSeconds: Math.max(1, Math.floor(expectedSeconds / 2)), expectedSeconds,
      maximumSeconds: expectedSeconds * 3,
      evidence: ['exact_range_duration', estimateInput.providerRequired === true ? 'provider_fixture_route' : 'local_route'],
    }
  })
  input.estimators.registerCredit('sound.credit.v3', (estimateInput) => {
    const provider = estimateInput.providerRequired === true
    const expectedCredits = provider ? 10 : estimateInput.noAction === true ? 0 : 1
    return {
      minimumCredits: expectedCredits === 0 ? 0 : 1, expectedCredits,
      maximumCredits: provider ? expectedCredits * 4 : expectedCredits,
      internalToolCostOnly: true,
      evidence: [provider ? 'mirelo_provider_credit_preflight_required' : 'local_infrastructure_only'],
    }
  })
  for (const value of SOUND_SUPPORTED_JOB_TYPES) input.catalog.jobTypes.add(value)
  for (const value of SOUND_PHASES) input.catalog.phases.add(value)
  for (const route of SOUND_ROUTE_OPERATION_REFS) {
    const destination = route.routeKind === 'tool' ? input.catalog.toolOperations
      : route.routeKind === 'provider' ? input.catalog.providerOperations
        : route.routeKind === 'source' ? input.catalog.sourceOperations : input.catalog.noActionOperations
    destination.add(route.operationRef)
  }
  input.capabilities.registerManifest(soundSkillCapabilityManifest)
  input.capabilities.registerHandler({
    skillKey: 'sound', skillVersion: soundSkillCapabilityManifest.skillVersion,
    handler: new SoundSharedKernelPlanningHandler({ artifacts: input.artifactStore, sound: input.service }),
  })
  const evidenceHash = hashSkillValue({
    manifestHash: soundSkillCapabilityManifest.manifestHash,
    qualification: 'planning_qualified',
    evidence: ['shared_kernel', 'exact_routes', 'local_private_execution', 'mirelo_injected_fixture'],
  })
  const receipt = createSkillQualificationReceipt({
    schemaVersion: 'skill-qualification-receipt-v1',
    manifestRef: skillManifestReference(soundSkillCapabilityManifest),
    qualificationStatus: 'planning_qualified',
    fixtureResults: [
      { fixtureKey: 'sound.shared_kernel.v2', status: 'passed', evidenceHash, summary: 'Sound validates in the neutral edit-skill kernel.' },
      { fixtureKey: 'sound.mirelo.injected_route.v2', status: 'passed', evidenceHash, summary: 'Mirelo remains fixture-qualified through injected transport.' },
    ],
    buildEvidenceHashes: [evidenceHash], testEvidenceHashes: [evidenceHash],
    securityEvidenceHashes: [evidenceHash], providerEvidenceHashes: [evidenceHash],
    issuedAt: '2026-08-03T12:00:00.000Z',
  })
  input.qualifications.register(receipt)
  input.qualifications.assertClaim(input.capabilities.referenceFor('sound'), soundSkillCapabilityManifest.qualificationStatus)
}
