import { Link2, UploadCloud } from 'lucide-react'
import { Button } from '../Button'
import { Card } from '../Card'

type ReferenceVideoInputProps = {
  value: string
  onChange: (value: string) => void
}

export function ReferenceVideoInput({ onChange, value }: ReferenceVideoInputProps) {
  return (
    <Card className="reference-card">
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow">Reference DNA</span>
          <h2>Reference and style input</h2>
        </div>
        <Button icon={UploadCloud} variant="secondary">
          Upload placeholder
        </Button>
      </div>
      <label className="planning-field">
        <span>Reference video URL</span>
        <div className="input-with-icon">
          <Link2 size={18} />
          <input onChange={(event) => onChange(event.target.value)} placeholder="https://example.com/reference-video" value={value} />
        </div>
        <small>ReeditPro studies the reference DNA - pacing, music, captions, transitions, visual style, and mood. It does not copy the reference shot-for-shot.</small>
      </label>
    </Card>
  )
}
