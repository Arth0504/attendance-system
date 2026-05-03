console.log('[STARTUP] server/src/index.js loading...');
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

// ── 1. Warn on missing env vars (do NOT exit — keep server alive for /health) ─
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing  = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error('[STARTUP] ⚠️  Missing env vars:', missing.join(', '));
  console.error('[STARTUP] Add them in Render → Environment tab, then redeploy.');
} else {
  console.log('[STARTUP] ✓ All required env vars present');
}

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
  // Still continue — partial routes are better than no server at all
}

// ── 3. Resolve client/dist ────────────────────────────────────────────────────
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
const CLIENT_HTML = path.join(CLIENT_DIST, 'index.html');
const hasFrontend = fs.existsSync(CLIENT_HTML);
console.log('[STARTUP] Frontend dist:', hasFrontend ? '✓ ' + CLIENT_DIST : '✗ not found');

// ── 4. Build Express app ──────────────────────────────────────────────────────
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: "${origin}" not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── 5. /test — simplest possible smoke-test route ─────────────────────────────
app.get('/test', (req, res) => res.send('WORKING'));

// ── 6. /health — always responds, reports DB + env status ────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status:      'ok',
    db:          mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env:         process.env.NODE_ENV || 'development',
    uptime:      Math.floor(process.uptime()),
    frontend:    hasFrontend,
    missingVars: missing,
  });
});

// ── 7. API routes ─────────────────────────────────────────────────────────────
if (authRoutes)       app.use('/api/auth',       authRoutes);
if (adminRoutes)      app.use('/api/admin',       adminRoutes);
if (facultyRoutes)    app.use('/api/faculty',     facultyRoutes);
if (studentRoutes)    app.use('/api/student',     studentRoutes);
if (attendanceRoutes) app.use('/api/attendance',  attendanceRoutes);
if (sessionRoutes)    app.use('/api/sessions',    sessionRoutes);
if (faceRoutes)       app.use('/api/face',        faceRoutes);

// ── 8. Serve React frontend (after all API routes) ────────────────────────────
if (hasFrontend) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => res.sendFile(CLIENT_HTML));
} else {
  app.use((req, res) => {
    res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
  });
}

// ── 9. Global error handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', req.method, req.originalUrl, err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ── 10. Start HTTP server IMMEDIATELY (before DB) ────────────────────────────
// Render requires the port to be bound within 60 s or it marks the deploy failed.
// Starting the server first guarantees /health always responds.
const PORT   = parseInt(process.env.PORT, 10) || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] ✓ Listening on 0.0.0.0:${PORT}`);
  console.log(`[SERVER] /test   → should return "WORKING"`);
  console.log(`[SERVER] /health → should return JSON`);
});

server.on('error', (err) => {
  console.error('[SERVER] ❌ Listen error:', err.message);
  process.exit(1);
});

// ── 11. Connect to MongoDB asynchronously ────────────────────────────────────
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('[DB] Skipping — MONGO_URI not set');
    return;
  }

  const uri     = process.env.MONGO_URI;
  const isAtlas = uri.includes('mongodb+srv');
  // Log URI shape (never log the full URI — it contains the password)
  const uriShape = uri.replace(/:([^@]+)@/, ':<password>@');
  console.log(`[DB] URI shape : ${uriShape}`);
  console.log(`[DB] Connecting to ${isAtlas ? 'MongoDB Atlas' : 'local MongoDB'}...`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    const { host, name } = mongoose.connection;
    console.log(`[DB] ✓ Connected — host: ${host} | db: ${name}`);
    console.log('[DB] MongoDB connected ✓');

    await require('./utils/seedAdmin')();
    console.log('[DB] ✓ Admin seeded');

  } catch (err) {
    console.error('[DB] ❌ Connection failed:', err.message);
    if (err.message.includes('ECONNREFUSED'))
      console.error('[DB] Hint: Use Atlas URI on Render, not localhost.');
    if (err.message.includes('authentication failed'))
      console.error('[DB] Hint: Wrong Atlas username/password in MONGO_URI.');
    if (err.message.includes('IP') || err.message.includes('whitelist'))
      console.error('[DB] Hint: Add 0.0.0.0/0 to Atlas Network Access.');
    if (err.message.includes('timed out'))
      console.error('[DB] Hint: Atlas cluster may be paused — resume it.');
    // Do NOT exit — server is already running and /health will show db: disconnected
  }
};

connectDB();

// ── 12. Graceful shutdown ─────────────────────────────────────────────────────
const shutdown = (sig) => {
  console.log(`[SERVER] ${sig} — shutting down`);
  server.close(async () => {
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (r) => console.error('[UNHANDLED]', r));
