import { z } from 'zod'

import type { EditSkillArtifactReference } from '../../core/edit-skill-artifact-store'
import {
  canonicalSkillJson,
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import {
  projectTrackGraphV1,
  trackGraphV2Schema,
} from '../../shared/track-graph/track-graph-schemas'
import {
  cameraMotionGraphSchema,
  planarTrackGraphSchema,
  trackAllCrossSkillHandoffSchema,
  trackAnchorGraphSchema,
  trackBoxSequenceSchema,
  trackMaskSequenceSchema,
} from '../track-all-active-artifact-contracts'

const inputSchema = z.object({
  trackGraph: trackGraphV2Schema,
  boxSequences: z.array(trackBoxSequenceSchema).max(10_000),
  maskSequences: z.array(trackMaskSequenceSchema).max(10_000),
  anchorGraphs: z.array(trackAnchorGraphSchema).max(10_000),
  cameraMotionGraph: cameraMotionGraphSchema.optional(),
  planarTrackGraphs: z.array(planarTrackGraphSchema).max(10_000),
}).strict()

export type TrackAllHandoffConsumer =
  | 'b_roll'
  | 'captions'
  | 'graphic_design'
  | 'living_frame'
  | 'three_d'
  | 'color'
  | 'sound'
  | 'transition'
  | 'render'

export function compileTrackAllCrossSkillHandoffs(
  input: z.input<typeof inputSchema>,
): Readonly<Record<TrackAllHandoffConsumer, z.infer<typeof trackAllCrossSkillHandoffSchema>>> {
  const parsed = inputSchema.parse(input)
  assertAuthorities(parsed)
  const graph = parsed.trackGraph
  const v1 = projectTrackGraphV1(graph)
  const trackGraphV1Ref = referenceFor('track_graph_v1', hashSkillValue(v1), graph)
  const trackGraphV2Ref = referenceFor('track_graph_v2', graph.graphHash, graph)
  const maskRefs = parsed.maskSequences.map((sequence) =>
    referenceFor('track_mask_sequence_v1', sequence.artifactHash, sequence))
  const anchorGraphRefs = parsed.anchorGraphs.map((anchor) =>
    referenceFor('track_anchor_graph_v1', anchor.artifactHash, anchor))
  const planarTrackRefs = parsed.planarTrackGraphs.map((planar) =>
    referenceFor('planar_track_graph_v1', planar.artifactHash, planar))
  const cameraMotionRef = parsed.cameraMotionGraph
    ? referenceFor('camera_motion_graph_v1', parsed.cameraMotionGraph.artifactHash, parsed.cameraMotionGraph)
    : undefined
  const base = {
    schemaVersion: 'track_all_cross_skill_handoff_v1' as const,
    ownerUserId: graph.ownerUserId,
    workspaceId: graph.workspaceId,
    projectId: graph.projectId,
    editSessionId: graph.editSessionId,
    assignmentId: graph.assignmentId,
    assignmentHash: graph.assignmentHash,
    planHash: graph.planHash,
    manifestRef: graph.manifestRef,
    sourceSha256: graph.sourceSha256,
    authorizedRange: graph.authorizedRange,
    trackGraphV2Ref,
    maskRefs,
    anchorGraphRefs,
    ...(cameraMotionRef ? { cameraMotionRef } : {}),
    planarTrackRefs,
    geometryOnly: true as const,
    finalPeerDesignOwnedByTrackAll: false as const,
  }
  const trackIds = graph.tracks.map((track) => track.trackId)
  const people = graph.tracks.filter((track) =>
    ['person', 'face', 'speaker', 'presenter'].includes(track.semanticClass))
    .map((track) => track.trackId)
  const anchors = parsed.anchorGraphs.flatMap((value) => value.anchors)
    .filter((value) => value.visibility === 'visible')
    .map((value) => value.anchorId)
  const enterExitFrames = uniqueSorted(graph.tracks.flatMap((track) => [
    track.startFrameInclusive,
    track.endFrameExclusive - 1,
  ]))
  const movementCueFrames = movementFrames(parsed.boxSequences)
  const interactionFrames = interactionFramesFromBoxes(parsed.boxSequences)
  const sceneBoundaryFrames = uniqueSorted(graph.shots.slice(1).map((shot) =>
    shot.range.startFrameInclusive))
  const edgeFrames = naturalWipeFrames(parsed.boxSequences)
  const create = (
    consumerSkillKey: TrackAllHandoffConsumer,
    geometryPayload: z.input<typeof trackAllCrossSkillHandoffSchema>['geometryPayload'],
    includeV1 = false,
  ) => {
    const core = {
      ...base,
      consumerSkillKey,
      ...(includeV1 ? { trackGraphV1Ref } : {}),
      geometryPayload,
    }
    return trackAllCrossSkillHandoffSchema.parse({
      ...core,
      artifactHash: hashSkillValue(core),
    })
  }
  return deepFreezeSkillValue({
    b_roll: create('b_roll', {
      handoffKind: 'b_roll',
      speakerSafeTrackIds: people,
      insetSafeRegionStrategy: 'avoid_active_primary_subject_bounds',
      cropGuidance: 'use_track_graph_v1_or_v2_authorized_geometry',
    }, true),
    captions: create('captions', {
      handoffKind: 'captions',
      foregroundTrackIds: graph.tracks.filter((track) => track.depthOrder > 0)
        .map((track) => track.trackId),
      behindSubjectTrackIds: graph.tracks.filter((track) => track.maskSequenceRef)
        .map((track) => track.trackId),
      faceSafeTrackIds: people,
      occlusionOrderPolicy: 'captions_resolve_design_track_all_supplies_geometry',
    }),
    graphic_design: create('graphic_design', {
      handoffKind: 'graphic_design',
      stableAnchorIds: uniqueStrings(anchors),
      leaderLinePolicy: 'anchor_to_visible_track_only',
      objectTrajectoryAvailable: parsed.boxSequences.length > 0,
    }),
    living_frame: create('living_frame', {
      handoffKind: 'living_frame',
      subjectTrackIds: trackIds,
      depthOrderTrackIds: [...graph.tracks]
        .sort((left, right) => left.depthOrder - right.depthOrder)
        .map((track) => track.trackId),
      foregroundOccluderTrackIds: graph.tracks.filter((track) => track.depthOrder > 0)
        .map((track) => track.trackId),
      cameraTransformAvailable: Boolean(cameraMotionRef),
    }),
    three_d: create('three_d', {
      handoffKind: 'three_d',
      planarSurfaceIds: parsed.planarTrackGraphs.map((value) => value.surfaceId),
      occlusionTrackIds: graph.tracks.filter((track) => track.maskSequenceRef)
        .map((track) => track.trackId),
      cameraTransformAvailable: Boolean(cameraMotionRef),
      scaleCuePolicy: 'derive_from_planar_and_camera_geometry',
    }),
    color: create('color', {
      handoffKind: 'color',
      selectiveColorTrackIds: graph.tracks.filter((track) => track.maskSequenceRef)
        .map((track) => track.trackId),
      skinProtectionTrackIds: people,
      finalSelectiveColorOwnedByTrackAll: false,
    }),
    sound: create('sound', {
      handoffKind: 'sound',
      interactionFrames,
      enterExitFrames,
      movementCueFrames,
      finalSoundOwnedByTrackAll: false,
    }),
    transition: create('transition', {
      handoffKind: 'transition',
      foregroundOccluderTrackIds: graph.tracks.filter((track) =>
        track.depthOrder > 0 && track.maskSequenceRef).map((track) => track.trackId),
      naturalWipeCandidateFrames: edgeFrames,
      sceneBoundaryFrames,
      finalTransitionOwnedByTrackAll: false,
    }),
    render: create('render', {
      handoffKind: 'render',
      layerOrder: ['source', 'track_all_treatment', 'peer_visuals', 'captions'],
      exactFrameRangeRequired: true,
      privateMaskResolutionRequired: true,
      finalRenderOwnedByTrackAll: false,
    }),
  })
}

function assertAuthorities(input: z.infer<typeof inputSchema>): void {
  const graph = input.trackGraph
  const all = [
    ...input.boxSequences,
    ...input.maskSequences,
    ...input.anchorGraphs,
    ...input.planarTrackGraphs,
    ...(input.cameraMotionGraph ? [input.cameraMotionGraph] : []),
  ]
  if (all.some((artifact) =>
    artifact.ownerUserId !== graph.ownerUserId ||
    artifact.workspaceId !== graph.workspaceId ||
    artifact.projectId !== graph.projectId ||
    artifact.editSessionId !== graph.editSessionId ||
    artifact.assignmentId !== graph.assignmentId ||
    artifact.assignmentHash !== graph.assignmentHash ||
    artifact.planHash !== graph.planHash ||
    artifact.sourceSha256 !== graph.sourceSha256 ||
    canonicalSkillJson(artifact.authorizedRange) !== canonicalSkillJson(graph.authorizedRange))) {
    throw new Error('Cross-skill geometry artifact lineage differs from Track Graph V2.')
  }
  uniqueRole(input.boxSequences.map((value) => value.trackId), 'box sequence')
  uniqueRole(input.maskSequences.map((value) => value.trackId), 'mask sequence')
  for (const track of graph.tracks) {
    const box = input.boxSequences.find((value) => value.trackId === track.trackId)
    if (!box || hashSkillValue(box) !== track.boxSequenceRef.sha256) {
      throw new Error(`Cross-skill track ${track.trackId} lacks its exact box sequence.`)
    }
    if (track.maskSequenceRef) {
      const mask = input.maskSequences.find((value) => value.trackId === track.trackId)
      if (!mask || hashSkillValue(mask) !== track.maskSequenceRef.sha256) {
        throw new Error(`Cross-skill track ${track.trackId} lacks its exact private mask manifest.`)
      }
    }
    if (track.anchorGraphRef) {
      const anchor = input.anchorGraphs.find((value) =>
        hashSkillValue(value) === track.anchorGraphRef?.sha256)
      if (!anchor) throw new Error(`Cross-skill track ${track.trackId} lacks its exact anchor graph.`)
    }
    if (track.planarGeometryRef) {
      const planar = input.planarTrackGraphs.find((value) =>
        hashSkillValue(value) === track.planarGeometryRef?.sha256)
      if (!planar) throw new Error(`Cross-skill track ${track.trackId} lacks its exact planar graph.`)
    }
  }
  if (
    graph.cameraMotionRef &&
    hashSkillValue(input.cameraMotionGraph) !== graph.cameraMotionRef.sha256
  ) throw new Error('Cross-skill camera motion graph does not match Track Graph V2.')
}

function movementFrames(sequences: z.infer<typeof trackBoxSequenceSchema>[]): number[] {
  const frames: number[] = []
  for (const sequence of sequences) {
    for (let index = 1; index < sequence.boxes.length; index += 1) {
      const previous = sequence.boxes[index - 1]!
      const current = sequence.boxes[index]!
      const distance = Math.hypot(
        center(current.box).x - center(previous.box).x,
        center(current.box).y - center(previous.box).y,
      )
      if (distance >= 0.012) frames.push(current.frameIndex)
    }
  }
  return uniqueSorted(frames)
}

function interactionFramesFromBoxes(
  sequences: z.infer<typeof trackBoxSequenceSchema>[],
): number[] {
  const frames = new Set<number>()
  for (let left = 0; left < sequences.length; left += 1) {
    const rightByFrame = sequences.slice(left + 1).map((sequence) =>
      new Map(sequence.boxes.map((sample) => [sample.frameIndex, sample.box])))
    for (const sample of sequences[left]!.boxes) {
      if (rightByFrame.some((values) => {
        const right = values.get(sample.frameIndex)
        return right ? intersectionArea(sample.box, right) >= 0.0025 : false
      })) frames.add(sample.frameIndex)
    }
  }
  return [...frames].sort((left, right) => left - right)
}

function naturalWipeFrames(sequences: z.infer<typeof trackBoxSequenceSchema>[]): number[] {
  return uniqueSorted(sequences.flatMap((sequence) => sequence.boxes
    .filter((sample) =>
      sample.box.x <= 0.08 || sample.box.y <= 0.08 ||
      sample.box.x + sample.box.width >= 0.92 ||
      sample.box.y + sample.box.height >= 0.92)
    .map((sample) => sample.frameIndex)))
}

function intersectionArea(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): number {
  const width = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x))
  const height = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y))
  return width * height
}

function center(box: { x: number; y: number; width: number; height: number }) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

function uniqueSorted(values: readonly number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right)
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function uniqueRole(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} role.`)
}

function referenceFor(
  artifactType: string,
  sha256: string,
  value: { ownerUserId: string; workspaceId: string; projectId: string },
): EditSkillArtifactReference {
  return {
    artifactType,
    sha256,
    byteLength: Buffer.byteLength(canonicalSkillJson(value)),
    ownerUserId: value.ownerUserId,
    workspaceId: value.workspaceId,
    projectId: value.projectId,
  }
}
