import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { gsap } from 'gsap'
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Sparkles,
} from 'lucide-react'
import { birthdayLetter } from './birthdayLetter'
import { memoryPhotos } from './memoryPhotos'
import './MemoryJourney.css'

type MemoryStage = 'gallery' | 'letter' | 'finale'

interface MemoryJourneyProps {
  stage: MemoryStage
  motionScale: number
  onStageChange: (stage: 'gallery' | 'letter' | 'finale') => void
  onStartAgain: () => void
}

const atmosphereParticles = Array.from({ length: 64 }, (_, index) => ({
  left: `${(index * 47 + 9) % 100}%`,
  top: `${(index * 31 + 7) % 100}%`,
  delay: `${(index % 11) * -0.63}s`,
  duration: `${8 + (index % 9) * 1.4}s`,
  size: `${1 + (index % 3)}px`,
}))

const finaleParticles = Array.from({ length: 18 }, (_, index) => ({
  left: `${5 + ((index * 37) % 91)}%`,
  delay: `${(index % 7) * 0.55}s`,
  duration: `${7 + (index % 5)}s`,
  size: `${12 + (index % 4) * 5}px`,
}))

const finaleFireworks = [
  { left: '17%', top: '24%', delay: '0s', color: 'pink' },
  { left: '81%', top: '21%', delay: '1.1s', color: 'gold' },
  { left: '72%', top: '64%', delay: '2.2s', color: 'violet' },
  { left: '24%', top: '70%', delay: '0.65s', color: 'gold' },
]

const finaleBalloons = [
  { left: '9%', delay: '0.2s', color: '#ee9dc8' },
  { left: '22%', delay: '1.4s', color: '#b9a4f5' },
  { left: '39%', delay: '0.8s', color: '#f2cf8d' },
  { left: '62%', delay: '1.9s', color: '#f2a6b6' },
  { left: '78%', delay: '0.5s', color: '#a8dce8' },
  { left: '91%', delay: '1.1s', color: '#d1b0f0' },
]

const heartFormation = Array.from({ length: 48 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 48
  const x = 16 * Math.sin(angle) ** 3
  const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)
  return {
    left: `${50 + x * 1.65}%`,
    top: `${47 - y * 1.65}%`,
    delay: `${(index % 12) * 0.045}s`,
  }
})

