import { readInternalTestingAuthProjectAccessReadiness } from './internal-testing-auth-project-access-readiness'
import {
  evaluateProjectEditSessionAccessPolicy,
  type ProjectEditSessionDurableAccessEvidence,
  type ProjectEditSessionAccessPolicy,
} from './project-edit-session-access-policy-core'

export * from './project-edit-session-access-policy-core'

export async function readProjectEditSessionAccessPolicy(input: {
  projectId?: string
  editSessionId?: string
  durableEvidence?: Partial<ProjectEditSessionDurableAccessEvidence>
} = {}): Promise<ProjectEditSessionAccessPolicy> {
  const authReadiness = await readInternalTestingAuthProjectAccessReadiness()
  return evaluateProjectEditSessionAccessPolicy({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    authReadiness,
    durableEvidence: input.durableEvidence,
  })
}
