import { Link } from 'react-router-dom'
import katex from 'katex'
import Navbar from '../components/Navbar'
import './Landing.css'

const SAMPLE_LATEX = `\\documentclass{article}
\\title{On the Nature of Light}
\\author{A. Researcher}
\\begin{document}
\\maketitle
\\section{Introduction}
Maxwell showed that light satisfies:
$$\\nabla^2 \\mathbf{E} = \\mu_0\\varepsilon_0 \\frac{\\partial^2 \\mathbf{E}}{\\partial t^2}$$
\\end{document}`

const RENDERED_MATH = (() => {
  try {
    return katex.renderToString(
      '\\nabla^2 \\mathbf{E} = \\mu_0\\varepsilon_0 \\frac{\\partial^2 \\mathbf{E}}{\\partial t^2}',
      { displayMode: true, throwOnError: false }
    )
  } catch {
    return ''
  }
})()

const FEATURES = [
  {
    icon: '∞',
    title: 'Free Forever',
    body: 'No subscriptions, no freemium limits. TeXFree is and always will be free.',
  },
  {
    icon: '⚡',
    title: 'No Account Needed',
    body: "Open the editor and start writing. Your browser does the compiling — we don't store anything.",
  },
  {
    icon: '↓',
    title: 'Instant PDF',
    body: 'Click Compile. Download your PDF. Works with equations, figures, and standard LaTeX packages.',
  },
]

const STEPS = [
  { num: '01', text: 'Write your LaTeX in the editor' },
  { num: '02', text: 'Click Compile' },
  { num: '03', text: 'Download your PDF' },
]

export default function Landing() {
  return (
    <div className="landing">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__badge">
            <span>✦</span> Free Forever · No Account Needed
          </div>

          <h1 className="hero__headline">
            Write LaTeX.<br />
            Get a PDF.<br />
            Nothing else.
          </h1>

          <p className="hero__sub">
            No Overleaf subscription. No sign-up. Just paste your LaTeX and compile.
          </p>

          <div className="hero__ctas">
            <Link to="/editor" className="btn-primary">
              Open Editor →
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See Examples
            </a>
          </div>
        </div>

        {/* Demo card */}
        <div className="demo-card">
          <div className="demo-card__topbar">
            <span className="dot dot--red" />
            <span className="dot dot--yellow" />
            <span className="dot dot--green" />
            <span className="demo-card__filename">document.tex</span>
          </div>
          <div className="demo-card__body">
            <div className="demo-card__code">
              <pre className="demo-code">{SAMPLE_LATEX}</pre>
            </div>
            <div className="demo-card__preview">
              <div className="demo-preview-paper">
                <div className="demo-preview-title">On the Nature of Light</div>
                <div className="demo-preview-author">A. Researcher</div>
                <hr className="demo-preview-rule" />
                <div className="demo-preview-section">1 Introduction</div>
                <p className="demo-preview-text">Maxwell showed that light satisfies:</p>
                <div
                  className="demo-preview-math"
                  dangerouslySetInnerHTML={{ __html: RENDERED_MATH }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features__inner">
          {FEATURES.map(f => (
            <div className="feature-card" key={f.title}>
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how" id="how-it-works">
        <div className="how__inner">
          <h2 className="how__heading">How it works</h2>
          <div className="how__steps">
            {STEPS.map(s => (
              <div className="how__step" key={s.num}>
                <div className="how__step-num">{s.num}</div>
                <p className="how__step-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <span className="footer__copy">© 2026 TeXFree</span>
          <div className="footer__links">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__link"
            >
              GitHub
            </a>
            <Link to="/editor" className="footer__link">Editor</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
