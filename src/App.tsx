import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  FormEvent,
  MouseEvent as ReactMouseEvent,
} from 'react'
import { gsap } from 'gsap'
import {
  ArrowRight,
  Check,
  Gift,
  Heart,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'
import MemoryJourney from './MemoryJourney'
import './App.css'

const CelebrationScene = lazy(() => import('./CelebrationScene'))
const CakeExperience = lazy(() => import('./CakeExperience'))

const BIRTHDAY_PASSWORD = '2810'

const reactions = [
  'Are you sure? 🥺',
  'Pretty please? 💗',
  'Look at that cute YES button! 🎀',
  "One little YES won't hurt! 😂",
  'The universe really wants you to say YES! ✨',
  'Okayyy, this is getting suspicious! 😭',
]

const skyDecorations = [
  { left: '7%', top: '18%', delay: '0s', size: '13px', symbol: '✦' },
  { left: '17%', top: '69%', delay: '1.3s', size: '10px', symbol: '♡' },
  { left: '28%', top: '12%', delay: '2.1s', size: '9px', symbol: '✧' },
  { left: '39%', top: '82%', delay: '0.7s', size: '12px', symbol: '✦' },
  { left: '53%', top: '9%', delay: '1.7s', size: '10px', symbol: '♡' },
  { left: '64%', top: '76%', delay: '0.3s', size: '9px', symbol: '✧' },
  { left: '76%', top: '17%', delay: '2.4s', size: '13px', symbol: '✦' },
  { left: '88%', top: '63%', delay: '1s', size: '11px', symbol: '♡' },
  { left: '94%', top: '31%', delay: '1.9s', size: '8px', symbol: '✧' },
  { left: '11%', top: '43%', delay: '2.7s', size: '8px', symbol: '✧' },
  { left: '83%', top: '86%', delay: '0.5s', size: '10px', symbol: '✦' },
] as const

interface BurstState {
  id: number
  left: number
  top: number
  tone: 'gold' | 'pink'
}

type AppStage =
  | 'invitation'
  | 'message'
  | 'welcome'
  | 'note'
  | 'placeholder'
  | 'cake'
  | 'gallery'
  | 'letter'
  | 'finale'

const burstParticles = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16
  const distance = 40 + ((index * 17) % 32)
  return {
    x: `${Math.cos(angle) * distance}px`,
    y: `${Math.sin(angle) * distance}px`,
    delay: `${(index % 4) * 0.025}s`,
    symbol: index % 3 === 0 ? '♡' : index % 3 === 1 ? '✦' : '✧',
  }
})

interface BirthdayJourneyProps {
  stage: 'welcome' | 'note' | 'placeholder'
  onAdvance: () => void
  onBurst: (event: ReactMouseEvent<HTMLButtonElement>) => void
  motionScale: number
}

