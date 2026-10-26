import { Canvas, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { gsap } from 'gsap'
import {
  ArrowRight,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  MathUtils,
  MeshStandardMaterial,
  Points,
  PointLight,
} from 'three'

type CakePhase =
  | 'ready'
  | 'wished'
  | 'blowing'
  | 'celebrated'
  | 'knife-ready'
  | 'knife-picked'
  | 'cutting'
  | 'finale'
type AudioState = 'checking' | 'missing' | 'available' | 'playing' | 'paused' | 'error'

interface CakeExperienceProps {
  motionScale: number
  onNext: () => void
}

const MUSIC_SOURCE = '/audio/birthdayverse-theme.mp3'
const candlePositions = [-1.18, -0.61, 0, 0.61, 1.18] as const
const cakeColors = ['#f4a6d4', '#c4a8f3', '#f2ce91', '#9b88e9', '#f7b6ce']

function makeConfettiGeometry() {
  const count = 150
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const palette = ['#f3b6dc', '#e5c0ff', '#f4d18c', '#9dddf4', '#c4b1ff']
    .map((color) => new Color(color))

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 10
    positions[index * 3 + 1] = Math.random() * 8 - 4
    positions[index * 3 + 2] = (Math.random() - 0.5) * 4
    const color = palette[index % palette.length]
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

function Candle({
  index,
  position,
  extinguishing,
  motionScale,
}: {
  index: number
  position: number
  extinguishing: boolean
  motionScale: number
}) {
  const flame = useRef<Group>(null)
  const flameMaterial = useRef<MeshStandardMaterial>(null)
  const light = useRef<PointLight>(null)
  const intensity = useRef(1)

  useFrame((_, delta) => {
    if (!flame.current || !flameMaterial.current || !light.current) return

    const target = extinguishing ? 0 : 1
    intensity.current = MathUtils.damp(intensity.current, target, extinguishing ? 4 : 2, delta)
    flame.current.scale.set(1, 0.72 + intensity.current * 0.48, 1)
    flame.current.visible = intensity.current > 0.025
    flameMaterial.current.opacity = intensity.current
    light.current.intensity = intensity.current * 2.8
    flame.current.rotation.z =
      motionScale === 0
        ? 0
        : Math.sin(performance.now() * 0.008 + index) * 0.08
  })

  return (
    <group position={[position, 1.04, 0]}>
      <mesh castShadow position={[0, 0.31, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.62, 20]} />
        <meshStandardMaterial
          color={index % 2 === 0 ? '#f8e8f1' : '#f3dff3'}
          roughness={0.31}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, 0.31, 0.086]}>
        <boxGeometry args={[0.022, 0.62, 0.008]} />
        <meshBasicMaterial color={cakeColors[index]} />
      </mesh>
      <mesh position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.045, 20]} />
        <meshStandardMaterial color="#f6d5ea" roughness={0.22} />
      </mesh>
      <group ref={flame} position={[0, 0.76, 0]}>
        <mesh>
          <sphereGeometry args={[0.095, 16, 16]} />
          <meshStandardMaterial
            ref={flameMaterial}
            color="#ffd27b"
            emissive="#ff9b43"
            emissiveIntensity={2.5}
            transparent
            opacity={1}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <coneGeometry args={[0.075, 0.19, 16]} />
          <meshBasicMaterial color="#fff0ad" transparent opacity={0.95} />
        </mesh>
      </group>
      <pointLight ref={light} color="#ffc66f" intensity={2.8} distance={2.6} />
    </group>
  )
}

