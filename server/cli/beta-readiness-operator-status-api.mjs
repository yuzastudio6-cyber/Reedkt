const SECRET_KEY_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /service[_-]?role/i,
  /credential/i,
  /(^|[_-])token($|[_-])/i,
  /authorization/i,
  /signed[_-]?url/i,
  /signedUrl/,
  /raw[_-]?prompt/i,
]

const SECRET_VALUE_PATTERNS = [
  /x-goog-signature=/i,
  /x-amz-signature=/i,
  /^bearer\s+/i,
  /^sk-[a-z0-9_-]+/i,
  /service_role_key/i,
]

export async function runBetaReadinessOperatorStatusApiFromEnv(
  env,
  fetchImpl = fetch,
) {
  const baseUrl = requiredEnvAny(env, [
    'REEDITPRO_BETA_STATUS_API_BASE_URL',
    'REEDITPRO_BETA_EXTERNAL_API_BASE_URL',
  ]).replace(/\/+$/, '')
  const bearerToken = requiredEnvAny(env, [
    'REEDITPRO_BETA_STATUS_BEARER_TOKEN',
    'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN',
  ])
  const workspaceId =
    clean(env.REEDITPRO_BETA_STATUS_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID)
  assertNoSecretLikeStatusQuery({ workspaceId })
  const endpoint = buildOperatorStatusEndpoint(baseUrl, workspaceId)

  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      accept: 'application/json',
    },
  })
  const payload = await response.json()
  const result = summarizeOperatorStatusApiResponse(endpoint, response.status, payload)

  const requireExternalBetaReady =
    env.REEDITPRO_BETA_STATUS_REQUIRE_EXTERNAL_BETA_READY ??
    env.REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY
  if (parseBoolean(requireExternalBetaReady) && result.readyForExternalBeta !== true) {
    throw new Error('Operator status reports external beta is not ready.')
  }
  if (parseBoolean(env.REEDITPRO_BETA_STATUS_REQUIRE_REAL_USER_MEDIA_BETA_READY) && result.readyForRealUserMediaBeta !== true) {
    throw new Error('Operator status reports real user media beta is not ready.')
  }
  if (parseBoolean(env.REEDITPRO_BETA_STATUS_REQUIRE_PAID_PRODUCTION_READY) && result.readyForPaidProduction !== true) {
    throw new Error('Operator status reports paid production is not ready.')
  }

  return result
}

export function buildOperatorStatusEndpoint(baseUrl, workspaceId) {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/beta-readiness/operator-status`
  if (!workspaceId) return endpoint
  return `${endpoint}?workspaceId=${encodeURIComponent(workspaceId)}`
}

export function summarizeOperatorStatusApiResponse(
  endpoint,
  status,
  payload,
) {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const operatorStatus = isRecord(data.status) ? data.status : {}
  const currentGate = isRecord(operatorStatus.currentGate) ? operatorStatus.currentGate : {}
  const blockerForwardProgressPolicy = isRecord(currentGate.blockerForwardProgressPolicy)
    ? currentGate.blockerForwardProgressPolicy
    : undefined
  const evidenceGaps = isRecord(operatorStatus.evidenceGaps) ? operatorStatus.evidenceGaps : {}
  const statusWarnings = stringArray(operatorStatus.warnings)
  const responseWarnings = stringArray(isRecord(payload) ? payload.warnings : undefined)

  return {
    ok: Boolean(isRecord(payload) && payload.ok === true),
    status,
    endpoint,
    evidenceSource: stringValue(operatorStatus.evidenceSource),
    workspaceId: stringValue(operatorStatus.workspaceId),
    evidencePacketCount: numberValue(operatorStatus.evidencePacketCount),
    readyForExternalBeta: booleanValue(operatorStatus.readyForExternalBeta),
    readyForRealUserMediaBeta: booleanValue(operatorStatus.readyForRealUserMediaBeta),
    readyForPaidProduction: booleanValue(operatorStatus.readyForPaidProduction),
    currentGate: {
      totalTools: numberValue(currentGate.totalTools),
      ownerCoverageToolCount: numberValue(currentGate.ownerCoverageToolCount),
      readinessSpecToolCount: numberValue(currentGate.readinessSpecToolCount),
      toolBlockers: numberValue(currentGate.toolBlockers),
      platformBlockers: numberValue(currentGate.platformBlockers),
      productReadyLocalOssCount: numberValue(currentGate.productReadyLocalOssCount),
      externalBetaToolExecutionAllowed: booleanValue(currentGate.externalBetaToolExecutionAllowed),
      productionToolExecutionAllowed: booleanValue(currentGate.productionToolExecutionAllowed),
      blockerPolicy: stringValue(currentGate.blockerPolicy),
      blockerForwardProgressPolicy: blockerForwardProgressPolicy
        ? {
          intentionalBlanketBlocksAllowed: booleanValue(blockerForwardProgressPolicy.intentionalBlanketBlocksAllowed),
          blockerScope: stringValue(blockerForwardProgressPolicy.blockerScope),
          safeForwardProgressRequired: booleanValue(blockerForwardProgressPolicy.safeForwardProgressRequired),
          nextSafeActionRequiredForBlockers: booleanValue(blockerForwardProgressPolicy.nextSafeActionRequiredForBlockers),
        }
        : undefined,
      safeBlockerReductionAllowed: booleanValue(currentGate.safeBlockerReductionAllowed),
      blockedActionScope: stringArray(currentGate.blockedActionScope),
      allowedForwardProgressScopes: stringArray(currentGate.allowedForwardProgressScopes),
    },
    evidenceGaps: {
      goNoGoBlockers: stringArray(evidenceGaps.goNoGoBlockers).length,
      blockedChecklistItems: stringArray(evidenceGaps.blockedChecklistItems),
      toolBlockers: numberValue(evidenceGaps.toolBlockers),
      platformBlockers: stringArray(evidenceGaps.platformBlockers),
    },
    nextActions: stringArray(operatorStatus.nextActions),
    warnings: [...new Set([...statusWarnings, ...responseWarnings])],
  }
}

function assertNoSecretLikeStatusQuery(query) {
  const secretPaths = collectSecretLikePaths(query, 'betaReadinessOperatorStatusQuery')
  if (secretPaths.length > 0) {
    throw new Error(`Operator status query contains secret-like fields: ${secretPaths.join(', ')}`)
  }
}

function requiredEnv(env, name) {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function requiredEnvAny(env, names) {
  for (const name of names) {
    const value = clean(env[name])
    if (value) return value
  }
  throw new Error(`${names.join(' or ')} is required.`)
}

function parseBoolean(value) {
  return value === 'true' || value === '1'
}

function clean(value) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value) {
  return typeof value === 'string' ? value : undefined
}

function numberValue(value) {
  return typeof value === 'number' ? value : undefined
}

function booleanValue(value) {
  return typeof value === 'boolean' ? value : undefined
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
}

function collectSecretLikePaths(value, rootPath = 'payload') {
  const matches = []
  visitSecretPaths(value, rootPath, matches)
  return matches
}

function visitSecretPaths(value, path, matches) {
  if (typeof value === 'string') {
    if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) matches.push(path)
    return
  }

  if (!value || typeof value !== 'object') return

  if (Array.isArray(value)) {
    value.forEach((item, index) => visitSecretPaths(item, `${path}[${index}]`, matches))
    return
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPath = `${path}.${key}`
    if (SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      matches.push(nestedPath)
      continue
    }
    visitSecretPaths(nestedValue, nestedPath, matches)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaReadinessOperatorStatusApiFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Beta readiness operator status API CLI failed.')
    process.exitCode = 1
  }
}
