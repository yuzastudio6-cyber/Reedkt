import { createHash } from 'node:crypto'
import type {
  CanonicalSourceLedChatAssistantRuntime,
  CanonicalSourceLedChatExchange,
  CanonicalSourceLedChatPlanBinding,
  CanonicalSourceLedChatRequestedSettings,
  CanonicalSourceLedChatSetupField,
  CanonicalSourceLedChatThread,
} from '../../src/types/canonical-source-led-chat-direction'
import {
  CANONICAL_SOURCE_LED_CHAT_PLAN_BINDING_VERSION,
} from '../../src/types/canonical-source-led-chat-direction'
import type {
  CanonicalExactEditPlanningAuthorityRead,
} from '../../src/types/canonical-exact-edit-planning-authority'
import {
  resolveMaterialPlanningInstruction,
} from '../../src/lib/planning-input-safety'
import type {
  AspectRatio,
  FrameTemplateType,
} from '../../src/types/reeditpro'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  AppendCanonicalSourceLedChatDirectionBody,
} from '../validation/canonical-source-led-chat-schemas'
import {
  MAX_CANONICAL_SOURCE_LED_CHAT_EXCHANGES,
  MAX_CANONICAL_SOURCE_LED_CHAT_IDEMPOTENCY_RECORDS,
  canonicalSourceLedChatRequestHash,
  createEmptyPrivateCanonicalSourceLedChatRecord,
  mutatePrivateCanonicalSourceLedChatRecord,
  projectPrivateCanonicalSourceLedChatThread,
  readPrivateCanonicalSourceLedChatRecord,
  type CanonicalSourceLedChatStoreScope,
  type PrivateCanonicalSourceLedChatRecord,
} from './private-canonical-source-led-chat-store'
import { createProjectService } from './project-service'
import {
  readPlanningExactEditPreferenceAuthority,
} from './planning-exact-edit-preference-authority-port'
import type {
  SourceLedChatAssistantResult,
} from './source-led-chat-assistant'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export interface CanonicalSourceLedChatPlanningDirections {
  readonly instructionHistory: readonly string[]
  readonly exchangeIds: readonly string[]
  readonly threadRevision: number
  readonly authorityDigestSha256: string
}

