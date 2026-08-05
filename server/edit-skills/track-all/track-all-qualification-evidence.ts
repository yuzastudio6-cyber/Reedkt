import { z } from 'zod'

import { hashSkillValue, skillManifestReference } from '../core/skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import {
  skillGitCommitShaSchema,
  skillQualificationDependencyAuthorityHashSchema,
  skillQualificationFixtureEvidenceSchema,
  type SkillQualificationDependencyAuthorityHash,
  type SkillQualificationFixtureEvidence,
} from '../core/skill-qualification-evidence'
import {
  assertSkillQualificationReceipt,
  createSkillQualificationReceiptV2,
  skillQualificationReceiptV2Schema,
} from '../core/skill-qualification-receipt'
import { GENERATED_TRACK_ALL_INTERNAL_QUALIFICATION_ARTIFACT } from './generated/track-all-internal-qualification.generated'
import {
  TRACK_ALL_QUALIFICATION_COMMAND_IDS,
  TRACK_ALL_ROUTE_COMMANDS,
} from './track-all-qualification-command-catalog'
import {
  TRACK_ALL_QUALIFICATION_FIXTURE_KEYS,
  TRACK_ALL_ROUTE_QUALIFICATION_KEYS,
} from './track-all-qualification'
import {
  assertTrackAllQualificationDependencyAuthorityHashes,
  computeTrackAllQualificationDependencyAuthorityHashes,
} from './track-all-qualification-dependency-authorities'
import { computeTrackAllRelevantSourceTreeHash } from './track-all-qualification-source-hash'

const routeQualificationCoreSchema = z.object({
  routeKey: z.enum(TRACK_ALL_ROUTE_QUALIFICATION_KEYS),
  qualificationStatus: z.enum([
    'planning_qualified',
    'internal_execution_qualified',
    'blocked',
  ]),
  evidenceClass: z.enum([
    'actual_planning_command_evidence',
    'actual_deterministic_private_fixture_evidence',
    'actual_injected_private_lifecycle_evidence',
    'missing_external_sam_evidence',
    'missing_production_evidence',
  ]),
  commandEvidenceHashes: z.array(skillSha256Schema).min(1).max(20),
  actualSamInferenceObserved: z.boolean(),
  productionWorkerObserved: z.boolean(),
  publicArtifactCount: z.number().int().nonnegative(),
  productionMutationCount: z.number().int().nonnegative(),
  summary: z.string().trim().min(1).max(2_000),
}).strict()

export const trackAllRouteQualificationEvidenceSchema = routeQualificationCoreSchema.extend({
  routeEvidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { routeEvidenceHash, ...core } = value
  if (hashSkillValue(core) !== routeEvidenceHash) {
    context.addIssue({ code: 'custom', message: 'Track All route qualification evidence is stale or forged.' })
  }
  if (value.publicArtifactCount !== 0 || value.productionMutationCount !== 0) {
    context.addIssue({ code: 'custom', message: 'Track All internal qualification cannot create public artifacts or production mutations.' })
  }
  if (value.routeKey === 'sam3_1_masklet_route' && (
    value.qualificationStatus !== 'blocked' ||
    value.evidenceClass !== 'missing_external_sam_evidence' ||
    value.actualSamInferenceObserved
  )) context.addIssue({
    code: 'custom',
    message: 'The current Track All SAM route must remain blocked without actual SAM inference evidence.',
  })
  if (value.routeKey === 'production_worker_route' && (
    value.qualificationStatus !== 'blocked' ||
    value.evidenceClass !== 'missing_production_evidence' ||
    value.productionWorkerObserved
  )) context.addIssue({
    code: 'custom',
    message: 'The current Track All production worker route must remain blocked.',
  })
})

export type TrackAllRouteQualificationEvidence = z.infer<
  typeof trackAllRouteQualificationEvidenceSchema
>

