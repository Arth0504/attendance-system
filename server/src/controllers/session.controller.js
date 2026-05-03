const crypto = require('crypto');
const QRCode = require('qrcode');
const Session = require('../models/Session.model');
const Attendance = require('../models/Attendance.model');

const generateQRToken = (sessionId) => {
  const payload = `${sessionId}:${Date.now()}:${process.env.QR_SECRET}`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 32);
};

exports.createSession = async (req, res) => {
  try {
    const { subject, className, startTime, endTime, latitude, longitude, radius } = req.body;
    const session = await Session.create({
      subject, className,
      facultyId: req.user._id,
      startTime, endTime,
      location: { latitude, longitude, radius: radius || 100 },
    });
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.generateQR = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (req.user.role === 'faculty' && session.facultyId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied' });

    const token = generateQRToken(session._id);
    const expiresAt = new Date(Date.now() + 60000);
    await Session.findByIdAndUpdate(session._id, { qrToken: token, qrExpiresAt: expiresAt });

    const qrData = JSON.stringify({ sessionId: session._id, token, expiresAt });
    const qrImage = await QRCode.toDataURL(qrData);
    res.json({ qrImage, token, expiresAt, sessionId: session._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.validateQR = async (req, res) => {
  try {
    const { sessionId, token } = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.qrToken !== token) return res.status(400).json({ valid: false, message: 'Invalid QR token' });
    if (new Date() > session.qrExpiresAt) return res.status(400).json({ valid: false, message: 'QR code expired' });
    res.json({ valid: true, session });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSessions = async (req, res) => {
  try {
    const filter = req.user.role === 'faculty' ? { facultyId: req.user._id } : {};
    const sessions = await Session.find(filter).populate('facultyId', 'name email').sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('facultyId', 'name email');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSessionAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ sessionId: req.params.id })
      .populate('studentId', 'name rollNo email');
    res.json(attendance);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteSession = async (req, res) => {
  await Session.findByIdAndDelete(req.params.id);
  res.json({ message: 'Session deleted' });
};
