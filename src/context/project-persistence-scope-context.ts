import { createContext } from 'react'
import type { ProjectPersistenceScope } from '../lib/project-persistence-scope'

export const ProjectPersistenceScopeContext = createContext<ProjectPersistenceScope | undefined>(undefined)
