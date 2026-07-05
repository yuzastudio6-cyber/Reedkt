import type {
  ReeditProApiRequestEnvelope,
  ReeditProApiResponseEnvelope,
} from '../types/api-routes'

export type ReeditProApiClientMode =
  | 'mock_browser'
  | 'mock_backend_local'
  | 'production_http_future'

export interface ReeditProApiClientOptions {
  mode?: ReeditProApiClientMode
  workspaceId?: string
  projectId?: string
  userId?: string
  apiBaseUrl?: string
  getAccessToken?: () => Promise<string | undefined>
  liveQwenMarkerChat?: boolean
  liveQwen25VLVisualContext?: boolean
  mockOnly?: boolean
  preserveMockSession?: boolean
}

export interface ReeditProApiClientSafetySummary {
  mockOnly: true
  providerCallMade: false
  supabaseWriteMade: false
  generationRequestCreated: false
  renderJobCreated: false
  workerJobCreated: false
  creditReservedOrSpent: false
  summary: string
  warnings: string[]
}

export interface ReeditProApiTransport {
  mode: ReeditProApiClientMode
  safety: ReeditProApiClientSafetySummary
  request<TPayload = unknown, TData = unknown>(
    envelope: ReeditProApiRequestEnvelope<TPayload>,
  ): Promise<ReeditProApiResponseEnvelope<TData>>
}

export interface ReeditProApiSyncTransport extends ReeditProApiTransport {
  requestSync<TPayload = unknown, TData = unknown>(
    envelope: ReeditProApiRequestEnvelope<TPayload>,
  ): ReeditProApiResponseEnvelope<TData>
}

export const REEDITPRO_API_CLIENT_MOCK_SAFETY_SUMMARY: ReeditProApiClientSafetySummary = {
  mockOnly: true,
  providerCallMade: false,
  supabaseWriteMade: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  workerJobCreated: false,
  creditReservedOrSpent: false,
  summary: 'Browser mock API client only; no production side effects are allowed.',
  warnings: [
    'No production HTTP route is called.',
    'No Supabase write, provider call, generation request, render job, worker job, or credit reservation occurs.',
  ],
}
