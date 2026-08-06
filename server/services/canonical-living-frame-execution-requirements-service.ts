import {
  CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_COMPONENT_KEY,
  type CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import {
  compileCanonicalLivingFrameExecutionRequirements,
  verifyCanonicalLivingFrameExecutionRequirements,
} from '../living-frame/canonical-living-frame-execution-requirements'
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

export function prepareCanonicalLivingFrameExecutionRequirements(
  input: {
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication | undefined
    readonly components: CanonicalPlanComponentsInput
  },
): CanonicalLivingFrameExecutionRequirements | undefined {
  if (!input.publication) return undefined
  return compileCanonicalLivingFrameExecutionRequirements({
    publication: input.publication,
    components: input.components,
  })
}

export async function persistCanonicalLivingFrameExecutionRequirements(
  input: {
    readonly context: ServiceContext
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements | undefined
  },
): Promise<Record<string, AuthorityJsonBlobRef>> {
  if (!input.requirements) return {}
  return {
    [CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_COMPONENT_KEY]:
      await putPrivateAuthorityJsonBlob({
        localStorageRoot: input.context.env.localStorageRoot,
        value:
          input.requirements as unknown as Record<string, unknown>,
        maxBytes: 2 * 1024 * 1024,
      }),
  }
}

export async function loadCanonicalLivingFrameExecutionRequirements(
  input: {
    readonly context: ServiceContext
    readonly componentRefs:
      Record<string, AuthorityJsonBlobRef>
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication | undefined
    readonly components: CanonicalPlanComponentsInput
  },
): Promise<CanonicalLivingFrameExecutionRequirements | undefined> {
  const ref =
    input.componentRefs[
      CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_COMPONENT_KEY
    ]
  if (!input.publication && !ref) return undefined
  if (!input.publication || !ref) {
    throw conflict(
      'Canonical Living Frame execution requirements and selected-scene lineage must be present together.',
    )
  }
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const verification = {
    requirements: value,
    publication: input.publication,
    components: input.components,
  }
  if (!verifyCanonicalLivingFrameExecutionRequirements(
    verification,
  )) {
    throw conflict(
      'Canonical Living Frame execution requirements failed full source revalidation.',
    )
  }
  return verification.requirements
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_execution_requirements',
    },
  )
}
