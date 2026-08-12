import { execFileSync } from 'node:child_process'

import { Storage } from '@google-cloud/storage'
import { OAuth2Client } from 'google-auth-library'

export const WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE =
  'active-gcloud-api-service-account-impersonation-v1' as const

const API_SERVICE_ACCOUNT =
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com' as const

/**
 * Creates a process-local Google client from one short-lived impersonated
 * token. The token is neither logged nor persisted and automatic client
 * retries remain disabled at the Storage boundary.
 */
export function createWeEditProGcpLocalOperatorAuth(input: {
  readonly confirmation: string | undefined
  readonly readAccessToken?: () => string
}): {
  readonly authClient: OAuth2Client
  readonly storage: Storage
} {
  if (input.confirmation !== WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE) {
    throw new Error('Ephemeral API-service authentication is not confirmed.')
  }
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

function readEphemeralAccessToken(): string {
  try {
    return execFileSync(
      'gcloud',
      [
        'auth',
        'print-access-token',
        `--impersonate-service-account=${API_SERVICE_ACCOUNT}`,
        '--project=reeditpro',
        '--quiet',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 8 * 1_024,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 15_000,
      },
    ).trim()
  } catch {
    throw new Error('Ephemeral API-service authentication is unavailable.')
  }
}
