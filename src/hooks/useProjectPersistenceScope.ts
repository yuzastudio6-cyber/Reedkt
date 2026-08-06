import { useContext } from 'react'
import { ProjectPersistenceScopeContext } from '../context/project-persistence-scope-context'

export function useProjectPersistenceScope() {
  const scope = useContext(ProjectPersistenceScopeContext)
  if (!scope) {
    throw new Error('Project persistence requires a resolved authenticated user and workspace scope.')
  }
  return scope
}
