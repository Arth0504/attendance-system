const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Approved'], default: 'Present' },
  markedAt: { type: Date, default: Date.now },
  verifications: {
    face: { type: Boolean, default: false },
    gps: { type: Boolean, default: false },
    qr: { type: Boolean, default: false },
  },
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