export function createTrackAllRouteQualificationEvidence(
  input: z.input<typeof routeQualificationCoreSchema>,
): TrackAllRouteQualificationEvidence {
  const core = routeQualificationCoreSchema.parse(input)
  return trackAllRouteQualificationEvidenceSchema.parse({
    ...core,
    routeEvidenceHash: hashSkillValue(core),
  })
}

const generatedArtifactCoreSchema = z.object({
  schemaVersion: z.literal('track_all_generated_qualification_artifact_v1'),
  generatedBy: z.literal('npm.qualify:track-all:internal.v1'),
  manifestRef: skillManifestReferenceSchema,
  testedCommitSha: skillGitCommitShaSchema,
  relevantSourceTreeHash: skillSha256Schema,
  dependencyAuthorityHashes: z.array(skillQualificationDependencyAuthorityHashSchema)
    .min(1).max(100),
  fixtureEvidence: z.array(skillQualificationFixtureEvidenceSchema)
    .length(TRACK_ALL_QUALIFICATION_FIXTURE_KEYS.length),
  commandEvidence: z.array(skillQualificationFixtureEvidenceSchema)
    .length(TRACK_ALL_QUALIFICATION_COMMAND_IDS.length),
  routeQualifications: z.array(trackAllRouteQualificationEvidenceSchema)
    .length(TRACK_ALL_ROUTE_QUALIFICATION_KEYS.length),
  actualSamRequestCount: z.literal(0),
  actualGpuExecutionCount: z.literal(0),
  productionQualified: z.literal(false),
  receipt: skillQualificationReceiptV2Schema,
}).strict()

export const trackAllGeneratedQualificationArtifactSchema = generatedArtifactCoreSchema.extend({
  artifactHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { artifactHash, ...core } = value
  if (hashSkillValue(core) !== artifactHash) {
    context.addIssue({ code: 'custom', message: 'Generated Track All qualification artifact is stale or forged.' })
  }
})

export type TrackAllGeneratedQualificationArtifact = z.infer<
  typeof trackAllGeneratedQualificationArtifactSchema
>

const BUILD_COMMAND_IDS = [
  'npm.build',
  'npm.typecheck:server',
  'npm.lint',
  'npm.check:frontend-boundary',
] as const

const SECURITY_COMMAND_IDS = [
  'npm.test:track-all-sam3.1-operation-authority',
  'npm.test:track-all-retirement',
  'npm.smoke:runtime-api-security',
  'npm.smoke:edit-execution-security-boundary',
] as const

function commandEvidenceHashes(
  commandEvidence: readonly SkillQualificationFixtureEvidence[],
  commandIds: readonly string[],
): string[] {
  const byCommand = new Map(commandEvidence.map((entry) => [entry.commandId, entry]))
  return commandIds.map((commandId) => {
    const evidence = byCommand.get(commandId)
    if (!evidence) throw new Error(`Required Track All command evidence is missing: ${commandId}.`)
    return evidence.evidenceHash
  })
}

function assertExactOrderedValues(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== actual.length ||
    hashSkillValue(actual) !== hashSkillValue(expected)
  ) throw new Error(`Track All qualification ${label} are missing, duplicate, unknown, or reordered.`)
}

function assertCurrentRouteQualificationPolicy(
  routes: readonly TrackAllRouteQualificationEvidence[],
): void {
  for (const route of routes) {
    const expected = route.routeKey === 'planning_core_route'
      ? {
          status: 'planning_qualified',
          evidenceClass: 'actual_planning_command_evidence',
        } as const
      : route.routeKey === 'sam3_1_masklet_route'
        ? {
            status: 'blocked',
            evidenceClass: 'missing_external_sam_evidence',
          } as const
        : route.routeKey === 'production_worker_route'
          ? {
              status: 'blocked',
              evidenceClass: 'missing_production_evidence',
            } as const
          : route.routeKey === 'public_plugin_lifecycle_route'
            ? {
                status: 'internal_execution_qualified',
                evidenceClass: 'actual_injected_private_lifecycle_evidence',
              } as const
            : {
                status: 'internal_execution_qualified',
                evidenceClass: 'actual_deterministic_private_fixture_evidence',
              } as const
    if (
      route.qualificationStatus !== expected.status ||
      route.evidenceClass !== expected.evidenceClass
    ) throw new Error(`Track All route ${route.routeKey} overclaims or misclassifies current evidence.`)
  }
}

