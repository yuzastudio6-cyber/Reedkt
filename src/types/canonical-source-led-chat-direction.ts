import type {
  AspectRatio,
  CleanupPreference,
  CreditPreference,
  MoodStyle,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from './reeditpro'

export const CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION =
  'canonical-source-led-chat-thread-v1' as const

export const CANONICAL_SOURCE_LED_CHAT_PLAN_BINDING_VERSION =
  'canonical-source-led-chat-plan-binding-v1' as const

export type CanonicalSourceLedChatSetupField =
  | 'output_frame'
  | 'cleanup_preference'
  | 'visual_direction'
  | 'workflow_context'
  | 'mood'
  | 'cost_posture'
  | 'destination'

export interface CanonicalSourceLedChatRequestedSettings {
  readonly aspectRatio?: Exclude<AspectRatio, 'let_ai_decide'>
  readonly cleanupPreference?: CleanupPreference
  readonly visualPreference?: VisualPreference
  readonly workflowType?: VideoWorkflowType
  readonly moodStyle?: MoodStyle
  readonly creditPreference?: CreditPreference
  readonly targetPlatform?: TargetPlatform
}

export interface CanonicalSourceLedChatEffect {
  readonly status:
    | 'applied_to_next_plan'
    | 'waiting_for_setup_confirmation'
    | 'waiting_for_ai_response'
    | 'not_applied'
  readonly activeForPlanning: boolean
  readonly requestedSettings: CanonicalSourceLedChatRequestedSettings
  readonly requiredSetupConfirmations: readonly CanonicalSourceLedChatSetupField[]
  readonly unsupportedRequests: readonly ('edit_level_not_exposed_in_internal_testing')[]
  readonly draftPlanInvalidated: boolean
  readonly executionStarted: false
  readonly creditsReservedOrSpent: false
}

export interface CanonicalSourceLedChatAssistantRuntime {
  readonly source: 'kimi_k3'
  readonly status:
    | 'completed'
    | 'credential_unavailable'
    | 'credential_rejected'
    | 'model_unavailable'
    | 'rate_limited'
    | 'invalid_response'
    | 'provider_failed'
    | 'outcome_unknown'
  readonly routeId: 'kimi_k3_primary'
  readonly providerModel: 'kimi-k3'
  readonly credentialSource: 'google_secret_manager_pinned_version'
  readonly credentialVersion: number | null
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly attemptDigestSha256: string
  readonly usage?: {
    readonly promptTokens: number
    readonly completionTokens: number
    readonly totalTokens: number
  }
}

export interface CanonicalSourceLedChatExchange {
  readonly exchangeId: string
  readonly clientMessageId: string
  readonly revision: number
  readonly userMessage: {
    readonly id: string
    readonly content: string
    readonly contentDigestSha256: string
    readonly createdAt: string
  }
  readonly assistantMessage: {
    readonly id: string
    readonly content: string
    readonly createdAt: string
  }
  readonly assistantRuntime?: CanonicalSourceLedChatAssistantRuntime
  readonly effect: CanonicalSourceLedChatEffect
}

export interface CanonicalSourceLedChatThread {
  readonly schemaVersion: typeof CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION
  readonly source: 'private_canonical_source_led_chat_store'
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly revision: number
  readonly exchanges: readonly CanonicalSourceLedChatExchange[]
  readonly activeInstructionHistory: readonly string[]
  readonly updatedAt: string | null
  readonly privateInternalOnly: true
  readonly providerModelCalled: boolean
  readonly planCreated: false
  readonly executionStarted: false
  readonly creditsReservedOrSpent: false
}

export interface CanonicalSourceLedChatPlanBinding {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_LED_CHAT_PLAN_BINDING_VERSION
  readonly source: 'private_canonical_source_led_chat_store'
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly threadRevision: number
  readonly activeInstructionCount: number
  readonly exchangeIds: readonly string[]
  readonly authorityDigestSha256: string
}
