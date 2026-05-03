const User = require('../models/User.model');

module.exports = async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL    || 'admin@attendance.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('[SEED] Admin already exists:', email);
    return;
  }

  // Build doc and save — pre('save') hook will hash the plain password
  const admin = new User({
    name:           'Admin',
    email,
    username:       'admin',
    password,        // plain text — hook hashes it
    role:           'admin',
    faceRegistered: false,
    isActive:       true,
  });
  await admin.save();
  console.log('[SEED] ✅ Admin user created:', email);
};
