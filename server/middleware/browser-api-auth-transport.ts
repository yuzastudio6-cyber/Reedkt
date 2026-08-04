import type { Request } from 'express'
import type { User } from '@supabase/supabase-js'

import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'

export const GOOGLE_API_GATEWAY_USERINFO_HEADER = 'x-apigateway-api-userinfo'
export const REEDITPRO_USER_AUTHORIZATION_HEADER = 'x-reeditpro-user-authorization'

const MAX_AUTHORIZATION_LENGTH = 16_384
const MAX_ENCODED_USERINFO_LENGTH = 16_384
const MAX_CLAIM_COUNT = 64
const MAX_CLAIM_STRING_LENGTH = 2_048
const ALLOWED_CLOCK_SKEW_SECONDS = 60

export interface GoogleApiGatewayUserClaims {
  issuer: string
  subject: string
  audiences: string[]
  role: 'authenticated'
  issuedAt: number
  expiresAt: number
  email?: string
}

export interface ResolvedBrowserUserAuthentication {
  accessToken: string
  transport: RuntimeEnv['browserApiTransport']
  gatewayClaims?: GoogleApiGatewayUserClaims
}

export function resolveBrowserUserAuthentication(
  request: Request,
  env: RuntimeEnv,
  nowSeconds = Math.floor(Date.now() / 1_000),
): ResolvedBrowserUserAuthentication {
  if (env.browserApiTransport === 'direct') {
    if (request.header(REEDITPRO_USER_AUTHORIZATION_HEADER)) {
      throw invalidAuthentication()
    }

    const accessToken = parseBearerToken(request.header('authorization'))
    if (!accessToken) throw authRequired()

    return {
      accessToken,
      transport: 'direct',
    }
  }

  // API Gateway replaces Authorization while authenticating to private Cloud
  // Run. ReEditPro therefore accepts the original Supabase JWT only through a
  // dedicated header and only when the gateway-authenticated claim envelope is
  // also present and agrees with that JWT.
  if (!parseBearerToken(request.header('authorization'))) {
    throw invalidAuthentication()
  }

  const accessToken = parseBearerToken(request.header(REEDITPRO_USER_AUTHORIZATION_HEADER))
  if (!accessToken) throw authRequired()

  const gatewayClaims = parseGoogleApiGatewayUserInfo(
    request.header(GOOGLE_API_GATEWAY_USERINFO_HEADER),
    env,
    nowSeconds,
  )
  const tokenClaims = parseSupabaseAccessTokenClaims(accessToken, env, nowSeconds)
  assertMatchingClaims(gatewayClaims, tokenClaims)

  return {
    accessToken,
    transport: 'google_api_gateway',
    gatewayClaims,
  }
}

export function assertAuthenticatedUserMatchesGateway(
  authentication: ResolvedBrowserUserAuthentication,
  user: User,
): void {
  const gatewayClaims = authentication.gatewayClaims
  if (!gatewayClaims) return

  if (
    user.id !== gatewayClaims.subject ||
    user.aud !== 'authenticated' ||
    !gatewayClaims.audiences.includes(user.aud)
  ) {
    throw invalidAuthentication()
  }
}

export function parseGoogleApiGatewayUserInfo(
  headerValue: string | undefined,
  env: RuntimeEnv,
  nowSeconds = Math.floor(Date.now() / 1_000),
): GoogleApiGatewayUserClaims {
  if (!headerValue) throw invalidAuthentication()
  return normalizeClaims(
    decodeBase64UrlJson(headerValue, MAX_ENCODED_USERINFO_LENGTH),
    expectedSupabaseIssuer(env),
    nowSeconds,
  )
}

export function expectedSupabaseIssuer(env: RuntimeEnv): string {
  if (!env.supabaseUrl) throw invalidAuthentication()

  try {
    const url = new URL(env.supabaseUrl)
    if (
      url.protocol !== 'https:' ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw invalidAuthentication()
    }
    return `${url.origin}/auth/v1`
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw invalidAuthentication()
  }
}

export function parseBearerToken(headerValue: string | undefined): string | undefined {
  if (!headerValue || headerValue.length > MAX_AUTHORIZATION_LENGTH) return undefined
  const match = headerValue.match(/^Bearer ([A-Za-z0-9._~-]+={0,2})$/i)
  return match?.[1]
}