export function createCanonicalSourceLedChatDirectionService(
  context: ServiceContext,
) {
  return {
    async read(input: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }): Promise<CanonicalSourceLedChatThread> {
      const scope = await authorizeChatStoreScope(context, input)
      const record = await readPrivateCanonicalSourceLedChatRecord(scope)
      if (!record) {
        return projectPrivateCanonicalSourceLedChatThread(scope)
      }
      const authority = await requireChatAuthority(context, scope)
      return projectThreadAgainstCurrentAuthority(scope, record, authority)
    },

    async append(input: AppendCanonicalSourceLedChatDirectionBody & {
      readonly projectId: string
      readonly editSessionId: string
      readonly idempotencyKey: string
    }): Promise<{
      readonly thread: CanonicalSourceLedChatThread
      readonly exchange: CanonicalSourceLedChatExchange
      readonly replayed: boolean
    }> {
      const scope = await authorizeChatStoreScope(context, input)
      const authority = await requireChatAuthority(context, scope)
      assertChatPlanningMutable(authority)

      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const message = normalizeChatDirection(input.message)
      const requestHashSha256 = canonicalSourceLedChatRequestHash({
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        editSessionId: scope.editSessionId,
        clientMessageId: input.clientMessageId,
        message,
      })
      const outcome = await mutatePrivateCanonicalSourceLedChatRecord<{
        readonly record: PrivateCanonicalSourceLedChatRecord
        readonly exchange: CanonicalSourceLedChatExchange
        readonly replayed: boolean
        readonly authority: CanonicalExactEditPlanningAuthorityRead
      }>({
        scope,
        async mutation(current) {
          const lockedAuthority = (
            await readPlanningExactEditPreferenceAuthority({ context, scope })
          ).authority
          assertChatPlanningMutable(lockedAuthority)
          const timestamp = new Date().toISOString()
          const record = current ??
            createEmptyPrivateCanonicalSourceLedChatRecord(scope, timestamp)
          const replay = record.idempotencyRecords.find(
            (entry) => entry.idempotencyKey === idempotencyKey,
          )
          if (replay) {
            if (replay.requestHashSha256 !== requestHashSha256) {
              throw new ApiError(
                'IDEMPOTENCY_CONFLICT',
                'This edit-chat retry changed its message.',
                409,
              )
            }
            const exchange = record.exchanges.find(
              (item) => item.exchangeId === replay.exchangeId,
            )
            if (!exchange) {
              throw new ApiError(
                'INTERNAL_ERROR',
                'The saved edit-chat retry lost its exchange lineage.',
                500,
                undefined,
                { internal: true },
              )
            }
            return {
              changed: false,
              result: {
                record,
                exchange,
                replayed: true as const,
                authority: lockedAuthority,
              },
            }
          }
          const duplicateClientMessage = record.exchanges.find(
            (exchange) => exchange.clientMessageId === input.clientMessageId,
          )
          if (duplicateClientMessage) {
            if (
              duplicateClientMessage.userMessage.contentDigestSha256 !==
                sha256(message)
            ) {
              throw new ApiError(
                'IDEMPOTENCY_CONFLICT',
                'This client chat message identity was reused with different text.',
                409,
              )
            }
            if (
              record.idempotencyRecords.length >=
                MAX_CANONICAL_SOURCE_LED_CHAT_IDEMPOTENCY_RECORDS
            ) {
              throw new ApiError(
                'IDEMPOTENCY_CAPACITY_EXCEEDED',
                'This named edit chat reached its safe retry capacity.',
                503,
              )
            }
            const nextRecord: PrivateCanonicalSourceLedChatRecord = {
              ...record,
              idempotencyRecords: [...record.idempotencyRecords, {
                idempotencyKey,
                requestHashSha256,
                exchangeId: duplicateClientMessage.exchangeId,
                completedAt: timestamp,
              }],
              updatedAt: timestamp,
            }
            return {
              changed: true,
              record: nextRecord,
              result: {
                record: nextRecord,
                exchange: duplicateClientMessage,
                replayed: true as const,
                authority: lockedAuthority,
              },
            }
          }
          const latestExchange = record.exchanges.at(-1)
          const retryableLatestExchange =
            latestExchange
            && latestExchange.clientMessageId !== input.clientMessageId
            && latestExchange.userMessage.contentDigestSha256 ===
              sha256(message)
            && latestExchange.effect.status === 'waiting_for_ai_response'
            && latestExchange.assistantRuntime !== undefined
            && latestExchange.assistantRuntime.status !== 'completed'
          if (retryableLatestExchange) {
            if (
              record.idempotencyRecords.length >=
                MAX_CANONICAL_SOURCE_LED_CHAT_IDEMPOTENCY_RECORDS
            ) {
              throw new ApiError(
                'IDEMPOTENCY_CAPACITY_EXCEEDED',
                'This named edit chat reached its safe retry capacity.',
                503,
              )
            }
            const retriedExchange = await createExchange({
              authority: lockedAuthority,
              clientMessageId: latestExchange.clientMessageId,
              assistantAttemptClientMessageId: input.clientMessageId,
              message,
              revision: latestExchange.revision,
              timestamp,
              scope,
              priorExchanges: record.exchanges.slice(0, -1),
              assistantPort: context.kimiK3SourceLedChatAssistantPort,
            })
            if (retriedExchange.exchangeId !== latestExchange.exchangeId) {
              throw new ApiError(
                'INTERNAL_ERROR',
                'The verified edit-chat retry changed its saved exchange identity.',
                500,
                undefined,
                { internal: true },
              )
            }
            const replacementExchange: CanonicalSourceLedChatExchange = {
              ...retriedExchange,
              userMessage: latestExchange.userMessage,
            }
            const nextRecord: PrivateCanonicalSourceLedChatRecord = {
              ...record,
              exchanges: [
                ...record.exchanges.slice(0, -1),
                replacementExchange,
              ],
              idempotencyRecords: [...record.idempotencyRecords, {
                idempotencyKey,
                requestHashSha256,
                exchangeId: replacementExchange.exchangeId,
                completedAt: timestamp,
              }],
              updatedAt: timestamp,
            }
            return {
              changed: true,
              record: nextRecord,
              result: {
                record: nextRecord,
                exchange: replacementExchange,
                replayed: false as const,
                authority: lockedAuthority,
              },
            }
          }
          if (
            record.exchanges.length >= MAX_CANONICAL_SOURCE_LED_CHAT_EXCHANGES
            || record.idempotencyRecords.length >=
              MAX_CANONICAL_SOURCE_LED_CHAT_IDEMPOTENCY_RECORDS
          ) {
            throw new ApiError(
              'IDEMPOTENCY_CAPACITY_EXCEEDED',
              'This named edit chat reached its safe message capacity.',
              503,
            )
          }

          const exchange = await createExchange({
            authority: lockedAuthority,
            clientMessageId: input.clientMessageId,
            message,
            revision: record.revision + 1,
            timestamp,
            scope,
            priorExchanges: record.exchanges,
            assistantPort: context.kimiK3SourceLedChatAssistantPort,
          })
          const nextRecord: PrivateCanonicalSourceLedChatRecord = {
            ...record,
            revision: exchange.revision,
            exchanges: [...record.exchanges, exchange],
            idempotencyRecords: [...record.idempotencyRecords, {
              idempotencyKey,
              requestHashSha256,
              exchangeId: exchange.exchangeId,
              completedAt: timestamp,
            }],
            updatedAt: timestamp,
          }
          return {
            changed: true,
            record: nextRecord,
            result: {
              record: nextRecord,
              exchange,
              replayed: false as const,
              authority: lockedAuthority,
            },
          }
        },
      })
      return {
        thread: projectThreadAgainstCurrentAuthority(
          scope,
          outcome.record,
          outcome.authority,
        ),
        exchange: projectExchangeAgainstAuthority(
          outcome.exchange,
          outcome.authority,
        ),
        replayed: outcome.replayed,
      }
    },
  }
}

