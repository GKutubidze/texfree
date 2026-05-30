require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { execFile, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Augment PATH so user-level TeX Live is found regardless of how node was launched
const TEXLIVE_BIN = `${os.homedir()}/texlive/bin/x86_64-linux`;
if (!process.env.PATH.includes(TEXLIVE_BIN)) {
  process.env.PATH = `${TEXLIVE_BIN}:${process.env.PATH}`;
}

// Detect available engines once at startup
const { execSync } = require('child_process');
const ENGINES = {};
['pdflatex', 'xelatex', 'lualatex'].forEach(bin => {
  try {
    execSync(`which ${bin}`, { stdio: 'ignore', env: process.env });
    ENGINES[bin] = true;
  } catch {
    ENGINES[bin] = false;
  }
});
console.log('Available engines:', Object.entries(ENGINES).filter(([,v]) => v).map(([k]) => k).join(', ') || 'none');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', engines: ENGINES, time: new Date().toISOString() });
});

app.post('/compile', async (req, res) => {
  const { latex, engine = 'pdflatex' } = req.body;

  if (!latex || typeof latex !== 'string') {
    return res.status(400).json({ error: 'No LaTeX source provided' });
  }
  if (latex.length > 500_000) {
    return res.status(400).json({ error: 'Document too large (max 500 KB)' });
  }

  const compiler = ['pdflatex', 'xelatex', 'lualatex'].includes(engine) ? engine : 'pdflatex';

  if (!ENGINES[compiler]) {
    return res.status(503).json({
      error: `${compiler} is not installed on this server`,
      engines: ENGINES,
    });
  }

  const jobId = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `texfree-${jobId}`);

  try {
    fs.mkdirSync(tmpDir, { recursive: true });

    const texFile = path.join(tmpDir, 'document.tex');
    const pdfFile = path.join(tmpDir, 'document.pdf');
    const logFile = path.join(tmpDir, 'document.log');

    fs.writeFileSync(texFile, latex, 'utf8');

    const runOnce = () => new Promise(resolve => {
      execFile(compiler, [
        '-interaction=nonstopmode',
        '-halt-on-error',
        `-output-directory=${tmpDir}`,
        texFile,
      ], { timeout: 60_000, cwd: tmpDir }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });

    const t0 = Date.now();
    await runOnce();          // first pass
    await runOnce();          // second pass (cross-refs, TOC)
    const compileTime = ((Date.now() - t0) / 1000).toFixed(2);

    if (!fs.existsSync(pdfFile)) {
      const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
      return res.status(422).json({
        error: 'Compilation failed',
        details: extractErrors(log),
        log: log.slice(-4000),
      });
    }

    const pdfBuffer = fs.readFileSync(pdfFile);
    const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';

    res.json({
      success: true,
      pdf: pdfBuffer.toString('base64'),
      compileTime: parseFloat(compileTime),
      warnings: extractWarnings(log),
      pages: countPages(log),
    });

  } catch (err) {
    console.error('Compile error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
});

function extractErrors(log) {
  const errors = [];
  const lines = log.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('!')) {
      errors.push({
        type: 'error',
        message: lines[i].slice(1).trim(),
        line: extractLineNumber(lines[i + 1] || ''),
      });
    }
  }
  return errors.slice(0, 10);
}

function extractWarnings(log) {
  return log.split('\n')
    .filter(l => l.includes('Warning:') && !l.includes('Font Warning'))
    .map(l => l.trim())
    .slice(0, 5);
}

function extractLineNumber(line) {
  const m = line.match(/l\.(\d+)/);
  return m ? parseInt(m[1]) : null;
}

function countPages(log) {
  const m = log.match(/Output written.*?(\d+) page/);
  return m ? parseInt(m[1]) : null;
}

app.listen(PORT, () => {
  console.log(`TeXFree backend → http://localhost:${PORT}`);
});
