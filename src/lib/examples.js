export const EXAMPLES = {
  article: {
    name: 'Academic Paper',
    filename: 'paper.tex',
    content: `\\documentclass{article}
\\usepackage{amsmath, amssymb, geometry}
\\geometry{margin=1in}
\\title{On Free Knowledge}
\\author{A. Researcher}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
We demonstrate that genuinely useful tools need not cost a thing,
and that focus---not features---is what lets ideas reach the page.
\\end{abstract}

\\section{Introduction}
Writing mathematics should be frictionless. Consider the Gaussian integral:
\\begin{equation}
  \\int_0^{\\infty} e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
\\end{equation}

\\section{Method}
Our approach rests on three principles:
\\begin{itemize}
  \\item No account stands between a writer and the page.
  \\item Compilation happens locally, so the source stays private.
  \\item The interface disappears, leaving only the document.
\\end{itemize}

For a function $f$ continuous on $[a,b]$, the fundamental theorem gives
$\\int_a^b f'(x)\\,dx = f(b) - f(a)$.

\\section{Conclusion}
Free need not mean lesser. Open the editor and judge for yourself.

\\end{document}`,
  },

  math: {
    name: 'Math Notes',
    filename: 'math.tex',
    content: `\\documentclass{article}
\\usepackage{amsmath, amssymb, amsthm}
\\newtheorem{theorem}{Theorem}
\\title{Calculus: Key Results}
\\author{Student Notes}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Fundamental Theorem of Calculus}
\\begin{theorem}
If $f$ is continuous on $[a, b]$ and $F' = f$, then:
\\[ \\int_a^b f(x)\\,dx = F(b) - F(a) \\]
\\end{theorem}

\\section{Taylor Series}
For an infinitely differentiable function $f$:
\\[ f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n \\]

Notable expansions:
\\begin{align}
  e^x &= \\sum_{n=0}^{\\infty} \\frac{x^n}{n!} \\\\
  \\sin x &= \\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n+1}}{(2n+1)!} \\\\
  \\cos x &= \\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n}}{(2n)!}
\\end{align}

\\end{document}`,
  },

  cv: {
    name: 'CV / Resume',
    filename: 'cv.tex',
    content: `\\documentclass[11pt, a4paper]{article}
\\usepackage{geometry, enumitem, titlesec, hyperref}
\\geometry{top=2cm, bottom=2cm, left=2.5cm, right=2.5cm}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\setlength{\\parindent}{0pt}

\\begin{document}

{\\Huge\\bfseries Your Name}\\\\[4pt]
your.email@example.com $\\cdot$ +1 555-000-0000 $\\cdot$ City, Country

\\section{Experience}
\\textbf{Senior Engineer} \\hfill 2022 -- Present\\\\
\\textit{Some Company}
\\begin{itemize}[leftmargin=*, noitemsep]
  \\item Led development of core product features
  \\item Mentored team of 4 junior engineers
\\end{itemize}

\\section{Education}
\\textbf{M.Sc. Computer Science} \\hfill 2020\\\\
\\textit{University Name}

\\section{Skills}
Python, TypeScript, React, Node.js, PostgreSQL, Docker

\\end{document}`,
  },

  beamer: {
    name: 'Presentation',
    filename: 'slides.tex',
    content: `\\documentclass{beamer}
\\usetheme{Madrid}
\\title{Introduction to TeXFree}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\begin{frame}
\\titlepage
\\end{frame}

\\begin{frame}{What is TeXFree?}
\\begin{itemize}
  \\item Free online LaTeX editor
  \\item No account needed
  \\item Real PDF compilation via pdflatex
  \\item Works with any LaTeX package
\\end{itemize}
\\end{frame}

\\begin{frame}{Mathematics}
The Euler identity:
\\[ e^{i\\pi} + 1 = 0 \\]
Combines: $e$, $i$, $\\pi$, $1$, $0$
\\end{frame}

\\end{document}`,
  },
};

export const DEFAULT_EXAMPLE = EXAMPLES.article.content;
