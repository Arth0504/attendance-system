const User = require('../models/User');
const csv = require('csv-parser');
const { Readable } = require('stream');

const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
    const users = await User.find(filter).select('-password -faceDescriptor').sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name, email, department, subject, password: reqPassword } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const password = reqPassword?.trim() || email.split('@')[0] + '@123';
    const user = await User.create({ name, email, password, role: 'faculty', department: department || subject });
    res.status(201).json({ ...user.toObject(), _password_plain: password });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadStudentsCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

  const results = [];
  const errors = [];
  const created = [];

  try {
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer.toString())
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) return res.status(400).json({ message: 'CSV file is empty or invalid' });

    for (const [i, row] of results.entries()) {
      const lineNum = i + 2;
      const name = row.name?.trim();
      const email = row.email?.trim()?.toLowerCase();
      const rollNumber = row.rollnumber?.trim() || row.roll_number?.trim() || row.roll?.trim();
      const department = row.department?.trim() || 'General';

      if (!name || !email || !rollNumber) {
        errors.push({ line: lineNum, reason: `Missing required fields (name, email, rollNumber)`, row });
        continue;
      }

      const emailExists = await User.findOne({ email });
      if (emailExists) { errors.push({ line: lineNum, reason: `Email already exists: ${email}`, row }); continue; }

      const rollExists = await User.findOne({ rollNumber });
      if (rollExists) { errors.push({ line: lineNum, reason: `Roll number already exists: ${rollNumber}`, row }); continue; }

      const user = await User.create({ name, email, password: rollNumber, role: 'student', rollNumber, department });
      created.push({ name: user.name, email: user.email, rollNumber: user.rollNumber });
    }

    res.json({
      message: `Processed ${results.length} rows: ${created.length} created, ${errors.length} skipped`,
      created,
      errors,
      total: results.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'CSV processing failed: ' + err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, rollNumber } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, rollNumber },
      { new: true }
    ).select('-password -faceDescriptor');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, createFaculty, uploadStudentsCSV, updateUser, deleteUser };
