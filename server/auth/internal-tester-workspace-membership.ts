import { privateIdentifierHash } from './internal-tester-google-identity'

export const INTERNAL_TESTER_WORKSPACE_MEMBERSHIP_SELECTS = [
  'id, workspace_id, user_id, role',
  'workspace_id, user_id, role',
] as const

export type InternalTesterWorkspaceMembershipIdentityContract =
  | 'surrogate_id'
  | 'workspace_user_composite'

export interface InternalTesterWorkspaceMembershipRow {
  id?: string
  workspace_id?: string
  user_id?: string
  role?: string | null
}

export interface ResolvedInternalTesterWorkspaceMembership {
  row: InternalTesterWorkspaceMembershipRow
  identityContract: InternalTesterWorkspaceMembershipIdentityContract
  identityHash: string
  surrogateIdHash?: string
}

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function compositeIdentityValue(workspaceId: string, userId: string): string {
  return JSON.stringify({ workspaceId, userId })
}

export function resolveInternalTesterWorkspaceMembership(input: {
  row: InternalTesterWorkspaceMembershipRow | undefined
  expectedWorkspaceId: string
  expectedUserId: string
}): ResolvedInternalTesterWorkspaceMembership | undefined {
  const workspaceId = clean(input.row?.workspace_id)
  const userId = clean(input.row?.user_id)
  const role = clean(input.row?.role)

  if (
    !input.row
    || workspaceId !== input.expectedWorkspaceId
    || userId !== input.expectedUserId
    || role !== 'owner'
  ) return undefined

  const surrogateId = clean(input.row.id)
  if (surrogateId) {
    const surrogateIdHash = privateIdentifierHash(surrogateId)
    return {
      row: input.row,
      identityContract: 'surrogate_id',
      identityHash: surrogateIdHash,
      surrogateIdHash,
    }
  }

  return {
    row: input.row,
    identityContract: 'workspace_user_composite',
    identityHash: privateIdentifierHash(
      compositeIdentityValue(workspaceId, userId),
    ),
  }
}
