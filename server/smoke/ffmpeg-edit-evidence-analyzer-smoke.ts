import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  analyzeEditAudioEvidence,
  analyzeEditColorEvidence,
  analyzeEditVisualRhythmEvidence,
} from '../workers/media/ffmpeg-edit-evidence-analyzer'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-edit-evidence-'))
const videoPath = path.join(root, 'measured-source.mp4')
const audioPath = path.join(root, 'measured-source.wav')
const ffmpegBin = process.env.FFMPEG_BIN?.trim() || 'ffmpeg'

try {
  execFileSync(ffmpegBin, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=0x182131:s=320x568:r=30:d=2',
    '-f', 'lavfi', '-i', 'color=c=0x9b2743:s=320x568:r=30:d=2',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=4',
    '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v];[2:a]volume=0.12[a]',
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest',
    videoPath,
  ], { stdio: 'pipe' })
  execFileSync(ffmpegBin, [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', videoPath, '-vn', '-acodec', 'pcm_s16le', audioPath,
  ], { stdio: 'pipe' })

  const [audio, rhythm, color] = await Promise.all([
    analyzeEditAudioEvidence({ sourceAudioLocalPath: audioPath, audioRequired: true, ffmpegBin, timeoutMs: 60_000 }),
    analyzeEditVisualRhythmEvidence({ sourceVideoLocalPath: videoPath, durationSeconds: 4, ffmpegBin, timeoutMs: 60_000, sceneThreshold: 0.2 }),
    analyzeEditColorEvidence({ sourceVideoLocalPath: videoPath, ffmpegBin, timeoutMs: 60_000 }),
  ])

  assert.equal(audio.status, 'completed', JSON.stringify(audio))
  assert.equal(typeof audio.integratedLufs, 'number')
  assert.equal(typeof audio.truePeakDb, 'number')
  assert.ok(audio.analysisMethods.includes('ffmpeg_loudnorm_measurement'))
  assert.equal(rhythm.status, 'completed', JSON.stringify(rhythm))
  assert.ok(rhythm.detectedCutCount >= 1, JSON.stringify(rhythm))
  assert.ok(rhythm.detectedCutTimesSeconds.some((value) => value >= 1.8 && value <= 2.2), JSON.stringify(rhythm))
  assert.equal(color.status, 'completed', JSON.stringify(color))
  assert.ok(color.sampledFrameCount >= 2)
  assert.equal(typeof color.averageLuma, 'number')

  console.log(JSON.stringify({
    ok: true,
    decision: 'ffmpeg_edit_evidence_measurements_passed',
    audio: { integratedLufs: audio.integratedLufs, truePeakDb: audio.truePeakDb, silenceRangeCount: audio.silenceRanges.length },
    rhythm: { detectedCutCount: rhythm.detectedCutCount, averageShotDurationSeconds: rhythm.averageShotDurationSeconds, pacingClass: rhythm.pacingClass },
    color: { sampledFrameCount: color.sampledFrameCount, averageLuma: color.averageLuma, exposureCondition: color.exposureCondition, contrastCondition: color.contrastCondition },
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}