export async function readCanonicalSourceLedChatDirectionsForPlanning(input: {
  readonly scope: CanonicalSourceLedChatStoreScope
  readonly authority: CanonicalExactEditPlanningAuthorityRead
  readonly confirmedAspectRatio: Exclude<AspectRatio, 'let_ai_decide'>
}): Promise<CanonicalSourceLedChatPlanningDirections> {
  const record = await readPrivateCanonicalSourceLedChatRecord(input.scope)
  if (!record) {
    return {
      instructionHistory: [],
      exchangeIds: [],
      threadRevision: 0,
      authorityDigestSha256: sha256('empty-canonical-source-led-chat'),
    }
  }

  const pendingAiResponses = record.exchanges
    .filter(
      (exchange) =>
        exchange.assistantRuntime !== undefined
        && exchange.assistantRuntime.status !== 'completed',
    )
    .map((exchange) => ({
      exchangeId: exchange.exchangeId,
      status: exchange.assistantRuntime!.status,
      attemptDigestSha256:
        exchange.assistantRuntime!.attemptDigestSha256,
    }))
  if (pendingAiResponses.length > 0) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'A saved Chat direction does not yet have a verified AI response.',
      409,
      {
        requiredGate: 'chat_direction_ai_response',
        pending: pendingAiResponses,
      },
    )
  }

  const pending: Array<{
    exchangeId: string
    fields: readonly CanonicalSourceLedChatSetupField[]
  }> = []
  const active = record.exchanges.filter((exchange) => {
    if (exchange.effect.status === 'not_applied') return false
    const projected = projectExchangeAgainstAuthority(
      exchange,
      input.authority,
      input.confirmedAspectRatio,
    )
    if (!projected.effect.activeForPlanning) {
      pending.push({
        exchangeId: exchange.exchangeId,
        fields: projected.effect.requiredSetupConfirmations,
      })
      return false
    }
    return true
  })
  if (pending.length > 0) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'A saved Chat direction still needs setup confirmation before planning.',
      409,
      {
        requiredGate: 'chat_direction_setup_confirmation',
        pending,
      },
    )
  }

  const payload = {
    threadRevision: record.revision,
    exchangeIds: active.map((exchange) => exchange.exchangeId),
    instructionHistory: active.map((exchange) => exchange.userMessage.content),
  }
  return {
    ...payload,
    authorityDigestSha256: sha256(stableStringify(payload)),
  }
}

export function createCanonicalSourceLedChatPlanBinding(input: {
  readonly scope: Pick<
    CanonicalSourceLedChatStoreScope,
    'workspaceId' | 'projectId' | 'editSessionId'
  >
  readonly directions: CanonicalSourceLedChatPlanningDirections
}): CanonicalSourceLedChatPlanBinding {
  return {
    schemaVersion: CANONICAL_SOURCE_LED_CHAT_PLAN_BINDING_VERSION,
    source: 'private_canonical_source_led_chat_store',
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
    threadRevision: input.directions.threadRevision,
    activeInstructionCount: input.directions.instructionHistory.length,
    exchangeIds: [...input.directions.exchangeIds],
    authorityDigestSha256: input.directions.authorityDigestSha256,
  }
}