export function issueTrackAllGeneratedQualificationArtifact(input: {
  manifest: Readonly<SkillCapabilityManifest>
  testedCommitSha: string
  relevantSourceTreeHash: string
  dependencyAuthorityHashes: readonly SkillQualificationDependencyAuthorityHash[]
  fixtureEvidence: readonly SkillQualificationFixtureEvidence[]
  commandEvidence: readonly SkillQualificationFixtureEvidence[]
  routeQualifications: readonly TrackAllRouteQualificationEvidence[]
}): TrackAllGeneratedQualificationArtifact {
  const manifestRef = skillManifestReference(input.manifest)
  if (input.manifest.qualificationStatus !== 'planning_qualified') {
    throw new Error('Track All qualification cannot issue against a manifest that overclaims current evidence.')
  }
  const fixtureEvidence = input.fixtureEvidence.map((entry) =>
    skillQualificationFixtureEvidenceSchema.parse(entry))
  const commandEvidence = input.commandEvidence.map((entry) =>
    skillQualificationFixtureEvidenceSchema.parse(entry))
  const routeQualifications = input.routeQualifications.map((entry) =>
    trackAllRouteQualificationEvidenceSchema.parse(entry))
  const dependencyAuthorityHashes = input.dependencyAuthorityHashes.map((entry) =>
    skillQualificationDependencyAuthorityHashSchema.parse(entry))
  assertTrackAllQualificationDependencyAuthorityHashes({
    actual: dependencyAuthorityHashes,
    expected: computeTrackAllQualificationDependencyAuthorityHashes(),
  })
  assertExactOrderedValues(
    fixtureEvidence.map((entry) => entry.fixtureKey),
    TRACK_ALL_QUALIFICATION_FIXTURE_KEYS,
    'fixture evidence',
  )
  assertExactOrderedValues(
    commandEvidence.map((entry) => entry.commandId),
    TRACK_ALL_QUALIFICATION_COMMAND_IDS,
    'command evidence',
  )
  assertExactOrderedValues(
    routeQualifications.map((entry) => entry.routeKey),
    TRACK_ALL_ROUTE_QUALIFICATION_KEYS,
    'route evidence',
  )
  assertCurrentRouteQualificationPolicy(routeQualifications)
  for (const evidence of [...fixtureEvidence, ...commandEvidence]) {
    if (
      evidence.skillKey !== 'track_all' ||
      evidence.skillVersion !== input.manifest.skillVersion ||
      evidence.contractVersion !== input.manifest.contractVersion ||
      evidence.manifestHash !== input.manifest.manifestHash ||
      evidence.testedCommitSha !== input.testedCommitSha ||
      evidence.relevantSourceTreeHash !== input.relevantSourceTreeHash ||
      hashSkillValue(evidence.dependencyAuthorityHashes) !== hashSkillValue(dependencyAuthorityHashes) ||
      !evidence.passed || evidence.exitStatus !== 0 ||
      evidence.providerRequestCount !== 0 || evidence.publicArtifactCount !== 0 ||
      evidence.productionMutationCount !== 0
    ) throw new Error('Track All qualification evidence is failed, stale, externally mutating, or forged.')
  }
  for (const route of routeQualifications) {
    const expectedCommands = TRACK_ALL_ROUTE_COMMANDS[route.routeKey]
    const expectedHashes = commandEvidenceHashes(commandEvidence, expectedCommands)
    if (hashSkillValue(route.commandEvidenceHashes) !== hashSkillValue(expectedHashes)) {
      throw new Error(`Track All route ${route.routeKey} lost exact command evidence lineage.`)
    }
  }
  const startedAt = [...fixtureEvidence, ...commandEvidence]
    .map((entry) => entry.startedAt).sort()[0]!
  const completedAt = [...fixtureEvidence, ...commandEvidence]
    .map((entry) => entry.completedAt).sort().at(-1)!
  const receipt = createSkillQualificationReceiptV2({
    schemaVersion: 'skill-qualification-receipt-v2',
    manifestRef,
    qualificationStatus: 'planning_qualified',
    testedCommitSha: input.testedCommitSha,
    relevantSourceTreeHash: input.relevantSourceTreeHash,
    dependencyAuthorityHashes,
    fixtureResults: fixtureEvidence.map((entry) => ({
      fixtureKey: entry.fixtureKey,
      status: 'passed' as const,
      evidenceHash: entry.evidenceHash,
      summary: `${entry.fixtureKey} passed via ${entry.commandId}.`,
    })),
    fixtureEvidenceRefs: fixtureEvidence.map((entry) => ({
      fixtureKey: entry.fixtureKey,
      commandId: entry.commandId,
      evidenceHash: entry.evidenceHash,
    })),
    buildEvidenceHashes: commandEvidenceHashes(commandEvidence, BUILD_COMMAND_IDS),
    testEvidenceHashes: commandEvidence.map((entry) => entry.evidenceHash),
    securityEvidenceHashes: commandEvidenceHashes(commandEvidence, SECURITY_COMMAND_IDS),
    providerEvidenceHashes: [],
    mediaEvidenceHashes: [],
    remotionEvidenceHashes: [],
    startedAt,
    completedAt,
    issuedAt: completedAt,
  })
  const core = generatedArtifactCoreSchema.parse({
    schemaVersion: 'track_all_generated_qualification_artifact_v1',
    generatedBy: 'npm.qualify:track-all:internal.v1',
    manifestRef,
    testedCommitSha: input.testedCommitSha,
    relevantSourceTreeHash: input.relevantSourceTreeHash,
    dependencyAuthorityHashes,
    fixtureEvidence,
    commandEvidence,
    routeQualifications,
    actualSamRequestCount: 0,
    actualGpuExecutionCount: 0,
    productionQualified: false,
    receipt,
  })
  assertSkillQualificationReceipt(receipt)
  return trackAllGeneratedQualificationArtifactSchema.parse({
    ...core,
    artifactHash: hashSkillValue(core),
  })
}

