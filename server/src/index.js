require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// ── Validate required env vars ─────────────────────────
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = REQUIRED.filter(k => !process.env[k]);

if (missing.length) {
  console.error(`[STARTUP] Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

// ── Routes ─────────────────────────────────────────────
const authRoutes       = require('./routes/auth.routes');
const adminRoutes      = require('./routes/admin.routes');
const facultyRoutes    = require('./routes/faculty.routes');
const studentRoutes    = require('./routes/student.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const sessionRoutes    = require('./routes/session.routes');
const faceRoutes       = require('./routes/face.routes');

const app = express();

// ── CORS ───────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Route ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/face', faceRoutes);

// ── Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ message: err.message });
});

// ── MongoDB Connect ────────────────────────────────────
const connectDB = async () => {
  try {
    console.log('[DB] Connecting to MongoDB Atlas...');

    await mongoose.connect(process.env.MONGO_URI);

    console.log('[DB] Connected ✓');

    // Seed admin
    await require('./utils/seedAdmin')();

 
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT}`);
    });

  } catch (err) {
    console.error('[DB ERROR]', err.message);
    process.exit(1);
  }
};

connectDB();