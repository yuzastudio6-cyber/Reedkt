import { serializeReeditProGoogleApiGatewayOpenApi } from '../config/google-api-gateway-openapi'

const apiHostname = requiredEnv('REEDITPRO_API_GATEWAY_HOSTNAME')
const cloudRunBackendUrl = requiredEnv('REEDITPRO_CLOUD_RUN_API_URL')
const supabaseUrl = requiredEnv('SUPABASE_URL')

process.stdout.write(serializeReeditProGoogleApiGatewayOpenApi({
  apiHostname,
  cloudRunBackendUrl,
  supabaseUrl,
}))

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required to render the private staging API Gateway contract.`)
  return value
}
