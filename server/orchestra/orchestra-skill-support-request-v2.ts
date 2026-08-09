import { z } from 'zod'

import {
  SKILL_SUPPORT_REQUEST_VERSION_V2,
  type SkillSupportRequestV2,
} from '../../src/types/orchestra-skill-support-request-v2'
import {
  assertClosedContractTree,
} from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from './orchestra-skill-contracts'

const safeKey = z.string().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const keyList = z.array(safeKey).max(256)

const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()

const frameRangeSchema = z.object({
  startFrame: z.number().int().min(0),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Frame range must have positive duration.',
    })
  }
})

const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey.nullable(),
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).max(256),
}).strict().superRefine((scope, context) => {
  let lastEnd = -1
  for (const range of scope.authorizedFrameRanges) {
    if (range.startFrame < lastEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Authorized frame ranges must be ordered and non-overlapping.',
      })
      return
    }
    lastEnd = range.endFrameExclusive
  }
})

const authoritySchema = z.object({
  scopeExpansionGranted: z.literal(false),
  timelineMutationGranted: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  providerCallGranted: z.literal(false),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  costAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export const skillSupportRequestV2Schema: z.ZodType<SkillSupportRequestV2> =
  z.object({
    schemaVersion: z.literal(SKILL_SUPPORT_REQUEST_VERSION_V2),
    requestId: safeKey,
    requestDigestSha256: sha256,
    originalCallRef: refSchema,
    requestingSkillKey: safeKey,
    targetSkillKey: z.enum([
      'visual_intelligence', 'track_all', 'living_frame', 'soundsync',
      'transitions', 'broll_owner', 'canonical_timing_owner',
      'canonical_layout_owner', 'captions',
    ]),
    requestedJobType: safeKey,
    reasonCode: safeKey,
    requestedArtifactTypes: keyList.min(1),
    canonicalScope: scopeSchema,
    typedPayloadType: safeKey,
    typedPayload: z.unknown(),
    mediationPolicy: z.object({
      hqMediated: z.literal(true),
      directPeerDispatchAllowed: z.literal(false),
      assigneeMayOnlyResumeAfterInjection: z.literal(true),
    }).strict(),
    authorityBoundary: authoritySchema,
  }).strict()

function findUnsafeText(value: unknown): string | null {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|\/(?:Users|Volumes|home|tmp)\/|\\\\|\.\.[/\\]|(?:authorization|password|credential|secret)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+/iu.test(current)) {
        return current
      }
      continue
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
  return null
}

export function calculateSkillSupportRequestV2Digest(
  value: Record<string, unknown>,
): string {
  return calculateSkillContractDigest(value, 'requestDigestSha256')
}

export function parseSkillSupportRequestV2(
  value: unknown,
): SkillSupportRequestV2 {
  assertClosedContractTree(value, 'Skill support request V2')
  if (findUnsafeText(value) !== null) {
    throw new Error('Skill support request V2 contains unsafe text.')
  }
  const parsed = skillSupportRequestV2Schema.parse(value)
  const expected = calculateSkillSupportRequestV2Digest(
    parsed as unknown as Record<string, unknown>)
  if (parsed.requestDigestSha256 !== expected) {
    throw new Error('Skill support request V2 digest verification failed.')
  }
  return parsed
}
