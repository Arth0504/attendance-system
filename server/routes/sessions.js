const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createSession, getSessions, getSessionById, closeSession, getSessionAttendance } = require('../controllers/sessionController');

router.use(protect);
router.post('/', authorize('faculty', 'admin'), createSession);
router.get('/', getSessions);
router.get('/:id', getSessionById);
router.put('/:id/close', authorize('faculty', 'admin'), closeSession);
router.get('/:id/attendance', authorize('faculty', 'admin'), getSessionAttendance);

module.exports = router;
