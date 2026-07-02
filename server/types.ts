import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Request } from 'express'
import type { RuntimeEnv } from './config/env'

export interface AuthContext {
  userId: string
  email?: string
  isMockUser: boolean
  user?: User
}

export interface IdempotencyContext {
  key: string
  requestHash: string
  workspaceId: string
  replayed: boolean
}

export interface RequestContext {
  requestId: string
  auth?: AuthContext
  idempotency?: IdempotencyContext
}

export interface RuntimeClients {
  admin: SupabaseClient | null
  public: SupabaseClient | null
}

export interface RuntimeState {
  env: RuntimeEnv
  clients: RuntimeClients
}

export type RuntimeRequest = Request & {
  context?: RequestContext
  runtime?: RuntimeState
}

export interface RouteHandlerResult<T = unknown> {
  ok: true
  data: T
  warnings?: string[]
  mockOnly?: boolean
}

export interface ServiceContext {
  env: RuntimeEnv
  clients: RuntimeClients
  requestId: string
  auth?: AuthContext
}
