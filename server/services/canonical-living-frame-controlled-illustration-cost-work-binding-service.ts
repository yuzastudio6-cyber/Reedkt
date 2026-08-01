import type {
  CanonicalCustomerEstimateAuthority,
} from '../../src/types/canonical-customer-estimate-authority'
import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import {
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_COMPONENT_KEY,
  type CanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../../src/types/living-frame-controlled-illustration-cost-work-binding'
import type {
  CanonicalLivingFrameEstimateWorkAssetProjection,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import { ApiError } from '../errors/api-error'
import {
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding,
  verifyCanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../living-frame/living-frame-controlled-illustration-cost-work-binding'
import type { ServiceContext } from '../types'
import {
  type AuthorityJsonBlobRef,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
} from './private-edit-authority-store'

export function prepareCanonicalLivingFrameControlledIllustrationCostWorkBinding(
  input: {
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding | undefined
    readonly estimateWorkAssetProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection | undefined
    readonly customerEstimateAuthority:
      CanonicalCustomerEstimateAuthority
  },
):
  | CanonicalLivingFrameControlledIllustrationCostWorkBinding
  | undefined {
  if (
    !input.assetWorkInputBinding
    && !input.estimateWorkAssetProjection
  ) {
    if (
      input.customerEstimateAuthority.sourceBindings
        .livingFrameEstimateWorkAssetProjectionDigestSha256 !==
        null
    ) {
      throw conflict(
        'Canonical Living Frame cost/work authority exists without its estimate projection.',
      )
    }
    return undefined
  }
  if (
    !input.assetWorkInputBinding
    || !input.estimateWorkAssetProjection
  ) {
    throw conflict(
      'Canonical Living Frame controlled-illustration cost/work binding requires asset/work, estimate, and customer-estimate lineage together.',
    )
  }
  return compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    assetWorkInputBinding:
      input.assetWorkInputBinding,
    estimateWorkAssetProjection:
      input.estimateWorkAssetProjection,
    customerEstimateAuthority:
      input.customerEstimateAuthority,
  })
}

export async function persistCanonicalLivingFrameControlledIllustrationCostWorkBinding(
  input: {
    readonly context: ServiceContext
    readonly binding:
      | CanonicalLivingFrameControlledIllustrationCostWorkBinding
      | undefined
  },
): Promise<Record<string, AuthorityJsonBlobRef>> {
  if (!input.binding) return {}
  return {
    [CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_COMPONENT_KEY]:
      await putPrivateAuthorityJsonBlob({
        localStorageRoot:
          input.context.env.localStorageRoot,
        value:
          input.binding as unknown as Record<string, unknown>,
        maxBytes: 2 * 1024 * 1024,
      }),
  }
}

export async function loadCanonicalLivingFrameControlledIllustrationCostWorkBinding(
  input: {
    readonly context: ServiceContext
    readonly componentRefs:
      Record<string, AuthorityJsonBlobRef>
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding | undefined
    readonly estimateWorkAssetProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection | undefined
    readonly customerEstimateAuthority:
      CanonicalCustomerEstimateAuthority
  },
): Promise<
  | CanonicalLivingFrameControlledIllustrationCostWorkBinding
  | undefined
> {
  const ref =
    input.componentRefs[
      CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_COMPONENT_KEY
    ]
  if (
    !input.assetWorkInputBinding
    && !input.estimateWorkAssetProjection
    && !ref
  ) {
    return undefined
  }
  if (
    !input.assetWorkInputBinding
    || !input.estimateWorkAssetProjection
    || !ref
  ) {
    throw conflict(
      'Canonical Living Frame controlled-illustration cost/work binding and its complete source lineage must be present together.',
    )
  }
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot:
      input.context.env.localStorageRoot,
    ref,
  })
  const verification = {
    binding: value,
    assetWorkInputBinding:
      input.assetWorkInputBinding,
    estimateWorkAssetProjection:
      input.estimateWorkAssetProjection,
    customerEstimateAuthority:
      input.customerEstimateAuthority,
  }
  if (
    !verifyCanonicalLivingFrameControlledIllustrationCostWorkBinding(
      verification,
    )
  ) {
    throw conflict(
      'Canonical Living Frame controlled-illustration cost/work binding failed full source revalidation.',
    )
  }
  return verification.binding as unknown as
    CanonicalLivingFrameControlledIllustrationCostWorkBinding
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_controlled_illustration_cost_work_binding',
    },
  )
}
