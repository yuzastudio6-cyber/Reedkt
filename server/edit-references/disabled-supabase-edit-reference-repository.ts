import { ApiError } from '../errors/api-error'
import type {
  EditReferenceAggregate,
  EditReferenceMutationInput,
  EditReferenceMutationResult,
  EditReferenceRepository,
  EditReferenceRepositoryScope,
} from './edit-reference-repository'

export class DisabledSupabaseEditReferenceRepository implements EditReferenceRepository {
  readonly persistence = 'supabase_blocked' as const

  async read(_scope: EditReferenceRepositoryScope): Promise<EditReferenceAggregate | undefined> {
    void _scope
    throw blocked()
  }

  async mutate(_input: EditReferenceMutationInput): Promise<EditReferenceMutationResult> {
    void _input
    throw blocked()
  }
}

function blocked(): ApiError {
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'Production Edit Reference persistence is blocked by the unresolved canonical Supabase migration baseline.',
    503,
    { migrationBaseline: 'blocked_by_parallel_foundations', remoteMutationAttempted: false },
  )
}
