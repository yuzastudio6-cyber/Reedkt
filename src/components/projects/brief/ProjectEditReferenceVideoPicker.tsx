import { CloudUpload, LoaderCircle, Sparkles, Video, X } from 'lucide-react'
import { Button, IconButton } from '../../Button'
import type {
  ProjectSourceVideoBackendUploadConfig,
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoBackendUploadStatus,
  ProjectSourceVideoLocalPreview,
} from '../../../types/project-source-video'

type ProjectEditReferenceVideoPickerProps = {
  backendUploadConfig: ProjectSourceVideoBackendUploadConfig
  backendUploadError?: string
  backendUploadResult?: ProjectSourceVideoBackendUploadResult
  backendUploadStatus: ProjectSourceVideoBackendUploadStatus
  localPreview?: ProjectSourceVideoLocalPreview
  onClear: () => void
  onSelectFile: (file: File) => void
  onUploadToBackend: () => void
}

export function ProjectEditReferenceVideoPicker({
  backendUploadConfig,
  backendUploadError,
  backendUploadResult,
  backendUploadStatus,
  localPreview,
  onClear,
  onSelectFile,
  onUploadToBackend,
}: ProjectEditReferenceVideoPickerProps) {
  const uploadDisabled = !localPreview || !backendUploadConfig.available || backendUploadStatus === 'uploading'

  return (
    <section className="project-edit-reference-picker" data-testid="project-edit-reference-video-picker">
      <div className="project-edit-reference-picker__heading">
        <Sparkles aria-hidden="true" size={18} />
        <div>
          <strong>Style reference</strong>
          <span>Optional video. ReEditPro measures its editing language and adapts principles without copying it.</span>
        </div>
      </div>
      <div className="project-edit-reference-picker__actions">
        <label className="project-edit-reference-picker__input">
          <Video aria-hidden="true" size={16} />
          <span>{localPreview ? 'Replace reference' : 'Choose reference video'}</span>
          <input
            accept="video/*"
            aria-label="Choose optional edit style reference video"
            data-testid="project-edit-reference-video-input"
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              if (file) onSelectFile(file)
            }}
          />
        </label>
        {localPreview ? <IconButton icon={X} label="Remove reference video" onClick={onClear} /> : null}
        <Button
          disabled={uploadDisabled}
          icon={backendUploadStatus === 'uploading' ? LoaderCircle : CloudUpload}
          onClick={onUploadToBackend}
          size="sm"
          variant="secondary"
        >
          {backendUploadStatus === 'uploading' ? 'Uploading' : backendUploadResult ? 'Reference ready' : 'Upload reference'}
        </Button>
      </div>
      {localPreview ? (
        <div className="project-edit-reference-picker__file">
          <span>{localPreview.fileName}</span>
          <small>{backendUploadResult ? 'Private reference attached' : 'Selected locally'}</small>
        </div>
      ) : null}
      {backendUploadError ? <p className="project-edit-brief-source-video-picker__error">{backendUploadError}</p> : null}
    </section>
  )
}
