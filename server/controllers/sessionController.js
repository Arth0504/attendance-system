const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

const createSession = async (req, res) => {
  try {
    const { subject, department, location } = req.body;
    const qrToken = uuidv4();
    const qrData = JSON.stringify({ token: qrToken, subject });
    const qrCode = await QRCode.toDataURL(qrData);
    const session = await Session.create({
      facultyId: req.user._id, subject, department,
      qrCode, qrToken, location,
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const filter = req.user.role === 'faculty' ? { facultyId: req.user._id } : {};
    const sessions = await Session.find(filter).populate('facultyId', 'name email').sort('-createdAt');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('facultyId', 'name email');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const closeSession = async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, facultyId: req.user._id },
      { isActive: false, endTime: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSessionAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ sessionId: req.params.id })
      .populate('userId', 'name email rollNumber');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createSession, getSessions, getSessionById, closeSession, getSessionAttendance };
