import { useEffect, useRef, useState } from 'react'
import './App.css'

const DURATION = 60
const BEST_SCORE_KEY = 'speedyfingers.personalBest.v1'

const WORDS = `
  about after again air all also always another any around
  ask away back because before begin best better between big
  book both bring build call can change city close come could
  country day different do down each early easy end even every
  example eye face family far feel few find first follow food
  for form friend from get give go good great group grow hand
  happy hard have head hear help here high home house how idea
  important into just keep kind know land large last late learn
  leave left let life light like line list little live long look
  made make many may mean might mile more morning most move much
  music must name near need never new next night now number often
  old once one only open order other our out over own page paper
  part people place plan play point put question quick read real
  right river road room run same school sea second see seem set
  show side small some something sometimes sound start state still
  stop story study such take talk tell than that their them then
  there these they thing think this those thought three through
  time together too tree try turn two under until use very walk
  want water way well went were what when where which while white
  who why will wind with without word work world would write year
  yes yet you young your
`.trim().split(/\s+/)

function generateWords(count = 200) {
  return Array.from(
    { length: count },
    () => WORDS[Math.floor(Math.random() * WORDS.length)],
  ).join(' ')
}

function readPersonalBest() {
  try {
    const stored = localStorage.getItem(BEST_SCORE_KEY)

    if (stored === null) return null

    const score = JSON.parse(stored)

    return Number.isInteger(score) && score >= 0 ? score : null
  } catch {
    return null
  }
}

function SkeletonHand({ className }) {
  return (
    <svg
      className={`skeleton-hand ${className}`}
      viewBox="0 0 120 180"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Finger bones */}
        <path d="M35 82 L30 64 M28 57 L24 42 M22 35 L20 25" />
        <path d="M51 72 L49 49 M48 42 L46 25 M45 18 L44 9" />
        <path d="M68 70 L69 45 M69 38 L70 21 M70 14 L70 5" />
        <path d="M84 77 L89 56 M91 49 L95 34 M97 27 L100 19" />

        {/* Thumb bones */}
        <path d="M33 117 L20 103 M16 97 L10 85 M8 79 L6 70" />

        {/* Palm bones */}
        <path d="M36 91 L48 130" />
        <path d="M52 81 L57 130" />
        <path d="M68 79 L67 130" />
        <path d="M82 86 L76 130" />
        <path d="M39 122 L45 133" />

        {/* Wrist bones */}
        <path d="M47 140 L53 144 M63 140 L69 144 M77 139 L80 143" />

        {/* Forearm bones */}
        <path d="M54 152 L52 175 M73 152 L78 175" />
      </g>

      <g fill="currentColor">
        <circle cx="34" cy="86" r="3.5" />
        <circle cx="52" cy="76" r="3.5" />
        <circle cx="68" cy="74" r="3.5" />
        <circle cx="83" cy="81" r="3.5" />
        <circle cx="35" cy="120" r="3.5" />
      </g>
    </svg>
  )
}

