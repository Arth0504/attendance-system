require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// ── Validate required env vars before anything else ───────────────────────────
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[STARTUP] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/auth.routes');
const adminRoutes      = require('./routes/admin.routes');
const facultyRoutes    = require('./routes/faculty.routes');
const studentRoutes    = require('./routes/student.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const sessionRoutes    = require('./routes/session.routes');
const faceRoutes       = require('./routes/face.routes');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In development: allow localhost:5173
// In production:  allow origins listed in ALLOWED_ORIGINS env var
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check (used by Render / Railway uptime monitors) ──────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/faculty',    facultyRoutes);
app.use('/api/student',    studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions',   sessionRoutes);
app.use('/api/face',       faceRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ── MongoDB connection ────────────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const isAtlas = uri.includes('mongodb+srv');

  console.log(`[DB] Connecting to ${isAtlas ? 'MongoDB Atlas' : 'local MongoDB'}…`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable
      socketTimeoutMS: 45000,
    });

    const { host, name } = mongoose.connection;
    console.log(`[DB] Connected — host: ${host}, database: ${name}`);
    if (isAtlas) console.log('[DB] MongoDB Atlas connected ✓');

    // Seed admin on first run
    await require('./utils/seedAdmin')();

    // Start HTTP server only after DB is ready
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () =>
      console.log(`[SERVER] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
    );

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      console.log(`\n[SERVER] ${signal} received — shutting down gracefully`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('[DB] Connection closed');
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('[DB] Hint: Local MongoDB is not running. Start it or switch to Atlas URI.');
    }
    if (err.message.includes('authentication failed')) {
      console.error('[DB] Hint: Check Atlas username/password in MONGO_URI.');
    }
    if (err.message.includes('IP') || err.message.includes('whitelist')) {
      console.error('[DB] Hint: Add your IP to Atlas Network Access (or use 0.0.0.0/0 for dev).');
    }
    process.exit(1);
  }
};

// ── Handle unhandled promise rejections ───────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

connectDB();
