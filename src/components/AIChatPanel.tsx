import { Paperclip, Send, Sparkles, Undo2 } from 'lucide-react'
import { activeEdits, chatMessages } from '../data/mockData'
import { Badge } from './Badge'
import { Button, IconButton } from './Button'
import { Card } from './Card'

const quickPrompts = ['Make it cleaner', 'Move this earlier', 'Reduce motion', 'Add captions', 'Regenerate this moment', 'Lower credit cost']

export function AIChatPanel() {
  return (
    <Card className="ai-chat-panel">
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">AI chat editor</span>
          <h2>Edit with instructions</h2>
        </div>
        <Badge accent="violet">Mock editor</Badge>
      </div>
      <div className="chat-thread">
        {chatMessages.map((message) => (
          <article className={`chat-message ${message.role === 'User' ? 'from-user' : 'from-ai'}`} key={message.text}>
            <strong>{message.role}</strong>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
      <div className="applied-edits">
        <h3>Applied edits</h3>
        {activeEdits.map((edit) => (
          <div className="edit-row" key={edit.label}>
            <span>
              <Sparkles size={15} /> {edit.label}
            </span>
            <Badge accent={edit.status === 'Applied' ? 'success' : edit.status === 'Preview' ? 'cyan' : 'warning'}>
              {edit.status}
            </Badge>
            <small>{edit.time}</small>
          </div>
        ))}
      </div>
      <div className="prompt-chips" aria-label="Quick AI prompts">
        {quickPrompts.map((suggestion) => (
          <button key={suggestion} type="button">
            {suggestion}
          </button>
        ))}
      </div>
      <label className="ai-prompt">
        <span>AI request</span>
        <textarea defaultValue="Make the proof moment more realistic, but keep it as an overlay inside the speaker video." />
      </label>
      <div className="chat-actions">
        <IconButton icon={Paperclip} label="Attach media context" />
        <Button icon={Undo2} variant="secondary">
          Undo
        </Button>
        <Button icon={Send} variant="primary">
          Preview changes
        </Button>
      </div>
      <p className="ai-disclaimer">AI can make mistakes. Review visual timing, captions, and audio before applying.</p>
    </Card>
  )
}
