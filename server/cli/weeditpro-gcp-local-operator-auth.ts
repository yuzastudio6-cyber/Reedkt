import { execFileSync } from 'node:child_process'

import { Storage } from '@google-cloud/storage'
import { OAuth2Client } from 'google-auth-library'

export const WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE =
  'active-gcloud-api-service-account-impersonation-v1' as const

const API_SERVICE_ACCOUNT =
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com' as const
const OPERATOR_ACCOUNT = 'aiediting@reeditpro.com' as const
const OPERATOR_PROJECT = 'reeditpro' as const

/**
 * Creates a process-local Google client from one short-lived impersonated
 * token. The token is neither logged nor persisted and automatic client
 * retries remain disabled at the Storage boundary.
 */
export function createWeEditProGcpLocalOperatorAuth(input: {
  readonly confirmation: string | undefined
  readonly readAccessToken?: () => string
  readonly readOperatorContext?: () => {
    readonly account: string
    readonly project: string
  }
}): {
  readonly authClient: OAuth2Client
  readonly storage: Storage
} {
  if (input.confirmation !== WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE) {
    throw new Error('Ephemeral API-service authentication is not confirmed.')
  }
  assertWeEditProGcpLocalOperatorContext({
    readOperatorContext: input.readOperatorContext,
  })
  const accessToken = (input.readAccessToken ?? readEphemeralAccessToken)()
  if (
    accessToken.length < 20
    || accessToken.length > 4_096
    || /\s/u.test(accessToken)
  ) throw new Error('Ephemeral API-service authentication is malformed.')
  const authClient = new OAuth2Client()
  authClient.setCredentials({ access_token: accessToken })
  return Object.freeze({
    authClient,
    storage: new Storage({
      projectId: 'reeditpro',
      authClient,
      retryOptions: { autoRetry: false, maxRetries: 0 },
    }),
  })
}

export function assertWeEditProGcpLocalOperatorContext(input: {
  readonly readOperatorContext?: () => {
    readonly account: string
    readonly project: string
  }
} = {}): void {
  const operatorContext = (
    input.readOperatorContext ?? readActiveOperatorContext
  )()
  if (
    operatorContext.account !== OPERATOR_ACCOUNT
    || operatorContext.project !== OPERATOR_PROJECT
  ) throw new Error('Reeditpro Google Cloud operator context is not active.')
}

function readActiveOperatorContext() {
  const read = (property: 'account' | 'project') => {
    try {
      return execFileSync(
        'gcloud',
        ['config', 'get-value', property, '--quiet'],
        {
          encoding: 'utf8',
          maxBuffer: 2 * 1_024,
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 30_000,
        },
      ).trim()
    } catch {
      throw new Error('Google Cloud operator context is unavailable.')
    }
  }
  return Object.freeze({ account: read('account'), project: read('project') })
}

function readEphemeralAccessToken(): string {
  const impersonationArgs = [
    'print-access-token',
    `--impersonate-service-account=${API_SERVICE_ACCOUNT}`,
    '--quiet',
  ] as const
  try {
    return execFileSync(
      'gcloud',
      [
        'auth',
        ...impersonationArgs,
        '--project=reeditpro',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 8 * 1_024,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 60_000,
      },
    ).trim()
  } catch {
    // The Application Default credential below is the approved fallback.
  }
  try {
    return execFileSync(
      'gcloud',
      [
        'auth',
        'application-default',
        ...impersonationArgs,
      ],
      {
        encoding: 'utf8',
        maxBuffer: 8 * 1_024,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 60_000,
      },
    ).trim()
  } catch {
    throw new Error('Ephemeral API-service authentication is unavailable.')
  }
}
