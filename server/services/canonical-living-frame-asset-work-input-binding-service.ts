import {
  CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_COMPONENT_KEY,
  type CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
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
  compileCanonicalLivingFrameAssetWorkInputBinding,
  verifyCanonicalLivingFrameAssetWorkInputBinding,
} from '../living-frame/canonical-living-frame-asset-work-input-binding'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import type {
  SourceBindingManifestCandidate,
} from '../validation/source-media-authority-schemas'
import {
  type AuthorityJsonBlobRef,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
} from './private-edit-authority-store'

export async function prepareCanonicalLivingFrameAssetWorkInputBinding(
  input: {
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication | undefined
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements | undefined
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding | undefined
    readonly components: CanonicalPlanComponentsInput
    readonly sourceMediaAuthority:
      SourceBindingManifestCandidate
  },
): Promise<
  CanonicalLivingFrameAssetWorkInputBinding | undefined
> {
  if (
    !input.publication
    && !input.requirements
    && !input.timingBinding
  ) {
    return undefined
  }
  if (
    !input.publication
    || !input.requirements
    || !input.timingBinding
  ) {
    throw conflict(
      'Canonical Living Frame asset/work input binding requires selected-scene, execution, and timing lineage together.',
    )
  }
  return compileCanonicalLivingFrameAssetWorkInputBinding({
    publication: input.publication,
    requirements: input.requirements,
    timingBinding: input.timingBinding,
    components: input.components,
    sourceMediaAuthority: input.sourceMediaAuthority,
  })
}

export async function persistCanonicalLivingFrameAssetWorkInputBinding(
  input: {
    readonly context: ServiceContext
    readonly binding:
      CanonicalLivingFrameAssetWorkInputBinding | undefined
  },
): Promise<Record<string, AuthorityJsonBlobRef>> {
  if (!input.binding) return {}
  return {
    [CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_COMPONENT_KEY]:
      await putPrivateAuthorityJsonBlob({
        localStorageRoot:
          input.context.env.localStorageRoot,
        value:
          input.binding as unknown as Record<string, unknown>,
        maxBytes: 2 * 1024 * 1024,
      }),
  }
}

export async function loadCanonicalLivingFrameAssetWorkInputBinding(
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
    readonly components: CanonicalPlanComponentsInput
    readonly sourceMediaAuthority:
      SourceBindingManifestCandidate
  },
): Promise<
  CanonicalLivingFrameAssetWorkInputBinding | undefined
> {
  const ref =
    input.componentRefs[
      CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_COMPONENT_KEY
    ]
  if (
    !input.publication
    && !input.requirements
    && !input.timingBinding
    && !ref
  ) {
    return undefined
  }
  if (
    !input.publication
    || !input.requirements
    || !input.timingBinding
    || !ref
  ) {
    throw conflict(
      'Canonical Living Frame asset/work input binding and its complete source lineage must be present together.',
    )
  }
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const verification = {
    binding: value,
    publication: input.publication,
    requirements: input.requirements,
    timingBinding: input.timingBinding,
    components: input.components,
    sourceMediaAuthority: input.sourceMediaAuthority,
  }
  if (!(await verifyCanonicalLivingFrameAssetWorkInputBinding(
    verification,
  ))) {
    throw conflict(
      'Canonical Living Frame asset/work input binding failed full source revalidation.',
    )
  }
  return verification.binding as unknown as
    CanonicalLivingFrameAssetWorkInputBinding
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_asset_work_input_binding',
    },
  )
}