export async function revalidateCanonicalSourceLedChatPlanBinding(input: {
  readonly context: ServiceContext
  readonly scope: CanonicalSourceLedChatStoreScope
  readonly compiledIntent: Record<string, unknown>
  readonly confirmedAspectRatio: unknown
}): Promise<void> {
  const confirmedAspectRatio = requireConfirmedAspectRatio(
    input.confirmedAspectRatio,
  )
  const authority = (
    await readPlanningExactEditPreferenceAuthority({
      context: input.context,
      scope: input.scope,
    })
  ).authority
  const directions = await readCanonicalSourceLedChatDirectionsForPlanning({
    scope: input.scope,
    authority,
    confirmedAspectRatio,
  })
  const expected = createCanonicalSourceLedChatPlanBinding({
    scope: input.scope,
    directions,
  })
  const persisted = input.compiledIntent.canonicalSourceLedChatAuthority
  if (
    persisted === undefined
    && directions.threadRevision === 0
  ) return
  if (
    !isCanonicalSourceLedChatPlanBinding(persisted)
    || stableStringify(persisted) !== stableStringify(expected)
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Chat direction changed after this plan was created. Prepare a fresh plan before approval.',
      409,
      {
        requiredGate: 'current_named_edit_chat_plan_binding',
        currentChatRevision: directions.threadRevision,
      },
    )
  }
}

async function authorizeChatStoreScope(
  context: ServiceContext,
  input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  },
): Promise<CanonicalSourceLedChatStoreScope> {
  const actorUserId = getRequiredAuthUserId(context)
  const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
  if (access.userId !== actorUserId) {
    throw new ApiError(
      'AUTH_REQUIRED',
      'This named edit chat is outside the signed-in workspace.',
      403,
    )
  }
  await createProjectService(context).getProject(input.projectId, access.workspaceId)
  return {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: actorUserId,
    workspaceId: access.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
  }
}

async function requireChatAuthority(
  context: ServiceContext,
  scope: CanonicalSourceLedChatStoreScope,
): Promise<CanonicalExactEditPlanningAuthorityRead> {
  const authority = (
    await readPlanningExactEditPreferenceAuthority({ context, scope })
  ).authority
  if (
    authority.workspaceId !== scope.workspaceId
    || authority.projectId !== scope.projectId
    || authority.editSessionId !== scope.editSessionId
  ) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'The exact edit-chat authority does not match this named edit.',
      403,
    )
  }
  return authority
}

