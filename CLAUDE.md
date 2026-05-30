# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start Vite dev server (usually port 5173 or 5174 if busy)
npm run build      # production build → dist/
npm run preview    # serve the dist/ build locally
npm run lint       # ESLint across src/
```

No test suite exists yet.

## Architecture

**Stack:** Vite 8 + React 19 (JSX only, no TypeScript), React Router v7, raw CodeMirror 6, KaTeX, react-split.

**Routes** (`src/App.jsx`):
- `/` → `Landing` — marketing page with a static hero demo card
- `/editor` → `Editor` — the full split-pane editing environment
- `*` → `NotFound`

**Editor data flow:**

`Editor.jsx` owns all state: `code`, `compiled`, `isCompiling`, `pdfReady`, `compileTime`, `activeTab`. It passes slices down:

```
Editor
├── EditorPane  (value, onChange, onCompile)
└── PreviewPane (compiled, isCompiling, printRef, pdfReady, compileTime)
```

The split pane is `react-split` on desktop; `MobileTabSwitcher` shows one pane at a time on mobile (`display: none` toggle via `.editor-panel--hidden`).

**EditorPane (`src/components/EditorPane.jsx`):**

Uses raw `EditorView` from `@codemirror/view` — **not** the `@uiw/react-codemirror` wrapper. Two critical effects:
1. Init effect (`[]` deps) — creates the `EditorView` once with `doc: value` captured at mount. Callbacks (`onChange`, `onCompile`) are stored in refs so the view is never recreated when props change.
2. Sync effect (`[value]` deps) — dispatches a replacement transaction if external state diverges from the editor's own doc (e.g. loading an example).

Syntax highlighting uses `codemirror-lang-latex` (the third-party `codemirror-lang-latex` package, not `@codemirror/lang-latex`). The `Compartment` import is present but currently unused.

The theme is defined as a module-level constant (`editorTheme`) via `EditorView.theme({...}, { dark: true })`. Text visibility requires explicit `color: '#ABB2BF'` on both `'&'` and `'.cm-line'` — CodeMirror's `{ dark: true }` only suppresses the default light theme; it does not auto-apply light text.

Selection rules must use `backgroundColor` (not `background`) and need both `.cm-selectionBackground` and `&.cm-focused .cm-selectionBackground` to stay visible when focus moves to a button.

**PreviewPane (`src/components/PreviewPane.jsx`):**

`renderLatexToHTML` is a regex-based LaTeX→HTML converter — **not real TeX compilation**. It handles `\section`, `\textbf`, `itemize`/`enumerate`, `beamer` frames, and passes math through KaTeX. "Compile" in the current codebase is `setTimeout(350ms)` that calls this function; there is no pdflatex backend yet.

"Download PDF" triggers `window.print()` — not actual PDF export.

**Styling:**

Design tokens live in `src/styles/tokens.css` (imported by `src/styles/global.css`). Every page and component has a co-located CSS file (e.g. `Editor.css` next to `Editor.jsx`, `EditorPane.css` next to `EditorPane.jsx`). The editor dark theme colors are defined twice: once as CSS variables in `tokens.css` (`--editor-bg`, `--editor-text`, etc.) and once as hard-coded hex strings inside the `EditorView.theme()` call — keep them in sync when changing colors.

**Example documents** are defined as template literals directly in `Editor.jsx` in the `EXAMPLES` object. `DEFAULT_LATEX = EXAMPLES.article` (the Gaussian integral document) is the initial `useState` value and thus what CodeMirror's `doc: value` receives on first mount.
