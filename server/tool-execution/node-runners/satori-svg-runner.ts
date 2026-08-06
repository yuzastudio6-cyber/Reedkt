import satori from 'satori'

import { createOfflineNodeRunnerResult } from './offline-node-runner-artifacts'
import {
  awaitWithOfflineDeadline,
  createOfflineNodeRunnerDeadline,
  themeTokens,
  validateSatoriCardInput,
} from './offline-node-runner-security'
import type { OfflineNodeRunnerResult } from './offline-node-runner-types'

export async function runOfflineSatoriSvgOperation(input: unknown): Promise<OfflineNodeRunnerResult> {
  const deadline = createOfflineNodeRunnerDeadline()
  const request = validateSatoriCardInput(input)
  const tokens = themeTokens(request.theme)
  deadline.assertWithin('Satori input and font validation')
  const fontData = new Uint8Array(request.font.bytes).buffer
  const element = {
    type: 'div',
    props: {
      style: {
        width: `${request.width}px`,
        height: `${request.height}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: tokens.background,
        color: tokens.foreground,
        padding: '28px 32px',
        border: `1px solid ${tokens.grid}`,
        borderRadius: '18px',
        fontFamily: request.font.family,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    color: tokens.accent,
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  },
                  children: request.eyebrow,
                },
              },
              {
                type: 'div',
                props: {
                  style: { color: tokens.foreground, fontSize: '28px', fontWeight: 700, lineHeight: 1.12 },
                  children: request.title,
                },
              },
              {
                type: 'div',
                props: {
                  style: { color: tokens.muted, fontSize: '15px', fontWeight: 400, lineHeight: 1.4 },
                  children: request.body,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              alignSelf: 'flex-start',
              display: 'flex',
              backgroundColor: tokens.accent,
              color: request.theme === 'dark' ? '#111318' : '#ffffff',
              borderRadius: '999px',
              padding: '7px 13px',
              fontSize: '13px',
              fontWeight: 700,
            },
            children: request.callout,
          },
        },
      ],
    },
  } as unknown as Parameters<typeof satori>[0]
  const svg = await awaitWithOfflineDeadline(
    satori(element, {
      width: request.width,
      height: request.height,
      fonts: [{
        name: request.font.family,
        data: fontData,
        weight: 400,
        style: 'normal',
      }, {
        name: request.font.family,
        data: fontData,
        weight: 700,
        style: 'normal',
      }],
    }),
    deadline,
    'Satori SVG render',
  )
  deadline.assertWithin('Satori SVG verification handoff')
  return createOfflineNodeRunnerResult({
    toolId: 'satori',
    packageName: 'satori',
    invokedEntrypoints: ['satori.default'],
    sourceInput: request,
    svg,
    elapsedMilliseconds: deadline.elapsedMilliseconds(),
    normalizedForDeterminism: false,
    expectedWidth: request.width,
    expectedHeight: request.height,
    minimumPathElements: 4,
  })
}
