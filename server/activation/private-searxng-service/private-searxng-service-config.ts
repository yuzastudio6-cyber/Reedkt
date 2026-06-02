import { privateSearxngServiceConfig } from './private-searxng-service-policy'

export function buildPrivateSearxngRuntimeEnv(redacted = true): Record<string, string> {
  return {
    REEDITPRO_RUNTIME_ROLE: 'phase49f_private_searxng_service',
    REEDITPRO_ENV: privateSearxngServiceConfig.env,
    SEARXNG_PORT: privateSearxngServiceConfig.containerPort,
    SEARXNG_BIND_ADDRESS: '0.0.0.0',
    SEARXNG_METHOD: 'GET',
    SEARXNG_LIMITER: 'false',
    SEARXNG_PUBLIC_INSTANCE: 'false',
    SEARXNG_SECRET: redacted ? '[redacted-runtime-generated]' : '',
    PAID_PROVIDERS_ALLOWED: 'false',
    PUBLIC_SEARXNG_INSTANCE_ALLOWED: 'false',
    PUBLIC_UNAUTHENTICATED_ACCESS_ALLOWED: 'false',
    BROWSER_CAPTURE_ALLOWED: 'false',
    READABILITY_EXTRACTION_ALLOWED: 'false',
    REEDITPRO_PRODUCTION_READY: 'false',
    REEDITPRO_EXTERNAL_BETA_READY: 'false',
    REEDITPRO_PAID_PRODUCTION_READY: 'false',
    REEDITPRO_BROAD_REAL_MEDIA_READY: 'false',
  }
}

export function buildPrivateSearxngDeployEnvVars(secret: string): string {
  return Object.entries({ ...buildPrivateSearxngRuntimeEnv(false), SEARXNG_SECRET: secret })
    .map(([key, value]) => `${key}=${value}`)
    .join(',')
}
