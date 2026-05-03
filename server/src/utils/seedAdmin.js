const User = require('../models/User.model');

module.exports = async function seedAdmin() {
  const exists = await User.findOne({ role: 'admin' });
  if (!exists) {
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL,
      username: 'admin',
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log('Admin user created:', process.env.ADMIN_EMAIL);
  }
};
