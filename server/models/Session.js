const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  department: { type: String, required: true },
  qrCode: { type: String },
  qrToken: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    radius: { type: Number, default: 100 },
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
