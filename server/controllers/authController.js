const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const formatUser = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  rollNumber: user.rollNumber,
  department: user.department,
  faceImage: user.faceImage,
  token,
});

const register = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already exists' });
    if (rollNumber && await User.findOne({ rollNumber }))
      return res.status(400).json({ message: 'Roll number already exists' });
    const user = await User.create({ name, email, password, role, rollNumber, department });
    res.status(201).json(formatUser(user, generateToken(user._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supports login via email OR rollNumber
const login = async (req, res) => {
  try {
    const { identifier, password, email } = req.body;
    const lookup = identifier || email;
    if (!lookup || !password)
      return res.status(400).json({ message: 'Identifier and password are required' });

    // Try email first, then rollNumber
    const user = await User.findOne({
      $or: [
        { email: lookup.toLowerCase() },
        { rollNumber: lookup },
      ],
    });

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json(formatUser(user, generateToken(user._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProfile = async (req, res) => res.json(req.user);

const updateFaceDescriptor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { faceDescriptor: req.body.descriptor },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadFaceImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { faceImage: imageUrl },
      { new: true }
    ).select('-password');
    res.json({ message: 'Face image uploaded', imageUrl, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getProfile, updateFaceDescriptor, uploadFaceImage };
