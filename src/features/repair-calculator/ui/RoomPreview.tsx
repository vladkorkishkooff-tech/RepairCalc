import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { getPackageLabel } from '../../../shared/config/pricing'
import {
  getVisualPresetDescription,
  getVisualPresetLabel,
  roomPreviewAssets,
} from '../../../shared/config/visual-preview'
import type {
  PackageType,
  VisualPresetType,
} from '../../../shared/contracts/estimate'

type RoomPreviewProps = {
  packageType: PackageType
  visualPreset: VisualPresetType
}

const DRAG_MIN = 6
const DRAG_MAX = 94
const DEFAULT_COMPARE = 56

export function RoomPreview({
  packageType,
  visualPreset,
}: RoomPreviewProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const timeoutsRef = useRef<number[]>([])

  const [sliderPercent, setSliderPercent] = useState(DEFAULT_COMPARE)
  const [isDragging, setIsDragging] = useState(false)
  const [failedSceneKey, setFailedSceneKey] = useState<string | null>(null)

  const packageLabel = getPackageLabel(packageType)
  const presetLabel = getVisualPresetLabel(visualPreset)
  const sceneAsset = roomPreviewAssets.scenes[packageType][visualPreset]
  const sceneKey = `${packageType}:${visualPreset}:${sceneAsset.src}`
  const sceneLabel = `${packageLabel} · ${presetLabel}`
  const isBeforeSelected = sliderPercent >= 50
  const revealClip = `inset(0 ${100 - sliderPercent}% 0 0 round 0px)`
  const hasPreviewError = failedSceneKey === sceneKey
  const sceneStyle = { backgroundImage: `url("${sceneAsset.src}")` }

  useEffect(() => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    timeoutsRef.current = [
      window.setTimeout(() => setSliderPercent(DEFAULT_COMPARE), 0),
      window.setTimeout(() => setSliderPercent(18), 80),
      window.setTimeout(() => setSliderPercent(84), 430),
      window.setTimeout(() => setSliderPercent(DEFAULT_COMPARE), 900),
    ]

    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutsRef.current = []
    }
  }, [sceneAsset.src])

  function updateSlider(nextClientX: number) {
    const rect = stageRef.current?.getBoundingClientRect()

    if (!rect || rect.width === 0) {
      return
    }

    const percent = ((nextClientX - rect.left) / rect.width) * 100
    const safePercent = Math.min(DRAG_MAX, Math.max(DRAG_MIN, percent))

    setSliderPercent(safePercent)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'touch') {
      return
    }

    activePointerIdRef.current = event.pointerId
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateSlider(event.clientX)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isDragging || activePointerIdRef.current !== event.pointerId) {
      return
    }

    updateSlider(event.clientX)
  }

  function finishDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    activePointerIdRef.current = null
    setIsDragging(false)
  }

  function showBefore() {
    setSliderPercent(DRAG_MAX)
  }

  function showAfter() {
    setSliderPercent(DRAG_MIN)
  }

  return (
    <section className="rc-room-preview">
      <div
        ref={stageRef}
        className="rc-preview-stage"
        aria-label="Визуальный предпросмотр комнаты"
      >
        {hasPreviewError ? (
          <div className="rc-preview-fallback">
            <strong>{sceneLabel}</strong>
            <span>{getVisualPresetDescription(visualPreset)}</span>
          </div>
        ) : (
          <>
            <img
              src={sceneAsset.src}
              alt=""
              className="rc-preview-preload"
              aria-hidden="true"
              loading="eager"
              decoding="async"
              onError={() => setFailedSceneKey(sceneKey)}
              onLoad={() => {
                if (failedSceneKey === sceneKey) {
                  setFailedSceneKey(null)
                }
              }}
            />
            <div
              className="rc-preview-layer rc-preview-layer--after"
              style={sceneStyle}
              aria-label="Комната после ремонта"
            />

            <motion.div
              className="rc-preview-after"
              animate={{ clipPath: revealClip }}
              transition={{
                duration: isDragging ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={sceneAsset.src}
                  className="rc-preview-layer rc-preview-layer--before"
                  style={sceneStyle}
                  aria-label="Комната до ремонта"
                  initial={{ opacity: 0.72, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.72, scale: 0.985 }}
                  transition={{ duration: 0.36, ease: 'easeOut' }}
                />
              </AnimatePresence>
            </motion.div>

            <div className="rc-preview-topline">
              <span className="rc-preview-pill">До</span>
              <span className="rc-preview-pill">После</span>
            </div>

            <div className="rc-preview-bottomline">
              <div className="rc-preview-room">{roomPreviewAssets.roomLabel}</div>
              <div
                className="rc-preview-selection"
                aria-label="Выбранный визуальный сценарий"
              >
                {sceneLabel}
              </div>
              <small>{getVisualPresetDescription(visualPreset)}</small>
            </div>

            <motion.button
              type="button"
              className="rc-preview-handle"
              aria-label="Сравнить до и после"
              style={{ left: `${sliderPercent}%` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              animate={{ left: `${sliderPercent}%` }}
              transition={{
                duration: isDragging ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="rc-preview-handle-line" />
              <span className="rc-preview-handle-knob" />
            </motion.button>
          </>
        )}
      </div>

      <div className="rc-preview-mobile-toggle" role="group" aria-label="Режим предпросмотра">
        <button
          type="button"
          className={isBeforeSelected ? 'is-active' : undefined}
          aria-pressed={isBeforeSelected}
          onClick={showBefore}
        >
          До
        </button>
        <button
          type="button"
          className={!isBeforeSelected ? 'is-active' : undefined}
          aria-pressed={!isBeforeSelected}
          onClick={showAfter}
        >
          После
        </button>
      </div>
    </section>
  )
}
