import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  readPrivateFileIfExistsWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../core/skill-capability-manifest-schema'
import {
  brollCandidateAttemptEvidenceSchema,
  createRefinementInjectedBrollCandidateAttemptEvidence,
  type BrollCandidateAttemptEvidence,
} from './b-roll-candidate-attempt'
import {
  brollCandidateRefinementAuthoritySchema,
  type BrollCandidateRefinementAuthority,
} from './mini-skills/refinement-director'

const refinementResultSchema = z.object({
  schemaVersion: z.literal('b_roll_injected_refinement_result_v1'),
  refinementAuthorityHash: skillSha256Schema,
  attemptEvidence: brollCandidateAttemptEvidenceSchema,
  rawOutputRelativePath: z.string().regex(
    /^b-roll\/candidate-refinements\/objects\/[a-f0-9]{64}\.mp4$/u,
  ),
  createdAt: z.string().datetime({ offset: true }),
  resultHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { resultHash, ...core } = value
  if (hashSkillValue(core) !== resultHash) {
    context.addIssue({ code: 'custom', message: 'B-roll injected refinement result hash is invalid.' })
  }
})

export async function executePrivateInjectedBrollCandidateRefinement(input: {
  localStorageRoot: string
  authority: BrollCandidateRefinementAuthority
  outputId: string
  bytes: Buffer | Uint8Array
  providerCostMicros: number
  infrastructureCostMicros: number
  now?: () => string
}): Promise<{
  disposition: 'executed' | 'completed_replay'
  attemptEvidence: BrollCandidateAttemptEvidence
}> {
  const authority = brollCandidateRefinementAuthoritySchema.parse(input.authority)
  const bytes = Buffer.isBuffer(input.bytes) ? input.bytes : Buffer.from(input.bytes)
  if (
    bytes.byteLength < 16 || bytes.byteLength > 67_108_864 ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp' ||
    !Number.isSafeInteger(input.providerCostMicros) || input.providerCostMicros < 0 ||
    !Number.isSafeInteger(input.infrastructureCostMicros) || input.infrastructureCostMicros < 0 ||
    input.providerCostMicros > authority.maximumAuthorizedProviderCostMicros ||
    input.infrastructureCostMicros >
      authority.maximumAuthorizedInfrastructureCostMicros ||
    input.providerCostMicros + input.infrastructureCostMicros >
      authority.maximumAuthorizedTotalInternalCostMicros
  ) throw new Error('Injected B-roll refinement output or cost is invalid.')
  const rawSha256 = sha256(bytes)
  const outputIdentity = hashSkillValue({
    domain: 'reeditpro:b-roll-candidate-refinement-output:v1',
    refinementAuthorityHash: authority.refinementAuthorityHash,
    outputId: input.outputId,
    rawSha256,
  })
  const attemptId = hashSkillValue({
    domain: 'reeditpro:b-roll-candidate-refinement-attempt:v1',
    refinementAuthorityHash: authority.refinementAuthorityHash,
  })
  const indexPath = `b-roll/candidate-refinements/attempts/${attemptId}.json`
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: `b-roll/candidate-refinements/locks/${attemptId}.lock`,
    operation: async () => {
      const existing = await readExisting(input.localStorageRoot, indexPath)
      if (existing) {
        if (
          existing.refinementAuthorityHash !== authority.refinementAuthorityHash ||
          existing.attemptEvidence.output.sha256 !== rawSha256
        ) throw new Error('B-roll refinement replay attempted to substitute output or authority.')
        await assertRawReadback(
          input.localStorageRoot,
          existing.rawOutputRelativePath,
          bytes,
        )
        return {
          disposition: 'completed_replay' as const,
          attemptEvidence: existing.attemptEvidence,
        }
      }
      const rawOutputRelativePath =
        `b-roll/candidate-refinements/objects/${outputIdentity}.mp4`
      const written = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: rawOutputRelativePath,
        content: bytes,
      })
      if (!written.created) {
        await assertRawReadback(input.localStorageRoot, rawOutputRelativePath, bytes)
      }
      await assertRawReadback(input.localStorageRoot, rawOutputRelativePath, bytes)
      const attemptEvidence = createRefinementInjectedBrollCandidateAttemptEvidence({
        attemptId,
        authorizationHash: authority.refinementAuthorityHash,
        requestPackageHash: authority.initialRequestPackageHash,
        assignmentHash: authority.assignmentHash,
        planHash: authority.planHash,
        interactionIdDigest: authority.previousInteractionIdDigest,
        output: {
          outputId: input.outputId,
          artifactType: 'provider_b_roll_candidate_video_mp4',
          contentType: 'video/mp4',
          privateObjectIdentityHash: outputIdentity,
          sha256: rawSha256,
          byteLength: bytes.byteLength,
          createOnly: true,
          checksumReadbackVerified: true,
          automaticSelectionAllowed: false,
          timelineMutationAllowed: false,
        },
        providerCostMicros: input.providerCostMicros,
        infrastructureCostMicros: input.infrastructureCostMicros,
      })
      const core = {
        schemaVersion: 'b_roll_injected_refinement_result_v1' as const,
        refinementAuthorityHash: authority.refinementAuthorityHash,
        attemptEvidence,
        rawOutputRelativePath,
        createdAt: (input.now ?? (() => new Date().toISOString()))(),
      }
      const result = refinementResultSchema.parse({
        ...core,
        resultHash: hashSkillValue(core),
      })
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: indexPath,
        content: Buffer.from(`${stableAuthorityStringify(result)}\n`, 'utf8'),
      })
      return { disposition: 'executed' as const, attemptEvidence }
    },
  })
}

async function readExisting(
  root: string,
  relativePath: string,
): Promise<z.infer<typeof refinementResultSchema> | undefined> {
  const text = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: root,
    relativePath,
  })
  return text ? refinementResultSchema.parse(JSON.parse(text)) : undefined
}

async function assertRawReadback(
  root: string,
  relativePath: string,
  expected: Buffer,
): Promise<void> {
  const stored = await readPrivateFileIfExistsWithinRoot({
    rootPath: root,
    relativePath,
  })
  if (!stored || !stored.equals(expected) || sha256(stored) !== sha256(expected)) {
    throw new Error('B-roll refinement private output changed after create-only persistence.')
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
