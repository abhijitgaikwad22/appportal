/**
 * AppPortal — Backend Server
 * ═══════════════════════════════════════════════════════════
 * Architecture mirrors the Java 21 HttpServer implementation:
 *   Java HttpServer  ←→  Node.js http.createServer
 *   HttpHandler      ←→  Route handler functions
 *   SHA-256 (Java)   ←→  crypto.createHash('sha256')
 *   Files.writeString←→  fs.writeFileSync
 *   Virtual Threads  ←→  Node.js async I/O (non-blocking)
 *
 * Zero external dependencies — uses only Node.js built-ins.
 * ═══════════════════════════════════════════════════════════
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const WEB_ROOT = path.join(__dirname, 'web');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists (mirrors Files.createDirectories in Java)
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ── MIME types (mirrors StaticHandler.MIME in Java) ─────── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
};

/* ── JSON helpers (mirrors JsonUtil.java) ────────────────── */
const Json = {
  ok:  msg  => JSON.stringify({ status: 'ok',    message: msg }),
  err: msg  => JSON.stringify({ status: 'error', message: msg }),

  save(filename, record) {
    const file = path.join(DATA_DIR, filename);
    let arr = [];
    if (fs.existsSync(file)) {
      try { arr = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
    }
    arr.push(record);
    fs.writeFileSync(file, JSON.stringify(arr, null, 2));
  },

  load(filename) {
    const file = path.join(DATA_DIR, filename);
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
  },

  count(filename) {
    try { return Json.load(filename).length; } catch { return 0; }
  }
};

/* ── SHA-256 (mirrors RegisterHandler.sha256 in Java) ───── */
const sha256 = str => crypto.createHash('sha256').update(str).digest('hex');

/* ── Body reader (mirrors JsonUtil.body in Java) ─────────── */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end',  ()    => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    // FIX 3: Handle aborted/errored requests to prevent memory leaks
    req.on('error', err => {
      console.error('[readBody] request error:', err.message);
      reject(err);
    });
  });
}