async function createExchange(input: {
  readonly authority: CanonicalExactEditPlanningAuthorityRead
  readonly clientMessageId: string
  readonly assistantAttemptClientMessageId?: string
  readonly message: string
  readonly revision: number
  readonly timestamp: string
  readonly scope: CanonicalSourceLedChatStoreScope
  readonly priorExchanges: readonly CanonicalSourceLedChatExchange[]
  readonly assistantPort?: ServiceContext['kimiK3SourceLedChatAssistantPort']
}): Promise<CanonicalSourceLedChatExchange> {
  const currentFrame =
    input.authority.frameConfirmation.status === 'confirmed'
      ? input.authority.frameConfirmation.aspectRatio
      : 'let_ai_decide'
  const resolution = resolveMaterialPlanningInstruction(input.message, {
    ...input.authority.values,
    aspectRatio: currentFrame,
    frameTemplateType: frameTemplateForAspectRatio(currentFrame),
  })
  const unsupportedEditLevel = resolution.changedFields.includes('editLevel')
  const requestedSettings = requestedSettingsFromResolution(resolution)
  const requiredSetupConfirmations =
    setupConfirmationsFor(requestedSettings)
  const hasRequestedSettings =
    Object.keys(requestedSettings).length > 0
  const status = unsupportedEditLevel
    ? 'not_applied' as const
    : hasRequestedSettings
      ? 'waiting_for_setup_confirmation' as const
      : 'applied_to_next_plan' as const
  const deterministicAssistantContent = unsupportedEditLevel
    ? 'Edit Level is intentionally hidden during internal testing, so that tier request was not applied. Send the creative direction without a tier label; no plan, credits, or editing changed.'
    : hasRequestedSettings
      ? `Saved to this named edit. Confirm ${humanSetupList(requiredSetupConfirmations)} before it can shape the next plan and estimate. No editing or credits started.`
      : 'Saved to this named edit and added to the next plan input. No editing, generation, or credit action started.'
  let assistantContent = deterministicAssistantContent
  let assistantRuntime: CanonicalSourceLedChatAssistantRuntime | undefined
  let effectiveStatus:
    CanonicalSourceLedChatExchange['effect']['status'] = status
  if (input.assistantPort) {
    const result = await input.assistantPort.respond({
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
      clientMessageId:
        input.assistantAttemptClientMessageId ?? input.clientMessageId,
      message: input.message,
      priorExchanges: input.priorExchanges.map((exchange) => ({
        userContent: exchange.userMessage.content,
        assistantContent: exchange.assistantMessage.content,
      })),
      serverDisposition: status,
      requiredSetupConfirmations,
      requestedSettings: Object.fromEntries(
        Object.entries(requestedSettings)
          .filter((entry): entry is [string, string] =>
            typeof entry[1] === 'string'),
      ),
    })
    assistantRuntime = assistantRuntimeFromResult(result)
    if (result.status === 'completed' && result.assistantContent) {
      assistantContent = result.assistantContent
    } else {
      effectiveStatus = 'waiting_for_ai_response'
      assistantContent =
        'Your direction was saved, but the AI response could not be verified. No plan, editing, generation, or credits started. Retry when the private AI service is available.'
    }
  }
  const activeForPlanning = effectiveStatus === 'applied_to_next_plan'
  const exchangeSeed = sha256([
    input.clientMessageId,
    String(input.revision),
    input.message,
  ].join('\u0000')).slice(0, 40)
  return {
    exchangeId: `source-led-chat-${exchangeSeed}`,
    clientMessageId: input.clientMessageId,
    revision: input.revision,
    userMessage: {
      id: `source-led-chat-user-${exchangeSeed}`,
      content: input.message,
      contentDigestSha256: sha256(input.message),
      createdAt: input.timestamp,
    },
    assistantMessage: {
      id: `source-led-chat-assistant-${exchangeSeed}`,
      content: assistantContent,
      createdAt: input.timestamp,
    },
    ...(assistantRuntime ? { assistantRuntime } : {}),
    effect: {
      status: effectiveStatus,
      activeForPlanning,
      requestedSettings,
      requiredSetupConfirmations,
      unsupportedRequests: unsupportedEditLevel
        ? ['edit_level_not_exposed_in_internal_testing']
        : [],
      draftPlanInvalidated: effectiveStatus !== 'not_applied',
      executionStarted: false,
      creditsReservedOrSpent: false,
    },
  }
}

function assistantRuntimeFromResult(
  result: SourceLedChatAssistantResult,
): CanonicalSourceLedChatAssistantRuntime {
  return {
    source: result.routeId === 'gpt_5_6_terra_fallback'
      ? 'gpt_5_6_terra'
      : 'kimi_k3',
    status: result.status,
    routeId: result.routeId,
    providerModel: result.providerModel,
    credentialSource: result.credentialSource,
    credentialVersion: result.credentialVersion,
    providerCallMade: result.providerCallMade,
    modelCallMade: result.modelCallMade,
    attemptDigestSha256: result.attemptDigestSha256,
    ...(result.usage ? { usage: structuredClone(result.usage) } : {}),
    ...(result.fallbackFrom
      ? { fallbackFrom: structuredClone(result.fallbackFrom) }
      : {}),
    ...(result.fallbackTrigger
      ? { fallbackTrigger: result.fallbackTrigger }
      : {}),
  }
}

function projectThreadAgainstCurrentAuthority(
  scope: CanonicalSourceLedChatStoreScope,
  record: PrivateCanonicalSourceLedChatRecord | undefined,
  authority: CanonicalExactEditPlanningAuthorityRead,
): CanonicalSourceLedChatThread {
  const base = projectPrivateCanonicalSourceLedChatThread(scope, record)
  const exchanges = base.exchanges.map((exchange) =>
    projectExchangeAgainstAuthority(exchange, authority))
  return {
    ...base,
    exchanges,
    activeInstructionHistory: exchanges
      .filter((exchange) => exchange.effect.activeForPlanning)
      .map((exchange) => exchange.userMessage.content),
  }
}

