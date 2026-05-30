import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import Split from 'react-split'
import EditorPane from '../components/EditorPane'
import PreviewPane from '../components/PreviewPane'
import MobileTabSwitcher from '../components/MobileTabSwitcher'
import { compileLatex } from '../lib/api'
import { EXAMPLES, DEFAULT_EXAMPLE } from '../lib/examples'
import './Editor.css'

export default function Editor() {
  // filename state
  const [filename, setFilename] = useState('paper.tex')
  const [renamingFile, setRenamingFile] = useState(false)
  const preEditFilename = useRef('')
  const filenameInputRef = useRef(null)

  const startRename = () => {
    preEditFilename.current = filename
    setRenamingFile(true)
  }

  const commitRename = useCallback((val) => {
    const trimmed = val.trim()
    setFilename(trimmed || preEditFilename.current)
    setRenamingFile(false)
  }, [])

  const cancelRename = useCallback(() => {
    setFilename(preEditFilename.current)
    setRenamingFile(false)
  }, [])

  useLayoutEffect(() => {
    if (renamingFile && filenameInputRef.current) {
      filenameInputRef.current.select()
    }
  }, [renamingFile])

  // editor state
  const [code, setCode] = useState(() => {
    try { return localStorage.getItem('texfree-document') || DEFAULT_EXAMPLE }
    catch { return DEFAULT_EXAMPLE }
  })
  const [savedStatus, setSavedStatus] = useState('saved') // 'saved' | 'saving'

  // compile / preview state
  const [pdfBase64, setPdfBase64]   = useState(null)   // real PDF from backend
  const [compiled, setCompiled]     = useState(null)   // source passed to KaTeX fallback
  const [isCompiling, setIsCompiling] = useState(false)
  const [compileTime, setCompileTime] = useState(null)
  const [pages, setPages]           = useState(null)
  const [pdfReady, setPdfReady]     = useState(false)
  const [useRealPdf, setUseRealPdf] = useState(false)  // true when backend returned PDF
  const [engine, setEngine]         = useState('pdflatex')

  // errors / warnings
  const [errors, setErrors]         = useState([])
  const [warnings, setWarnings]     = useState([])
  const [logExcerpt, setLogExcerpt] = useState(null)
  const [showErrors, setShowErrors] = useState(false)

  // UI
  const [activeTab, setActiveTab]     = useState('code')
  const [showExamples, setShowExamples] = useState(false)
  const [showHelp, setShowHelp]         = useState(false)
  const [toast, setToast]               = useState(null)
  const printRef    = useRef(null)
  const examplesRef = useRef(null)
  const editorRef   = useRef(null)

  // ── auto-save ────────────────────────────────────────────────
  useEffect(() => {
    setSavedStatus('saving')
    const t = setTimeout(() => {
      try { localStorage.setItem('texfree-document', code) } catch {}
      setSavedStatus('saved')
    }, 800)
    return () => clearTimeout(t)
  }, [code])

  // ── close dropdown on outside click ──────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (examplesRef.current && !examplesRef.current.contains(e.target))
        setShowExamples(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── toast helper ─────────────────────────────────────────────
  const showToast = useCallback((msg, ms = 3500) => {
    setToast(msg)
    setTimeout(() => setToast(null), ms)
  }, [])

  // ── compile ───────────────────────────────────────────────────
  const compile = useCallback(async () => {
    if (isCompiling) return
    setIsCompiling(true)
    setErrors([])
    setWarnings([])
    setLogExcerpt(null)

    const t0 = Date.now()
    try {
      // Try real backend first
      const result = await compileLatex({ latex: code, engine })
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
      setPdfBase64(result.pdf)
      setCompileTime(result.compileTime ?? elapsed)
      setPages(result.pages)
      setWarnings(result.warnings || [])
      setPdfReady(true)
      setUseRealPdf(true)
      setCompiled(null)
      if (result.warnings?.length) setShowErrors(true)
      if (activeTab === 'code') setActiveTab('preview')
    } catch (err) {
      // Backend unavailable or pdflatex missing → fall back to KaTeX renderer
      if (err.engines || err.message?.includes('Failed to fetch') || err.message?.includes('not installed')) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
        setCompiled(code)
        setCompileTime(elapsed)
        setPdfReady(true)
        setUseRealPdf(false)
        setPdfBase64(null)
        if (activeTab === 'code') setActiveTab('preview')
        if (err.engines) showToast('Backend offline — showing KaTeX preview')
      } else {
        // Real compile error (bad LaTeX)
        setErrors(err.details || [{ message: err.message }])
        setWarnings(err.warnings || [])
        setLogExcerpt(err.logExcerpt || null)
        setShowErrors(true)
        showToast('Compilation failed — see error panel', 4500)
      }
    } finally {
      setIsCompiling(false)
    }
  }, [code, engine, isCompiling, activeTab, showToast])

  // global Ctrl/Cmd+Enter shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        compile()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [compile])

  // ── download ──────────────────────────────────────────────────
  const downloadPDF = useCallback(() => {
    if (pdfBase64) {
      // Real PDF download
      const bytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
      const blob  = new Blob([bytes], { type: 'application/pdf' })
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement('a')
      a.href = url
      const baseName = filename.endsWith('.tex') ? filename.slice(0, -4) : filename
      a.download = baseName + '.pdf'
      a.click()
      URL.revokeObjectURL(url)
      showToast('PDF downloaded')
    } else if (printRef.current) {
      // KaTeX fallback — browser print
      const content  = printRef.current.innerHTML
      const printDiv = document.getElementById('editor-print-root')
      if (printDiv) printDiv.innerHTML = content
      showToast("Opening print dialog — choose 'Save as PDF'")
      setTimeout(() => window.print(), 400)
    }
  }, [pdfBase64, filename, showToast])

  // ── examples ──────────────────────────────────────────────────
  const loadExample = useCallback((key) => {
    setCode(EXAMPLES[key].content)
    setShowExamples(false)
    setPdfBase64(null)
    setCompiled(null)
    setPdfReady(false)
    setUseRealPdf(false)
    setErrors([])
    setWarnings([])
    setShowErrors(false)
    showToast(`Loaded: ${EXAMPLES[key].name}`)
  }, [showToast])

  return (
    <div className="editor-page">
      {/* print-only target for KaTeX fallback */}
      <div id="editor-print-root" className="editor-print-target preview-print-target print-paper" />

      {/* ── TOPBAR ──────────────────────────────────────────── */}
      <header className="editor-topbar">
        {/* left: logo | separator | file tab */}
        <Link to="/" className="editor-logo" title="Back to home">
          <span className="editor-logo-tx">Tx</span>
          TeXFree
        </Link>
        <span className="editor-topbar-sep" />
        {renamingFile ? (
          <input
            ref={filenameInputRef}
            className="editor-topbar-file-input"
            value={filename}
            onChange={e => setFilename(e.target.value)}
            onBlur={e => commitRename(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename(e.target.value)
              if (e.key === 'Escape') cancelRename()
            }}
          />
        ) : (
          <div
            className="editor-topbar-file-tab"
            onClick={startRename}
            title="Click to rename"
          >
            <span className="editor-topbar-file-dot" />
            {filename}
          </div>
        )}

        {/* right: save indicator, engine, compile, download, examples, help */}
        <div className="editor-topbar-actions">
          <span className={`editor-saved-badge ${savedStatus === 'saving' ? 'unsaved' : ''}`}>
            <span className="editor-saved-dot" />
            {savedStatus === 'saving' ? 'Saving…' : 'Saved locally'}
          </span>

          <select
            className="editor-engine-select"
            value={engine}
            onChange={e => setEngine(e.target.value)}
            title="LaTeX engine"
          >
            <option value="pdflatex">pdflatex</option>
            <option value="xelatex">xelatex</option>
            <option value="lualatex">lualatex</option>
          </select>

          <button
            className={`btn-compile ${isCompiling ? 'is-compiling' : ''}`}
            onClick={compile}
            disabled={isCompiling}
          >
            {isCompiling
              ? <><span className="btn-spinner" /> Compiling…</>
              : <><span>▶</span> Compile <span className="btn-compile-kbd">⌘↵</span></>
            }
          </button>

          <button
            className="btn-outline"
            onClick={downloadPDF}
            disabled={!pdfReady}
            title="Download PDF"
          >
            ↓ Download PDF
          </button>

          <div className="examples-dropdown" ref={examplesRef}>
            <button className="btn-outline" onClick={() => setShowExamples(v => !v)}>
              Examples ▾
            </button>
            {showExamples && (
              <div className="examples-menu">
                {Object.entries(EXAMPLES).map(([key, ex]) => (
                  <button key={key} onClick={() => loadExample(key)}>
                    {ex.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="btn-icon" onClick={() => setShowHelp(true)} title="Keyboard shortcuts">
            ⓘ
          </button>
        </div>
      </header>

      {/* ── MOBILE TABS ─────────────────────────────────────── */}
      <div className="editor-mobile-tabs">
        <MobileTabSwitcher activeTab={activeTab} onSwitch={setActiveTab} />
      </div>

      {/* ── SPLIT PANES ─────────────────────────────────────── */}
      <div className="editor-body">
        <Split
          className="editor-split"
          sizes={[50, 50]}
          minSize={[200, 200]}
          gutterSize={5}
          snapOffset={0}
        >
          <div className={`editor-panel ${activeTab === 'preview' ? 'editor-panel--hidden' : ''}`}>
            <EditorPane ref={editorRef} value={code} onChange={setCode} onCompile={compile} />
          </div>
          <div className={`editor-panel ${activeTab === 'code' ? 'editor-panel--hidden' : ''}`}>
            <PreviewPane
              compiled={compiled}
              pdfBase64={pdfBase64}
              useRealPdf={useRealPdf}
              isCompiling={isCompiling}
              printRef={printRef}
              pdfReady={pdfReady}
              compileTime={compileTime}
              pages={pages}
            />
          </div>
        </Split>
      </div>

      {/* ── ERROR PANEL ─────────────────────────────────────── */}
      {showErrors && (errors.length > 0 || warnings.length > 0) && (
        <div className="error-panel">
          <div className="error-panel-header">
            <span>
              {[
                errors.length > 0 && `${errors.length} error${errors.length > 1 ? 's' : ''}`,
                warnings.length > 0 && `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`,
              ].filter(Boolean).join(', ')}
            </span>
            <div className="error-panel-header-actions">
              {(errors.length > 0 || logExcerpt) && (
                <button
                  className="error-panel-copy-btn"
                  onClick={() => {
                    const lines = [
                      ...errors.map(e => `Error: ${e.message}${e.line ? ` (line ${e.line})` : ''}${e.context ? ` — ${e.context}` : ''}`),
                      ...warnings.map(w => `Warning: ${w}`),
                      ...(logExcerpt ? ['\n--- Log ---', logExcerpt] : []),
                    ]
                    navigator.clipboard.writeText(lines.join('\n')).catch(() => {})
                    showToast('Error copied to clipboard')
                  }}
                >
                  Copy Error
                </button>
              )}
              <button onClick={() => setShowErrors(false)}>✕</button>
            </div>
          </div>
          {errors.map((e, i) => (
            <div key={i} className="error-item is-error">
              <span className="error-item__icon">✕</span>
              <span className="error-item__message">{e.message}</span>
              {e.context && <code className="error-item__context">{e.context}</code>}
              {e.line != null && (
                <span
                  className="error-item__line is-link"
                  onClick={() => editorRef.current?.jumpToLine(e.line)}
                  title="Jump to this line in the editor"
                >
                  line {e.line}
                </span>
              )}
            </div>
          ))}
          {warnings.map((w, i) => (
            <div key={i} className="error-item is-warning">
              <span className="error-item__icon">⚠</span>
              <span>{w}</span>
            </div>
          ))}
          {logExcerpt && (
            <div className="error-log-excerpt">
              <div className="error-log-excerpt-header">Log output (last 50 lines)</div>
              <pre className="error-log-excerpt-body">{logExcerpt}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── TOAST ───────────────────────────────────────────── */}
      {toast && <div className="editor-toast">{toast}</div>}

      {/* ── HELP MODAL ──────────────────────────────────────── */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Keyboard Shortcuts</h2>
              <button className="modal-close" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            <div className="modal-body">
              {[
                ['Compile',        'Ctrl+Enter / ⌘↵'],
                ['Undo',           'Ctrl+Z'],
                ['Redo',           'Ctrl+Shift+Z'],
                ['Find',           'Ctrl+F'],
                ['Select All',     'Ctrl+A'],
                ['Indent',         'Tab'],
              ].map(([action, shortcut]) => (
                <div key={action} className="shortcut-row">
                  <span>{action}</span>
                  <kbd>{shortcut}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
