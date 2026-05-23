import React from 'react'
import { AbsoluteFill, Composition, OffthreadVideo, registerRoot, useCurrentFrame } from 'remotion'
import {
  STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_COMPOSITION_ID,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_COMPOSITION_ID,
} from './staging-canary-constants'

function TinyMutedCanary(props: Record<string, unknown>) {
  const smokeRunId = typeof props.smokeRunId === 'string'
    ? props.smokeRunId
    : 'rp-e2e-smoke-00000000-0000-4000-8000-000000000000'
  const frame = useCurrentFrame()
  const barWidth = 24 + (frame % 45) * 2

  return React.createElement(
    AbsoluteFill,
    {
      style: {
        backgroundColor: '#101820',
        color: '#f4f7fb',
        fontFamily: 'Arial, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      },
    },
    React.createElement('div', {
      style: {
        position: 'absolute',
        inset: 10,
        border: '1px solid rgba(244, 247, 251, 0.28)',
      },
    }),
    React.createElement('div', {
      style: {
        width: barWidth,
        height: 10,
        borderRadius: 2,
        backgroundColor: '#61d394',
        boxShadow: '0 0 12px rgba(97, 211, 148, 0.55)',
      },
    }),
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 8,
          fontSize: 5,
          letterSpacing: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: 0.72,
        },
      },
      smokeRunId,
    ),
  )
}

function TinyUploadedSourcePreview(props: Record<string, unknown>) {
  const smokeRunId = typeof props.smokeRunId === 'string'
    ? props.smokeRunId
    : 'rp-e2e-smoke-00000000-0000-4000-8000-000000000000'
  const sourceDataUrl = typeof props.sourceDataUrl === 'string' ? props.sourceDataUrl : ''

  return React.createElement(
    AbsoluteFill,
    {
      style: {
        backgroundColor: '#080b10',
        color: '#f4f7fb',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
      },
    },
    sourceDataUrl
      ? React.createElement(OffthreadVideo, {
        src: sourceDataUrl,
        muted: true,
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        },
      })
      : React.createElement('div', {
        style: {
          width: '100%',
          height: '100%',
          backgroundColor: '#101820',
        },
      }),
    React.createElement('div', {
      style: {
        position: 'absolute',
        inset: 7,
        border: '1px solid rgba(244, 247, 251, 0.42)',
      },
    }),
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 6,
          padding: '2px 3px',
          backgroundColor: 'rgba(8, 11, 16, 0.58)',
          fontSize: 5,
          letterSpacing: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      },
      smokeRunId,
    ),
  )
}

function RemotionRoot() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, {
      id: STAGING_RENDER_INFRASTRUCTURE_CANARY_COMPOSITION_ID,
      component: TinyMutedCanary,
      width: 160,
      height: 90,
      fps: 15,
      durationInFrames: 45,
      defaultProps: {
        smokeRunId: 'rp-e2e-smoke-00000000-0000-4000-8000-000000000000',
      },
    }),
    React.createElement(Composition, {
      id: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_COMPOSITION_ID,
      component: TinyUploadedSourcePreview,
      width: 160,
      height: 90,
      fps: 15,
      durationInFrames: 45,
      defaultProps: {
        smokeRunId: 'rp-e2e-smoke-00000000-0000-4000-8000-000000000000',
        sourceDataUrl: '',
      },
    }),
  )
}

registerRoot(RemotionRoot)
