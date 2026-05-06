const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance, approvePending, rejectPending,
  getPendingAttendance, getMyAttendance, getAttendanceStats, getAllAttendance,
} = require('../controllers/attendanceController');

router.use(protect);
router.post('/mark',              authorize('student'),          markAttendance);
router.get('/my',                 authorize('student'),          getMyAttendance);
router.get('/stats',                                             getAttendanceStats);
router.get('/pending',            authorize('admin', 'faculty'), getPendingAttendance);
router.put('/pending/:id/approve',authorize('admin', 'faculty'), approvePending);
router.put('/pending/:id/reject', authorize('admin', 'faculty'), rejectPending);
router.get('/all',                authorize('admin', 'faculty'), getAllAttendance);

module.exports = router;