function projectExchangeAgainstAuthority(
  exchange: CanonicalSourceLedChatExchange,
  authority: CanonicalExactEditPlanningAuthorityRead,
  confirmedAspectRatio?: Exclude<AspectRatio, 'let_ai_decide'>,
): CanonicalSourceLedChatExchange {
  if (
    exchange.effect.status === 'not_applied'
    || exchange.effect.status === 'waiting_for_ai_response'
  ) return structuredClone(exchange)
  const requiredSetupConfirmations = unmatchedSetupConfirmations(
    exchange.effect.requestedSettings,
    authority,
    confirmedAspectRatio,
  )
  const activeForPlanning = requiredSetupConfirmations.length === 0
  return {
    ...structuredClone(exchange),
    assistantMessage: activeForPlanning && !exchange.assistantRuntime
      ? {
          ...structuredClone(exchange.assistantMessage),
          content:
            'Saved to this named edit and verified against the current setup. This direction is now an input to the next server-derived plan; no editing or credits started.',
        }
      : structuredClone(exchange.assistantMessage),
    effect: {
      ...structuredClone(exchange.effect),
      status: activeForPlanning
        ? 'applied_to_next_plan'
        : 'waiting_for_setup_confirmation',
      activeForPlanning,
      requiredSetupConfirmations,
    },
  }
}

function requestedSettingsFromResolution(
  resolution: ReturnType<typeof resolveMaterialPlanningInstruction>,
): CanonicalSourceLedChatRequestedSettings {
  const requested: {
    -readonly [Key in keyof CanonicalSourceLedChatRequestedSettings]:
      CanonicalSourceLedChatRequestedSettings[Key]
  } = {}
  for (const field of resolution.changedFields) {
    if (field === 'editLevel' || field === 'frameTemplateType') continue
    if (field === 'aspectRatio' && resolution.next.aspectRatio !== 'let_ai_decide') {
      requested.aspectRatio = resolution.next.aspectRatio
      continue
    }
    if (field === 'cleanupPreference' && resolution.next.cleanupPreference) {
      requested.cleanupPreference = resolution.next.cleanupPreference
      continue
    }
    if (field === 'visualPreference') {
      requested.visualPreference = resolution.next.visualPreference
      continue
    }
    if (field === 'workflowType') {
      requested.workflowType = resolution.next.workflowType
      continue
    }
    if (field === 'moodStyle') {
      requested.moodStyle = resolution.next.moodStyle
      continue
    }
    if (field === 'creditPreference') {
      requested.creditPreference = resolution.next.creditPreference
      continue
    }
    if (field === 'targetPlatform') {
      requested.targetPlatform = resolution.next.targetPlatform
    }
  }
  return requested
}

function setupConfirmationsFor(
  requested: CanonicalSourceLedChatRequestedSettings,
): CanonicalSourceLedChatSetupField[] {
  return [
    requested.aspectRatio && 'output_frame',
    requested.cleanupPreference && 'cleanup_preference',
    requested.visualPreference && 'visual_direction',
    requested.workflowType && 'workflow_context',
    requested.moodStyle && 'mood',
    requested.creditPreference && 'cost_posture',
    requested.targetPlatform && 'destination',
  ].filter((field): field is CanonicalSourceLedChatSetupField => Boolean(field))
}

function unmatchedSetupConfirmations(
  requested: CanonicalSourceLedChatRequestedSettings,
  authority: CanonicalExactEditPlanningAuthorityRead,
  confirmedAspectRatio?: Exclude<AspectRatio, 'let_ai_decide'>,
): CanonicalSourceLedChatSetupField[] {
  const authoritativeAspectRatio = confirmedAspectRatio ??
    (authority.frameConfirmation.status === 'confirmed'
      ? authority.frameConfirmation.aspectRatio
      : undefined)
  return [
    requested.aspectRatio !== undefined
      && requested.aspectRatio !== authoritativeAspectRatio
      && 'output_frame',
    requested.cleanupPreference !== undefined
      && requested.cleanupPreference !== authority.values.cleanupPreference
      && 'cleanup_preference',
    requested.visualPreference !== undefined
      && requested.visualPreference !== authority.values.visualPreference
      && 'visual_direction',
    requested.workflowType !== undefined
      && requested.workflowType !== authority.values.workflowType
      && 'workflow_context',
    requested.moodStyle !== undefined
      && requested.moodStyle !== authority.values.moodStyle
      && 'mood',
    requested.creditPreference !== undefined
      && requested.creditPreference !== authority.values.creditPreference
      && 'cost_posture',
    requested.targetPlatform !== undefined
      && requested.targetPlatform !== authority.values.targetPlatform
      && 'destination',
  ].filter((field): field is CanonicalSourceLedChatSetupField => Boolean(field))
}

