import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Suspense,
  useMemo,
  useRef,
} from 'react'
import type { JSX } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CanvasTexture,
  Color,
  Group,
  MathUtils,
  Mesh,
  Points,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from 'three'

type SceneStage = 'invitation' | 'message'

interface CelebrationSceneProps {
  stage: SceneStage
  motionScale: number
}

interface BalloonProps {
  color: string
  index: number
  label?: string
  rising?: boolean
  side: -1 | 1
  motionScale: number
}

function makePoints(count: number, spread: number, seed: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  let value = seed

  const random = () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }

  const palette = ['#fff1ff', '#f6b4e2', '#bba9ff', '#a9dfff']
    .map((color) => new Color(color))

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * spread
    positions[index * 3 + 1] = (random() - 0.5) * spread * 0.62
    positions[index * 3 + 2] = (random() - 0.5) * 8

    const color = palette[Math.floor(random() * palette.length)]
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

function Starfield({ motionScale }: { motionScale: number }) {
  const points = useRef<Points>(null)
  const { viewport } = useThree()
  const narrowScreen = viewport.width < 6

  const geometries = useMemo(
    () => ({
      stars: makePoints(narrowScreen ? 180 : 430, 28, 583),
      dust: makePoints(narrowScreen ? 48 : 115, 15, 177),
    }),
    [narrowScreen],
  )

  useFrame(({ clock, pointer }) => {
    if (!points.current || motionScale === 0) return
    const time = clock.elapsedTime * motionScale
    points.current.rotation.y = time * 0.006 + pointer.x * 0.018
    points.current.rotation.x = time * 0.003 - pointer.y * 0.014
    points.current.position.x = MathUtils.damp(
      points.current.position.x,
      pointer.x * 0.12,
      1.4,
      0.016,
    )
    points.current.position.y = MathUtils.damp(
      points.current.position.y,
      pointer.y * 0.08,
      1.4,
      0.016,
    )
  })

  return (
    <group ref={points}>
      <points geometry={geometries.stars}>
        <pointsMaterial
          vertexColors
          transparent
          opacity={0.72}
          size={0.032}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <points geometry={geometries.dust}>
        <pointsMaterial
          vertexColors
          transparent
          opacity={0.27}
          size={0.072}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}

const balloonGeometry = new SphereGeometry(1, 32, 24)

function Balloon({
  color,
  index,
  label,
  rising = false,
  side,
  motionScale,
}: BalloonProps) {
  const group = useRef<Group>(null)
  const { viewport } = useThree()
  const scale = label ? 0.58 : 0.27 + (index % 3) * 0.07
  const initialY = rising
    ? -viewport.height * 0.66 + (index % 3) * 0.35
    : (index % 2 === 0 ? 1 : -1) * viewport.height * 0.4
  const x = side * viewport.width * (0.55 + (index % 2) * 0.05)
  const z = -1.4 - (index % 3) * 1.55

  const stringGeometry = useMemo(() => {
    const points = [
      new Vector3(0, -0.67, 0),
      new Vector3(0.12, -0.97, 0),
      new Vector3(-0.1, -1.28, -0.015),
      new Vector3(0.07, -1.55, -0.02),
    ]
    return new TubeGeometry(new CatmullRomCurve3(points), 20, 0.008, 5, false)
  }, [])
  const labelTexture = useMemo(() => {
    if (!label) return null

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 96
    const context = canvas.getContext('2d')
    if (!context) return null

    context.fillStyle = 'rgba(49, 21, 64, 0.72)'
    context.beginPath()
    context.roundRect(8, 8, 496, 80, 40)
    context.fill()
    context.strokeStyle = 'rgba(255, 255, 255, 0.64)'
    context.lineWidth = 4
    context.stroke()
    context.fillStyle = '#fff4ff'
    context.font = '600 37px Arial, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, 256, 50, 450)

    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [label])

  useFrame(({ clock, pointer }) => {
    if (!group.current || motionScale === 0) return
    const time = clock.elapsedTime * motionScale
    group.current.position.y = rising
      ? -viewport.height * 0.66 +
        ((time * 0.16 + index * 1.8) % (viewport.height * 1.34))
      : initialY + Math.sin(time * 0.48 + index * 1.7) * 0.2
    group.current.position.x =
      x + Math.sin(time * 0.23 + index) * 0.12 + pointer.x * 0.06
    group.current.rotation.z = Math.sin(time * 0.38 + index) * 0.08
    group.current.rotation.y = Math.sin(time * 0.3 + index) * 0.1
  })

  return (
    <group ref={group} position={[x, initialY, z]} scale={scale}>
      <mesh geometry={balloonGeometry} scale={[0.72, 1, 0.64]}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.12}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={color}
          emissiveIntensity={0.16}
        />
      </mesh>
      <mesh position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.22, 5]} />
        <meshStandardMaterial color={color} roughness={0.32} />
      </mesh>
      <mesh geometry={stringGeometry} position={[0, -0.76, 0]}>
        <meshBasicMaterial color="#efd7f7" transparent opacity={0.55} />
      </mesh>
      {labelTexture && (
        <mesh position={[0, 0.01, 0.67]} scale={[0.9, 0.32, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={labelTexture}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

function FloatingBalloons({ motionScale }: { motionScale: number }) {
  const balloons: Array<Omit<BalloonProps, 'motionScale'>> = [
    { color: '#f28ac8', index: 0, label: 'MAKE A WISH', side: -1 },
    { color: '#8b83f6', index: 1, side: 1 },
    { color: '#f2c375', index: 2, side: -1 },
    { color: '#79c9e8', index: 3, label: 'PARTY TIME', side: 1 },
    { color: '#bd8de8', index: 4, rising: true, side: -1 },
    { color: '#ee9ab4', index: 5, rising: true, side: 1 },
  ]

  return (
    <group>
      {balloons.map((balloon) => (
        <Balloon
          key={balloon.index}
          {...balloon}
          motionScale={motionScale}
          side={balloon.side}
        />
      ))}
    </group>
  )
}

function OrbitRings({ motionScale }: { motionScale: number }) {
  const ring = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!ring.current || motionScale === 0) return
    const time = clock.elapsedTime * motionScale
    ring.current.rotation.x = 0.75 + Math.sin(time * 0.13) * 0.05
    ring.current.rotation.y = time * 0.045
    ring.current.rotation.z = time * 0.025
  })

  return (
    <mesh ref={ring} position={[0, -0.4, -3.5]}>
      <torusGeometry args={[4.6, 0.009, 6, 180]} />
      <meshBasicMaterial color="#d8a0ef" transparent opacity={0.12} />
    </mesh>
  )
}

function CameraDrift({ motionScale }: { motionScale: number }) {
  useFrame(({ camera, pointer }, delta) => {
    if (motionScale === 0) return
    camera.position.x = MathUtils.damp(
      camera.position.x,
      pointer.x * 0.18,
      1.1,
      delta,
    )
    camera.position.y = MathUtils.damp(
      camera.position.y,
      pointer.y * 0.12,
      1.1,
      delta,
    )
    camera.lookAt(0, 0, 0)
  })

  return null
}

function BirthdayWorld({
  stage,
  motionScale,
}: CelebrationSceneProps): JSX.Element {
  const isMessage = stage === 'message'

  return (
    <>
      <ambientLight intensity={isMessage ? 1.1 : 0.85} color="#d9c2ff" />
      <pointLight
        color={isMessage ? '#ff9ecf' : '#a78bfa'}
        intensity={22}
        distance={16}
        position={[-4, 3, 4]}
      />
      <pointLight
        color="#7fd7ff"
        intensity={14}
        distance={14}
        position={[4, -2, 1]}
      />
      <CameraDrift motionScale={motionScale} />
      <Starfield motionScale={motionScale} />
      <OrbitRings motionScale={motionScale} />
      <FloatingBalloons motionScale={motionScale} />
    </>
  )
}

export default function CelebrationScene({
  stage,
  motionScale,
}: CelebrationSceneProps) {
  const visible = motionScale > 0

  return (
    <div className={`birthday-scene${visible ? '' : ' motion-paused'}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 42 }}
        dpr={[1, 1.35]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        fallback={<div className="scene-fallback" />}
      >
        <Suspense fallback={null}>
          <BirthdayWorld stage={stage} motionScale={motionScale} />
        </Suspense>
      </Canvas>
    </div>
  )
}
