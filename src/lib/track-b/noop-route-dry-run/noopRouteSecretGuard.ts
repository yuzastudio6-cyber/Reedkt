import type {
  NoopRouteSecretGuardReport,
  NoopRouteSecretPayloadRequest,
} from './noopRouteDryRunTypes'

const SECRET_BLOCKER = 'unexpected_secret_payload_access_required'

export function buildNoopRouteSecretPayloadGuard(
  request: NoopRouteSecretPayloadRequest = {},
): NoopRouteSecretGuardReport {
  const blockedReasons: string[] = []
  if (request.serviceRoleSecretAccessRequested) blockedReasons.push(SECRET_BLOCKER)
  if (request.providerSecretAccessRequested) blockedReasons.push(SECRET_BLOCKER)
  if (request.secretManagerAccessRequested) blockedReasons.push(SECRET_BLOCKER)
  if (request.envSecretAccessRequested) blockedReasons.push(SECRET_BLOCKER)
  if (request.frontendSecretAccessRequested) blockedReasons.push(SECRET_BLOCKER)
  if (request.secretPayloadReadAttempted) blockedReasons.push(SECRET_BLOCKER)
  if (request.secretValuesInReports) blockedReasons.push(SECRET_BLOCKER)

  const uniqueBlockedReasons = [...new Set(blockedReasons)]
  return {
    status: uniqueBlockedReasons.length === 0 ? 'passed' : 'blocked',
    passed: uniqueBlockedReasons.length === 0,
    blockedReasons: uniqueBlockedReasons,
    warnings: [],
    serviceRoleSecretAccess: 'not_required',
    providerSecretAccess: 'not_required',
    secretManagerAccess: 'not_required',
    envSecretAccess: 'not_required',
    frontendSecretAccess: 'blocked',
    secretPayloadReadAttempted: false,
    secretValuesInReports: false,
    unexpectedSecretPayloadAccess: uniqueBlockedReasons.length === 0 ? 'not_observed' : 'blocked',
  }
}