/* ── CORS headers (mirrors JsonUtil.preflight in Java) ───── */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function send(res, code, json) {
  cors(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const body = typeof json === 'string' ? json : JSON.stringify(json);
  res.writeHead(code);
  res.end(body);
}

/* ══════════════════════════════════════════════════════════
   ROUTE HANDLERS
   Each function mirrors a Java HttpHandler class
   ══════════════════════════════════════════════════════════ */

/** POST /api/auth/register  ←→  RegisterHandler.java */
async function handleRegister(req, res) {
  const { name, email, password } = await readBody(req);

  if (!name || !email || !password) {
    return send(res, 400, Json.err('All fields are required'));
  }

  const users = Json.load('users.json');
  if (users.find(u => u.email === email)) {
    return send(res, 409, Json.err('Email already registered'));
  }

  const id     = Math.random().toString(36).substring(2,10).toUpperCase();
  const token  = crypto.randomUUID();
  const record = { id, name, email, password: sha256(password), token, created: new Date().toISOString() };

  Json.save('users.json', record);
  send(res, 201, { status: 'ok', message: 'Registration successful', token, name, id });
}

/** POST /api/auth/login  ←→  LoginHandler.java */
async function handleLogin(req, res) {
  const { email, password } = await readBody(req);

  // FIX 4: Validate inputs before lookup — prevents sha256(undefined) wrong-hash bug
  if (!email || !password) {
    return send(res, 400, Json.err('Email and password are required'));
  }

  const users = Json.load('users.json');
  const user  = users.find(u => u.email === email);

  if (!user)                          return send(res, 401, Json.err('No account found with that email'));
  if (user.password !== sha256(password)) return send(res, 401, Json.err('Incorrect password'));

  const token = crypto.randomUUID(); // fresh session token
  send(res, 200, { status: 'ok', message: 'Login successful', token, name: user.name, id: user.id });
}

/** POST/GET /api/personal  ←→  PersonalHandler.java */
async function handlePersonal(req, res) {
  if (req.method === 'GET') {
    return send(res, 200, Json.load('personal.json'));
  }
  const data = await readBody(req);
  if (!data.fullName) return send(res, 400, Json.err('Full name is required'));
  Json.save('personal.json', { ...data, savedAt: new Date().toISOString() });
  send(res, 200, Json.ok('Personal information saved successfully'));
}

/** POST/GET /api/education  ←→  EducationHandler.java */
async function handleEducation(req, res) {
  if (req.method === 'GET') {
    return send(res, 200, Json.load('education.json'));
  }
  const data = await readBody(req);
  if (!data.degree) return send(res, 400, Json.err('Degree field is required'));
  Json.save('education.json', { ...data, savedAt: new Date().toISOString() });
  send(res, 200, Json.ok('Education details saved successfully'));
}

/** POST /api/payment  ←→  PaymentHandler.java */
async function handlePayment(req, res) {
  const data = await readBody(req);
  if (!data.amount) return send(res, 400, Json.err('Amount is required'));

  const txnId = 'TXN' + Date.now();
  Json.save('payments.json', { ...data, txnId, paidAt: new Date().toISOString() });
  send(res, 200, { status: 'ok', message: 'Payment processed successfully',
                   txnId, amount: data.amount, method: data.paymentMethod });
}

/** GET /api/status  ←→  StatusHandler.java */
function handleStatus(req, res) {
  send(res, 200, {
    status: 'ok',
    server: 'Node.js (mirrors Java 21 HttpServer)',
    data: {
      registeredUsers:  Json.count('users.json'),
      personalForms:    Json.count('personal.json'),
      educationForms:   Json.count('education.json'),
      payments:         Json.count('payments.json'),
    }
  });
}

/** Static file handler  ←→  StaticHandler.java */
function handleStatic(req, res) {
  // FIX 1: Strip query string before resolving path (e.g. /?ref=google)
  const reqPath = new URL(req.url, 'http://localhost').pathname;
  let filePath = path.join(WEB_ROOT, reqPath === '/' ? '/index.html' : reqPath);

  // Security: prevent path traversal (mirrors StaticHandler check)
  if (!filePath.startsWith(WEB_ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // FIX 2: Single statSync call — reuse stat object for both isDirectory() and size
  let stat;
  try { stat = fs.statSync(filePath); } catch { stat = null; }
  if (!stat || stat.isDirectory()) {
    res.writeHead(404); res.end('Not found: ' + reqPath); return;
  }

  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'no-cache');
  res.writeHead(200);
  fs.createReadStream(filePath).pipe(res);
}

/* ══════════════════════════════════════════════════════════
   MAIN SERVER  (mirrors AppServer.main in Java)
   ══════════════════════════════════════════════════════════ */
const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  // CORS preflight (mirrors JsonUtil.preflight)
  if (req.method === 'OPTIONS') {
    cors(res); res.writeHead(204); res.end(); return;
  }

  // API routes
  try {
    if (pathname === '/api/auth/register')    return await handleRegister(req, res);
    if (pathname === '/api/auth/login')       return await handleLogin(req, res);
    if (pathname === '/api/personal')         return await handlePersonal(req, res);
    if (pathname === '/api/education')        return await handleEducation(req, res);
    if (pathname === '/api/payment')          return await handlePayment(req, res);
    if (pathname === '/api/status')           return handleStatus(req, res);
  } catch (err) {
    console.error('[API Error]', err.message);
    return send(res, 500, Json.err('Internal server error'));
  }

  // Static files (everything else)
  handleStatic(req, res);
});

// FIX: Handle port-in-use and other listen errors gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ✗ Port ${PORT} is already in use.`);
    console.error(`    Stop the existing process or change PORT in server.js\n`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  AppPortal Server running on http://localhost:' + PORT + '  ║');
  console.log('║  Stack: Node.js ' + process.version + '                         ║');
  console.log('║  Press Ctrl+C to stop                            ║');
  console.log('╚══════════════════════════════════════════════════╝');
});

// FIX 13: Timeout slow/stalled client connections after 30 seconds
server.setTimeout(30000);

// FIX: Graceful shutdown on SIGTERM / SIGINT (Ctrl+C)
function gracefulShutdown(signal) {
  console.log(`\n  Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('  Server closed. Goodbye!\n');
    process.exit(0);
  });
  // FIX 11: .unref() so the timer doesn't keep the process alive if all connections close first
  setTimeout(() => { console.error('  Force shutdown.'); process.exit(1); }, 5000).unref();
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
