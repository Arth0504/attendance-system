const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');

const markAttendance = async (req, res) => {
  try {
    const { sessionId, method, location, qrToken } = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!session.isActive) return res.status(400).json({ message: 'Session is closed' });

    if (method === 'qr' && session.qrToken !== qrToken)
      return res.status(400).json({ message: 'Invalid QR code' });

    if (session.location?.latitude && location?.latitude) {
      const dist = getDistance(session.location, location);
      if (dist > session.location.radius)
        return res.status(400).json({ message: 'You are outside the allowed location range' });
    }

    const existing = await Attendance.findOne({ userId: req.user._id, sessionId });
    if (existing) return res.status(400).json({ message: 'Attendance already marked' });

    const attendance = await Attendance.create({
      userId: req.user._id, sessionId, method, location,
      status: 'present',
    });
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.user._id })
      .populate('sessionId', 'subject department startTime facultyId')
      .sort('-timestamp');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAttendanceStats = async (req, res) => {
  try {
    const userId = req.user.role === 'student' ? req.user._id : req.params.userId;
    const total = await Attendance.countDocuments({ userId });
    const present = await Attendance.countDocuments({ userId, status: 'present' });
    const bySubject = await Attendance.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'sessions', localField: 'sessionId', foreignField: '_id', as: 'session' } },
      { $unwind: '$session' },
      { $group: { _id: '$session.subject', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
    ]);
    res.json({ total, present, percentage: total ? Math.round((present / total) * 100) : 0, bySubject });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate('userId', 'name email rollNumber')
      .populate('sessionId', 'subject department startTime')
      .sort('-timestamp').limit(200);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function getDistance(loc1, loc2) {
  const R = 6371e3;
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { markAttendance, getMyAttendance, getAttendanceStats, getAllAttendance };
