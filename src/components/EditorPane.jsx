import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history, indentWithTab } from '@codemirror/commands'
import { bracketMatching, indentOnInput } from '@codemirror/language'
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
    background: '#16161F',
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
  '.cm-selectionBackground': { backgroundColor: '#2D3A5A !important' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#2D3A5A !important' },
  '.cm-selectionMatch': { backgroundColor: '#1a2a4a' },
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

export default function EditorPane({ value, onChange, onCompile }) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const onCompileRef = useRef(onCompile)
  const onChangeRef = useRef(onChange)

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
}