function humanSetupList(
  fields: readonly CanonicalSourceLedChatSetupField[],
): string {
  const labels: Record<CanonicalSourceLedChatSetupField, string> = {
    output_frame: 'the output frame',
    cleanup_preference: 'cleanup',
    visual_direction: 'visual direction',
    workflow_context: 'workflow context',
    mood: 'mood',
    cost_posture: 'cost posture',
    destination: 'destination',
  }
  const values = fields.map((field) => labels[field])
  if (values.length <= 1) return values[0] ?? 'the working setup'
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`
}

function frameTemplateForAspectRatio(
  aspectRatio: AspectRatio,
): FrameTemplateType {
  if (aspectRatio === '9:16') return 'vertical_story_frame'
  if (aspectRatio === '16:9') return 'horizontal_wide_frame'
  if (aspectRatio === '1:1') return 'square_social_frame'
  if (aspectRatio === '4:5') return 'portrait_feed_lower_panel'
  if (aspectRatio === '4:3') return 'classic_documentary_center_panel'
  return 'let_ai_decide'
}

function normalizeChatDirection(value: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!normalized || normalized.length > 4_000) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Chat direction must contain 1 to 4,000 characters.',
      400,
    )
  }
  return normalized
}

function requireIdempotencyKey(value: string): string {
  const normalized = value.trim()
  if (
    normalized.length < 1
    || normalized.length > 240
    || Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Edit-chat Idempotency-Key is invalid.',
      400,
    )
  }
  return normalized
}

function assertChatPlanningMutable(
  authority: CanonicalExactEditPlanningAuthorityRead,
): void {
  if (!authority.locked && authority.lifecyclePhase === 'planning') return
  throw new ApiError(
    'PLAN_NOT_APPROVED',
    'This edit already has approved or active work. Use the exact revision flow before changing its direction.',
    409,
    {
      lifecyclePhase: authority.lifecyclePhase,
      requiredFlow: 'canonical_private_review_revision',
    },
  )
}

function requireConfirmedAspectRatio(
  value: unknown,
): Exclude<AspectRatio, 'let_ai_decide'> {
  if (
    value === '9:16'
    || value === '16:9'
    || value === '1:1'
    || value === '4:5'
    || value === '4:3'
  ) return value
  throw new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The plan no longer contains one exact confirmed output frame for Chat revalidation.',
    409,
  )
}

function isCanonicalSourceLedChatPlanBinding(
  value: unknown,
): value is CanonicalSourceLedChatPlanBinding {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const binding = value as Record<string, unknown>
  const keys = Object.keys(binding).sort()
  const expectedKeys = [
    'activeInstructionCount',
    'authorityDigestSha256',
    'editSessionId',
    'exchangeIds',
    'projectId',
    'schemaVersion',
    'source',
    'threadRevision',
    'workspaceId',
  ].sort()
  return (
    keys.length === expectedKeys.length
    && keys.every((key, index) => key === expectedKeys[index])
    && binding.schemaVersion ===
      CANONICAL_SOURCE_LED_CHAT_PLAN_BINDING_VERSION
    && binding.source === 'private_canonical_source_led_chat_store'
    && safeIdentity(binding.workspaceId)
    && safeIdentity(binding.projectId)
    && safeIdentity(binding.editSessionId)
    && Number.isInteger(binding.threadRevision)
    && Number(binding.threadRevision) >= 0
    && Number.isInteger(binding.activeInstructionCount)
    && Number(binding.activeInstructionCount) >= 0
    && Array.isArray(binding.exchangeIds)
    && binding.exchangeIds.length === binding.activeInstructionCount
    && new Set(binding.exchangeIds).size === binding.exchangeIds.length
    && binding.exchangeIds.every(safeIdentity)
    && typeof binding.authorityDigestSha256 === 'string'
    && /^[a-f0-9]{64}$/.test(binding.authorityDigestSha256)
  )
}

function safeIdentity(value: unknown): value is string {
  return (
    typeof value === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value)
    && !value.includes('..')
  )
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(stableJsonValue))
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableJsonValue(entry)]),
  )
}
