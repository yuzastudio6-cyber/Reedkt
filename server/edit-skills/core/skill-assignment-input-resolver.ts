import type { EditSkillArtifactReference, EditSkillArtifactStore } from './edit-skill-artifact-store'
import { hashSkillValue, skillManifestReference } from './skill-capability-manifest-hash'
import type {
  SkillCapabilityManifest,
  SkillInputRequirement,
} from './skill-capability-manifest-types'
import { assertSkillAssignment } from './skill-range-authority'
import type { SkillAssignment } from './skill-assignment-types'

export interface ResolvedSkillAssignmentInput {
  requirement: Readonly<SkillInputRequirement>
  references: readonly EditSkillArtifactReference[]
  values: readonly unknown[]
}

export interface ResolvedSkillAssignmentInputs {
  assignment: SkillAssignment
  manifest: Readonly<SkillCapabilityManifest>
  required: ReadonlyMap<string, ResolvedSkillAssignmentInput>
  optional: ReadonlyMap<string, ResolvedSkillAssignmentInput>
  requireOne(key: string): { reference: EditSkillArtifactReference; value: unknown }
}

function sameValue(left: unknown, right: unknown): boolean {
  return hashSkillValue(left) === hashSkillValue(right)
}

function assertReferenceScope(
  assignment: SkillAssignment,
  reference: EditSkillArtifactReference,
): void {
  if (reference.ownerUserId !== assignment.ownerUserId) {
    throw new Error(`Skill input ${reference.artifactType} belongs to another user.`)
  }
  if (reference.workspaceId !== assignment.workspaceId) {
    throw new Error(`Skill input ${reference.artifactType} belongs to another workspace.`)
  }
  if (reference.projectId !== assignment.projectId) {
    throw new Error(`Skill input ${reference.artifactType} belongs to another project.`)
  }
}

function validateRequirementCatalog(
  required: readonly SkillInputRequirement[],
  optional: readonly SkillInputRequirement[],
): void {
  const keys = new Set<string>()
  const artifactTypes = new Map<string, string>()
  for (const requirement of [...required, ...optional]) {
    if (keys.has(requirement.key)) {
      throw new Error(`Skill manifest input key ${requirement.key} is ambiguous.`)
    }
    keys.add(requirement.key)
    const existingKey = artifactTypes.get(requirement.artifactType)
    if (existingKey) {
      throw new Error(
        `Skill manifest artifact ${requirement.artifactType} ambiguously maps to ${existingKey} and ${requirement.key}.`,
      )
    }
    artifactTypes.set(requirement.artifactType, requirement.key)
  }
}

async function resolveRequirement(input: {
  assignment: SkillAssignment
  artifactStore: EditSkillArtifactStore
  requirement: SkillInputRequirement
}): Promise<ResolvedSkillAssignmentInput> {
  const references = input.assignment.contextArtifactRefs.filter(
    (reference) => reference.artifactType === input.requirement.artifactType,
  )
  if (
    references.length < input.requirement.minimumCount ||
    references.length > input.requirement.maximumCount
  ) {
    throw new Error(
      `Skill input ${input.requirement.key} requires ${input.requirement.minimumCount}-${input.requirement.maximumCount} ` +
      `${input.requirement.artifactType} artifacts; received ${references.length}.`,
    )
  }
  const referenceKeys = references.map((reference) => hashSkillValue(reference))
  if (new Set(referenceKeys).size !== referenceKeys.length) {
    throw new Error(`Skill input ${input.requirement.key} contains a duplicate artifact reference.`)
  }
  const values: unknown[] = []
  for (const reference of references) {
    assertReferenceScope(input.assignment, reference)
    values.push(await input.artifactStore.readJson({
      reference,
      ownerUserId: input.assignment.ownerUserId,
      workspaceId: input.assignment.workspaceId,
      projectId: input.assignment.projectId,
    }))
  }
  return { requirement: input.requirement, references, values }
}

export async function resolveAndValidateSkillAssignmentInputs(input: {
  assignment: SkillAssignment
  manifest: Readonly<SkillCapabilityManifest>
  artifactStore: EditSkillArtifactStore
}): Promise<ResolvedSkillAssignmentInputs> {
  const assignment = assertSkillAssignment(input.assignment)
  if (!sameValue(assignment.manifestRef, skillManifestReference(input.manifest))) {
    throw new Error('Skill assignment input resolution rejected a stale manifest reference.')
  }
  validateRequirementCatalog(input.manifest.requiredInputs, input.manifest.optionalInputs)
  for (const reference of [...assignment.contextArtifactRefs, ...assignment.dependencyArtifactRefs]) {
    assertReferenceScope(assignment, reference)
  }
  const requiredTypes = new Set(input.manifest.requiredInputs.map((requirement) => requirement.artifactType))
  if (assignment.dependencyArtifactRefs.some((reference) => requiredTypes.has(reference.artifactType))) {
    throw new Error('A dependency artifact cannot replace a manifest-required assignment input.')
  }
  const allReferenceKeys = assignment.contextArtifactRefs.map((reference) => hashSkillValue(reference))
  if (new Set(allReferenceKeys).size !== allReferenceKeys.length) {
    throw new Error('Skill assignment contains an ambiguous duplicate context artifact.')
  }
  const required = new Map<string, ResolvedSkillAssignmentInput>()
  for (const requirement of input.manifest.requiredInputs) {
    required.set(requirement.key, await resolveRequirement({
      assignment,
      artifactStore: input.artifactStore,
      requirement,
    }))
  }
  const optional = new Map<string, ResolvedSkillAssignmentInput>()
  for (const requirement of input.manifest.optionalInputs) {
    optional.set(requirement.key, await resolveRequirement({
      assignment,
      artifactStore: input.artifactStore,
      requirement,
    }))
  }
  return {
    assignment,
    manifest: input.manifest,
    required,
    optional,
    requireOne(key) {
      const resolved = required.get(key)
      if (!resolved || resolved.references.length !== 1 || resolved.values.length !== 1) {
        throw new Error(`Skill input ${key} did not resolve to exactly one required artifact.`)
      }
      return { reference: resolved.references[0]!, value: resolved.values[0] }
    },
  }
}
