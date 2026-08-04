import type { InternalEditPersistenceStatus } from './local-project-handoff'

export type InternalEditPersistenceStatusCopy = {
  label: 'Saving…' | 'Saved in browser' | 'Recovery saved' | 'Save needs retry'
  title: string
}

export function getInternalEditPersistenceStatusCopy(
  status: InternalEditPersistenceStatus,
): InternalEditPersistenceStatusCopy {
  const title = status.errorMessage
    ? `${status.message} ${status.errorMessage}`
    : status.message

  if (status.status === 'saving') return { label: 'Saving…', title }
  if (status.status === 'saved_backend') return { label: 'Recovery saved', title }
  if (status.status === 'needs_retry') return { label: 'Save needs retry', title }
  return { label: 'Saved in browser', title }
}
