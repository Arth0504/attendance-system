require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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