function CakeScene({
  extinguishing,
  phase,
  motionScale,
  compactViewport,
  cutProgress,
  onPickKnife,
  onCutProgress,
  onCutComplete,
}: {
  extinguishing: boolean
  phase: CakePhase
  motionScale: number
  compactViewport: boolean
  cutProgress: number
  onPickKnife: () => void
  onCutProgress: (progress: number) => void
  onCutComplete: () => void
}) {
  const cake = useRef<Group>(null)
  const slice = useRef<Group>(null)
  const knife = useRef<Group>(null)
  const confetti = useRef<Points>(null)
  const dragRef = useRef<{ pointerId: number; startY: number; lastY: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const confettiGeometry = useMemo(() => makeConfettiGeometry(), [])
  useEffect(() => () => confettiGeometry.dispose(), [confettiGeometry])
  const isParty = phase === 'finale'
  const isKnifeVisible = phase === 'knife-ready'
    || phase === 'knife-picked'
    || phase === 'cutting'
    || phase === 'finale'

  useFrame(({ clock, camera }, delta) => {
    const time = clock.elapsedTime * motionScale

    if (cake.current && motionScale > 0) {
      const canFloat = phase === 'ready' || phase === 'wished' || phase === 'blowing'
      cake.current.position.y = canFloat ? -0.92 + Math.sin(time * 0.6) * 0.07 : -0.92
      cake.current.rotation.y = canFloat ? Math.sin(time * 0.17) * 0.12 : 0
      cake.current.rotation.x = canFloat ? Math.sin(time * 0.2) * 0.035 : 0
    }

    const targetCameraZ = phase === 'cutting' || isParty ? 7.5 : extinguishing ? 7.05 : 8.4
    if (motionScale > 0) {
      camera.position.z = MathUtils.damp(camera.position.z, targetCameraZ, 1.15, delta)
    }
    const knifeScene = phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting'
    camera.lookAt(
      0,
      compactViewport
        ? knifeScene ? 0.35 : phase === 'celebrated' ? 0.35 : -0.15
          : knifeScene ? 0.65 : -0.45,
      0,
    )

    if (knife.current) {
      const start: [number, number, number] = phase === 'knife-ready'
        ? [compactViewport ? 0.45 : 2.2, 0.35, 1.7]
        : [compactViewport ? 0.35 : 0.05, 0.3 - cutProgress * 1.05, 2.08]
      const visible = isKnifeVisible
      knife.current.visible = visible
      if (visible && motionScale > 0) {
        knife.current.position.x = MathUtils.damp(knife.current.position.x, start[0], 5, delta)
        knife.current.position.y = MathUtils.damp(knife.current.position.y, start[1], 5, delta)
        knife.current.position.z = MathUtils.damp(knife.current.position.z, start[2], 5, delta)
        knife.current.rotation.z = MathUtils.damp(
          knife.current.rotation.z,
          phase === 'knife-ready' ? -0.66 : -0.12,
          5,
          delta,
        )
        if (phase === 'cutting') knife.current.rotation.x = MathUtils.damp(knife.current.rotation.x, 0.38, 4, delta)
        else knife.current.rotation.x = MathUtils.damp(knife.current.rotation.x, 0, 4, delta)
      } else if (visible) {
        knife.current.position.set(...start)
        knife.current.rotation.set(0, 0, phase === 'knife-ready' ? -0.66 : -0.12)
      }
    }

    if (slice.current) {
      const separated = isParty
      const targetZ = separated ? 0.82 : 0
      const targetY = separated ? 0.18 : 0
      if (motionScale > 0) {
        slice.current.position.z = MathUtils.damp(slice.current.position.z, targetZ, 3.2, delta)
        slice.current.position.y = MathUtils.damp(slice.current.position.y, targetY, 3.2, delta)
      } else {
        slice.current.position.set(0, targetY, targetZ)
      }
    }

    if (confetti.current && (phase === 'celebrated' || phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting' || isParty) && motionScale > 0) {
      const attribute = confetti.current.geometry.getAttribute('position')
      const array = attribute.array as Float32Array
      for (let index = 0; index < array.length; index += 3) {
        array[index + 1] -= delta * (0.45 + (index % 7) * 0.08) * motionScale
        array[index] += Math.sin(time + index) * delta * 0.08
        if (array[index + 1] < -4.2) array[index + 1] = 4.2
      }
      attribute.needsUpdate = true
      confetti.current.rotation.y = Math.sin(time * 0.2) * 0.08
    }
  })

  function startDrag(event: ThreeEvent<PointerEvent>) {
    if (phase !== 'knife-picked') return
    event.stopPropagation()
    const pointer = event.nativeEvent
    dragRef.current = { pointerId: pointer.pointerId, startY: pointer.clientY, lastY: pointer.clientY }
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    function movePointer(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      drag.lastY = event.clientY
      onCutProgress(MathUtils.clamp((event.clientY - drag.startY) / 104, 0, 1))
    }

    function finishPointer(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      const distance = drag.lastY - drag.startY
      dragRef.current = null
      setIsDragging(false)
      if (distance >= 62) onCutComplete()
      else onCutProgress(0)
    }

    window.addEventListener('pointermove', movePointer)
    window.addEventListener('pointerup', finishPointer)
    window.addEventListener('pointercancel', finishPointer)
    return () => {
      window.removeEventListener('pointermove', movePointer)
      window.removeEventListener('pointerup', finishPointer)
      window.removeEventListener('pointercancel', finishPointer)
    }
  }, [isDragging, onCutComplete, onCutProgress])

  return (
    <>
      <ambientLight intensity={0.7} color="#d8c9ff" />
      <hemisphereLight args={['#f8d9f3', '#33203f', 1.1]} />
      <spotLight
        position={[-3.5, 6, 5]}
        angle={0.52}
        penumbra={0.8}
        intensity={isParty ? 58 : phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting' ? 66 : phase === 'celebrated' ? 58 : 38}
        color={isParty || phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting' ? '#ffd68a' : '#e8b7ff'}
        castShadow
      />
      {(phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting') && (
        <spotLight
          position={[1.8, 5.3, 3.5]}
          angle={0.27}
          penumbra={0.9}
          intensity={42}
          color="#ffe7aa"
        />
      )}
      <pointLight
        position={[3.5, 1.2, 3]}
        intensity={isParty ? 24 : 12}
        color={isParty ? '#ff9fbf' : '#a697ff'}
        distance={11}
      />

      <group ref={cake} position={[0, -0.92, 0]}>
        <group position={[0, -0.22, 0]}>
          <mesh receiveShadow castShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[2.05, 2.12, 0.3, 80]} />
            <meshStandardMaterial color="#e8b67b" roughness={0.42} />
          </mesh>
          <mesh receiveShadow castShadow position={[0, 0.42, 0]}>
            <cylinderGeometry args={[1.78, 1.86, 1.05, 80]} />
            <meshPhysicalMaterial
              color="#e9a6c9"
              roughness={0.28}
              metalness={0.03}
              clearcoat={0.7}
              clearcoatRoughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.97, 0]}>
            <cylinderGeometry args={[1.84, 1.82, 0.13, 80]} />
            <meshPhysicalMaterial color="#fff0e8" roughness={0.22} clearcoat={0.8} />
          </mesh>
          <mesh position={[0, 1.04, 0]}>
            <cylinderGeometry args={[1.82, 1.82, 0.06, 80]} />
            <meshStandardMaterial color="#fff0e8" roughness={0.25} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <cylinderGeometry args={[1.2, 1.25, 0.83, 72]} />
            <meshPhysicalMaterial color="#c7a0e7" roughness={0.26} clearcoat={0.8} />
          </mesh>
          <mesh position={[0, 1.49, 0]}>
            <cylinderGeometry args={[1.28, 1.27, 0.12, 72]} />
            <meshPhysicalMaterial color="#fff1ec" roughness={0.2} clearcoat={0.9} />
          </mesh>
          {[0.01, 0.77, 1.44].map((height, tier) => (
            <mesh key={height} position={[0, height, 0]}>
              <torusGeometry
                args={[tier === 2 ? 1.26 : tier === 1 ? 1.8 : 2.04, 0.045, 10, 88]}
              />
              <meshStandardMaterial
                color={tier === 1 ? '#f7d4e9' : '#f5d69a'}
                metalness={0.35}
                roughness={0.25}
              />
            </mesh>
          ))}
          {Array.from({ length: 20 }, (_, index) => {
            const angle = (index / 20) * Math.PI * 2
            return (
              <mesh
                key={`pearl-${index}`}
                position={[Math.cos(angle) * 1.8, 0.42, Math.sin(angle) * 1.8]}
                castShadow
              >
                <sphereGeometry args={[0.064, 12, 12]} />
                <meshStandardMaterial color="#fff0dc" metalness={0.2} roughness={0.2} />
              </mesh>
            )
          })}
          {Array.from({ length: 9 }, (_, index) => {
            const angle = (index / 9) * Math.PI * 2 + 0.2
            const radius = 0.72
            return (
              <group
                key={`berry-${index}`}
                position={[Math.cos(angle) * radius, 1.59, Math.sin(angle) * radius]}
              >
                <mesh castShadow>
                  <sphereGeometry args={[0.105, 18, 18]} />
                  <meshPhysicalMaterial
                    color={index % 2 ? '#cf6b91' : '#7c456d'}
                    roughness={0.25}
                    clearcoat={0.85}
                  />
                </mesh>
                <mesh position={[0, 0.095, 0]}>
                  <sphereGeometry args={[0.045, 10, 10]} />
                  <meshBasicMaterial color="#f5d58e" />
                </mesh>
              </group>
            )
          })}
          {candlePositions.map((position, index) => (
            <Candle
              key={index}
              index={index}
              position={position}
              extinguishing={extinguishing}
              motionScale={motionScale}
            />
          ))}
          <group
            ref={slice}
            visible={phase === 'cutting' || isParty}
            position={[0, 0, 0]}
          >
            <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
              <cylinderGeometry args={[1.78, 1.86, 1.05, 24, 1, false, -0.34, 0.68]} />
              <meshPhysicalMaterial color="#d988ad" roughness={0.34} clearcoat={0.45} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[1.81, 1.86, 0.08, 24, 1, false, -0.34, 0.68]} />
              <meshStandardMaterial color="#f4d0b7" roughness={0.48} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[1.79, 1.81, 0.07, 24, 1, false, -0.34, 0.68]} />
              <meshStandardMaterial color="#fff0e8" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.65, 0]}>
              <cylinderGeometry args={[1.79, 1.81, 0.07, 24, 1, false, -0.34, 0.68]} />
              <meshStandardMaterial color="#f2b1d2" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.97, 0]}>
              <cylinderGeometry args={[1.84, 1.82, 0.13, 24, 1, false, -0.34, 0.68]} />
              <meshPhysicalMaterial color="#fff0e8" roughness={0.22} clearcoat={0.8} />
            </mesh>
          </group>
          {isParty && (
            <mesh position={[0, 1.044, 0]}>
              <cylinderGeometry args={[1.83, 1.83, 0.014, 24, 1, false, -0.34, 0.68]} />
              <meshStandardMaterial color="#493047" roughness={0.9} />
            </mesh>
          )}
          {(phase === 'cutting' || isParty) && (
            <>
              {[-0.34, 0.34].map((angle) => (
                <mesh
                  key={`cut-line-${angle}`}
                  position={[Math.sin(angle) * 0.91, 1.051, Math.cos(angle) * 0.91]}
                  rotation={[0, angle, 0]}
                >
                  <boxGeometry args={[0.025, 0.018, 1.82]} />
                  <meshBasicMaterial color="#ffe6a2" />
                </mesh>
              ))}
            </>
          )}
        </group>
      </group>

      {phase !== 'ready' && phase !== 'wished' && phase !== 'blowing' && (
        <>
          <group
            ref={knife}
            visible={false}
            onClick={(event) => {
              event.stopPropagation()
              if (phase === 'knife-ready') onPickKnife()
            }}
          >
            <mesh position={[0, 0.08, 0.12]}>
              <planeGeometry args={[0.78, 1.7]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh castShadow position={[0, 0.3, 0]}>
              <boxGeometry args={[0.16, 0.77, 0.055]} />
              <meshPhysicalMaterial
                color="#eef1f6"
                metalness={0.92}
                roughness={0.18}
                clearcoat={1}
                emissive="#f3d48c"
                emissiveIntensity={0.08}
              />
            </mesh>
            <mesh castShadow position={[0, 0.72, 0]}>
              <coneGeometry args={[0.11, 0.23, 4]} />
              <meshPhysicalMaterial color="#fff6dd" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh castShadow position={[0, -0.13, 0]}>
              <boxGeometry args={[0.35, 0.085, 0.12]} />
              <meshStandardMaterial color="#d7ae68" metalness={0.8} roughness={0.24} />
            </mesh>
            <mesh castShadow position={[0, -0.48, 0]}>
              <capsuleGeometry args={[0.105, 0.51, 5, 12]} />
              <meshPhysicalMaterial
                color="#68436e"
                metalness={0.42}
                roughness={0.26}
                clearcoat={0.8}
              />
            </mesh>
            {[-0.57, -0.38, -0.19].map((y) => (
              <mesh key={`knife-handle-${y}`} position={[0, y, 0.107]}>
                <sphereGeometry args={[0.035, 10, 10]} />
                <meshStandardMaterial color="#f0d18d" metalness={0.8} roughness={0.25} />
              </mesh>
            ))}
            <pointLight position={[0, 0.35, 0.18]} color="#ffd78a" intensity={1.7} distance={2.3} />
          </group>
          {phase === 'knife-picked' && (
            <mesh
              position={[0, -0.15, 2.05]}
              onPointerDown={startDrag}
            >
              <planeGeometry args={[3.8, 2.35]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </>
      )}

      {(phase === 'celebrated' || phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting' || isParty) && (
        <points ref={confetti} geometry={confettiGeometry}>
          <pointsMaterial
            vertexColors
            size={0.085}
            sizeAttenuation
            transparent
            opacity={0.95}
            depthWrite={false}
          />
        </points>
      )}
    </>
  )
}

const confettiPieces = Array.from({ length: 64 }, (_, index) => ({
  left: `${((index * 47) % 100)}%`,
  delay: `${(index % 13) * 0.075}s`,
  duration: `${2.4 + (index % 8) * 0.34}s`,
  drift: `${((index * 29) % 180) - 90}px`,
  color: ['#f0abd7', '#d1b7ff', '#f5d28e', '#9fdef0', '#ff9fbd'][index % 5],
  shape: index % 4 === 0 ? 'confetti-round' : 'confetti-strip',
}))

const balloonBursts = Array.from({ length: 9 }, (_, index) => ({
  left: `${8 + ((index * 37) % 84)}%`,
  delay: `${0.15 + (index % 5) * 0.43}s`,
  color: ['#ec8dbb', '#b69af5', '#f4cd83', '#8ed8e9', '#f5a2a5'][index % 5],
}))

const fireworks = [
  { left: '18%', top: '26%', delay: '0.15s', color: '#f7d58f' },
  { left: '78%', top: '22%', delay: '0.85s', color: '#e99bc9' },
  { left: '31%', top: '43%', delay: '1.45s', color: '#9fdcf4' },
  { left: '69%', top: '38%', delay: '2.15s', color: '#c2a8ff' },
]

function CandleFallback({ separated }: { separated: boolean }) {
  return (
    <div className="cake-webgl-fallback" aria-hidden="true">
      <div className="fallback-flame-row">
        {candlePositions.map((position) => (
          <span key={position} className="fallback-flame" />
        ))}
      </div>
      <div className="fallback-topper" />
      <div className="fallback-tier fallback-tier-top" />
      <div className="fallback-tier fallback-tier-middle" />
      <div className="fallback-tier fallback-tier-bottom" />
      <div className="fallback-plate" />
      {separated && <div className="fallback-cut-slice" />}
    </div>
  )
}

export default function CakeExperience({ motionScale, onNext }: CakeExperienceProps) {
  const [compactViewport, setCompactViewport] = useState(
    () => window.innerWidth <= 760,
  )
  const [phase, setPhase] = useState<CakePhase>('ready')
  const [cutProgress, setCutProgress] = useState(0)
  const [blowOut, setBlowOut] = useState(false)
  const [showBlowButton, setShowBlowButton] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showBirthdayEnding, setShowBirthdayEnding] = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [musicState, setMusicState] = useState<AudioState>('checking')
  const [musicMessage, setMusicMessage] = useState('')
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const stageRef = useRef<HTMLElement>(null)
  const wishButtonRef = useRef<HTMLButtonElement>(null)
  const blowButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const blowStarted = useRef(false)
  const nextStarted = useRef(false)
  const wishStarted = useRef(false)
  const cutStarted = useRef(false)

  useEffect(() => {
    const updateViewport = () => setCompactViewport(window.innerWidth <= 760)
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    if (!stageRef.current || motionScale === 0) return
    timelineRef.current?.kill()
    timelineRef.current = gsap.timeline().fromTo(
      stageRef.current,
      { autoAlpha: 0, scale: 0.985, filter: 'blur(10px)' },
      {
        autoAlpha: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.15,
        ease: 'power3.out',
      },
    )

    return () => {
      timelineRef.current?.kill()
    }
  }, [motionScale])

  useEffect(() => {
    if (phase !== 'wished') return
    timerRef.current = window.setTimeout(
      () => setShowBlowButton(true),
      motionScale === 0 ? 0 : 1250,
    )
    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    }
  }, [motionScale, phase])

  useEffect(() => {
    if (phase !== 'blowing') return
    timerRef.current = window.setTimeout(() => {
      setPhase('celebrated')
      setShowConfetti(true)
    }, motionScale === 0 ? 0 : 1550)
    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    }
  }, [motionScale, phase])

  useEffect(() => {
    if (phase !== 'celebrated') return
    timerRef.current = window.setTimeout(
      () => setPhase('knife-ready'),
      motionScale === 0 ? 0 : 2600,
    )
    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    }
  }, [motionScale, phase])

  useEffect(() => {
    if (phase !== 'cutting') return
    timerRef.current = window.setTimeout(() => {
      setCutProgress(1)
      setPhase('finale')
    }, motionScale === 0 ? 0 : 1350)
    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    }
  }, [motionScale, phase])

  useEffect(() => {
    if (phase !== 'finale') return
    timerRef.current = window.setTimeout(
      () => setShowBirthdayEnding(true),
      motionScale === 0 ? 0 : 7800,
    )
    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    }
  }, [motionScale, phase, replayKey])

  useEffect(() => {
    if (!isReplaying) return
    const pickTimer = window.setTimeout(() => setPhase('knife-picked'), motionScale === 0 ? 0 : 750)
    const cutTimer = window.setTimeout(() => {
      cutStarted.current = false
      setPhase('cutting')
    }, motionScale === 0 ? 0 : 1600)
    const finishTimer = window.setTimeout(() => setIsReplaying(false), motionScale === 0 ? 0 : 3050)
    return () => {
      window.clearTimeout(pickTimer)
      window.clearTimeout(cutTimer)
      window.clearTimeout(finishTimer)
    }
  }, [isReplaying, motionScale])

  useEffect(() => {
    const controller = new AbortController()

    fetch(MUSIC_SOURCE, { method: 'HEAD', signal: controller.signal })
      .then((response) => {
        const contentType = response.headers.get('content-type') ?? ''
        setMusicState(
          response.ok && contentType.startsWith('audio/')
            ? 'available'
            : 'missing',
        )
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setMusicState('missing')
      })

    return () => {
      controller.abort()
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
      timelineRef.current?.kill()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (!audioElement) return
      audioElement.pause()
      audioElement.removeAttribute('src')
      audioElement.load()
    }
  }, [audioElement])

  function playButtonPulse(button: HTMLButtonElement | null) {
    if (!button || motionScale === 0) return
    gsap.fromTo(
      button,
      { scale: 0.94 },
      { scale: 1, duration: 0.45, ease: 'back.out(2.4)', overwrite: true },
    )
  }

  function handleWish(event: ReactMouseEvent<HTMLButtonElement>) {
    if (phase !== 'ready' || wishStarted.current) return
    wishStarted.current = true
    playButtonPulse(event.currentTarget)
    setPhase('wished')
  }

  function handleBlowOut(event: ReactMouseEvent<HTMLButtonElement>) {
    if (phase !== 'wished' || blowStarted.current) return
    blowStarted.current = true
    playButtonPulse(event.currentTarget)
    setShowConfetti(true)
    setBlowOut(true)
    setPhase('blowing')
    if (motionScale > 0) {
      timelineRef.current = gsap.timeline().to('.cake-stage', {
        filter: 'brightness(1.22) saturate(1.16)',
        duration: 0.65,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      })
    }
  }

  function handlePickKnife() {
    if (phase !== 'knife-ready') return
    setPhase('knife-picked')
  }

  const handleCut = useCallback(() => {
    if (phase !== 'knife-picked' || cutStarted.current) return
    cutStarted.current = true
    setCutProgress(1)
    setPhase('cutting')
  }, [phase])

  function handleReplay() {
    if (phase !== 'finale' || !showBirthdayEnding || isReplaying) return
    cutStarted.current = false
    setShowBirthdayEnding(false)
    setCutProgress(0)
    setShowConfetti(false)
    setReplayKey((key) => key + 1)
    setIsReplaying(true)
    setPhase('knife-ready')
  }

  function handleNext() {
    if (phase !== 'finale' || !showBirthdayEnding || nextStarted.current) return
    nextStarted.current = true
    const nextButton = nextButtonRef.current
    if (!nextButton || motionScale === 0) {
      onNext()
      return
    }
    timelineRef.current?.kill()
    timelineRef.current = gsap
      .timeline({ onComplete: onNext })
      .to(stageRef.current, {
        autoAlpha: 0,
        scale: 0.97,
        filter: 'blur(9px)',
        duration: 0.58,
        ease: 'power2.in',
      })
  }

  async function toggleMusic() {
    if (musicState === 'missing' || musicState === 'checking') return

    if (audioElement && musicState === 'playing') {
      audioElement.pause()
      setMusicState('paused')
      setMusicMessage('Music paused.')
      return
    }

    const audio =
      audioElement ??
      (() => {
        const createdAudio = new Audio(MUSIC_SOURCE)
        createdAudio.loop = true
        createdAudio.volume = 0.32
        setAudioElement(createdAudio)
        return createdAudio
      })()

    try {
      await audio.play()
      setMusicState('playing')
      setMusicMessage('Birthday music is playing.')
    } catch {
      setMusicState('error')
      setMusicMessage('The music could not be played. Please check the audio file.')
    }
  }

  return (
    <main
      className={`cake-stage${phase === 'ready' || phase === 'wished' || phase === 'blowing' || phase === 'celebrated' ? ' cake-birthday-copy-visible' : ''}${phase === 'celebrated' || phase === 'blowing' || phase === 'finale' ? ' cake-celebrating' : ''}${phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting' ? ' cake-knife-scene' : ''}${phase === 'knife-ready' || phase === 'knife-picked' ? ' is-knife-visible' : ''}${phase === 'knife-picked' ? ' is-knife-interactive' : ''}${phase === 'finale' ? ` cake-finale${showBirthdayEnding ? ' cake-finale-ending' : ''}` : ''}`}
      ref={stageRef}
    >
      <div className="cake-atmosphere" aria-hidden="true">
        <div className="cake-aura cake-aura-one" />
        <div className="cake-aura cake-aura-two" />
        <div className="cake-aura cake-aura-three" />
        <div className="cake-star-layer">
          {Array.from({ length: 26 }, (_, index) => (
            <span
              key={index}
              style={
                {
                  '--star-x': `${(index * 41) % 100}%`,
                  '--star-y': `${(index * 67) % 100}%`,
                  '--star-delay': `${(index % 9) * 0.43}s`,
                } as CSSProperties
              }
            >
              {index % 3 === 0 ? '✦' : '·'}
            </span>
          ))}
        </div>
      </div>

      <div className="cake-canvas-wrap" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 1.05, 8.4], fov: compactViewport ? 58 : 36 }}
          dpr={[1, 1.45]}
          gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
          shadows="percentage"
          fallback={<CandleFallback separated={phase === 'finale'} />}
        >
          <Suspense fallback={null}>
            <CakeScene
              key={replayKey}
              extinguishing={blowOut}
              phase={phase}
              motionScale={motionScale}
              compactViewport={compactViewport}
              cutProgress={cutProgress}
              onPickKnife={handlePickKnife}
              onCutProgress={setCutProgress}
              onCutComplete={handleCut}
            />
          </Suspense>
        </Canvas>
      </div>

      {showConfetti && (
        <div className="cake-confetti" aria-hidden="true">
          {confettiPieces.map((piece, index) => (
            <span
              className={piece.shape}
              key={`confetti-${index}`}
              style={
                {
                  left: piece.left,
                  '--confetti-delay': piece.delay,
                  '--confetti-duration': piece.duration,
                  '--confetti-drift': piece.drift,
                  '--confetti-color': piece.color,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {phase === 'finale' && (
        <div className="cake-finale-effects" key={replayKey} aria-hidden="true">
          <div className="cake-balloons">
            {balloonBursts.map((balloon, index) => (
              <span
                className="cake-balloon"
                key={`balloon-${index}`}
                style={{
                  left: balloon.left,
                  '--balloon-delay': balloon.delay,
                  '--balloon-color': balloon.color,
                } as CSSProperties}
              >
                {Array.from({ length: 5 }, (_, fragment) => (
                  <i key={`balloon-fragment-${fragment}`} />
                ))}
              </span>
            ))}
          </div>
          <div className="cake-fireworks">
            {fireworks.map((firework, index) => (
              <span
                className="cake-firework"
                key={`firework-${index}`}
                style={{
                  left: firework.left,
                  top: firework.top,
                  '--firework-delay': firework.delay,
                  '--firework-color': firework.color,
                } as CSSProperties}
              >
                {Array.from({ length: 16 }, (_, ray) => (
                  <i
                    key={`ray-${ray}`}
                    style={{ '--ray-angle': `${ray * 22.5}deg` } as CSSProperties}
                  />
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {phase === 'knife-picked' && (
        <>
          <div className="cake-cut-guide" aria-hidden="true" />
          {cutProgress > 0.04 && (
            <div
              className="cake-cut-trail"
              aria-hidden="true"
              style={{ height: `${Math.max(0.1, cutProgress * 17)}vh` }}
            />
          )}
        </>
      )}

      {phase === 'finale' && (
        <div className="cake-cut-sparkles" key={`cut-sparkles-${replayKey}`} aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={`cut-sparkle-${index}`}
              style={
                {
                  '--sparkle-x': `${((index * 43) % 180) - 90}px`,
                  '--sparkle-y': `${((index * 61) % 150) - 75}px`,
                  '--sparkle-delay': `${(index % 6) * 0.08}s`,
                } as CSSProperties
              }
            >
              {index % 2 === 0 ? '✦' : '·'}
            </span>
          ))}
        </div>
      )}

      {phase === 'finale' && (
        <div className="cake-celebration-phrases" key={`phrases-${replayKey}`}>
          <p className="cake-main-phrase">HAPPY BIRTHDAY, KRITHIKA!</p>
          <p className="cake-floating-phrase cake-phrase-one">KEEP SHINING, KRITHIKA! ✨</p>
          <p className="cake-floating-phrase cake-phrase-two">MAKE A WISH!</p>
          <p className="cake-floating-phrase cake-phrase-three">CELEBRATE YOUR DAY!</p>
          <p className="cake-floating-phrase cake-phrase-four">YOU DESERVE ALL THE HAPPINESS!</p>
          {showBirthdayEnding && (
            <div className="cake-ending-copy" role="status">
              <h1>Today Is All About You, Krithika! 💖</h1>
              <p>
                Today is your day. Let the smiles be brighter, the laughter be
                louder, and the memories be unforgettable.
              </p>
            </div>
          )}
        </div>
      )}

      <header className="cake-header">
        <span className="cake-eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          A MOMENT MADE JUST FOR YOU
        </span>
        <button
          className="cake-music-button"
          type="button"
          disabled={musicState === 'checking' || musicState === 'missing'}
          onClick={toggleMusic}
          aria-label={
            musicState === 'playing'
              ? 'Pause birthday music'
              : musicState === 'missing'
                ? 'Music unavailable. Add public/audio/birthdayverse-theme.mp3'
                : 'Play birthday music'
          }
          aria-describedby="cake-music-status"
        >
          {musicState === 'playing' ? (
            <Pause size={15} aria-hidden="true" />
          ) : musicState === 'checking' ? (
            <Music2 size={15} aria-hidden="true" />
          ) : (
            <Play size={15} aria-hidden="true" />
          )}
          {musicState === 'playing'
            ? 'PAUSE MUSIC'
            : musicState === 'missing'
              ? 'MUSIC UNAVAILABLE'
              : musicState === 'checking'
                ? 'CHECKING MUSIC'
                : 'PLAY MUSIC'}
        </button>
        <span className="sr-only" id="cake-music-status" role="status">
          {musicMessage ||
            (musicState === 'missing'
              ? `Add a licensed audio file at ${MUSIC_SOURCE} to enable music.`
              : '')}
        </span>
      </header>

      {phase !== 'finale' && (
      <div className={`cake-copy${phase === 'celebrated' ? ' cake-copy-celebrated' : ''}${phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting' ? ' cake-copy-knife' : ''}`}>
        {phase === 'celebrated' ? (
          <div className="cake-blessing" role="status">
            <h2>May Your Birthday Wish Come True, Krithika! 💖</h2>
            <p>
              May this new chapter bring you happiness, beautiful memories, and
              countless reasons to smile.
            </p>
          </div>
        ) : phase === 'knife-ready' || phase === 'knife-picked' || phase === 'cutting' ? (
          <div className="cake-knife-message" role="status">
            <p className="cake-overline">A LITTLE BIRTHDAY TRADITION</p>
            <h1>{phase === 'cutting' ? 'A little slice of birthday magic...' : 'Ready to cut your birthday cake? 🎂'}</h1>
            <p>
              {phase === 'knife-ready'
                ? 'Touch the knife to begin the celebration.'
                : phase === 'knife-picked'
                  ? 'Move the knife down across the cake to cut a slice!'
                  : 'The sweetest part is just beginning...'}
            </p>
          </div>
        ) : (
          <>
            <p className="cake-overline">LET THE WISHES BEGIN</p>
            <h1 className="cake-title">HAPPY BIRTHDAY, KRITHIKA! 🎂💖</h1>
            <p className="cake-subtitle">
              Today is your day. Let the smiles be brighter, the laughter be louder, and the memories be unforgettable.
            </p>
          </>
        )}
        {phase === 'wished' && (
          <p className="cake-wish-prompt" role="status">
            Close your eyes. Make a wish. <Sparkles size={17} aria-hidden="true" />
          </p>
        )}
      </div>
      )}

      <div className="cake-actions">
        {phase === 'ready' && (
          <button
            className="button button-cake-action"
            onClick={handleWish}
            ref={wishButtonRef}
            type="button"
          >
            MAKE A WISH <Sparkles size={16} aria-hidden="true" />
          </button>
        )}
        {(phase === 'wished' || phase === 'blowing') && showBlowButton && (
          <button
            className="button button-cake-action button-blow"
            onClick={handleBlowOut}
            ref={blowButtonRef}
            type="button"
            disabled={phase === 'blowing'}
          >
            {phase === 'blowing' ? 'A LITTLE MAGIC…' : 'BLOW OUT THE CANDLES 🕯️'}
          </button>
        )}
        {phase === 'knife-ready' && (
          <button
            className="button button-cake-action button-more"
            onClick={handlePickKnife}
            type="button"
          >
            PICK UP THE KNIFE <Sparkles size={16} aria-hidden="true" />
          </button>
        )}
        {(phase === 'knife-picked' || phase === 'cutting') && (
          <button
            className="button button-cake-action button-more"
            onClick={handleCut}
            type="button"
            disabled={phase === 'cutting'}
          >
            {phase === 'cutting' ? 'CUTTING THE CAKE…' : 'CUT THE CAKE ✨'}
          </button>
        )}
        {phase === 'finale' && showBirthdayEnding && (
          <div className="cake-finale-actions">
            <button
              className="button button-cake-action button-replay"
              onClick={handleReplay}
              type="button"
              disabled={isReplaying}
            >
              <RotateCcw size={16} aria-hidden="true" /> REPLAY THE CELEBRATION
            </button>
            <button
              className="button button-cake-action button-more"
              onClick={handleNext}
              ref={nextButtonRef}
              type="button"
            >
              NEXT SURPRISE <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {phase === 'celebrated' && (
        <div className="cake-next-hint" aria-hidden="true">
          Let the birthday magic settle <span>✦</span>
        </div>
      )}

      <button
        className={`cake-info-trigger${infoOpen ? ' is-open' : ''}`}
        type="button"
        aria-expanded={infoOpen}
        onClick={() => setInfoOpen((open) => !open)}
      >
        {infoOpen ? 'CLOSE NOTE' : 'A LITTLE NOTE'}
      </button>
      {infoOpen && (
        <div className="cake-info-card" role="status">
          <Sparkles size={16} aria-hidden="true" />
          <span>
            Make a wish when you&apos;re ready. The candles will stay glowing
            until you choose to blow them out.
          </span>
        </div>
      )}

      {musicState === 'missing' && (
        <p className="cake-audio-note">
          Add a licensed track at <code>public/audio/birthdayverse-theme.mp3</code>{' '}
          to enable music.
        </p>
      )}
    </main>
  )
}