function App() {
  const [passage, setPassage] = useState(generateWords)
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState('ready')
  const [remaining, setRemaining] = useState(DURATION)
  const [attempts, setAttempts] = useState(0)
  const [correctAttempts, setCorrectAttempts] = useState(0)
  const [savedBest, setSavedBest] = useState(readPersonalBest)

  const deadlineRef = useRef(null)
  const typingRef = useRef(null)
  const caretRef = useRef(null)

  // A deadline keeps delayed timer updates from extending the test.
  useEffect(() => {
    if (status !== 'running') return

    function updateTimer() {
      const seconds = Math.max(
        0,
        (deadlineRef.current - performance.now()) / 1000,
      )

      setRemaining(seconds)

      if (seconds === 0) {
        setStatus('finished')
      }
    }

    const interval = window.setInterval(updateTimer, 100)

    return () => window.clearInterval(interval)
  }, [status])

  // Scroll within the typing area as the current character moves.
  useEffect(() => {
    const area = typingRef.current
    const caret = caretRef.current

    if (!area || !caret) return

    const areaBounds = area.getBoundingClientRect()
    const caretBounds = caret.getBoundingClientRect()

    if (
      caretBounds.bottom > areaBounds.bottom - 20 ||
      caretBounds.top < areaBounds.top + 20
    ) {
      area.scrollTop += caretBounds.top - areaBounds.top - 45
    }
  }, [typed])

  const elapsed = DURATION - remaining

  const correctCharacters = Array.from(typed).reduce(
    (total, character, index) =>
      total + (character === passage[index] ? 1 : 0),
    0,
  )

  const wpm = elapsed > 0
    ? Math.round(correctCharacters / 5 / (elapsed / 60))
    : 0

  const accuracy = attempts > 0
    ? Math.round((correctAttempts / attempts) * 100)
    : 100

  const mistakes = attempts - correctAttempts

  // Use the exact ratio for eligibility, rather than rounded accuracy.
  const qualifiesForBest =
    status === 'finished' &&
    attempts > 0 &&
    correctAttempts / attempts >= 0.9

  const personalBest = qualifiesForBest
    ? Math.max(savedBest ?? 0, wpm)
    : savedBest

  const isNewBest =
    qualifiesForBest && (savedBest === null || wpm > savedBest)

  useEffect(() => {
    if (personalBest === null) return

    try {
      localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(personalBest))
    } catch {
      // The test still works if browser storage is unavailable.
    }
  }, [personalBest])

  function handleKeyDown(event) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }

    const isCharacter = event.key.length === 1
    const isBackspace = event.key === 'Backspace'

    if (!isCharacter && !isBackspace) return

    event.preventDefault()

    if (status === 'finished') return

    // Check the deadline on input too, including after a background tab.
    if (
      deadlineRef.current !== null &&
      performance.now() >= deadlineRef.current
    ) {
      setRemaining(0)
      setStatus('finished')
      return
    }

    if (isBackspace) {
      setTyped((previous) => previous.slice(0, -1))
      return
    }

    if (status === 'ready') {
      deadlineRef.current = performance.now() + DURATION * 1000
      setStatus('running')
    }

    setAttempts((previous) => previous + 1)

    if (event.key === passage[typed.length]) {
      setCorrectAttempts((previous) => previous + 1)
    }

    setTyped((previous) => previous + event.key)

    if (passage.length - typed.length < 300) {
      setPassage((previous) => `${previous} ${generateWords(100)}`)
    }
  }

  function restartTest() {
    setSavedBest(personalBest)
    deadlineRef.current = null
    setPassage(generateWords())
    setTyped('')
    setStatus('ready')
    setRemaining(DURATION)
    setAttempts(0)
    setCorrectAttempts(0)

    // Focus after React restores the typing area from the results view.
    window.requestAnimationFrame(() => {
      if (typingRef.current) {
        typingRef.current.scrollTop = 0
        typingRef.current.focus()
      }
    })
  }

  const statusLabel = {
    ready: 'SYSTEM READY',
    running: 'TEST RUNNING',
    finished: 'TEST COMPLETE',
  }[status]

  // Calculate each word's starting position once per render.
  const passageWords = []
  let position = 0

  for (const word of passage.split(' ')) {
    passageWords.push({ word, start: position })
    position += word.length + 1
  }

  return (
    <div className="app">
      <div className="background-hands" aria-hidden="true">
        <SkeletonHand className="hand-one" />
        <SkeletonHand className="hand-two" />
        <SkeletonHand className="hand-three" />
      </div>

      <header className="site-header">
        <a className="brand" href="./" aria-label="SpeedyFingers home">
          <span className="brand-icon" aria-hidden="true">&gt;_</span>
          speedy<span>fingers</span>
        </a>

        <span className="terminal-status">
          <span className="status-light" />
          {statusLabel}
        </span>
      </header>

      <main className="test-container">
        <div className="test-heading">
          <p className="eyebrow">SPEEDYFINGERS // TYPING TEST</p>
          <h1>Let your fingers do the talking.</h1>
          <p className="description">
            Everyday words. Sixty seconds. Find your rhythm.
          </p>
        </div>

        <section className="test-panel" aria-label="Typing test">
          <div className="test-toolbar">
            <span className="mode-label">ENGLISH / 60 SECONDS</span>
            <span className="preview-label">{statusLabel}</span>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="stat-label">TIME LEFT</span>
              <span
                className={`stat-value timer ${
                  remaining <= 10 ? 'timer-urgent' : ''
                }`}
              >
                {Math.ceil(remaining)}
                <span className="unit">s</span>
              </span>
            </div>

            <div className="stat">
              <span className="stat-label">WORDS / MIN</span>
              <span className="stat-value">
                {status === 'ready' ? '—' : wpm}
              </span>
            </div>

            <div className="stat">
              <span className="stat-label">ACCURACY</span>
              <span className="stat-value">
                {status === 'ready' ? '—' : `${accuracy}%`}
              </span>
            </div>

            <div className="stat">
              <span className="stat-label">PERSONAL BEST</span>
              <span className="stat-value">
                {personalBest === null ? '—' : personalBest}
                {personalBest !== null && (
                  <span className="unit">wpm</span>
                )}
              </span>
            </div>
          </div>

          {status === 'finished' ? (
            <div className="results" role="status">
              <p className="eyebrow">SESSION COMPLETE</p>
              <h2>Your time is up.</h2>

              <p>
                {wpm} WPM · {accuracy}% accuracy · {mistakes} mistakes
              </p>

              <p className="results-note">
                {!qualifiesForBest
                  ? 'Reach at least 90% accuracy to qualify for a personal best.'
                  : isNewBest
                    ? 'New personal best. Your next challenge: beat it.'
                    : 'Session complete. Try another round to beat your best.'}
              </p>
            </div>
          ) : (
            <>
              <p className="typing-hint" id="typing-instructions">
                Click the words or press Tab to focus. Type to begin.
              </p>

              <div
                className="typing-area interactive"
                ref={typingRef}
                tabIndex={0}
                role="textbox"
                aria-label="Typing test input"
                aria-describedby="typing-instructions"
                aria-multiline="true"
                onKeyDown={handleKeyDown}
                onPaste={(event) => event.preventDefault()}
                spellCheck={false}
              >
                <p className="words">
                  {passageWords.map(({ word, start }) => {
                    const hasSpace = start + word.length < passage.length
                    const characters = word + (hasSpace ? ' ' : '')

                    return (
                      <span className="word" key={start}>
                        {Array.from(characters).map((character, index) => {
                          const characterPosition = start + index
                          const isCurrent =
                            characterPosition === typed.length

                          let className = 'character'

                          if (characterPosition < typed.length) {
                            className +=
                              typed[characterPosition] === character
                                ? ' correct'
                                : ' incorrect'
                          }

                          if (isCurrent) className += ' current'

                          return (
                            <span
                              key={characterPosition}
                              className={className}
                              ref={isCurrent ? caretRef : null}
                            >
                              {character}
                            </span>
                          )
                        })}
                      </span>
                    )
                  })}
                </p>
              </div>
            </>
          )}

          <div className="test-footer controls">
            <span>
              {status === 'finished'
                ? 'Personal bests require at least 90% accuracy.'
                : 'Backspace to correct · Timer continues when unfocused'}
            </span>

            <button
              className="restart-button"
              type="button"
              onClick={restartTest}
            >
              Restart ↻
            </button>
          </div>
        </section>

        <p className="bottom-note">
          TAKE A BREATH. FIND YOUR PACE.
        </p>
      </main>

      <footer className="site-footer">
        <span>SPEEDYFINGERS</span>
        <span>Built one keystroke at a time.</span>
      </footer>
    </div>
  )
}

export default App