import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar({ transparent = false }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className={`navbar ${transparent ? 'navbar--transparent' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-dot" />
          TeXFree
        </Link>

        <div className="navbar__links">
          <a href="#how-it-works" className="navbar__link">How it works</a>
          <a
            href="https://github.com/GKutubidze/texfree"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__link"
          >
            GitHub
          </a>
          <Link to="/editor" className="navbar__cta">Open Editor</Link>
        </div>

        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-icon ${menuOpen ? 'open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>
      </div>

      {menuOpen && (
        <div className="navbar__mobile-menu">
          <a href="#how-it-works" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>How it works</a>
          <a
            href="https://github.com/GKutubidze/texfree"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            GitHub
          </a>
          <Link to="/editor" className="navbar__mobile-cta" onClick={() => setMenuOpen(false)}>Open Editor</Link>
        </div>
      )}
    </nav>
  )
}
