const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  status:    { type: String, enum: ['present', 'absent', 'late', 'pending'], default: 'present' },
  method:    { type: String, enum: ['qr', 'face', 'manual', 'gps'],          default: 'qr' },
  location: {
    latitude:  { type: Number },
    longitude: { type: Number },
  },
  distanceFromCampus: { type: Number },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

attendanceSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
