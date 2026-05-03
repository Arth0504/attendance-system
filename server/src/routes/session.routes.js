const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const {
  createSession, generateQR, validateQR, getSessions,
  getSessionById, getSessionAttendance, deleteSession
} = require('../controllers/session.controller');

router.post('/', auth, authorize('faculty', 'admin'), createSession);
router.get('/', auth, getSessions);
router.get('/:id', auth, getSessionById);
router.post('/:id/qr', auth, authorize('faculty', 'admin'), generateQR);
router.post('/validate-qr', auth, validateQR);
router.get('/:id/attendance', auth, authorize('faculty', 'admin'), getSessionAttendance);
router.delete('/:id', auth, authorize('faculty', 'admin'), deleteSession);

module.exports = router;
