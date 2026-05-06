const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Session    = require('../models/Session');

const markAttendance = async (req, res) => {
  try {
    const { sessionId, method, location, qrToken } = req.body;
    const session = await Session.findById(sessionId);
    if (!session)          return res.status(404).json({ message: 'Session not found' });
    if (!session.isActive) return res.status(400).json({ message: 'Session closed by faculty' });

    if (method === 'qr' && session.qrToken !== qrToken)
      return res.status(400).json({ message: 'Invalid QR code' });

    const existing = await Attendance.findOne({ userId: req.user._id, sessionId });
    if (existing) return res.status(400).json({ message: 'Attendance already marked' });

    let status = 'present';
    let distanceFromCampus = null;

    if (session.location?.latitude && location?.latitude) {
      const dist = getDistance(session.location, location);
      distanceFromCampus = Math.round(dist);
      if (dist > session.location.radius) {
        status = 'pending';
      }
    }

    const attendance = await Attendance.create({
      userId: req.user._id, sessionId, method, location,
      status, distanceFromCampus,
    });

    if (status === 'pending') {
      return res.status(201).json({
        ...attendance.toObject(),
        _message: 'You are outside campus. Attendance is pending faculty approval.',
      });
    }

    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const approvePending = async (req, res) => {
  try {
    const record = await Attendance.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { status: 'present' },
      { new: true }
    ).populate('userId', 'name email rollNumber').populate('sessionId', 'subject department');
    if (!record) return res.status(404).json({ message: 'Pending record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rejectPending = async (req, res) => {
  try {
    const record = await Attendance.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { status: 'absent' },
      { new: true }
    ).populate('userId', 'name email rollNumber').populate('sessionId', 'subject department');
    if (!record) return res.status(404).json({ message: 'Pending record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPendingAttendance = async (req, res) => {
  try {
    // Faculty sees pending for their sessions; admin sees all
    let filter = { status: 'pending' };
    if (req.user.role === 'faculty') {
      const sessions = await Session.find({ facultyId: req.user._id }).select('_id');
      filter.sessionId = { $in: sessions.map(s => s._id) };
    }
    const records = await Attendance.find(filter)
      .populate('userId',    'name email rollNumber department')
      .populate('sessionId', 'subject department startTime facultyId')
      .sort('-timestamp');
    res.json(records);
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
    const userId = req.user._id;
    const total   = await Attendance.countDocuments({ userId, status: { $in: ['present', 'pending'] } });
    const present = await Attendance.countDocuments({ userId, status: 'present' });
    const bySubject = await Attendance.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'sessions', localField: 'sessionId', foreignField: '_id', as: 'session' } },
      { $unwind: '$session' },
      { $group: {
        _id:     '$session.subject',
        total:   { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
      }},
    ]);
    res.json({ total, present, percentage: total ? Math.round((present / total) * 100) : 0, bySubject });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const { department, subject, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    let sessionFilter = {};
    if (department) sessionFilter.department = department;
    if (subject)    sessionFilter.subject    = subject;
    if (req.user.role === 'faculty') sessionFilter.facultyId = req.user._id;

    if (Object.keys(sessionFilter).length) {
      const sessions = await Session.find(sessionFilter).select('_id');
      filter.sessionId = { $in: sessions.map(s => s._id) };
    }

    const records = await Attendance.find(filter)
      .populate('userId',    'name email rollNumber')
      .populate('sessionId', 'subject department startTime')
      .sort('-timestamp').limit(500);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function getDistance(loc1, loc2) {
  const R  = 6371e3;
  const φ1 = (loc1.latitude  * Math.PI) / 180;
  const φ2 = (loc2.latitude  * Math.PI) / 180;
  const Δφ = ((loc2.latitude  - loc1.latitude)  * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { markAttendance, approvePending, rejectPending, getPendingAttendance, getMyAttendance, getAttendanceStats, getAllAttendance };
