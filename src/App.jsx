import { useEffect, useRef, useState } from 'react'
import './App.css'

const DURATION = 60

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

function App() {
  const [passage, setPassage] = useState(generateWords)
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState('ready')
  const [remaining, setRemaining] = useState(DURATION)
  const [attempts, setAttempts] = useState(0)
  const [correctAttempts, setCorrectAttempts] = useState(0)

  const deadlineRef = useRef(null)
  const typingRef = useRef(null)
  const caretRef = useRef(null)

  // Use a deadline so delayed timer updates do not extend the test.
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

  // Keep the current character visible inside the typing area.
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

    // Add more words before the user reaches the end.
    if (passage.length - typed.length < 300) {
      setPassage((previous) => `${previous} ${generateWords(100)}`)
    }
  }

  function restartTest() {
    deadlineRef.current = null
    setPassage(generateWords())
    setTyped('')
    setStatus('ready')
    setRemaining(DURATION)
    setAttempts(0)
    setCorrectAttempts(0)

    if (typingRef.current) {
      typingRef.current.scrollTop = 0
      typingRef.current.focus()
    }
  }

  const elapsed = DURATION - remaining

  // Only characters currently correct in the passage contribute to WPM.
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

  const statusLabel = {
    ready: 'SYSTEM READY',
    running: 'TEST RUNNING',
    finished: 'TEST COMPLETE',
  }[status]

  return (
    <div className="app">
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
          </div>

          {status === 'finished' ? (
            <div className="results" role="status">
              <p className="eyebrow">SESSION COMPLETE</p>
              <h2>Your time is up.</h2>
              <p>
                {wpm} WPM · {accuracy}% accuracy · {mistakes} mistakes
              </p>
              <p className="results-note">
                Take a breath, then try another round.
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
                  {passage.split(' ').map((word, wordIndex) => {
                    const start = passage
                      .split(' ')
                      .slice(0, wordIndex)
                      .join(' ').length + (wordIndex > 0 ? 1 : 0)

                    return (
                      <span className="word" key={wordIndex}>
                        {Array.from(
                          word + (
                            start + word.length < passage.length ? ' ' : ''
                          ),
                        ).map((character, index) => {
                          const position = start + index
                          let className = 'character'

                          if (position < typed.length) {
                            className += typed[position] === character
                              ? ' correct'
                              : ' incorrect'
                          }

                          const isCurrent = position === typed.length

                          if (isCurrent) className += ' current'

                          return (
                            <span
                              key={position}
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
                ? 'Restart for a fresh set of words.'
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