import type {
  CanonicalCustomerEstimateAuthority,
} from '../../src/types/canonical-customer-estimate-authority'
import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import {
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_COMPONENT_KEY,
  type CanonicalLivingFrameWorkGraphProjection,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  CanonicalLivingFrameEstimateWorkAssetProjection,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import { ApiError } from '../errors/api-error'
import {
  compileCanonicalLivingFrameWorkGraphProjection,
  verifyCanonicalLivingFrameWorkGraphProjection,
} from '../living-frame/canonical-living-frame-work-graph-projection'
import type { ServiceContext } from '../types'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  type AuthorityJsonBlobRef,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
} from './private-edit-authority-store'

export function prepareCanonicalLivingFrameWorkGraphProjection(
  input: {
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication | undefined
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements | undefined
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding | undefined
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding | undefined
    readonly estimateWorkAssetProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection | undefined
    readonly customerEstimateAuthority:
      CanonicalCustomerEstimateAuthority
    readonly components: CanonicalPlanComponentsInput
  },
): CanonicalLivingFrameWorkGraphProjection | undefined {
  if (
    !input.publication
    && !input.requirements
    && !input.timingBinding
    && !input.assetWorkInputBinding
    && !input.estimateWorkAssetProjection
  ) {
    return undefined
  }
  if (
    !input.publication
    || !input.requirements
    || !input.timingBinding
    || !input.assetWorkInputBinding
    || !input.estimateWorkAssetProjection
  ) {
    throw conflict(
      'Canonical Living Frame work-graph projection requires selected-scene, execution, timing, asset/work, estimate, and customer-estimate lineage together.',
    )
  }
  return compileCanonicalLivingFrameWorkGraphProjection({
    publication: input.publication,
    requirements: input.requirements,
    timingBinding: input.timingBinding,
    assetWorkInputBinding:
      input.assetWorkInputBinding,
    estimateWorkAssetProjection:
      input.estimateWorkAssetProjection,
    customerEstimateAuthority:
      input.customerEstimateAuthority,
    components: input.components,
  })
}

export async function persistCanonicalLivingFrameWorkGraphProjection(
  input: {
    readonly context: ServiceContext
    readonly projection:
      CanonicalLivingFrameWorkGraphProjection | undefined
  },
): Promise<Record<string, AuthorityJsonBlobRef>> {
  if (!input.projection) return {}
  return {
    [CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_COMPONENT_KEY]:
      await putPrivateAuthorityJsonBlob({
        localStorageRoot:
          input.context.env.localStorageRoot,
        value:
          input.projection as unknown as Record<string, unknown>,
        maxBytes: 4 * 1024 * 1024,
      }),
  }
}

export async function loadCanonicalLivingFrameWorkGraphProjection(
  input: {
    readonly context: ServiceContext
    readonly componentRefs:
      Record<string, AuthorityJsonBlobRef>
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication | undefined
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements | undefined
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding | undefined
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding | undefined
    readonly estimateWorkAssetProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection | undefined
    readonly customerEstimateAuthority:
      CanonicalCustomerEstimateAuthority
    readonly components: CanonicalPlanComponentsInput
  },
): Promise<CanonicalLivingFrameWorkGraphProjection | undefined> {
  const ref =
    input.componentRefs[
      CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_COMPONENT_KEY
    ]
  if (
    !input.publication
    && !input.requirements
    && !input.timingBinding
    && !input.assetWorkInputBinding
    && !input.estimateWorkAssetProjection
    && !ref
  ) {
    return undefined
  }
  if (
    !input.publication
    || !input.requirements
    || !input.timingBinding
    || !input.assetWorkInputBinding
    || !input.estimateWorkAssetProjection
    || !ref
  ) {
    throw conflict(
      'Canonical Living Frame work-graph projection and its complete source lineage must be present together.',
    )
  }
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot:
      input.context.env.localStorageRoot,
    ref,
  })
  const verification = {
    projection: value,
    publication: input.publication,
    requirements: input.requirements,
    timingBinding: input.timingBinding,
    assetWorkInputBinding:
      input.assetWorkInputBinding,
    estimateWorkAssetProjection:
      input.estimateWorkAssetProjection,
    customerEstimateAuthority:
      input.customerEstimateAuthority,
    components: input.components,
  }
  if (
    !verifyCanonicalLivingFrameWorkGraphProjection(
      verification,
    )
  ) {
    throw conflict(
      'Canonical Living Frame work-graph projection failed full source revalidation.',
    )
  }
  return verification.projection as unknown as
    CanonicalLivingFrameWorkGraphProjection
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_work_graph_projection',
    },
  )
}
