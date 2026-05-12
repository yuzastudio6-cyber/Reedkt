import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, FileVideo, Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EditPlanCard } from '../components/planning/EditPlanCard'
import { InstructionTextarea } from '../components/planning/InstructionTextarea'
import { OrderedClipList } from '../components/planning/OrderedClipList'
import { ReferenceVideoInput } from '../components/planning/ReferenceVideoInput'
import { WorkflowSelect } from '../components/planning/WorkflowSelect'
import { createMockEditPlan, mockPlannerLoadingSteps, sampleClips } from '../lib/mock-planner'
import {
  aspectRatioOptions,
  creditPreferenceOptions,
  editLevelOptions,
  getWorkflowProfile,
  moodStyleOptions,
  structurePreferenceOptions,
  targetPlatformOptions,
  visualPreferenceOptions,
  workflowProfiles,
} from '../lib/workflow-profiles'
import type {
  AspectRatio,
  ClipSource,
  CreditPreference,
  EditLevel,
  EditPlan,
  MoodStyle,
  PlannerInput,
  StructurePreference,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from '../types/reeditpro'

const stepLabels = [
  'Project basics',
  'Upload clips in source order',
  'Choose edit workflow',
  'Reference and instructions',
  'AI edit plan',
  'Credit estimate and approval',
]

function reorderClips(clips: ClipSource[]) {
  return clips.map((clip, index) => ({ ...clip, uploadedOrder: index + 1 }))
}

export function CreateProjectPage() {
  const [projectName, setProjectName] = useState('Premium property walkthrough')
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('tiktok_reels_shorts')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [workflowType, setWorkflowType] = useState<VideoWorkflowType>('real_estate_property_tour')
  const [editLevel, setEditLevel] = useState<EditLevel>('pro')
  const [structurePreference, setStructurePreference] = useState<StructurePreference>('improve_if_needed')
  const [moodStyle, setMoodStyle] = useState<MoodStyle>('luxury')
  const [visualPreference, setVisualPreference] = useState<VisualPreference>('balanced_visual_mix')
  const [referenceUrl, setReferenceUrl] = useState('https://example.com/luxury-listing-reference')
  const [customInstructions, setCustomInstructions] = useState('Keep it natural, preserve the walkthrough feel, add captions, use subtle motion, and make it feel premium.')
  const [creditPreference, setCreditPreference] = useState<CreditPreference>('balanced')
  const [clips, setClips] = useState<ClipSource[]>(sampleClips)
  const [isGenerating, setIsGenerating] = useState(false)
  const [plan, setPlan] = useState<EditPlan | null>(null)
  const [approved, setApproved] = useState(false)
  const [planError, setPlanError] = useState('')
  const [draftState, setDraftState] = useState('')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const plannerInput: PlannerInput = useMemo(
    () => ({
      projectName,
      targetPlatform,
      aspectRatio,
      workflowType,
      editLevel,
      structurePreference,
      moodStyle,
      visualPreference,
      referenceUrl,
      customInstructions,
      creditPreference,
      clips,
    }),
    [aspectRatio, clips, creditPreference, customInstructions, editLevel, moodStyle, projectName, referenceUrl, structurePreference, targetPlatform, visualPreference, workflowType],
  )

  const workflowProfile = getWorkflowProfile(workflowType)

  function handleAddClip() {
    setClips((current) =>
      reorderClips([
        ...current,
        {
          id: `clip-${Date.now()}`,
          uploadedOrder: current.length + 1,
          fileName: `new-source-clip-${current.length + 1}.mp4`,
          duration: '00:09',
          detectedType: 'Mock uploaded clip',
          notes: '',
        },
      ]),
    )
  }

  function handleMoveClip(id: string, direction: 'up' | 'down') {
    setClips((current) => {
      const next = [...current]
      const index = next.findIndex((clip) => clip.id === id)
      const targetIndex = direction === 'up' ? index - 1 : index + 1

      if (index < 0 || targetIndex < 0 || targetIndex >= next.length) {
        return current
      }

      const moving = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = moving
      return reorderClips(next)
    })
    setApproved(false)
  }

  function handleRemoveClip(id: string) {
    setClips((current) => reorderClips(current.filter((clip) => clip.id !== id)))
    setApproved(false)
  }

  function handleUpdateClip(id: string, updates: Partial<ClipSource>) {
    setClips((current) => current.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip)))
    setApproved(false)
  }

  function handleGeneratePlan() {
    setDraftState('')
    setPlanError('')
    setApproved(false)

    if (clips.length === 0) {
      setPlan(null)
      setPlanError('Edit plan could not be created because no clips were added. Add at least one clip or save this project as a draft.')
      return
    }

    setIsGenerating(true)
    setPlan(null)
    timerRef.current = window.setTimeout(() => {
      setPlan(createMockEditPlan(plannerInput))
      setIsGenerating(false)
    }, 1200)
  }

  return (
    <AppShell
      description="Create a project, upload clips in source order, generate a mock edit plan, estimate credits, and approve before generation."
      eyebrow="New project"
      title="Create project"
    >
      <section className="planning-hero">
        <div>
          <Badge accent="cyan">Plan first. Approve second. Generate third.</Badge>
          <h2>Mock upload and edit planning workflow</h2>
          <p>Everything here is local demo state. ReeditPro does not upload files, deduct credits, call AI, or start rendering in this phase.</p>
        </div>
        <Button icon={Sparkles} onClick={handleGeneratePlan} variant="primary">
          Generate mock edit plan
        </Button>
      </section>

      <nav aria-label="Create project steps" className="stepper">
        {stepLabels.map((step, index) => (
          <span className={index < 4 || plan ? 'complete' : ''} key={step}>
            {index + 1}. {step}
          </span>
        ))}
      </nav>

      <section className="planning-grid">
        <Card className="planning-step">
          <div className="step-heading">
            <span>1</span>
            <div>
              <h2>Project basics</h2>
              <p>Set the goal context before asking AI to plan anything.</p>
            </div>
          </div>
          <label className="planning-field">
            <span>Project name</span>
            <input onChange={(event) => setProjectName(event.target.value)} value={projectName} />
          </label>
          <div className="field-grid">
            <WorkflowSelect label="Target platform" onChange={setTargetPlatform} options={targetPlatformOptions} value={targetPlatform} />
            <WorkflowSelect label="Aspect ratio" onChange={setAspectRatio} options={aspectRatioOptions} value={aspectRatio} />
          </div>
        </Card>

        <Card className="planning-step source-sequence-step">
          <div className="step-heading">
            <span>2</span>
            <div>
              <h2>Upload clips in source order</h2>
              <p>Upload clips in the order they were filmed or the order you believe they belong. ReeditPro uses this as the source sequence, not automatically the final edit order.</p>
            </div>
          </div>
          <div className="upload-dropzone mock-dropzone">
            <UploadCloud size={30} />
            <strong>Drag clips here</strong>
            <p>Mock only. The add button creates local demo clips and does not upload files.</p>
            <Button icon={FileVideo} onClick={handleAddClip} variant="secondary">
              Add mock clip
            </Button>
          </div>
          <div className="sequence-columns">
            <div>
              <div className="panel-heading">
                <h3>Source sequence</h3>
                <Badge accent="cyan">{clips.length} clips</Badge>
              </div>
              <OrderedClipList clips={clips} onAddClip={handleAddClip} onMoveClip={handleMoveClip} onRemoveClip={handleRemoveClip} onUpdateClip={handleUpdateClip} />
            </div>
            <aside className="recommended-structure-preview">
              <ClipboardList size={22} />
              <h3>Recommended edit structure</h3>
              <p>The mock AI plan will propose final order separately. Uploaded order is context, not automatic final structure.</p>
              <Badge accent="warning">Approval required before changes</Badge>
            </aside>
          </div>
        </Card>

        <Card className="planning-step">
          <div className="step-heading">
            <span>3</span>
            <div>
              <h2>Choose edit workflow</h2>
              <p>This gives the AI workflow context. It does not automatically decide which visual signature systems will be used.</p>
            </div>
          </div>
          <WorkflowSelect
            helper="Dropdown = workflow context. AI edit plan = decides signature usage per segment."
            label="What type of video are you creating?"
            onChange={setWorkflowType}
            options={workflowProfiles.map((profile) => ({ value: profile.value, label: profile.label }))}
            value={workflowType}
          />
          <div className="workflow-profile-card">
            <strong>{workflowProfile.purpose}</strong>
            <p>{workflowProfile.hookGuidance}</p>
            <small>
              Pacing: {workflowProfile.pacingGuidance} / Credit expectation: {workflowProfile.creditExpectation}
            </small>
          </div>
          <div className="field-grid">
            <WorkflowSelect label="How strong should the edit be?" onChange={setEditLevel} options={editLevelOptions} value={editLevel} />
            <WorkflowSelect label="Structure preference" onChange={setStructurePreference} options={structurePreferenceOptions} value={structurePreference} />
            <WorkflowSelect label="Mood / style" onChange={setMoodStyle} options={moodStyleOptions} value={moodStyle} />
          </div>
          <div className="visual-preference-group" role="group" aria-label="Visual preference">
            <span>Visual preference</span>
            <div>
              {visualPreferenceOptions.map((option) => (
                <button className={visualPreference === option.value ? 'active' : ''} key={option.value} onClick={() => setVisualPreference(option.value)} type="button">
                  {option.label}
                </button>
              ))}
            </div>
            <small>Even if you choose a visual preference, AI plans per segment and should not force visuals that do not help.</small>
          </div>
        </Card>

        <section className="planning-step-stack">
          <div className="step-heading standalone">
            <span>4</span>
            <div>
              <h2>Reference and instructions</h2>
              <p>Reference DNA guides style. User instructions have highest priority.</p>
            </div>
          </div>
          <ReferenceVideoInput onChange={setReferenceUrl} value={referenceUrl} />
          <InstructionTextarea onChange={setCustomInstructions} value={customInstructions} />
          <Card>
            <WorkflowSelect label="Budget / credit preference" onChange={setCreditPreference} options={creditPreferenceOptions} value={creditPreference} />
          </Card>
        </section>

        <Card className="planning-step plan-generation-step">
          <div className="step-heading">
            <span>5</span>
            <div>
              <h2>AI edit plan</h2>
              <p>Generate a mock plan after the setup context is ready.</p>
            </div>
          </div>
          <Button icon={Sparkles} onClick={handleGeneratePlan} variant="primary">
            Generate mock edit plan
          </Button>
          {isGenerating && (
            <div className="planner-loading" aria-live="polite">
              <Loader2 className="spin-icon" size={22} />
              <div>
                {mockPlannerLoadingSteps.map((step) => (
                  <span key={step}>{step}</span>
                ))}
              </div>
            </div>
          )}
          {planError && (
            <div className="planner-error" role="alert">
              <AlertTriangle size={20} />
              <p>{planError}</p>
            </div>
          )}
          {!isGenerating && !plan && !planError && (
            <div className="planner-empty">
              <Sparkles size={22} />
              <p>Generate a mock edit plan to see source sequence, recommended structure, signature routing, and credit estimate.</p>
            </div>
          )}
        </Card>
      </section>

      <section className="approval-section">
        <div className="step-heading standalone">
          <span>6</span>
          <div>
            <h2>Credit estimate and approval</h2>
            <p>Credits are only deducted after approval in production. This page never deducts real credits.</p>
          </div>
        </div>
        {plan ? (
          <EditPlanCard
            approved={approved}
            onApprove={() => {
              setApproved(true)
              setDraftState('')
            }}
            onRevise={() => {
              setApproved(false)
              setDraftState('Plan marked for revision. Adjust instructions or regenerate a new mock plan.')
            }}
            onSaveDraft={() => setDraftState('Draft saved locally for this mock session. No backend storage was used.')}
            plan={plan}
          />
        ) : (
          <Card className="approval-placeholder">
            <CheckCircle2 size={22} />
            <h3>No credit estimate yet</h3>
            <p>Generate a mock edit plan first. ReeditPro must show the plan and estimate before generation.</p>
          </Card>
        )}
        {draftState && <p className="draft-state">{draftState}</p>}
      </section>
    </AppShell>
  )
}