function parseSupabaseAccessTokenClaims(
  accessToken: string,
  env: RuntimeEnv,
  nowSeconds: number,
): GoogleApiGatewayUserClaims {
  const parts = accessToken.split('.')
  if (parts.length !== 3 || parts.some((part) => !part)) throw invalidAuthentication()
  return normalizeClaims(
    decodeBase64UrlJson(parts[1], MAX_AUTHORIZATION_LENGTH),
    expectedSupabaseIssuer(env),
    nowSeconds,
  )
}

function normalizeClaims(
  value: unknown,
  expectedIssuerValue: string,
  nowSeconds: number,
): GoogleApiGatewayUserClaims {
  if (!isPlainRecord(value) || Object.keys(value).length > MAX_CLAIM_COUNT) {
    throw invalidAuthentication()
  }

  const issuer = boundedString(value.iss)
  const subject = boundedString(value.sub)
  const role = boundedString(value.role)
  const audiences = normalizeAudiences(value.aud)
  const issuedAt = safeInteger(value.iat)
  const expiresAt = safeInteger(value.exp)
  const email = value.email === undefined ? undefined : boundedString(value.email)

  if (
    issuer !== expectedIssuerValue ||
    !subject ||
    role !== 'authenticated' ||
    audiences.length === 0 ||
    !audiences.includes('authenticated') ||
    issuedAt === undefined ||
    expiresAt === undefined ||
    issuedAt > nowSeconds + ALLOWED_CLOCK_SKEW_SECONDS ||
    expiresAt <= nowSeconds - ALLOWED_CLOCK_SKEW_SECONDS ||
    expiresAt <= issuedAt
  ) {
    throw invalidAuthentication()
  }

  return {
    issuer,
    subject,
    audiences,
    role: 'authenticated',
    issuedAt,
    expiresAt,
    ...(email ? { email } : {}),
  }
}

function assertMatchingClaims(
  gatewayClaims: GoogleApiGatewayUserClaims,
  tokenClaims: GoogleApiGatewayUserClaims,
): void {
  if (
    gatewayClaims.issuer !== tokenClaims.issuer ||
    gatewayClaims.subject !== tokenClaims.subject ||
    gatewayClaims.role !== tokenClaims.role ||
    gatewayClaims.issuedAt !== tokenClaims.issuedAt ||
    gatewayClaims.expiresAt !== tokenClaims.expiresAt ||
    gatewayClaims.audiences.join('\u0000') !== tokenClaims.audiences.join('\u0000')
  ) {
    throw invalidAuthentication()
  }
}

function decodeBase64UrlJson(value: string, maxLength: number): unknown {
  if (
    value.length === 0 ||
    value.length > maxLength ||
    !/^[A-Za-z0-9_-]+={0,2}$/.test(value)
  ) {
    throw invalidAuthentication()
  }

  try {
    const bytes = Buffer.from(value, 'base64url')
    if (bytes.length === 0 || bytes.length > maxLength) throw invalidAuthentication()
    const json = bytes.toString('utf8')
    if (!Buffer.from(json, 'utf8').equals(bytes)) throw invalidAuthentication()
    return JSON.parse(json) as unknown
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw invalidAuthentication()
  }
}

function normalizeAudiences(value: unknown): string[] {
  const candidates = typeof value === 'string' ? [value] : Array.isArray(value) ? value : []
  if (candidates.length === 0 || candidates.length > 8) throw invalidAuthentication()

  const audiences = candidates.map((candidate) => boundedString(candidate))
  if (audiences.some((audience) => !audience)) throw invalidAuthentication()
  return Array.from(new Set(audiences as string[])).sort()
}

function boundedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed && trimmed.length <= MAX_CLAIM_STRING_LENGTH ? trimmed : undefined
}

function safeInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function authRequired(): ApiError {
  return new ApiError('AUTH_REQUIRED', 'Authorization bearer token is required.', 401)
}

function invalidAuthentication(): ApiError {
  return new ApiError('AUTH_INVALID', 'Authorization token could not be verified.', 401)
}
