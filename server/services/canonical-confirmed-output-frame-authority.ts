import { z } from 'zod'

import {
  canonicalPlanComponentsSchema,
  type CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  canonicalConfirmedOutputBindingSchema,
  createCanonicalConfirmedOutputBinding,
} from '../validation/canonical-confirmed-output-frame-schemas'
import {
  resolvedPlanningInputAuthorityBindingSchema,
  type ResolvedPlanningInputAuthorityBinding,
} from '../validation/planning-input-authority-binding-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_CONFIRMED_OUTPUT_FRAME_AUTHORITY_VERSION =
  'canonical-confirmed-output-frame-authority-v1' as const

export const CANONICAL_CONFIRMED_OUTPUT_FRAME_AUTHORITY_COMPONENT_KEY =
  'canonicalConfirmedOutputFrameAuthority' as const

const safeIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)

const authorityWithoutDigestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CONFIRMED_OUTPUT_FRAME_AUTHORITY_VERSION),
  source: z.literal('canonical_backend_confirmed_output_frame_compiler'),
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  planningInputBindingHash: rawSha256Schema,
  planningInputRevision: z.number().int().nonnegative(),
  frameConfirmationId: safeIdSchema,
  confirmedAspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5', '4:3']),
  confirmedOutputBinding:
    canonicalConfirmedOutputBindingSchema,
  authorityBoundary: z.object({
    serverDerivedFromCanonicalReread: z.literal(true),
    browserFrameAuthorityAccepted: z.literal(false),
    callerOutputIdAccepted: z.literal(false),
    callerDimensionsAccepted: z.literal(false),
    callerFpsAccepted: z.literal(false),
    approvalGranted: z.literal(false),
    workDispatched: z.literal(false),
    providerCalled: z.literal(false),
    mediaExecuted: z.literal(false),
    publicDeliveryGranted: z.literal(false),
    productionAuthorityGranted: z.literal(false),
  }).strict(),
}).strict()

export const canonicalConfirmedOutputFrameAuthoritySchema =
  authorityWithoutDigestSchema.extend({
    authorityDigestSha256: rawSha256Schema,
  }).strict()

export type CanonicalConfirmedOutputFrameAuthority = z.infer<
  typeof canonicalConfirmedOutputFrameAuthoritySchema
>

export function createCanonicalConfirmedOutputFrameAuthority(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  planningInputAuthority: ResolvedPlanningInputAuthorityBinding
  components: CanonicalPlanComponentsInput
}): CanonicalConfirmedOutputFrameAuthority {
  assertPlainAcyclicData(input)
  const planning = resolvedPlanningInputAuthorityBindingSchema.parse(
    input.planningInputAuthority,
  )
  const components = canonicalPlanComponentsSchema.parse(input.components)
  const exactEdit = planning.exactEditPreference
  const settings = components.confirmedSettings
  const { bindingHash, ...planningWithoutHash } = planning
  if (
    planning.workspaceId !== input.workspaceId ||
    planning.projectId !== input.projectId ||
    planning.editSessionId !== input.editSessionId ||
    settings.outputFrameConfirmed !== true ||
    exactEdit.confirmedAspectRatio !== settings.aspectRatio ||
    bindingHash !== sha256AuthorityValue(planningWithoutHash)
  ) {
    throw new Error(
      'Canonical confirmed-output authority requires one current server-reread planning binding and matching confirmed frame.',
    )
  }

  const ratio = parseAndReduceAspectRatio(settings.aspectRatio)
  if (
    settings.outputFrame.width * ratio.denominator !==
      settings.outputFrame.height * ratio.numerator
  ) {
    throw new Error(
      'Canonical confirmed-output dimensions do not match the user-confirmed aspect ratio.',
    )
  }
  const fps = decimalToRational(settings.outputFrame.fps)
  const outputIdentityDigest = sha256AuthorityValue({
    domain: 'weeditpro:canonical-confirmed-output-id:v1',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    frameConfirmationId: exactEdit.frameConfirmationId,
    planningInputRevision: exactEdit.planningInputRevision,
  })
  const outputId = `canonical-output-${outputIdentityDigest.slice(0, 48)}`
  const frameEvidenceDigest = sha256AuthorityValue({
    domain: 'weeditpro:canonical-confirmed-output-frame-evidence:v1',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    planningInputBindingHash: planning.bindingHash,
    frameConfirmationId: exactEdit.frameConfirmationId,
    confirmedAspectRatio: exactEdit.confirmedAspectRatio,
    width: settings.outputFrame.width,
    height: settings.outputFrame.height,
    fpsNumerator: fps.numerator,
    fpsDenominator: fps.denominator,
    outputId,
  })
  const confirmedOutputBinding =
    createCanonicalConfirmedOutputBinding({
      outputId,
      aspectRatioLabel: exactEdit.confirmedAspectRatio,
      aspectRatioNumerator: ratio.numerator,
      aspectRatioDenominator: ratio.denominator,
      width: settings.outputFrame.width,
      height: settings.outputFrame.height,
      fpsNumerator: fps.numerator,
      fpsDenominator: fps.denominator,
      confirmedOutputFrameRef: {
        id: exactEdit.frameConfirmationId,
        version: exactEdit.planningInputRevision + 1,
        contentHash: `sha256:${frameEvidenceDigest}`,
      },
      confirmedByUser: true,
      confirmationRecordId: exactEdit.frameConfirmationId,
    })
  const withoutDigest = authorityWithoutDigestSchema.parse({
    schemaVersion: CANONICAL_CONFIRMED_OUTPUT_FRAME_AUTHORITY_VERSION,
    source: 'canonical_backend_confirmed_output_frame_compiler',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    planningInputBindingHash: planning.bindingHash,
    planningInputRevision: exactEdit.planningInputRevision,
    frameConfirmationId: exactEdit.frameConfirmationId,
    confirmedAspectRatio: exactEdit.confirmedAspectRatio,
    confirmedOutputBinding,
    authorityBoundary: {
      serverDerivedFromCanonicalReread: true,
      browserFrameAuthorityAccepted: false,
      callerOutputIdAccepted: false,
      callerDimensionsAccepted: false,
      callerFpsAccepted: false,
      approvalGranted: false,
      workDispatched: false,
      providerCalled: false,
      mediaExecuted: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    },
  })
  return canonicalConfirmedOutputFrameAuthoritySchema.parse({
    ...withoutDigest,
    authorityDigestSha256: sha256AuthorityValue(withoutDigest),
  })
}