const finaleConfetti = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 23 + 7) % 85}%`,
  delay: `${(index % 12) * 0.19}s`,
  duration: `${5.8 + (index % 7) * 0.55}s`,
  drift: `${((index * 29) % 100) - 50}px`,
  color: ['#f0abd7', '#d1b7ff', '#f5d28e', '#9fdef0'][index % 4],
}))

function MemoryJourney({
  stage,
  motionScale,
  onStageChange,
  onStartAgain,
}: MemoryJourneyProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(() => new Set())
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isFinalTransition, setIsFinalTransition] = useState(false)
  const journeyRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const transitioningRef = useRef(false)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const letterRef = useRef(false)

  useEffect(() => () => {
    timelineRef.current?.kill()
    transitioningRef.current = false
  }, [])

  function markPhotoUnavailable(index: number) {
    setFailedPhotos((current) => {
      if (current.has(index)) return current
      const next = new Set(current)
      next.add(index)
      return next
    })
  }

  const startTransition = useCallback((direction: -1 | 1) => {
    if (transitioningRef.current) return

    const isFinalMemory = currentIndex === memoryPhotos.length - 1 && direction === 1
    const nextIndex = currentIndex + direction
    if (!isFinalMemory && (nextIndex < 0 || nextIndex >= memoryPhotos.length)) return

    if (motionScale === 0) {
      if (isFinalMemory) {
        onStageChange('letter')
      } else {
        setCurrentIndex(nextIndex)
      }
      return
    }

    const photo = photoRef.current
    const copy = copyRef.current
    const portal = portalRef.current
    const journey = journeyRef.current
    if (!photo || !copy || !portal || !journey) {
      if (isFinalMemory) onStageChange('letter')
      else setCurrentIndex(nextIndex)
      return
    }

    transitioningRef.current = true
    setIsTransitioning(true)
    setIsFinalTransition(isFinalMemory)
    letterRef.current = isFinalMemory
    const durationScale = motionScale < 1 ? 0.76 : 1

    const timeline = gsap.timeline({
      onComplete: () => {
        timelineRef.current = null
        transitioningRef.current = false
        setIsTransitioning(false)
        setIsFinalTransition(false)
        if (letterRef.current) onStageChange('letter')
      },
    })
    timelineRef.current = timeline

    timeline
      .to(copy, {
        autoAlpha: 0,
        y: -16,
        filter: 'blur(7px)',
        duration: 0.44 * durationScale,
        ease: 'power2.in',
      })
      .to(photo, {
        autoAlpha: 0,
        scale: isFinalMemory ? 0.05 : 1.16,
        rotationY: direction > 0 ? 12 : -12,
        rotationX: -5,
        filter: 'blur(3px)',
        duration: (isFinalMemory ? 1.18 : 0.68) * durationScale,
        ease: 'power3.in',
      }, '<0.08')
      .to(portal, {
        autoAlpha: 1,
        scale: isFinalMemory ? 1.3 : 1,
        rotation: isFinalMemory ? 0 : 160,
        duration: (isFinalMemory ? 1 : 0.62) * durationScale,
        ease: 'power2.out',
      }, '<0.2')
      .to(journey, {
        '--journey-wash': 1,
        duration: 0.6 * durationScale,
        ease: 'sine.inOut',
      }, '<0.1')
      .call(() => {
        if (isFinalMemory) return
        setCurrentIndex(nextIndex)
        gsap.set(photo, {
          autoAlpha: 0,
          scale: 0.76,
          rotationY: direction > 0 ? -12 : 12,
          rotationX: 4,
          filter: 'blur(9px)',
        })
        gsap.set(copy, { autoAlpha: 0, y: 18, filter: 'blur(7px)' })
      })

    if (!isFinalMemory) {
      timeline
        .to(portal, {
          autoAlpha: 0.38,
          scale: 0.22,
          rotation: 260,
          duration: 0.65 * durationScale,
          ease: 'power2.in',
        })
        .to(photo, {
          autoAlpha: 1,
          scale: 1,
          rotationY: 0,
          rotationX: 0,
          filter: 'blur(0px)',
          duration: 0.95 * durationScale,
          ease: 'back.out(1.25)',
        }, '<0.06')
        .to(copy, {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.62 * durationScale,
          ease: 'power3.out',
        }, '<0.3')
        .to(journey, {
          '--journey-wash': 0,
          duration: 0.8 * durationScale,
          ease: 'sine.inOut',
        }, '<')
        .to(portal, {
          autoAlpha: 0,
          scale: 0.1,
          duration: 0.55 * durationScale,
          ease: 'power2.in',
        }, '<')
    } else {
      timeline
        .to(portal, {
          scale: 0.12,
          autoAlpha: 0.1,
          duration: 1.1 * durationScale,
          ease: 'power3.in',
        })
        .to(journey, {
          '--journey-wash': 0.84,
          duration: 1.15 * durationScale,
          ease: 'sine.inOut',
        }, '<')
    }
  }, [currentIndex, motionScale, onStageChange])

  useEffect(() => {
    if (stage !== 'gallery') return

    function handleArrowKeys(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || transitioningRef.current) return
      if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea')) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        startTransition(1)
      } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault()
        startTransition(-1)
      }
    }

    window.addEventListener('keydown', handleArrowKeys)
    return () => window.removeEventListener('keydown', handleArrowKeys)
  }, [currentIndex, stage, startTransition])

  function skipTransition() {
    if (!transitioningRef.current) return
    timelineRef.current?.progress(1)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.target instanceof HTMLElement && event.target.closest('button')) return
    swipeStartRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start || transitioningRef.current) return

    const distanceX = event.clientX - start.x
    const distanceY = event.clientY - start.y
    if (Math.abs(distanceX) > 55 && Math.abs(distanceX) > Math.abs(distanceY) * 1.25) {
      startTransition(distanceX < 0 ? 1 : -1)
    }
  }

  const photo = memoryPhotos[currentIndex]

  return (
    <div
      ref={journeyRef}
      className={`memory-journey memory-stage-${stage}${motionScale === 0 ? ' memory-still' : ''}${isTransitioning ? ' cinema-transitioning' : ''}`}
      data-tone={stage === 'gallery' ? photo.tone : undefined}
      onPointerDown={stage === 'gallery' ? handlePointerDown : undefined}
      onPointerUp={stage === 'gallery' ? handlePointerUp : undefined}
      onPointerCancel={() => { swipeStartRef.current = null }}
    >
      <div className="memory-stars" aria-hidden="true">
        {atmosphereParticles.map((particle, index) => (
          <span
            key={index}
            style={{
              '--star-left': particle.left,
              '--star-top': particle.top,
              '--star-delay': particle.delay,
              '--particle-duration': particle.duration,
              '--particle-size': particle.size,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="memory-ambient memory-ambient-one" aria-hidden="true" />
      <div className="memory-ambient memory-ambient-two" aria-hidden="true" />
      <div className="cinema-trails" aria-hidden="true"><span /><span /><span /></div>
      <div className="cinema-portal" ref={portalRef} aria-hidden="true">
        <span /><span /><i />
      </div>
      <div className="cinema-transition-dust" aria-hidden="true">
        {atmosphereParticles.slice(0, 32).map((particle, index) => (
          <span
            key={index}
            style={{
              '--star-left': particle.left,
              '--star-top': particle.top,
              '--dust-delay': `${(index % 8) * 0.035}s`,
            } as CSSProperties}
          >
            {index % 4 === 0 ? '♡' : '✦'}
          </span>
        ))}
      </div>

      {stage === 'gallery' && (
        <main className="cinema-content" aria-labelledby="memory-title">
          <header className="cinema-heading">
            <p className="memory-kicker"><Sparkles size={14} aria-hidden="true" /> A LITTLE UNIVERSE OF MOMENTS</p>
            <h1 id="memory-title">
              {'A Little Journey Through Beautiful Moments'.split(' ').map((word, index) => (
                <span className="cinema-heading-word" key={`${word}-${index}`} style={{ '--word-index': index } as CSSProperties}>
                  {word}
                </span>
              ))}
            </h1>
            <p className="memory-subtitle">Five little memories. Five little wishes. One special day.</p>
          </header>

          <div className={`cinema-layout${isFinalTransition ? ' cinema-final-transition' : ''}`}>
            <div className="cinema-photo-column">
              <div className="cinema-frame-wrap" ref={photoRef}>
                <div className={`cinema-photo-frame memory-tone-${photo.tone}`}>
                  {failedPhotos.has(currentIndex) ? (
                    <div className="memory-art cinema-unavailable" role="img" aria-label="This photograph is unavailable">
                      <span className="memory-art-sun" />
                      <span className="memory-art-hill memory-art-hill-back" />
                      <span className="memory-art-hill memory-art-hill-front" />
                      <span className="memory-art-caption">PHOTO UNAVAILABLE</span>
                    </div>
                  ) : (
                    <img
                      src={photo.src}
                      alt={`Personal photograph ${currentIndex + 1}`}
                      onError={() => markPhotoUnavailable(currentIndex)}
                      decoding="async"
                    />
                  )}
                  <span className="cinema-frame-shine" aria-hidden="true" />
                </div>
                <span className="cinema-frame-caption" aria-hidden="true">A MOMENT TO KEEP</span>
              </div>
              <p className="cinema-photo-number" aria-hidden="true">
                MEMORY {String(currentIndex + 1).padStart(2, '0')} <span /> {String(memoryPhotos.length).padStart(2, '0')}
              </p>
            </div>

            <article className="cinema-wish-card" ref={copyRef} aria-label={`Birthday wish: ${photo.title}`}>
              <p className="cinema-wish-kicker"><Heart size={14} fill="currentColor" aria-hidden="true" /> A WISH FOR YOU</p>
              <h2 className="cinema-photo-title" key={photo.title}>
                {photo.title.split(' ').map((word, index) => (
                  <span className="cinema-title-word" key={`${word}-${index}`} style={{ '--word-index': index } as CSSProperties}>
                    {word}
                  </span>
                ))}
              </h2>
              <span className="cinema-underline" key={photo.src} aria-hidden="true" />
              <div className="cinema-wish-copy">
                {photo.wish.split('\n\n').map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`} style={{ '--wish-index': index } as CSSProperties}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          </div>

          <nav className="cinema-controls" aria-label="Memory navigation">
            <button
              className="memory-button memory-button-secondary cinema-nav-button"
              type="button"
              onClick={() => startTransition(-1)}
              disabled={isTransitioning || currentIndex === 0}
            >
              <ArrowLeft size={16} aria-hidden="true" /> PREVIOUS MEMORY
            </button>
            <p className="cinema-progress" aria-live="polite">
              MEMORY {String(currentIndex + 1).padStart(2, '0')} / {String(memoryPhotos.length).padStart(2, '0')}
            </p>
            <button
              className="memory-button memory-button-primary cinema-nav-button"
              type="button"
              onClick={() => startTransition(1)}
              disabled={isTransitioning}
            >
              {currentIndex === memoryPhotos.length - 1 ? 'READ MY FINAL MESSAGE →' : 'NEXT MEMORY'}
              {currentIndex === memoryPhotos.length - 1 ? null : <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </nav>
          {isTransitioning && (
            <button className="cinema-skip" type="button" onClick={skipTransition}>
              SKIP ANIMATION <ArrowRight size={13} aria-hidden="true" />
            </button>
          )}
        </main>
      )}

      {stage === 'letter' && (
        <section className="letter-content cinema-letter-content" aria-labelledby="letter-title">
          <p className="memory-kicker"><Sparkles size={14} aria-hidden="true" /> A LITTLE SOMETHING, JUST FOR YOU</p>
          <h1 id="letter-title">A note from the heart</h1>
          <div className="letter-scene cinema-letter-scene" aria-hidden="true">
            <div className="letter-glow" />
            <div className="letter-envelope">
              <div className="letter-envelope-back" />
              <div className="letter-paper"><Heart size={25} fill="currentColor" /></div>
              <div className="letter-envelope-front" />
              <div className="letter-envelope-flap" />
              <div className="letter-envelope-seal"><Heart size={17} fill="currentColor" /></div>
            </div>
          </div>
          <article className="birthday-letter cinema-final-letter" aria-label="Final birthday message">
            {birthdayLetter.split('\n\n').map((paragraph, index) => (
              <p key={`${index}-${paragraph}`} style={{ '--letter-line-delay': `${0.32 + index * 0.34}s` } as CSSProperties}>
                {paragraph}
              </p>
            ))}
            <div className="cinema-letter-underline" aria-hidden="true" />
          </article>
          <div className="cinema-letter-actions">
            <button
              className="memory-button memory-button-secondary"
              type="button"
              onClick={() => {
                setCurrentIndex(0)
                onStageChange('gallery')
              }}
            >
              REPLAY THE MEMORIES ↻
            </button>
            <button className="memory-button memory-button-primary" type="button" onClick={() => onStageChange('finale')}>
              FINISH THE SURPRISE <Sparkles size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {stage === 'finale' && (
        <section className="finale-content" aria-label="Birthday finale">
          <div className="finale-particles" aria-hidden="true">
            <div className="memory-finale-balloons">
              {finaleBalloons.map((balloon, index) => (
                <span
                  className="memory-finale-balloon"
                  key={index}
                  style={{
                    '--balloon-left': balloon.left,
                    '--balloon-delay': balloon.delay,
                    '--balloon-color': balloon.color,
                  } as CSSProperties}
                />
              ))}
            </div>
            {finaleConfetti.map((piece, index) => (
              <span
                className="memory-finale-confetti"
                key={index}
                style={{
                  '--confetti-left': piece.left,
                  '--confetti-top': piece.top,
                  '--confetti-delay': piece.delay,
                  '--confetti-duration': piece.duration,
                  '--confetti-drift': piece.drift,
                  '--confetti-color': piece.color,
                } as CSSProperties}
              />
            ))}
            {heartFormation.map((particle, index) => (
              <span
                className="finale-heart-point"
                key={index}
                style={{
                  '--heart-left': particle.left,
                  '--heart-top': particle.top,
                  '--heart-delay': particle.delay,
                } as CSSProperties}
              />
            ))}
            {finaleParticles.map((particle, index) => (
              <span
                className="finale-heart"
                key={index}
                style={{
                  '--heart-left': particle.left,
                  '--heart-delay': particle.delay,
                  '--heart-duration': particle.duration,
                  '--heart-size': particle.size,
                } as CSSProperties}
              >
                {index % 3 === 0 ? '♡' : '✦'}
              </span>
            ))}
            <div className="finale-fireworks">
              {finaleFireworks.map((firework) => (
                <span
                  className={`finale-firework finale-firework-${firework.color}`}
                  key={`${firework.left}-${firework.top}`}
                  style={{
                    '--firework-left': firework.left,
                    '--firework-top': firework.top,
                    '--firework-delay': firework.delay,
                  } as CSSProperties}
                >
                  {Array.from({ length: 12 }, (_, index) => (
                    <i key={index} style={{ '--ray-angle': `${index * 30}deg` } as CSSProperties} />
                  ))}
                </span>
              ))}
            </div>
          </div>
          <div className="finale-copy">
            <p className="finale-overline"><Sparkles size={15} aria-hidden="true" /> A LITTLE WISH FROM THE HEART</p>
            <h1>HAPPY BIRTHDAY, KRITHIKA!</h1>
            <p className="finale-birthday">May your smile shine a little brighter every day. ✨</p>
          </div>
          <div className="finale-actions">
            <button
              className="memory-button memory-button-secondary"
              type="button"
              onClick={() => {
                setCurrentIndex(0)
                onStageChange('gallery')
              }}
            >
              REPLAY THE MEMORIES ↻
            </button>
            <button className="memory-button memory-button-primary" type="button" onClick={onStartAgain}>
              START AGAIN
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default MemoryJourney
