import { MessageSquareText } from 'lucide-react'
import { Card } from '../Card'

export function ProjectEditSessionEmptyState() {
  return (
    <Card className="project-edit-session-empty-state" data-testid="project-edit-session-empty-state">
      <MessageSquareText aria-hidden="true" size={28} />
      <h2>No Edit Chats yet.</h2>
      <p>Click + New Edit to start your first video edit.</p>
    </Card>
  )
}