export function assertTrackAllGeneratedQualificationArtifact(input: {
  artifact: unknown
  manifest: Readonly<SkillCapabilityManifest>
  expectedRelevantSourceTreeHash: string
  expectedDependencyAuthorityHashes: readonly SkillQualificationDependencyAuthorityHash[]
}): TrackAllGeneratedQualificationArtifact {
  const artifact = trackAllGeneratedQualificationArtifactSchema.parse(input.artifact)
  assertTrackAllQualificationDependencyAuthorityHashes({
    actual: artifact.dependencyAuthorityHashes,
    expected: input.expectedDependencyAuthorityHashes,
  })
  if (
    hashSkillValue(artifact.manifestRef) !== hashSkillValue(skillManifestReference(input.manifest)) ||
    artifact.relevantSourceTreeHash !== input.expectedRelevantSourceTreeHash ||
    artifact.receipt.qualificationStatus !== 'planning_qualified' ||
    artifact.receipt.testedCommitSha !== artifact.testedCommitSha ||
    artifact.receipt.relevantSourceTreeHash !== artifact.relevantSourceTreeHash ||
    hashSkillValue(artifact.receipt.dependencyAuthorityHashes) !==
      hashSkillValue(input.expectedDependencyAuthorityHashes)
  ) throw new Error('Generated Track All qualification artifact is stale or overclaims authority.')
  const commandById = new Map(artifact.commandEvidence.map((entry) => [entry.commandId, entry]))
  assertExactOrderedValues(
    artifact.fixtureEvidence.map((entry) => entry.fixtureKey),
    TRACK_ALL_QUALIFICATION_FIXTURE_KEYS,
    'fixture evidence',
  )
  assertExactOrderedValues(
    artifact.commandEvidence.map((entry) => entry.commandId),
    TRACK_ALL_QUALIFICATION_COMMAND_IDS,
    'command evidence',
  )
  assertExactOrderedValues(
    artifact.routeQualifications.map((entry) => entry.routeKey),
    TRACK_ALL_ROUTE_QUALIFICATION_KEYS,
    'route evidence',
  )
  assertCurrentRouteQualificationPolicy(artifact.routeQualifications)
  for (const evidence of [...artifact.fixtureEvidence, ...artifact.commandEvidence]) {
    if (
      evidence.testedCommitSha !== artifact.testedCommitSha ||
      evidence.relevantSourceTreeHash !== artifact.relevantSourceTreeHash ||
      evidence.manifestHash !== artifact.manifestRef.manifestHash ||
      hashSkillValue(evidence.dependencyAuthorityHashes) !==
        hashSkillValue(input.expectedDependencyAuthorityHashes) ||
      !evidence.passed || evidence.exitStatus !== 0 ||
      evidence.providerRequestCount !== 0 || evidence.publicArtifactCount !== 0 ||
      evidence.productionMutationCount !== 0
    ) throw new Error('Generated Track All qualification evidence is failed, stale, mutating, or forged.')
  }
  for (const ref of artifact.receipt.fixtureEvidenceRefs) {
    const fixture = artifact.fixtureEvidence.find((entry) => entry.fixtureKey === ref.fixtureKey)
    const command = commandById.get(ref.commandId)
    if (
      !fixture || !command || fixture.evidenceHash !== ref.evidenceHash ||
      fixture.commandId !== ref.commandId ||
      !fixture.evidenceArtifactHashes.includes(command.evidenceHash)
    ) throw new Error('Generated Track All receipt lost actual fixture command lineage.')
  }
  for (const route of artifact.routeQualifications) {
    const expectedHashes = commandEvidenceHashes(
      artifact.commandEvidence,
      TRACK_ALL_ROUTE_COMMANDS[route.routeKey],
    )
    if (hashSkillValue(route.commandEvidenceHashes) !== hashSkillValue(expectedHashes)) {
      throw new Error(`Generated Track All route ${route.routeKey} has forged command lineage.`)
    }
  }
  assertSkillQualificationReceipt(artifact.receipt)
  return artifact
}

