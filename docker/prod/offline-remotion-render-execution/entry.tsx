import React from 'react'
import { Composition, registerRoot } from 'remotion'

import { ApprovedComposition, defaultApprovedCompositionProps } from './composition'

const Root: React.FC = () => (
  <Composition
    id="ReeditProApprovedComposition"
    component={ApprovedComposition}
    durationInFrames={defaultApprovedCompositionProps.durationFrames}
    fps={defaultApprovedCompositionProps.fps}
    width={defaultApprovedCompositionProps.width}
    height={defaultApprovedCompositionProps.height}
    defaultProps={defaultApprovedCompositionProps}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.durationFrames,
      fps: props.fps,
      width: props.width,
      height: props.height,
    })}
  />
)

registerRoot(Root)
