import { useEffect, useId, useState } from 'react'
import { CheckCircle2, FileVideo, MessageSquareText, UploadCloud } from 'lucide-react'
import { Button } from '../../Button'
import { Card } from '../../Card'

type ProjectEditBriefWorkspaceProps = {
  editSessionId: string
  editSessionTitle?: string
  projectId: string
}

type LocalSourceVideo = {
  name: string
  objectUrl: string
  sizeLabel: string
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Size unknown'
  const megabytes = bytes / 1024 / 1024
  if (megabytes < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`
}

export function ProjectEditBriefWorkspace({ editSessionTitle, projectId }: ProjectEditBriefWorkspaceProps) {
  const fileInputId = useId()
  const [sourceVideo, setSourceVideo] = useState<LocalSourceVideo | undefined>()
  const [briefText, setBriefText] = useState('Clean pacing, readable captions, natural sound, and no flashy transitions unless the edit asks for it.')
  const [statusMessage, setStatusMessage] = useState('Ready for source video and brief notes.')

  useEffect(() => {
    return () => {
      if (sourceVideo?.objectUrl) URL.revokeObjectURL(sourceVideo.objectUrl)
    }
  }, [sourceVideo?.objectUrl])

  function handleVideoSelected(file?: File) {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setStatusMessage('Choose a video file for this edit.')
      return
    }

    if (sourceVideo?.objectUrl) URL.revokeObjectURL(sourceVideo.objectUrl)
    setSourceVideo({
      name: file.name,
      objectUrl: URL.createObjectURL(file),
      sizeLabel: formatFileSize(file.size),
    })
    setStatusMessage('Source video selected for this edit. Nothing has been uploaded or processed yet.')
  }

  function clearVideo() {
    if (sourceVideo?.objectUrl) URL.revokeObjectURL(sourceVideo.objectUrl)
    setSourceVideo(undefined)
    setStatusMessage('Source video cleared from this edit.')
  }

  function saveBrief() {
    setStatusMessage('Brief saved locally for this edit workspace.')
  }

  return (
    <section className="clean-edit-brief" data-testid="project-edit-brief-workspace">
      <Card className="clean-edit-brief__hero">
        <div className="clean-edit-brief__hero-copy">
          <span className="section-eyebrow">Edit setup</span>
          <h2>{editSessionTitle ?? 'Untitled edit'}</h2>
          <p>
            Upload the source video for this edit, write the brief, then continue to planning and approval when the backend execution lane is ready.
          </p>
        </div>
        <Button to={`/projects/${projectId}`} variant="secondary">
          Back to project
        </Button>
      </Card>

      <div className="clean-edit-brief__layout">
        <main className="clean-edit-brief__main">
          <Card className="clean-edit-brief__upload-card">
            <div className="clean-edit-brief__card-heading">
              <UploadCloud aria-hidden="true" size={22} />
              <div>
                <h3>Source video</h3>
                <p>Select the video that belongs to this edit.</p>
              </div>
            </div>

            <div className={sourceVideo ? 'clean-edit-brief__preview clean-edit-brief__preview--ready' : 'clean-edit-brief__preview'}>
              {sourceVideo ? (
                <video controls src={sourceVideo.objectUrl} />
              ) : (
                <div className="clean-edit-brief__empty-preview">
                  <FileVideo aria-hidden="true" size={34} />
                  <strong>No source video selected</strong>
                  <span>Choose a local video to preview it in this edit.</span>
                </div>
              )}
            </div>

            <div className="clean-edit-brief__upload-actions">
              <input
                accept="video/*"
                id={fileInputId}
                onChange={(event) => handleVideoSelected(event.currentTarget.files?.[0])}
                type="file"
              />
              <label className="rp-button rp-button-primary rp-button-md clean-edit-brief__file-button" htmlFor={fileInputId}>
                <UploadCloud aria-hidden="true" size={17} />
                Choose video
              </label>
              {sourceVideo ? (
                <Button onClick={clearVideo} type="button" variant="secondary">
                  Remove
                </Button>
              ) : null}
            </div>

            {sourceVideo ? (
              <div className="clean-edit-brief__file-summary">
                <CheckCircle2 aria-hidden="true" size={17} />
                <span>{sourceVideo.name}</span>
                <span>{sourceVideo.sizeLabel}</span>
              </div>
            ) : null}
          </Card>

          <Card className="clean-edit-brief__brief-card">
            <div className="clean-edit-brief__card-heading">
              <MessageSquareText aria-hidden="true" size={22} />
              <div>
                <h3>Edit brief</h3>
                <p>Tell ReEditPro what this edit should feel like.</p>
              </div>
            </div>
            <label htmlFor="clean-edit-brief-text">Instructions</label>
            <textarea
              id="clean-edit-brief-text"
              onChange={(event) => setBriefText(event.currentTarget.value)}
              rows={6}
              value={briefText}
            />
            <Button onClick={saveBrief} type="button" variant="primary">
              Save brief
            </Button>
          </Card>
        </main>

        <aside className="clean-edit-brief__side">
          <Card className="clean-edit-brief__next-card">
            <span className="section-eyebrow">Next</span>
            <h3>Plan after upload</h3>
            <p>
              The next production step is to analyze the selected source video, create the edit plan, show the credit estimate, and wait for approval before execution.
            </p>
            <ul>
              <li>Video stays inside this edit workspace.</li>
              <li>Planning and credits happen after the brief is ready.</li>
              <li>Editing tools do not run from this UI screen.</li>
            </ul>
          </Card>
          <Card className="clean-edit-brief__status-card">
            <span className="section-eyebrow">Status</span>
            <p>{statusMessage}</p>
          </Card>
        </aside>
      </div>
    </section>
  )
}
