import type { ServiceContext } from '../types'

export function createAuthService(context: ServiceContext) {
  return {
    getCurrentUserSummary() {
      return {
        userId: context.auth?.userId,
        email: context.auth?.email,
        isMockUser: Boolean(context.auth?.isMockUser),
      }
    },
  }
}
