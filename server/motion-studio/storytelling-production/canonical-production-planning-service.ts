import type {
  PrepareCanonicalStorytellingPlanningRequest,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import {
  createMotionStudioCommandService,
  type MotionStudioCommandService,
} from '../commands'
import {
  isMotionStudioStorytellingProductionAuthorityPreparationPort,
} from './canonical-production-authority-reader'

const LOCAL_WARNING =
  'Storytelling planning is source-verified for private local review only. It does not call a provider, render, spend credits, bill, deploy, or deliver.'

type CommandAuthority = Pick<MotionStudioCommandService, 'getProductionScopeById'>

export class CanonicalStorytellingProductionPlanningService {
  private readonly commandAuthority: CommandAuthority
  private readonly context: ServiceContext

  constructor(
    context: ServiceContext,
    commandAuthority: CommandAuthority = createMotionStudioCommandService(context),
  ) {
    this.context = context
    this.commandAuthority = commandAuthority
  }

  async prepare(
    productionId: string,
    request: PrepareCanonicalStorytellingPlanningRequest,
  ) {
    const scope = await this.commandAuthority.getProductionScopeById(productionId)
    const port = this.context
      .canonicalMotionStudioStorytellingProductionAuthorityReaderPort
    if (!isMotionStudioStorytellingProductionAuthorityPreparationPort(port)) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Idea-first Storytelling planning is available only when the controlled source-verification reader is connected.',
        503,
        {
          requiredGate: 'canonical_motion_studio_storytelling_production_authority_reader',
          productionReady: false,
        },
      )
    }
    const preparation = await port.prepareAndVerifyAuthority({
      ...scope,
      storytellingStylePlan: request.storytellingStylePlan,
    })
    return { data: { preparation }, warnings: [LOCAL_WARNING] }
  }
}

export function createCanonicalStorytellingProductionPlanningService(
  context: ServiceContext,
): CanonicalStorytellingProductionPlanningService {
  return new CanonicalStorytellingProductionPlanningService(context)
}
