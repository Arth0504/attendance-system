const fs = require('fs');
const csv = require('csv-parser');
const User = require('../models/User.model');
const Attendance = require('../models/Attendance.model');
const AttendanceRequest = require('../models/AttendanceRequest.model');
const Session = require('../models/Session.model');

exports.uploadStudents = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      const created = [];
      for (const row of results) {
        const { name, email, rollNo } = row;
        if (!name || !email || !rollNo) { errors.push(`Missing fields for ${JSON.stringify(row)}`); continue; }
        try {
          const existing = await User.findOne({ $or: [{ email }, { rollNo }] });
          if (existing) { errors.push(`Student ${email} already exists`); continue; }
          const student = await User.create({ name, email, rollNo, username: rollNo, password: rollNo, role: 'student' });
          created.push({ name: student.name, email: student.email, username: student.username, password: rollNo });
        } catch (e) { errors.push(`Error creating ${email}: ${e.message}`); }
      }
      fs.unlinkSync(req.file.path);
      res.json({ message: `${created.length} students created`, created, errors });
    });
};

exports.createFaculty = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Faculty already exists' });
    const faculty = await User.create({ name, email, password, role: 'faculty' });
    res.status(201).json({ message: 'Faculty created', faculty: { id: faculty._id, name: faculty.name, email: faculty.email } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getFaculty = async (req, res) => {
  const faculty = await User.find({ role: 'faculty' }).select('-password -faceDescriptor');
  res.json(faculty);
};

exports.getStudents = async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password -faceDescriptor');
  res.json(students);
};

exports.toggleUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};

exports.getAnalytics = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password -faceDescriptor');
    const sessions = await Session.find();
    const attendances = await Attendance.find().populate('sessionId');

    const analytics = students.map(student => {
      const studentAttendances = attendances.filter(a => a.studentId.toString() === student._id.toString());
      const totalSessions = sessions.length;
      const presentCount = studentAttendances.filter(a => a.status === 'Present' || a.status === 'Approved').length;
      const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
      return { student: { id: student._id, name: student.name, rollNo: student.rollNo }, totalSessions, presentCount, percentage };
    });

    const dailyTrend = await Attendance.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$markedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: 30 }
    ]);

    res.json({ analytics, dailyTrend, totalStudents: students.length, totalSessions: sessions.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRequests = async (req, res) => {
  const requests = await AttendanceRequest.find()
    .populate('studentId', 'name rollNo email')
    .populate('sessionId', 'subject className startTime')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(requests);
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
