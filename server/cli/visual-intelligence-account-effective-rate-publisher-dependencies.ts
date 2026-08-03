import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceGcsPrivateObjectReadPort,
} from '../visual-intelligence/visual-intelligence-private-object-read-port'

export function createVisualIntelligenceAccountEffectiveRatePublisherDependencies(
  input: { readonly projectId: 'reeditpro' },
) {
  if (input.projectId !== 'reeditpro') {
    throw new Error('Visual Intelligence rate publisher project is invalid.')
  }
  const storage = new Storage({ projectId: input.projectId })
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-billing.readonly'],
  })
  return Object.freeze({
    storage,
    auth,
    privateObjectReadPort: createVisualIntelligenceGcsPrivateObjectReadPort({
      projectId: input.projectId,
      storage,
    }),
  })
}
