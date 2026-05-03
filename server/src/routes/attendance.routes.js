const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const { markAttendance, getMyAttendance, submitRequest, getMyRequests, getMyStats } = require('../controllers/attendance.controller');

router.post('/mark', auth, authorize('student'), markAttendance);
router.get('/my', auth, authorize('student'), getMyAttendance);
router.get('/my-stats', auth, authorize('student'), getMyStats);
router.post('/request', auth, authorize('student'), submitRequest);
router.get('/my-requests', auth, authorize('student'), getMyRequests);

module.exports = router;
