require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const User = require('./models/User');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Session.deleteMany({});
  await Attendance.deleteMany({});
  console.log('Cleared existing data');

  // --- Users ---
  const hashedPw = await bcrypt.hash('password123', 10);

  const [admin, faculty1, faculty2, ...students] = await User.insertMany([
    { name: 'Admin User', email: 'admin@attendai.com', password: hashedPw, role: 'admin', department: 'Administration' },
    { name: 'Dr. Priya Sharma', email: 'priya@attendai.com', password: hashedPw, role: 'faculty', department: 'Computer Science' },
    { name: 'Prof. Rahul Mehta', email: 'rahul@attendai.com', password: hashedPw, role: 'faculty', department: 'Electronics' },
    { name: 'Arjun Patel', email: 'arjun@attendai.com', password: hashedPw, role: 'student', department: 'Computer Science', rollNumber: 'CS2024001' },
    { name: 'Sneha Verma', email: 'sneha@attendai.com', password: hashedPw, role: 'student', department: 'Computer Science', rollNumber: 'CS2024002' },
    { name: 'Rohan Gupta', email: 'rohan@attendai.com', password: hashedPw, role: 'student', department: 'Computer Science', rollNumber: 'CS2024003' },
    { name: 'Ananya Singh', email: 'ananya@attendai.com', password: hashedPw, role: 'student', department: 'Electronics', rollNumber: 'EC2024001' },
    { name: 'Karan Joshi', email: 'karan@attendai.com', password: hashedPw, role: 'student', department: 'Electronics', rollNumber: 'EC2024002' },
  ]);
  console.log(`Created ${2 + students.length + 1} users`);

  // --- Sessions ---
  const sessionDefs = [
    { faculty: faculty1, subject: 'Data Structures', dept: 'Computer Science', daysAgo: 5 },
    { faculty: faculty1, subject: 'Algorithms', dept: 'Computer Science', daysAgo: 4 },
    { faculty: faculty1, subject: 'Database Systems', dept: 'Computer Science', daysAgo: 3 },
    { faculty: faculty1, subject: 'Data Structures', dept: 'Computer Science', daysAgo: 2 },
    { faculty: faculty2, subject: 'Digital Electronics', dept: 'Electronics', daysAgo: 4 },
    { faculty: faculty2, subject: 'Microprocessors', dept: 'Electronics', daysAgo: 2 },
    { faculty: faculty1, subject: 'Algorithms', dept: 'Computer Science', daysAgo: 0, active: true },
  ];

  const sessions = [];
  for (const def of sessionDefs) {
    const qrToken = uuidv4();
    const qrCode = await QRCode.toDataURL(JSON.stringify({ token: qrToken, subject: def.subject }));
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - def.daysAgo);
    sessions.push(await Session.create({
      facultyId: def.faculty._id,
      subject: def.subject,
      department: def.dept,
      qrCode,
      qrToken,
      startTime,
      endTime: def.active ? undefined : new Date(startTime.getTime() + 60 * 60 * 1000),
      isActive: !!def.active,
    }));
  }
  console.log(`Created ${sessions.length} sessions`);

  // --- Attendance ---
  const csStudents = students.filter(s => s.department === 'Computer Science');
  const ecStudents = students.filter(s => s.department === 'Electronics');
  const csSessions = sessions.filter(s => s.department === 'Computer Science' && !s.isActive);
  const ecSessions = sessions.filter(s => s.department === 'Electronics' && !s.isActive);

  const attendanceRecords = [];
  const methods = ['qr', 'face', 'qr', 'qr', 'face'];

  for (const session of csSessions) {
    for (let i = 0; i < csStudents.length; i++) {
      if (Math.random() > 0.2) {
        attendanceRecords.push({
          userId: csStudents[i]._id,
          sessionId: session._id,
          status: 'present',
          method: methods[i % methods.length],
          timestamp: new Date(session.startTime.getTime() + Math.random() * 10 * 60 * 1000),
        });
      }
    }
  }

  for (const session of ecSessions) {
    for (let i = 0; i < ecStudents.length; i++) {
      if (Math.random() > 0.15) {
        attendanceRecords.push({
          userId: ecStudents[i]._id,
          sessionId: session._id,
          status: 'present',
          method: methods[i % methods.length],
          timestamp: new Date(session.startTime.getTime() + Math.random() * 10 * 60 * 1000),
        });
      }
    }
  }

  await Attendance.insertMany(attendanceRecords);
  console.log(`Created ${attendanceRecords.length} attendance records`);

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials (all use password: password123)');
  console.log('─────────────────────────────────────────────────');
  console.log('Admin   : admin@attendai.com');
  console.log('Faculty : priya@attendai.com  |  rahul@attendai.com');
  console.log('Students: arjun@attendai.com  |  sneha@attendai.com  |  rohan@attendai.com');
  console.log('          ananya@attendai.com |  karan@attendai.com');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
