require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

<<<<<<< HEAD
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://attendance-system-rosy-six.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (mobile apps, Postman, curl)
    if (!origin) return cb(null, true);
    // Allow any *.vercel.app preview deployment
    const isVercel = /^https:\/\/[\w-]+\.vercel\.app$/.test(origin);
    // Allow LAN IPs for local mobile testing
    const isLan = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);
    if (ALLOWED_ORIGINS.includes(origin) || isVercel || isLan) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
=======
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://attendance-system-rosy-six.vercel.app',
  ],
  credentials: true,
}));
>>>>>>> f189c11bf04c4deab4119623ee19d79b2934894f
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', require('express').static('uploads'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const seedAdmin = async () => {
  const User = require('./models/User');
  const exists = await User.findOne({ email: 'admin@college.com' });
  if (!exists) {
    await User.create({
      name: 'Super Admin',
      email: 'admin@college.com',
      password: 'admin123',
      role: 'admin',
      department: 'Administration',
    });
    console.log('✅ Default admin created: admin@college.com / admin123');
  }
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected to lbattend');
    await seedAdmin();
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
