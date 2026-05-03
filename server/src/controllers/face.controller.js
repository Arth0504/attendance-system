const User = require('../models/User.model');

// Euclidean distance between two 128-dim face descriptors
const euclidean = (a, b) =>
  Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));

exports.registerFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128)
      return res.status(400).json({ message: 'Invalid face descriptor — must be 128-element array' });

    if (faceDescriptor.some(v => typeof v !== 'number' || isNaN(v)))
      return res.status(400).json({ message: 'Face descriptor contains invalid values' });

    await User.findByIdAndUpdate(req.user._id, {
      faceDescriptor,
      faceRegistered: true,
    });

    res.json({ message: 'Face registered successfully', faceRegistered: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128)
      return res.status(400).json({ message: 'Invalid face descriptor' });

    // Fetch stored descriptor (not included in req.user by default)
    const user = await User.findById(req.user._id).select('faceDescriptor faceRegistered');

    if (!user.faceRegistered || !user.faceDescriptor?.length)
      return res.status(400).json({ message: 'No face registered for this account', faceRegistered: false });

    const distance = euclidean(user.faceDescriptor, faceDescriptor);
    const matched = distance < 0.6;

    res.json({
      matched,
      distance: parseFloat(distance.toFixed(4)),
      confidence: parseFloat(Math.max(0, Math.min(100, (1 - distance / 1.2) * 100)).toFixed(1)),
      message: matched ? 'Face verified successfully' : 'Face does not match registered face',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteFace = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      faceDescriptor: null,
      faceRegistered: false,
    });
    res.json({ message: 'Face data deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
