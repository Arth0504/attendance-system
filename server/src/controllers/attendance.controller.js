const Attendance = require('../models/Attendance.model');
const AttendanceRequest = require('../models/AttendanceRequest.model');
const Session = require('../models/Session.model');
const User = require('../models/User.model');
const { haversineDistance } = require('../utils/gps');

const euclideanDistance = (a, b) => Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));

exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, qrToken, latitude, longitude, faceDescriptor } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const existing = await Attendance.findOne({ studentId: req.user._id, sessionId });
    if (existing) return res.status(400).json({ message: 'Attendance already marked' });

    const verifications = { face: false, gps: false, qr: false };

    if (session.qrToken === qrToken && new Date() <= session.qrExpiresAt) verifications.qr = true;

    const distance = haversineDistance(latitude, longitude, session.location.latitude, session.location.longitude);
    if (distance <= session.location.radius) verifications.gps = true;

    // Face verification — fetch full descriptor from DB (req.user excludes it)
    const studentWithFace = await User.findById(req.user._id).select('faceDescriptor faceRegistered');
    let faceDistance = null;
    if (studentWithFace.faceRegistered && studentWithFace.faceDescriptor?.length && faceDescriptor) {
      faceDistance = euclideanDistance(studentWithFace.faceDescriptor, faceDescriptor);
      if (faceDistance < 0.6) verifications.face = true;
    }

    if (!verifications.face || !verifications.gps || !verifications.qr) {
      return res.status(400).json({
        message: 'Attendance verification failed',
        verifications,
        details: {
          face: verifications.face
            ? 'Passed'
            : !studentWithFace.faceRegistered
              ? 'Failed — face not registered'
              : `Failed (distance: ${faceDistance?.toFixed(3)}, threshold: 0.6)`,
          gps: verifications.gps ? 'Passed' : `Failed (${Math.round(distance)}m away, limit: ${session.location.radius}m)`,
          qr: verifications.qr ? 'Passed' : 'Failed — QR expired or invalid',
        }
      });
    }

    const attendance = await Attendance.create({
      studentId: req.user._id,
      sessionId,
      status: 'Present',
      verifications,
    });

    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ studentId: req.user._id })
      .populate('sessionId', 'subject className startTime endTime')
      .sort({ markedAt: -1 });
    res.json(attendance);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.submitRequest = async (req, res) => {
  try {
    const { sessionId, reason, proofImage } = req.body;
    const request = await AttendanceRequest.create({
      studentId: req.user._id,
      sessionId,
      reason,
      proofImage,
    });
    res.status(201).json({ message: 'Request submitted', request });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await AttendanceRequest.find({ studentId: req.user._id })
      .populate('sessionId', 'subject className startTime')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyStats = async (req, res) => {
  try {
    const sessions = await Session.find();
    const attendance = await Attendance.find({ studentId: req.user._id });
    const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'Approved').length;
    const percentage = sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 0;
    res.json({ totalSessions: sessions.length, presentCount, percentage });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
