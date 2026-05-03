require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

// ── 1. Validate required env vars ─────────────────────────────────────────────
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing  = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[STARTUP] ❌ Missing env vars: ${missing.join(', ')}`);
  console.error('[STARTUP] Add them in Render dashboard → Environment tab');
  process.exit(1);
}
console.log('[STARTUP] ✓ All required env vars present');

// ── 2. Load route modules ─────────────────────────────────────────────────────
let authRoutes, adminRoutes, facultyRoutes, studentRoutes,
    attendanceRoutes, sessionRoutes, faceRoutes;
try {
  authRoutes       = require('./routes/auth.routes');
  adminRoutes      = require('./routes/admin.routes');
  facultyRoutes    = require('./routes/faculty.routes');
  studentRoutes    = require('./routes/student.routes');
  attendanceRoutes = require('./routes/attendance.routes');
  sessionRoutes    = require('./routes/session.routes');
  faceRoutes       = require('./routes/face.routes');
  console.log('[STARTUP] ✓ All route modules loaded');
} catch (err) {
  console.error('[STARTUP] ❌ Route module load failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}

// ── 3. Resolve client/dist path ───────────────────────────────────────────────
// __dirname = server/src  →  ../../client/dist
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
const CLIENT_HTML = path.join(CLIENT_DIST, 'index.html');
const hasFrontend = fs.existsSync(CLIENT_HTML);
console.log(`[STARTUP] Frontend build: ${hasFrontend ? '✓ found at ' + CLIENT_DIST : '✗ not found (API-only mode)'}`);

// ── 4. Build Express app ──────────────────────────────────────────────────────
const app = express();

// CORS — only needed when frontend is on a different origin (separate deployment)
// In unified mode (frontend served by Express) same-origin requests don't need CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                        // curl / Render health monitor
    if (allowedOrigins.length === 0) return cb(null, true);   // dev: allow all
    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`[CORS] Blocked: ${origin}`);
    return cb(new Error(`CORS: "${origin}" not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── 5. Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    db:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env:    process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    frontend: hasFrontend,
  });
});

// ── 6. API routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/faculty',    facultyRoutes);
app.use('/api/student',    studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions',   sessionRoutes);
app.use('/api/face',       faceRoutes);

// ── 7. Serve React frontend (MUST be after all API routes) ────────────────────
if (hasFrontend) {
  console.log('[STARTUP] Serving React frontend from Express');
  // Serve static assets (JS, CSS, images)
  app.use(express.static(CLIENT_DIST));
  // Catch-all: send index.html for any non-API route (React Router handles it)
  app.get('*', (req, res) => {
    res.sendFile(CLIENT_HTML);
  });
} else {
  // No frontend build — return JSON for unknown routes
  app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      hint: 'Run "cd client && npm run build" to enable frontend serving',
    });
  });
}

// ── 8. Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ── 9. Connect DB then start server ──────────────────────────────────────────
const connectDB = async () => {
  const uri     = process.env.MONGO_URI;
  const isAtlas = uri.includes('mongodb+srv');
  console.log(`[DB] Connecting to ${isAtlas ? 'MongoDB Atlas' : 'local MongoDB'}…`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    const { host, name } = mongoose.connection;
    console.log(`[DB] ✓ Connected — host: ${host} | db: ${name}`);

    await require('./utils/seedAdmin')();

    const PORT   = parseInt(process.env.PORT, 10) || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] ✓ Listening on 0.0.0.0:${PORT}`);
      console.log(`[SERVER] Health  → /health`);
      if (hasFrontend) console.log(`[SERVER] Frontend → /`);
    });

    server.on('error', (err) => {
      console.error('[SERVER] ❌ Listen error:', err.message);
      process.exit(1);
    });

    const shutdown = (sig) => {
      console.log(`\n[SERVER] ${sig} — shutting down`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('[DB] Connection closed');
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('[DB] ❌ Connection failed:', err.message);
    if (err.message.includes('ECONNREFUSED'))
      console.error('[DB] Hint: Local MongoDB not running — use Atlas URI on Render.');
    if (err.message.includes('authentication failed'))
      console.error('[DB] Hint: Wrong Atlas username/password in MONGO_URI.');
    if (err.message.includes('IP') || err.message.includes('whitelist'))
      console.error('[DB] Hint: Add 0.0.0.0/0 to Atlas Network Access.');
    if (err.message.includes('timed out'))
      console.error('[DB] Hint: Atlas cluster may be paused — resume it in Atlas UI.');
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

connectDB();
