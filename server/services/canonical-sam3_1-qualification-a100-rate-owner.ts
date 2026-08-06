import { z } from 'zod'

import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateReadPort,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository,
  type CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import type {
  CanonicalSam31QualificationA100RateReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import type {
  CanonicalSam31QualificationApprovedA100RateReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_A100_RATE_OWNER_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-a100-rate-owner-v1' as const

const ROUTE_ID = 'a100_80gb_heavy_primary' as const
const REGION = 'us-central1' as const
const RATE_AUTHORITY_ID =
  'sam31-source-checkpoint-qualification-a100-current-rate' as const
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
    .refine((value) => !value.includes('..')),
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export type CanonicalSam31QualificationA100RateOwner =
  CanonicalSam31QualificationA100RateReadPort
  & CanonicalSam31QualificationApprovedA100RateReadPort
  & {
    readonly schemaVersion:
      typeof CANONICAL_SAM3_1_QUALIFICATION_A100_RATE_OWNER_VERSION
    readonly evidenceClass:
      'billing_api_observation_create_only_repository_exact_reread'
  }

type CurrentRateReadInput = Parameters<
  CanonicalSam31QualificationA100RateReadPort[
    'rereadCurrentAccountEffectiveA100Rate'
  ]
>[0]
type ApprovedRateReadInput = Parameters<
  CanonicalSam31QualificationApprovedA100RateReadPort[
    'rereadExactApprovedRate'
  ]
>[0]

/**
 * Reads the billing-account-effective A100 route price immediately before
 * qualification admission, persists that exact authority, and later rereads
 * the same immutable rate for terminal internal-cost reconciliation. It does
 * not calculate customer credits, add a service fee, or launch a GPU job.
 */
export function createCanonicalSam31QualificationA100RateOwner(input: {
  readonly liveRateReadPort: CanonicalGoogleCloudGpuRateReadPort
  readonly repository: CanonicalCurrentGoogleCloudGpuRateAuthorityRepository
}): CanonicalSam31QualificationA100RateOwner {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_A100_RATE_OWNER_VERSION,
    evidenceClass:
      'billing_api_observation_create_only_repository_exact_reread',

    async rereadCurrentAccountEffectiveA100Rate(
      untrusted: CurrentRateReadInput,
    ) {
      assertPlainSerializedData(untrusted, 'sam31_a100_current_rate_read')
      const request = z.object({
        routeId: z.literal(ROUTE_ID),
        region: z.literal(REGION),
        at: timestamp,
      }).strict().parse(untrusted)
      const authority =
        await observeCanonicalCurrentGoogleCloudGpuRateAuthority({
          rateAuthorityId: RATE_AUTHORITY_ID,
          rateAuthorityVersion: 1,
          routeId: request.routeId,
          region: request.region,
          readPort: input.liveRateReadPort,
        })
      assertCanonicalCurrentGoogleCloudGpuRateAuthority(authority, request.at)
      const persisted = await input.repository
        .persistCurrentRateAuthorityCreateOnly({
          authority,
          publishedAt: request.at,
        })
      const reread = await input.repository.rereadApprovedCurrentRate({
        rateAuthorityRef: persisted.rateAuthorityRef,
        routeId: ROUTE_ID,
        at: request.at,
      })
      const accepted = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        reread,
        request.at,
      )
      if (stableAuthorityStringify(accepted) !==
        stableAuthorityStringify(authority)) {
        throw new Error('SAM 3.1 A100 current rate exact reread changed.')
      }
      return structuredClone(accepted)
    },

    async rereadExactApprovedRate(untrusted: ApprovedRateReadInput) {
      assertPlainSerializedData(untrusted, 'sam31_a100_approved_rate_read')
      const request = z.object({
        rateAuthorityRef: evidenceRefSchema,
        at: timestamp,
      }).strict().parse(untrusted)
      const reread = await input.repository.rereadApprovedCurrentRate({
        rateAuthorityRef: request.rateAuthorityRef,
        routeId: ROUTE_ID,
        at: request.at,
      })
      return structuredClone(
        assertCanonicalCurrentGoogleCloudGpuRateAuthority(reread, request.at),
      )
    },
  })
}

export function createCanonicalSam31GcpQualificationA100RateOwner(input: {
  readonly liveRateReadPort: CanonicalGoogleCloudGpuRateReadPort
  readonly repository?: CanonicalCurrentGoogleCloudGpuRateAuthorityRepository
}): CanonicalSam31QualificationA100RateOwner {
  return createCanonicalSam31QualificationA100RateOwner({
    liveRateReadPort: input.liveRateReadPort,
    repository: input.repository ??
      createCanonicalGcsCurrentGoogleCloudGpuRateAuthorityRepository(),
  })
}

function assertDependencies(input: {
  readonly liveRateReadPort: CanonicalGoogleCloudGpuRateReadPort
  readonly repository: CanonicalCurrentGoogleCloudGpuRateAuthorityRepository
}): void {
  if (
    typeof input.liveRateReadPort?.readCurrentRouteRate !== 'function'
    || typeof input.repository?.persistCurrentRateAuthorityCreateOnly
      !== 'function'
    || typeof input.repository?.rereadApprovedCurrentRate !== 'function'
  ) throw new Error('SAM 3.1 A100 rate owner is not configured.')
}
