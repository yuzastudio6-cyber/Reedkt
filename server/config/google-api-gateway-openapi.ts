export const REEDITPRO_API_GATEWAY_AUTH_SCHEME = 'supabase_user_jwt'
export const REEDITPRO_API_GATEWAY_USER_HEADER = 'X-ReEditPro-User-Authorization'

export interface ReeditProGoogleApiGatewayOpenApiInput {
  apiHostname: string
  cloudRunBackendUrl: string
  supabaseUrl: string
}

export interface ReeditProGoogleApiGatewayOpenApiSummary {
  apiHostname: string
  cloudRunBackendOrigin: string
  supabaseIssuer: string
  supabaseJwksUri: string
  supabaseAudience: 'authenticated'
  cloudRunRemainsIamPrivate: true
  configuredPathsOnly: true
  corsHandledByBackend: true
  unauthenticatedOptionsOnly: true
  userTokenRevalidationHeaderRequired: true
  providerCallsEnabled: false
  workerDispatchEnabled: false
  billingEnabled: false
  deploymentPerformed: false
}

type OpenApiOperation = Record<string, unknown>

export function createReeditProGoogleApiGatewayOpenApi(
  input: ReeditProGoogleApiGatewayOpenApiInput,
): Record<string, unknown> {
  const apiHostname = requireApiGatewayHostname(input.apiHostname)
  const cloudRunBackendOrigin = requireCloudRunOrigin(input.cloudRunBackendUrl)
  const supabaseOrigin = requireHttpsOrigin(input.supabaseUrl, 'Supabase')
  const supabaseIssuer = `${supabaseOrigin}/auth/v1`
  const supabaseJwksUri = `${supabaseIssuer}/.well-known/jwks.json`

  return {
    swagger: '2.0',
    info: {
      title: 'ReEditPro private staging browser API',
      version: '1.0.0',
      description: 'Supabase-user-authenticated browser gateway for an IAM-private Cloud Run API.',
    },
    host: apiHostname,
    schemes: ['https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    'x-google-allow': 'configured',
    'x-google-endpoints': [{ name: apiHostname, allowCors: true }],
    'x-google-backend': {
      address: cloudRunBackendOrigin,
      jwt_audience: cloudRunBackendOrigin,
      path_translation: 'APPEND_PATH_TO_ADDRESS',
      deadline: 30,
    },
    securityDefinitions: {
      [REEDITPRO_API_GATEWAY_AUTH_SCHEME]: {
        authorizationUrl: '',
        flow: 'implicit',
        type: 'oauth2',
        'x-google-issuer': supabaseIssuer,
        'x-google-jwks_uri': supabaseJwksUri,
        'x-google-audiences': 'authenticated',
      },
    },
    security: [{ [REEDITPRO_API_GATEWAY_AUTH_SCHEME]: [] }],
    paths: {
      '/health': {
        get: publicOperation('Public liveness only', 'publicHealth'),
        options: corsPreflightOperation('publicHealthOptions'),
      },
      '/v1/{path=**}': {
        parameters: [{
          name: 'path',
          in: 'path',
          required: true,
          type: 'string',
        }],
        get: protectedOperation('get'),
        post: protectedOperation('post'),
        put: protectedOperation('put'),
        patch: protectedOperation('patch'),
        delete: protectedOperation('delete'),
        options: corsPreflightOperation('v1CorsOptions'),
      },
    },
  }
}

export function summarizeReeditProGoogleApiGatewayOpenApi(
  input: ReeditProGoogleApiGatewayOpenApiInput,
): ReeditProGoogleApiGatewayOpenApiSummary {
  const apiHostname = requireApiGatewayHostname(input.apiHostname)
  const cloudRunBackendOrigin = requireCloudRunOrigin(input.cloudRunBackendUrl)
  const supabaseOrigin = requireHttpsOrigin(input.supabaseUrl, 'Supabase')

  return {
    apiHostname,
    cloudRunBackendOrigin,
    supabaseIssuer: `${supabaseOrigin}/auth/v1`,
    supabaseJwksUri: `${supabaseOrigin}/auth/v1/.well-known/jwks.json`,
    supabaseAudience: 'authenticated',
    cloudRunRemainsIamPrivate: true,
    configuredPathsOnly: true,
    corsHandledByBackend: true,
    unauthenticatedOptionsOnly: true,
    userTokenRevalidationHeaderRequired: true,
    providerCallsEnabled: false,
    workerDispatchEnabled: false,
    billingEnabled: false,
    deploymentPerformed: false,
  }
}

export function serializeReeditProGoogleApiGatewayOpenApi(
  input: ReeditProGoogleApiGatewayOpenApiInput,
): string {
  return `${JSON.stringify(createReeditProGoogleApiGatewayOpenApi(input), null, 2)}\n`
}

function protectedOperation(method: string): OpenApiOperation {
  return {
    operationId: `reeditproV1${method[0]?.toUpperCase()}${method.slice(1)}`,
    summary: `Authenticated ReEditPro ${method.toUpperCase()} route`,
    parameters: [{
      name: REEDITPRO_API_GATEWAY_USER_HEADER,
      in: 'header',
      required: true,
      type: 'string',
      description: 'Original Supabase bearer token for backend revalidation. Never persisted or logged.',
    }],
    responses: standardResponses(),
  }
}

function publicOperation(summary: string, operationId: string): OpenApiOperation {
  return {
    operationId,
    summary,
    security: [],
    responses: standardResponses(),
  }
}

function corsPreflightOperation(operationId: string): OpenApiOperation {
  return {
    operationId,
    summary: 'Backend-enforced CORS preflight',
    security: [],
    responses: {
      204: { description: 'Allowlisted preflight accepted.' },
      403: { description: 'Origin or requested headers rejected.' },
    },
  }
}

function standardResponses(): Record<string, unknown> {
  return {
    200: { description: 'Request accepted by the backend route.' },
    400: { description: 'Request validation failed.' },
    401: { description: 'User authentication failed.' },
    403: { description: 'Tenant authorization failed.' },
    409: { description: 'Request conflicted with canonical state.' },
    503: { description: 'A required durable or execution gate remains unavailable.' },
  }
}

function requireApiGatewayHostname(value: string): string {
  const hostname = value.trim().toLowerCase()
  if (
    hostname.length > 253 ||
    !/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(hostname) ||
    !hostname.includes('.apigateway.') ||
    !hostname.endsWith('.cloud.goog')
  ) {
    throw new Error('API Gateway hostname must be an exact Google-managed apigateway cloud.goog hostname.')
  }
  return hostname
}

function requireCloudRunOrigin(value: string): string {
  const origin = requireHttpsOrigin(value, 'Cloud Run')
  if (!new URL(origin).hostname.endsWith('.run.app')) {
    throw new Error('Cloud Run backend must use its exact Google-managed run.app origin for IAM audience binding.')
  }
  return origin
}

function requireHttpsOrigin(value: string, label: string): string {
  const trimmed = value.trim()
  try {
    const url = new URL(trimmed)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error()
    }
    return url.origin
  } catch {
    throw new Error(`${label} URL must be an exact HTTPS origin without credentials, path, query, or fragment.`)
  }
}
