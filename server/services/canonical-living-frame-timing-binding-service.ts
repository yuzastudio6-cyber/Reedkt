import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import {
  CANONICAL_LIVING_FRAME_TIMING_BINDING_COMPONENT_KEY,
  type CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  compileCanonicalLivingFrameTimingBinding,
  verifyCanonicalLivingFrameTimingBinding,
} from '../living-frame/canonical-living-frame-timing-binding'
import type { ServiceContext } from '../types'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import { ApiError } from '../errors/api-error'
import {
  type AuthorityJsonBlobRef,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
} from './private-edit-authority-store'

export function prepareCanonicalLivingFrameTimingBinding(
  input: {
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication | undefined
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements | undefined
    readonly components: CanonicalPlanComponentsInput
  },
): CanonicalLivingFrameTimingBinding | undefined {
  if (!input.publication && !input.requirements) {
    return undefined
  }
  if (!input.publication || !input.requirements) {
    throw conflict(
      'Canonical Living Frame timing binding requires selected-scene publication and execution requirements together.',
    )
  }
  return compileCanonicalLivingFrameTimingBinding({
    publication: input.publication,
    requirements: input.requirements,
    components: input.components,
  })
}

export async function persistCanonicalLivingFrameTimingBinding(
  input: {
    readonly context: ServiceContext
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding | undefined
  },
): Promise<Record<string, AuthorityJsonBlobRef>> {
  if (!input.timingBinding) return {}
  return {
    [CANONICAL_LIVING_FRAME_TIMING_BINDING_COMPONENT_KEY]:
      await putPrivateAuthorityJsonBlob({
        localStorageRoot: input.context.env.localStorageRoot,
        value:
          input.timingBinding as unknown as
            Record<string, unknown>,
        maxBytes: 2 * 1024 * 1024,
      }),
  }
}

export async function loadCanonicalLivingFrameTimingBinding(
  input: {
    readonly context: ServiceContext
    readonly componentRefs:
      Record<string, AuthorityJsonBlobRef>
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication | undefined
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements | undefined
    readonly components: CanonicalPlanComponentsInput
  },
): Promise<CanonicalLivingFrameTimingBinding | undefined> {
  const ref =
    input.componentRefs[
      CANONICAL_LIVING_FRAME_TIMING_BINDING_COMPONENT_KEY
    ]
  if (
    !input.publication
    && !input.requirements
    && !ref
  ) {
    return undefined
  }
  if (!input.publication || !input.requirements || !ref) {
    throw conflict(
      'Canonical Living Frame timing binding and its selected-scene lineage must be present together.',
    )
  }
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const verification = {
    timingBinding: value,
    publication: input.publication,
    requirements: input.requirements,
    components: input.components,
  }
  if (!verifyCanonicalLivingFrameTimingBinding(verification)) {
    throw conflict(
      'Canonical Living Frame timing binding failed full source revalidation.',
    )
  }
  return verification.timingBinding
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_master_timing_soundsync_binding',
    },
  )
}
