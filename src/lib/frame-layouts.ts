import type { AspectRatio, FrameLayoutPlan, FrameTemplateType } from '../types/reeditpro'

export const frameLayoutTemplates: Record<FrameTemplateType, FrameLayoutPlan> = {
  vertical_talking_head_lower_panel: {
    templateType: 'vertical_talking_head_lower_panel',
    aspectRatio: '9:16',
    canvasWidth: 1080,
    canvasHeight: 1920,
    speakerZone: {
      x: 90,
      y: 120,
      width: 900,
      height: 980,
      label: 'Speaker zone',
      notes: 'Keep face and primary footage readable in the upper portion.',
    },
    animationZone: {
      x: 90,
      y: 1160,
      width: 900,
      height: 540,
      label: 'Lower animation panel',
      notes: 'Generate AI animation on a matching white panel background.',
    },
    captionSafeZone: {
      x: 120,
      y: 1040,
      width: 840,
      height: 260,
      label: 'Caption safe zone',
      notes: 'Avoid covering the face and keep captions away from the bottom UI area.',
    },
    safeMargin: 90,
    panelBackgroundColor: '#FFFFFF',
    notes: ['TikTok/Reels/Shorts vertical layout.', 'Animation generated on matching white panel background.'],
  },
  vertical_full_panel: {
    templateType: 'vertical_full_panel',
    aspectRatio: '9:16',
    canvasWidth: 1080,
    canvasHeight: 1920,
    animationZone: {
      x: 90,
      y: 180,
      width: 900,
      height: 1320,
      label: 'Main centered visual panel',
      notes: 'Use for no-speaker or full visual scenes inside the ReeditPro canvas.',
    },
    captionSafeZone: {
      x: 120,
      y: 1500,
      width: 840,
      height: 260,
      label: 'Caption safe zone',
      notes: 'Keep captions inside platform-safe bounds.',
    },
    safeMargin: 90,
    panelBackgroundColor: '#FFFFFF',
    notes: ['Vertical full-panel layout.', 'Use when the generated visual is the main scene.'],
  },
  youtube_side_panel: {
    templateType: 'youtube_side_panel',
    aspectRatio: '16:9',
    canvasWidth: 1920,
    canvasHeight: 1080,
    speakerZone: {
      x: 110,
      y: 90,
      width: 820,
      height: 760,
      label: 'Speaker/content zone',
      notes: 'Speaker or source footage stays on one side.',
    },
    animationZone: {
      x: 1010,
      y: 120,
      width: 800,
      height: 620,
      label: 'Opposite side animation panel',
      notes: 'Generate visual assets on the matching white panel.',
    },
    captionSafeZone: {
      x: 180,
      y: 820,
      width: 1560,
      height: 160,
      label: 'Caption safe zone',
      notes: 'Keep captions below main content without covering panel details.',
    },
    safeMargin: 90,
    panelBackgroundColor: '#FFFFFF',
    notes: ['YouTube landscape side-panel layout.', 'Useful for demos, explainers, and talking-head proof visuals.'],
  },
  youtube_lower_panel: {
    templateType: 'youtube_lower_panel',
    aspectRatio: '16:9',
    canvasWidth: 1920,
    canvasHeight: 1080,
    speakerZone: {
      x: 120,
      y: 80,
      width: 1680,
      height: 560,
      label: 'Upper speaker/content zone',
      notes: 'Keep primary footage in the upper/main area.',
    },
    animationZone: {
      x: 180,
      y: 680,
      width: 1560,
      height: 260,
      label: 'Lower animation panel',
      notes: 'Use a matching white panel for AI animation or card motion.',
    },
    captionSafeZone: {
      x: 220,
      y: 600,
      width: 1480,
      height: 150,
      label: 'Caption safe zone',
      notes: 'Avoid covering faces and avoid crowding the lower panel.',
    },
    safeMargin: 90,
    panelBackgroundColor: '#FFFFFF',
    notes: ['YouTube landscape lower-panel layout.', 'Useful for timeline cards, proof strips, and diagrams.'],
  },
  square_center_panel: {
    templateType: 'square_center_panel',
    aspectRatio: '1:1',
    canvasWidth: 1080,
    canvasHeight: 1080,
    animationZone: {
      x: 150,
      y: 150,
      width: 780,
      height: 620,
      label: 'Centered animation panel',
      notes: 'Generate the visual on a centered white panel.',
    },
    captionSafeZone: {
      x: 120,
      y: 780,
      width: 840,
      height: 170,
      label: 'Lower caption safe zone',
      notes: 'Keep captions inside lower safe area.',
    },
    safeMargin: 80,
    panelBackgroundColor: '#FFFFFF',
    notes: ['Square centered-panel layout.', 'Works for cards, lists, proof visuals, and short story beats.'],
  },
  let_ai_decide: {
    templateType: 'let_ai_decide',
    aspectRatio: 'let_ai_decide',
    canvasWidth: 1080,
    canvasHeight: 1920,
    speakerZone: {
      x: 90,
      y: 120,
      width: 900,
      height: 980,
      label: 'Default speaker zone',
      notes: 'Safe default until the planner chooses a ratio-specific template.',
    },
    animationZone: {
      x: 90,
      y: 1160,
      width: 900,
      height: 540,
      label: 'Default lower animation panel',
      notes: 'Defaults to the vertical lower-panel pattern.',
    },
    captionSafeZone: {
      x: 120,
      y: 1040,
      width: 840,
      height: 260,
      label: 'Default caption safe zone',
      notes: 'Avoid face and platform UI areas.',
    },
    safeMargin: 90,
    panelBackgroundColor: '#FFFFFF',
    notes: ['Planner should resolve this to a concrete ratio-specific template before generation.'],
  },
}

export function getFrameLayoutTemplate(templateType: FrameTemplateType) {
  return frameLayoutTemplates[templateType]
}

export function getDefaultFrameTemplateForAspectRatio(aspectRatio: AspectRatio) {
  if (aspectRatio === '16:9') {
    return frameLayoutTemplates.youtube_side_panel
  }

  if (aspectRatio === '1:1') {
    return frameLayoutTemplates.square_center_panel
  }

  return frameLayoutTemplates.vertical_talking_head_lower_panel
}
