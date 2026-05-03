const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password)
      return res.status(400).json({ message: 'Email/username and password are required' });

    // Match against email (admin/faculty), username (all), or rollNo (students)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.trim() },
        { rollNo: identifier.trim() },
      ],
    });

    console.log(`[LOGIN] identifier="${identifier}" → found: ${user ? `${user.name} (${user.role})` : 'none'}`);

    if (!user) return res.status(401).json({ message: 'No account found with those credentials' });

    const passwordMatch = await user.comparePassword(password);
    console.log(`[LOGIN] password match: ${passwordMatch}`);

    if (!passwordMatch) return res.status(401).json({ message: 'Incorrect password' });
    if (!user.isActive)  return res.status(403).json({ message: 'Your account has been deactivated' });

    const token = generateToken(user._id);
    console.log(`[LOGIN] success → ${user.name} (${user.role})`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        rollNo: user.rollNo,
        role: user.role,
        faceRegistered: user.faceRegistered,
      },
    });
  } catch (err) {
    console.error('[LOGIN] error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.registerFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    if (!faceDescriptor || !Array.isArray(faceDescriptor))
      return res.status(400).json({ message: 'Invalid face descriptor' });
    await User.findByIdAndUpdate(req.user._id, { faceDescriptor, faceRegistered: true });
    res.json({ message: 'Face registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
