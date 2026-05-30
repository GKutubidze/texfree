import { useEffect, useRef, useMemo } from 'react'
import katex from 'katex'
import './PreviewPane.css'

/* ── KaTeX fallback renderer ─────────────────────────────────── */
function renderLatexToHTML(source) {
  let title = '', author = '', date = ''
  const titleMatch  = source.match(/\\title\{([^}]*)\}/)
  const authorMatch = source.match(/\\author\{([^}]*)\}/)
  const dateMatch   = source.match(/\\date\{([^}]*)\}/)

  if (titleMatch)  title  = titleMatch[1]
  if (authorMatch) author = authorMatch[1]
  if (dateMatch)   date   = dateMatch[1].replace(
    '\\today',
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  )

  let body = source
  const bodyMatch = source.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)
  if (bodyMatch) body = bodyMatch[1]

  body = body.replace(/\\maketitle/g, '')
  body = body.replace(/\\documentclass(\[.*?\])?\{.*?\}/g, '')
  body = body.replace(/\\usepackage(\[.*?\])?\{.*?\}/g, '')
  body = body.replace(/\\title\{[^}]*\}/g, '')
  body = body.replace(/\\author\{[^}]*\}/g, '')
  body = body.replace(/\\date\{[^}]*\}/g, '')

  // Sections
  body = body.replace(/\\section\{([^}]*)\}/g, '<h2 class="preview-section">$1</h2>')
  body = body.replace(/\\subsection\{([^}]*)\}/g, '<h3 class="preview-subsection">$1</h3>')
  body = body.replace(/\\subsubsection\{([^}]*)\}/g, '<h4 class="preview-subsubsection">$1</h4>')

  // Text formatting
  body = body.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
  body = body.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
  body = body.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
  body = body.replace(/\\texttt\{([^}]*)\}/g, '<code>$1</code>')
  body = body.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')

  // Lists
  body = body.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, content) => {
    const items = content.split('\\item').filter(s => s.trim())
    return '<ul>' + items.map(i => `<li>${i.trim()}</li>`).join('') + '</ul>'
  })
  body = body.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, content) => {
    const items = content.split('\\item').filter(s => s.trim())
    return '<ol>' + items.map(i => `<li>${i.trim()}</li>`).join('') + '</ol>'
  })

  body = body.replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g, '<pre><code>$1</code></pre>')

  // Beamer frames
  body = body.replace(/\\begin\{frame\}\{([^}]*)\}([\s\S]*?)\\end\{frame\}/g,
    (_, ftitle, content) => `<div class="preview-frame"><h2 class="preview-frame-title">${ftitle}</h2>${content}</div>`)
  body = body.replace(/\\begin\{frame\}([\s\S]*?)\\end\{frame\}/g,
    (_, content) => `<div class="preview-frame">${content}</div>`)
  body = body.replace(/\\titlepage/g, '')

  // Special chars
  body = body.replace(/\\,/g, ' ')
  body = body.replace(/~~/g, '  ')
  body = body.replace(/~/g, ' ')
  body = body.replace(/\\newline|\\\\(?!\[)/g, '<br>')
  body = body.replace(/\\noindent/g, '')
  body = body.replace(/\\par\b/g, '</p><p>')
  body = body.replace(/\n\n+/g, '</p><p>')

  // Display math
  const renderDisplay = (math) => {
    try { return `<div class="preview-display-math">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>` }
    catch { return `<div class="preview-display-math preview-math-error">${math}</div>` }
  }
  body = body.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => renderDisplay(m))
  body = body.replace(/\\\[([\s\S]*?)\\\]/g,  (_, m) => renderDisplay(m))

  // Inline math
  body = body.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }) }
    catch { return `<span class="preview-math-error">${math}</span>` }
  })

  return { title, author, date, body: `<p>${body}</p>` }
}

/* ── status bar shared by all preview states ─────────────────── */
function StatusBar({ pdfReady, compileTime, pages }) {
  return (
    <div className="preview-statusbar">
      <span className="preview-statusbar-left">PREVIEW · PDF</span>
      {pdfReady && compileTime && (
        <span className="preview-statusbar-right">
          <span className="preview-statusbar-dot" />
          compiled · {compileTime}s{pages ? ` · ${pages}p` : ''}
        </span>
      )}
    </div>
  )
}

/* ── main component ──────────────────────────────────────────── */
export default function PreviewPane({
  compiled,        // LaTeX source for KaTeX fallback
  pdfBase64,       // base64 PDF from real backend
  useRealPdf,      // flag: show iframe vs KaTeX
  isCompiling,
  printRef,
  pdfReady,
  compileTime,
  pages,
}) {
  const contentRef = useRef(null)

  useEffect(() => {
    if (printRef) printRef.current = contentRef.current
  }, [printRef])

  // Build an object URL for the PDF blob (revoked on change / unmount)
  const pdfUrl = useMemo(() => {
    if (!pdfBase64) return null
    const bytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  }, [pdfBase64])

  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [pdfUrl])

  // Compiling spinner
  if (isCompiling) {
    return (
      <div className="preview-pane">
        <StatusBar pdfReady={pdfReady} compileTime={compileTime} pages={pages} />
        <div className="preview-compiling">
          <div className="preview-spinner" />
          <span>Compiling…</span>
        </div>
      </div>
    )
  }

  // Real PDF in iframe
  if (useRealPdf && pdfUrl) {
    return (
      <div className="preview-pane">
        <StatusBar pdfReady={pdfReady} compileTime={compileTime} pages={pages} />
        <div className="preview-pdf-wrap">
          <iframe src={pdfUrl} title="PDF Preview" className="preview-pdf-iframe" />
        </div>
      </div>
    )
  }

  // Nothing compiled yet
  if (!compiled) {
    return (
      <div className="preview-pane">
        <StatusBar pdfReady={pdfReady} compileTime={compileTime} pages={pages} />
        <div className="preview-placeholder">
          <div className="preview-placeholder-icon">∫</div>
          <p>Click <strong>Compile</strong> to render your document</p>
          <p className="preview-placeholder-hint">or press <kbd>Ctrl+Enter</kbd></p>
        </div>
      </div>
    )
  }

  // KaTeX fallback
  const { title, author, date, body } = renderLatexToHTML(compiled)
  return (
    <div className="preview-pane">
      <StatusBar pdfReady={pdfReady} compileTime={compileTime} pages={pages} />
      <div className="preview-scroll">
        <div className="preview-paper print-paper" ref={contentRef}>
          {title && (
            <div className="preview-title-block">
              <h1 className="preview-title">{title}</h1>
              {author && <p className="preview-author">{author}</p>}
              {date && <p className="preview-date">{date}</p>}
              <hr className="preview-rule" />
            </div>
          )}
          <div
            className="preview-body preview-animate-in"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </div>
    </div>
  )
}