export function tryLoadTrackAllGeneratedQualificationArtifact(input: {
  manifest: Readonly<SkillCapabilityManifest>
  expectedRelevantSourceTreeHash: string
  expectedDependencyAuthorityHashes: readonly SkillQualificationDependencyAuthorityHash[]
}): TrackAllGeneratedQualificationArtifact | undefined {
  if (GENERATED_TRACK_ALL_INTERNAL_QUALIFICATION_ARTIFACT === undefined) return undefined
  return assertTrackAllGeneratedQualificationArtifact({
    artifact: GENERATED_TRACK_ALL_INTERNAL_QUALIFICATION_ARTIFACT,
    ...input,
  })
}

export function loadTrackAllGeneratedQualificationReceiptForCurrentSource(
  manifest: Readonly<SkillCapabilityManifest>,
) {
  const artifact = tryLoadTrackAllGeneratedQualificationArtifact({
    manifest,
    expectedRelevantSourceTreeHash: computeTrackAllRelevantSourceTreeHash(),
    expectedDependencyAuthorityHashes:
      computeTrackAllQualificationDependencyAuthorityHashes(),
  })
  if (!artifact) {
    throw new Error('Track All runtime is unqualified: generated qualification evidence is unavailable.')
  }
  return artifact.receipt
}