export function verifyCanonicalConfirmedOutputFrameAuthority(input: {
  value: unknown
  workspaceId: string
  projectId: string
  editSessionId: string
  planningInputAuthority: ResolvedPlanningInputAuthorityBinding
  components: CanonicalPlanComponentsInput
}): CanonicalConfirmedOutputFrameAuthority {
  assertPlainAcyclicData(input)
  const parsed = canonicalConfirmedOutputFrameAuthoritySchema.parse(input.value)
  const { authorityDigestSha256, ...withoutDigest } = parsed
  if (authorityDigestSha256 !== sha256AuthorityValue(withoutDigest)) {
    throw new Error('Canonical confirmed-output authority digest is invalid.')
  }
  const expected = createCanonicalConfirmedOutputFrameAuthority(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Canonical confirmed-output authority is stale against the exact planning-input reread or confirmed frame.',
    )
  }
  return parsed
}

function parseAndReduceAspectRatio(value: string): {
  numerator: number
  denominator: number
} {
  const match = /^([1-9][0-9]{0,4}):([1-9][0-9]{0,4})$/u.exec(value)
  if (!match) throw new Error('Canonical output aspect ratio must be numeric.')
  const numerator = Number(match[1])
  const denominator = Number(match[2])
  const divisor = greatestCommonDivisor(numerator, denominator)
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  }
}

function decimalToRational(value: number): {
  numerator: number
  denominator: number
} {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Canonical output fps must be finite and positive.')
  }
  const broadcastRates = [
    [24_000, 1_001],
    [30_000, 1_001],
    [60_000, 1_001],
    [120_000, 1_001],
  ] as const
  const broadcastRate = broadcastRates.find(([numerator, denominator]) =>
    Math.abs(value - numerator / denominator) < 1e-9)
  if (broadcastRate) return {
    numerator: broadcastRate[0],
    denominator: broadcastRate[1],
  }
  const text = value.toString()
  const decimalPlaces = text.includes('.') ? text.split('.')[1]!.length : 0
  if (decimalPlaces > 6) {
    throw new Error('Canonical output fps precision exceeds the exact rational envelope.')
  }
  const denominator = 10 ** decimalPlaces
  const numerator = Math.round(value * denominator)
  const divisor = greatestCommonDivisor(numerator, denominator)
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  }
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) [a, b] = [b, a % b]
  return a || 1
}

function assertPlainAcyclicData(value: unknown): void {
  const active = new WeakSet<object>()
  let visitedNodes = 0
  const visit = (item: unknown, depth: number): void => {
    if (
      item === null
      || typeof item === 'string'
      || typeof item === 'boolean'
      || typeof item === 'undefined'
    ) return
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) {
        throw new TypeError('Confirmed-output authority has a non-finite number.')
      }
      return
    }
    if (typeof item !== 'object') {
      throw new TypeError('Confirmed-output authority has an unsupported value.')
    }
    visitedNodes += 1
    if (depth > 64 || visitedNodes > 20_000) {
      throw new TypeError('Confirmed-output authority exceeds structural bounds.')
    }
    const object = item as object
    if (active.has(object)) {
      throw new TypeError('Confirmed-output authority cannot be cyclic.')
    }
    let prototype: object | null
    let keys: readonly PropertyKey[]
    try {
      prototype = Object.getPrototypeOf(object)
      keys = Reflect.ownKeys(object)
    } catch {
      throw new TypeError('Confirmed-output authority cannot be inspected.')
    }
    if (
      !Array.isArray(object)
      && prototype !== Object.prototype
      && prototype !== null
    ) throw new TypeError(
      'Confirmed-output authority requires plain records and arrays.',
    )
    if (keys.some((key) => typeof key !== 'string')) {
      throw new TypeError('Confirmed-output authority cannot contain symbol keys.')
    }
    active.add(object)
    try {
      for (const key of keys as readonly string[]) {
        if (Array.isArray(object) && key === 'length') continue
        let descriptor: PropertyDescriptor | undefined
        try {
          descriptor = Object.getOwnPropertyDescriptor(object, key)
        } catch {
          throw new TypeError('Confirmed-output authority cannot be inspected.')
        }
        if (
          !descriptor
          || descriptor.get !== undefined
          || descriptor.set !== undefined
          || descriptor.enumerable !== true
          || !Object.hasOwn(descriptor, 'value')
        ) throw new TypeError(
          'Confirmed-output authority requires enumerable data properties.',
        )
        visit(descriptor.value, depth + 1)
      }
    } finally {
      active.delete(object)
    }
  }
  visit(value, 0)
}