function BirthdayJourney({
  stage,
  onAdvance,
  onBurst,
  motionScale,
}: BirthdayJourneyProps) {
  const contentRef = useRef<HTMLElement>(null)
  const timelineRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    if (motionScale === 0) {
      gsap.set(content, { clearProps: 'all' })
      return
    }

    timelineRef.current?.kill()
    timelineRef.current = gsap.fromTo(
      content,
      { autoAlpha: 0, y: 18, scale: 0.985, filter: 'blur(8px)' },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.85,
        ease: 'power3.out',
        clearProps: 'all',
      },
    )

    return () => {
      timelineRef.current?.kill()
    }
  }, [motionScale, stage])

  return (
    <section
      className={`journey-screen journey-${stage}`}
      aria-labelledby="journey-title"
      ref={contentRef}
    >
      <div className="journey-decoration journey-decoration-one" aria-hidden="true">
        <Heart size={23} />
      </div>
      <div className="journey-decoration journey-decoration-two" aria-hidden="true">
        <Sparkles size={22} />
      </div>

      {stage === 'welcome' && (
        <div className="journey-panel welcome-panel">
          <div className="journey-badge">
            <Sparkles size={14} aria-hidden="true" />
            YOUR BIRTHDAY, YOUR LITTLE UNIVERSE
          </div>
          <p className="journey-greeting">YAYYY! 🥳💖</p>
          <h1 className="journey-title" id="journey-title">
            Hey, Krithika! 💖
          </h1>
          <p className="journey-copy">
            Today is about to feel a little more special, because this little
            corner of the internet was made just for you. <span>✨</span>
          </p>
          <div className="journey-divider" aria-hidden="true">
            <span />
            <Heart size={13} fill="currentColor" />
            <span />
          </div>
          <p className="journey-question">Your birthday surprise is ready!</p>
          <button
            className="button button-journey"
            onClick={(event) => {
              onBurst(event)
              onAdvance()
            }}
            type="button"
          >
            OPEN YOUR SURPRISE <Sparkles size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {stage === 'note' && (
        <article className="journey-panel note-panel" aria-labelledby="journey-title">
          <div className="note-icon" aria-hidden="true">
            <Gift size={25} strokeWidth={1.5} />
          </div>
          <p className="journey-badge note-badge">
            <Heart size={13} fill="currentColor" aria-hidden="true" />
            A LITTLE NOTE, FROM THE HEART
          </p>
          <h1 className="note-title" id="journey-title">
            Okayyy, one thing before we continue... <span>💌</span>
          </h1>
          <p className="note-copy">
            I hope your birthday brings you countless reasons to smile,
            unexpected happiness, beautiful memories, and people who make you
            feel truly special.
          </p>
          <p className="note-cake">And yes, you deserve all the extra cake today. 🎂😂</p>
          <button
            className="button button-continue"
            onClick={onAdvance}
            type="button"
          >
            CONTINUE <ArrowRight size={16} aria-hidden="true" />
          </button>
        </article>
      )}

      {stage === 'placeholder' && (
        <div className="journey-panel placeholder-panel">
          <div className="placeholder-orbit" aria-hidden="true">
            <Sparkles size={31} />
          </div>
          <p className="journey-badge">A LITTLE MORE MAGIC AHEAD</p>
          <h1 className="journey-title" id="journey-title">
            More surprises are waiting... <span>🎁✨</span>
          </h1>
          <p className="journey-copy">
            This little corner is saving a few more birthday wishes just for you.
          </p>
          <button className="button button-journey" onClick={onAdvance} type="button">
            REVEAL THE BIRTHDAY CAKE <Sparkles size={16} aria-hidden="true" />
          </button>
        </div>
      )}

    </section>
  )
}

function App() {
  const [stage, setStage] = useState<AppStage>('invitation')
  const [isLeaving, setIsLeaving] = useState(false)
  const [noClickCount, setNoClickCount] = useState(0)
  const [birthday, setBirthday] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [burst, setBurst] = useState<BurstState | null>(null)
  const [motionScale, setMotionScale] = useState(1)
  const contentRef = useRef<HTMLDivElement>(null)
  const passwordCardRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<gsap.core.Timeline | null>(null)
  const transitionStarted = useRef(false)
  const passwordTransitionStarted = useRef(false)

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    const mobileQuery = window.matchMedia('(max-width: 700px)')
    const updateMotion = () => {
      setMotionScale(
        document.hidden || reducedMotionQuery.matches
          ? 0
          : mobileQuery.matches
            ? 0.55
            : 1,
      )
    }

    updateMotion()
    reducedMotionQuery.addEventListener('change', updateMotion)
    mobileQuery.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateMotion)

    return () => {
      reducedMotionQuery.removeEventListener('change', updateMotion)
      mobileQuery.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateMotion)
      transitionRef.current?.kill()
    }
  }, [])

  useEffect(() => {
    if (!isUnlocked || stage !== 'message') return

    if (motionScale === 0 || !passwordCardRef.current) {
      setStage('welcome')
      return
    }

    transitionRef.current?.kill()
    transitionRef.current = gsap
      .timeline({ onComplete: () => setStage('welcome') })
      .to(passwordCardRef.current, {
        opacity: 0,
        scale: 0.94,
        y: -12,
        filter: 'blur(8px)',
        duration: 0.54,
        ease: 'power2.in',
      })

    return () => {
      transitionRef.current?.kill()
    }
  }, [isUnlocked, motionScale, stage])

  function createBurst(event: ReactMouseEvent<HTMLButtonElement>, tone: BurstState['tone']) {
    setBurst({
      id: Date.now(),
      left: event.clientX,
      top: event.clientY,
      tone,
    })
  }

  function handleYes(event: ReactMouseEvent<HTMLButtonElement>) {
    if (stage !== 'invitation' || transitionStarted.current) return

    transitionStarted.current = true
    createBurst(event, 'pink')
    setIsLeaving(true)
    if (motionScale === 0 || !contentRef.current) {
      setStage('message')
      return
    }

    transitionRef.current = gsap
      .timeline({ onComplete: () => setStage('message') })
      .to(contentRef.current, {
        opacity: 0,
        scale: 0.94,
        filter: 'blur(9px)',
        y: 14,
        duration: 0.62,
        ease: 'power3.in',
      })
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (passwordTransitionStarted.current) return

    if (!/^\d{4}$/.test(birthday)) {
      setIsUnlocked(false)
      setFeedback('Please enter all four birthday digits to unlock your surprise.')
      return
    }

    if (birthday === BIRTHDAY_PASSWORD) {
      passwordTransitionStarted.current = true
      setBurst({
        id: Date.now(),
        left: window.innerWidth / 2,
        top: window.innerHeight / 2,
        tone: 'gold',
      })
      setIsUnlocked(true)
      setFeedback('')
      return
    }

    setIsUnlocked(false)
    setFeedback('That date did not unlock your surprise. Please check it and try again. 💗')
  }

  function handleStartAgain() {
    transitionRef.current?.kill()
    transitionStarted.current = false
    passwordTransitionStarted.current = false
    setIsLeaving(false)
    setNoClickCount(0)
    setBirthday('')
    setFeedback('')
    setIsUnlocked(false)
    setBurst(null)
    setStage('invitation')
  }

  const yesButtonStyle: CSSProperties = {
    fontSize: `${1 + 0.7 * (1 - Math.exp(-noClickCount * 0.18))}rem`,
    padding: `${0.9 + 0.4 * (1 - Math.exp(-noClickCount * 0.14))}rem ${1.65 + (1 - Math.exp(-noClickCount * 0.14))}rem`,
  }

  return (
    <main
      className={`app-shell${stage !== 'invitation' ? ' stage-message' : ''}${stage === 'welcome' || stage === 'note' || stage === 'placeholder' ? ' journey-mode' : ''}${stage === 'gallery' || stage === 'letter' || stage === 'finale' ? ' memory-mode' : ''}${stage === 'cake' ? ' cake-mode' : ''}${isLeaving ? ' is-transitioning' : ''}`}
    >
      <div className="ambient-background" aria-hidden="true">
        <div className="glow glow-one" />
        <div className="glow glow-two" />
        <div className="glow glow-three" />
        {stage !== 'gallery' && stage !== 'letter' && stage !== 'finale' && (
          <Suspense fallback={<div className="scene-fallback" />}>
            <CelebrationScene
              stage={stage === 'invitation' ? 'invitation' : 'message'}
              motionScale={motionScale}
            />
          </Suspense>
        )}
        <div className="birthday-title" aria-hidden="true">
          {'HAPPY BIRTHDAY'.split('').map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              style={{ '--letter-delay': `${index * 0.08}s` } as CSSProperties}
            >
              {letter === ' ' ? '\u00a0' : letter}
            </span>
          ))}
        </div>
        <div className="ambient-orbit orbit-one" />
        <div className="ambient-orbit orbit-two" />
        {skyDecorations.map((decoration, index) => (
          <span
            className={`sky-sparkle${index % 3 === 0 ? ' heart-sparkle' : ''}`}
            key={`${decoration.left}-${decoration.top}`}
            style={
              {
                '--sparkle-left': decoration.left,
                '--sparkle-top': decoration.top,
                '--sparkle-delay': decoration.delay,
                '--sparkle-size': decoration.size,
              } as CSSProperties
            }
          >
            {decoration.symbol}
          </span>
        ))}
      </div>
      {burst && (
        <div
          className={`celebration-burst burst-${burst.tone}`}
          key={burst.id}
          aria-hidden="true"
          style={{ left: burst.left, top: burst.top }}
        >
          {burstParticles.map((particle, index) => (
            <span
              key={`${burst.id}-${index}`}
              style={
                {
                  '--particle-x': particle.x,
                  '--particle-y': particle.y,
                  '--particle-delay': particle.delay,
                } as CSSProperties
              }
            >
              {particle.symbol}
            </span>
          ))}
        </div>
      )}

      <header className="topbar">
        <a className="brand" href="#home" aria-label="BirthdayVerse home">
          <span className="brand-mark" aria-hidden="true">
            b.
          </span>
          <span>birthdayverse</span>
        </a>
        <span className="topbar-note">
          <span className="topbar-heart" aria-hidden="true">
            ♥
          </span>
          made with a little extra love
        </span>
      </header>

      {stage === 'invitation' ? (
        <section
          className={`invitation-screen${isLeaving ? ' is-leaving' : ''}`}
          id="home"
          aria-labelledby="invitation-title"
        >
          <div className="invitation-content" ref={contentRef}>
            <div className="eyebrow entrance entrance-delay-1">
              <span className="eyebrow-star" aria-hidden="true">
                ✦
              </span>
              MADE WITH A LITTLE EXTRA LOVE
              <span className="eyebrow-star" aria-hidden="true">
                ✦
              </span>
            </div>

            <div className="title-wrap">
              <p className="pre-title entrance entrance-delay-2">
                For someone who deserves a little extra happiness...
              </p>
              <h1
                id="invitation-title"
                className="invitation-title"
                aria-label="A Little Birthday Surprise"
              >
                {'A Little Birthday Surprise'
                  .split(' ')
                  .map((word, index) => (
                    <span
                      className="title-word"
                      key={`${word}-${index}`}
                      style={{ animationDelay: `${0.42 + index * 0.075}s` }}
                      aria-hidden="true"
                    >
                      {word}
                    </span>
                  ))}
              </h1>
            </div>

            <p className="invitation-subtitle entrance entrance-delay-3">
              Ready for your special surprise, Krithika?
            </p>

            <div className="answer-area entrance entrance-delay-4">
              <p
                className={`reaction${noClickCount > 0 ? ' reaction-visible' : ''}`}
                aria-live="polite"
                aria-atomic="true"
              >
                {noClickCount > 0
                  ? reactions[Math.min(noClickCount - 1, reactions.length - 1)]
                  : ' '}
              </p>
              <div className="button-row">
                <button
                  className="button button-yes"
                  onClick={handleYes}
                  style={yesButtonStyle}
                  type="button"
                  disabled={isLeaving}
                >
                  YES! <Heart className="yes-heart" size={17} fill="currentColor" aria-hidden="true" />
                </button>
                <button
                  className="button button-no"
                  onClick={(event) => {
                    createBurst(event, 'pink')
                    setNoClickCount((count) => count + 1)
                  }}
                  type="button"
                  disabled={isLeaving}
                >
                  No <span aria-hidden="true">🙈</span>
                </button>
              </div>
            </div>

            <div className="invitation-footnote entrance entrance-delay-5">
              <span className="footnote-line" />
              <span>YOUR SPECIAL DAY IS WAITING TO BEGIN</span>
              <span className="footnote-line" />
            </div>
          </div>
          <div className="page-indicator" aria-hidden="true">
            <span className="indicator-dot indicator-active" />
            <span className="indicator-dot" />
          </div>
        </section>
      ) : stage === 'message' ? (
        <section
          className="message-screen"
          aria-labelledby="message-heading"
        >
          <div className="stage-intro">
            <span className="floating-gift" aria-hidden="true">
              <Gift size={20} strokeWidth={1.5} />
            </span>
            <div className="eyebrow message-eyebrow">
              <span className="eyebrow-star" aria-hidden="true">
                ✦
              </span>
              YOUR LITTLE MOMENT STARTS HERE
              <span className="eyebrow-star" aria-hidden="true">
                ✦
              </span>
            </div>
            <h1 id="message-heading" className="message-heading">
              HAPPY BIRTHDAY,
              <br />
              <span>KRITHIKA! 🎂💖</span>
            </h1>
          </div>

          <div className="message-layout">
            <div className="sweet-message">
              <span className="message-ornament" aria-hidden="true">
                “
              </span>
              <p className="message-line message-line-one">Yayyy! 🥹💖</p>
              <p className="message-line message-line-two">
                I knew you&apos;d say yes!
              </p>
              <p className="message-line message-line-three">
                Today is your day. Let the smiles be brighter, the laughter be
                louder, and the memories be unforgettable.
              </p>
              <p className="message-line message-line-four">
                A little birthday surprise is waiting just for you, and this is
                only the beginning.
              </p>
              <p className="message-line message-line-five">
                But wait... there&apos;s one tiny secret to unlock first! 🎁
              </p>
              <span className="message-signoff">
                with love, and a little bit of magic <span>♡</span>
              </span>
            </div>

            <div className="secret-card" ref={passwordCardRef}>
              {!isUnlocked ? (
                <>
                  <div className="lock-emblem" aria-hidden="true">
                    <LockKeyhole size={24} strokeWidth={1.6} />
                  </div>
                  <p className="card-kicker">A tiny birthday riddle</p>
                  <h2 className="card-heading">ONE LITTLE SECRET 🔐</h2>
                  <p className="card-helper">
                    Enter your birthday to unlock your surprise.
                  </p>

                  <form
                    className="password-form"
                    onSubmit={handlePasswordSubmit}
                    noValidate
                  >
                    <label className="password-label" htmlFor="birthday">
                      YOUR BIRTHDAY <span>DDMM</span>
                    </label>
                    <input
                      autoComplete="off"
                      className="password-input"
                      id="birthday"
                      inputMode="numeric"
                      maxLength={4}
                      name="birthday"
                      onChange={(event) => {
                        setBirthday(event.target.value.replace(/\D/g, '').slice(0, 4))
                        setFeedback('')
                      }}
                      placeholder="Enter your birthday (DDMM)"
                      type="text"
                      value={birthday}
                      aria-describedby={
                        feedback ? 'password-feedback' : undefined
                      }
                    />
                    {feedback && (
                      <p
                        className={`form-feedback${feedback.startsWith('Oops') ? ' feedback-error' : ''}`}
                        id="password-feedback"
                        role="status"
                      >
                        {feedback}
                      </p>
                    )}
                    <button className="button button-unlock" type="submit">
                      UNLOCK MY SURPRISE <Sparkles size={15} aria-hidden="true" />
                    </button>
                  </form>
                  <p className="card-footnote">
                    a little hint: it&apos;s your special day
                  </p>
                </>
              ) : (
                <div className="success-state" role="status">
                  <div className="success-emblem" aria-hidden="true">
                    <Check size={30} strokeWidth={1.7} />
                  </div>
                  <p className="card-kicker">the secret is all yours</p>
                  <h2 className="card-heading">SECRET UNLOCKED!</h2>
                  <p className="success-message">
                    Secret unlocked! 💖
                    <br />
                    Your next surprise is waiting...
                  </p>
                  <div className="success-placeholder">
                    <span className="placeholder-sparkle" aria-hidden="true">
                      ✧
                    </span>
                    A little more magic, coming soon
                  </div>
                </div>
              )}
              <span className="card-corner card-corner-top" aria-hidden="true">
                ✧
              </span>
              <span
                className="card-corner card-corner-bottom"
                aria-hidden="true"
              >
                ✧
              </span>
            </div>
          </div>

          <div className="page-indicator" aria-hidden="true">
            <span className="indicator-dot" />
            <span className="indicator-dot indicator-active" />
          </div>
        </section>
      ) : stage === 'cake' ? (
        <Suspense fallback={<div className="cake-loading">Preparing a little birthday magic…</div>}>
          <CakeExperience
            motionScale={motionScale}
            onNext={() => setStage('gallery')}
          />
        </Suspense>
      ) : stage === 'gallery' || stage === 'letter' || stage === 'finale' ? (
        <MemoryJourney
          key={stage}
          stage={stage}
          motionScale={motionScale}
          onStageChange={setStage}
          onStartAgain={handleStartAgain}
        />
      ) : (
        <BirthdayJourney
          stage={stage}
          motionScale={motionScale}
          onAdvance={() => {
            if (stage === 'welcome') setStage('note')
            else if (stage === 'note') setStage('placeholder')
            else if (stage === 'placeholder') setStage('cake')
          }}
          onBurst={(event) => createBurst(event, 'gold')}
        />
      )}

      <footer className="site-footer">
        <span>MADE FOR YOUR MOST MAGICAL DAY</span>
        <span className="footer-star" aria-hidden="true">
          ✧
        </span>
      </footer>
    </main>
  )
}

export default App
