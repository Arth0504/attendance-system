const Attendance = require('../models/Attendance.model');
const AttendanceRequest = require('../models/AttendanceRequest.model');
const Session = require('../models/Session.model');
const User = require('../models/User.model');

exports.getMyAnalytics = async (req, res) => {
  try {
    const sessions = await Session.find({ facultyId: req.user._id });
    const sessionIds = sessions.map(s => s._id);
    const attendances = await Attendance.find({ sessionId: { $in: sessionIds } }).populate('studentId', 'name rollNo');
    const students = await User.find({ role: 'student' }).select('name rollNo');

    const analytics = students.map(student => {
      const studentAttendances = attendances.filter(a => a.studentId?._id.toString() === student._id.toString());
      const presentCount = studentAttendances.filter(a => a.status === 'Present' || a.status === 'Approved').length;
      const percentage = sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 0;
      return { student: { id: student._id, name: student.name, rollNo: student.rollNo }, totalSessions: sessions.length, presentCount, percentage };
    });

    res.json({ analytics, totalSessions: sessions.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRequests = async (req, res) => {
  try {
    const sessions = await Session.find({ facultyId: req.user._id });
    const sessionIds = sessions.map(s => s._id);
    const requests = await AttendanceRequest.find({ sessionId: { $in: sessionIds } })
      .populate('studentId', 'name rollNo email')
      .populate('sessionId', 'subject className startTime')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.reviewRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await AttendanceRequest.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (status === 'Approved') {
      await Attendance.findOneAndUpdate(
        { studentId: request.studentId, sessionId: request.sessionId },
        { status: 'Approved' },
        { upsert: true, new: true }
      );
    }
    res.json({ message: `Request ${status}`, request });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
