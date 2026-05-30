import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history, indentWithTab } from '@codemirror/commands'
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { latex } from 'codemirror-lang-latex'
import './EditorPane.css'

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13.5px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    background: '#16161F',
    color: '#ABB2BF',
  },
  '.cm-content': {
    padding: '12px 0',
    lineHeight: '1.65',
    caretColor: '#4F8EF7',
    color: '#ABB2BF',
  },
  '.cm-gutters': {
    background: '#1E1E2A',
    border: 'none',
    borderRight: '1px solid #2D2D3D',
    color: '#4B5263',
    fontSize: '12px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 12px 0 8px',
    minWidth: '40px',
  },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(79, 142, 247, 0.4) !important' },
  '.cm-selectionBackground': { backgroundColor: 'rgba(79, 142, 247, 0.4) !important' },
  '.cm-selectionMatch': { backgroundColor: 'rgba(79, 142, 247, 0.2)' },
  '.cm-activeLine': {
    background: 'rgba(255,255,255,0.03)',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(79, 142, 247, 0.1)',
    color: '#7C8CAA',
  },
  '.cm-cursor': {
    borderLeftColor: '#4F8EF7',
    borderLeftWidth: '2px',
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    overflow: 'auto',
  },
  '.cm-line': {
    padding: '0 16px',
    color: '#ABB2BF',
  },
}, { dark: true })

const latexHighlight = HighlightStyle.define([
  // LaTeX commands: \section, \begin, \end, \usepackage, …
  { tag: t.keyword,           color: '#61AFEF' },
  { tag: t.definitionKeyword, color: '#61AFEF' },
  // Section / heading commands
  { tag: t.heading,           color: '#61AFEF', fontWeight: 'bold' },
  // Environment names ({document}, {equation}, …)
  { tag: t.className,         color: '#C678DD' },
  // Math content: variables, special chars, dollar signs
  { tag: t.variableName,      color: '#E5C07B' },
  { tag: t.processingInstruction, color: '#E5C07B' },
  // Operators (math specials, &, ~, ctrl symbols)
  { tag: t.operator,          color: '#56B6C2' },
  // Comments (%...)
  { tag: t.comment,           color: '#5C6370', fontStyle: 'italic' },
  // Braces, brackets
  { tag: t.bracket,           color: '#ABB2BF' },
  // Literal args / strings
  { tag: t.string,            color: '#98C379' },
  // Verbatim content
  { tag: t.meta,              color: '#98C379' },
  // Numbers
  { tag: t.number,            color: '#D19A66' },
  // Labels / refs
  { tag: t.labelName,         color: '#E06C75' },
  // Bold/italic/monospace control sequences
  { tag: t.strong,            color: '#61AFEF', fontWeight: 'bold' },
  { tag: t.emphasis,          color: '#61AFEF', fontStyle: 'italic' },
  { tag: t.monospace,         color: '#98C379' },
  // Plain text
  { tag: t.content,           color: '#ABB2BF' },
])

const EditorPane = forwardRef(function EditorPane({ value, onChange, onCompile }, ref) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const onCompileRef = useRef(onCompile)
  const onChangeRef = useRef(onChange)

  useImperativeHandle(ref, () => ({
    jumpToLine(lineNumber) {
      const view = viewRef.current
      if (!view) return
      const total = view.state.doc.lines
      const target = Math.max(1, Math.min(lineNumber, total))
      const line = view.state.doc.line(target)
      view.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
      })
      view.focus()
    },
  }), [])

  useEffect(() => { onCompileRef.current = onCompile }, [onCompile])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        bracketMatching(),
        indentOnInput(),
        highlightSelectionMatches(),
        latex(),
        syntaxHighlighting(latexHighlight),
        editorTheme,
        keymap.of([
          {
            key: 'Mod-Enter',
            run() {
              onCompileRef.current?.()
              return true
            }
          },
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString())
          }
        }),
      ]
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => view.destroy()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value }
      })
    }
  }, [value])

  return (
    <div className="editor-pane-wrap">
      <div ref={containerRef} className="editor-pane" />
      <div className="editor-statusbar">
        <span className="editor-statusbar-left">SOURCE · LATEX</span>
        <span className="editor-statusbar-right">UTF-8</span>
      </div>
    </div>
  )
})

export default EditorPane
