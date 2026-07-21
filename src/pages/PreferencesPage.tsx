import { EditReferenceWorkspacePage } from '../components/preferences/EditReferenceWorkspacePage'
import { useProjectPersistenceScope } from '../hooks/useProjectPersistenceScope'
import '../styles/preferences.css'

export function PreferencesPage() {
  const projectPersistenceScope = useProjectPersistenceScope()
  return <EditReferenceWorkspacePage workspaceId={projectPersistenceScope.workspaceId} />
}
