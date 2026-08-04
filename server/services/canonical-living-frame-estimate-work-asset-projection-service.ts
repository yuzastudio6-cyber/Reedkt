import {
  type CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import {
  CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_COMPONENT_KEY,
  type CanonicalLivingFrameEstimateWorkAssetProjection,
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
import {
  compileCanonicalLivingFrameEstimateWorkAssetProjection,
  verifyCanonicalLivingFrameEstimateWorkAssetProjection,
} from '../living-frame/canonical-living-frame-estimate-work-asset-projection'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  type AuthorityJsonBlobRef,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
} from './private-edit-authority-store'

export function prepareCanonicalLivingFrameEstimateWorkAssetProjection(
  input: {
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication | undefined
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements | undefined
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding | undefined
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding | undefined
    readonly components: CanonicalPlanComponentsInput
  },
): CanonicalLivingFrameEstimateWorkAssetProjection | undefined {
  if (
    !input.publication
    && !input.requirements
    && !input.timingBinding
    && !input.assetWorkInputBinding
  ) {
    return undefined
  }
  if (
    !input.publication
    || !input.requirements
    || !input.timingBinding
    || !input.assetWorkInputBinding
  ) {
    throw conflict(
      'Canonical Living Frame estimate/work/asset projection requires selected-scene, execution, timing, and asset/work input lineage together.',
    )
  }
  return compileCanonicalLivingFrameEstimateWorkAssetProjection({
    publication: input.publication,
    requirements: input.requirements,
    timingBinding: input.timingBinding,
    assetWorkInputBinding:
      input.assetWorkInputBinding,
    components: input.components,
  })
}

export async function persistCanonicalLivingFrameEstimateWorkAssetProjection(
  input: {
    readonly context: ServiceContext
    readonly projection:
      CanonicalLivingFrameEstimateWorkAssetProjection | undefined
  },
): Promise<Record<string, AuthorityJsonBlobRef>> {
  if (!input.projection) return {}
  return {
    [CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_COMPONENT_KEY]:
      await putPrivateAuthorityJsonBlob({
        localStorageRoot:
          input.context.env.localStorageRoot,
        value:
          input.projection as unknown as Record<string, unknown>,
        maxBytes: 2 * 1024 * 1024,
      }),
  }
}

export async function loadCanonicalLivingFrameEstimateWorkAssetProjection(
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
    readonly components: CanonicalPlanComponentsInput
  },
): Promise<CanonicalLivingFrameEstimateWorkAssetProjection | undefined> {
  const ref =
    input.componentRefs[
      CANONICAL_LIVING_FRAME_ESTIMATE_WORK_ASSET_PROJECTION_COMPONENT_KEY
    ]
  if (
    !input.publication
    && !input.requirements
    && !input.timingBinding
    && !input.assetWorkInputBinding
    && !ref
  ) {
    return undefined
  }
  if (
    !input.publication
    || !input.requirements
    || !input.timingBinding
    || !input.assetWorkInputBinding
    || !ref
  ) {
    throw conflict(
      'Canonical Living Frame estimate/work/asset projection and its complete source lineage must be present together.',
    )
  }
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const verification = {
    projection: value,
    publication: input.publication,
    requirements: input.requirements,
    timingBinding: input.timingBinding,
    assetWorkInputBinding:
      input.assetWorkInputBinding,
    components: input.components,
  }
  if (
    !verifyCanonicalLivingFrameEstimateWorkAssetProjection(
      verification,
    )
  ) {
    throw conflict(
      'Canonical Living Frame estimate/work/asset projection failed full source revalidation.',
    )
  }
  return verification.projection
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_estimate_work_asset_projection',
    },
  )
}
