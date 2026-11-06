import './App.css'

const previewWords =
  'the world feels quiet as you begin another small journey through the words on your screen'

function App() {
  return (
    <div className="app">
      <header className="site-header">
        <a className="brand" href="./" aria-label="SpeedyFingers home">
          <span className="brand-icon" aria-hidden="true">&gt;_</span>
          speedy<span>fingers</span>
        </a>

        <span className="terminal-status">
          <span className="status-light" />
          SYSTEM READY
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

        <section className="test-panel" aria-label="Typing test preview">
          <div className="test-toolbar">
            <span className="mode-label">ENGLISH / 60 SECONDS</span>
            <span className="preview-label">LAYOUT PREVIEW</span>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="stat-label">TIME LEFT</span>
              <span className="stat-value timer">
                60<span className="unit">s</span>
              </span>
            </div>

            <div className="stat">
              <span className="stat-label">WORDS / MIN</span>
              <span className="stat-value">—</span>
            </div>

            <div className="stat">
              <span className="stat-label">ACCURACY</span>
              <span className="stat-value">—</span>
            </div>
          </div>

          <div className="typing-area">
            <p className="words">{previewWords}</p>
          </div>

          <div className="test-footer">
            <span>Typing controls will be connected next.</span>
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