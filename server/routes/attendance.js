const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { markAttendance, getMyAttendance, getAttendanceStats, getAllAttendance } = require('../controllers/attendanceController');

router.use(protect);
router.post('/mark', authorize('student'), markAttendance);
router.get('/my', authorize('student'), getMyAttendance);
router.get('/stats', getAttendanceStats);
router.get('/all', authorize('admin', 'faculty'), getAllAttendance);

module.exports = router;
