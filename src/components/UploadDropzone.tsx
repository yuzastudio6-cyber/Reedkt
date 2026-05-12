import { FileVideo, FolderOpen, UploadCloud } from 'lucide-react'
import { uploadSteps } from '../data/mockData'
import { Button } from './Button'
import { Card } from './Card'

export function UploadDropzone() {
  return (
    <Card className="upload-dropzone">
      <div className="dropzone-icon">
        <UploadCloud aria-hidden="true" size={34} />
      </div>
      <h2>Upload video, audio, and assets</h2>
      <p>Drop source clips, b-roll, product footage, voice audio, images, or brand files. ReeditPro will prepare transcript, media metadata, and a first AI edit plan.</p>
      <div className="dropzone-actions">
        <Button icon={FileVideo} variant="primary">
          Select media
        </Button>
        <Button icon={FolderOpen} variant="secondary">
          Import folder
        </Button>
      </div>
      <div className="upload-step-grid">
        {uploadSteps.map((step) => (
          <article key={step.label}>
            <step.icon aria-hidden="true" size={20} />
            <strong>{step.label}</strong>
            <span>{step.detail}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}
