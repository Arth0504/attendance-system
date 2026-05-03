const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const {
  createSession, generateQR, validateQR, getSessions,
  getSessionById, getSessionAttendance, deleteSession,
} = require('../controllers/session.controller');

// Static routes MUST come before /:id to avoid param shadowing
router.post('/',             auth, authorize('faculty', 'admin'), createSession);
router.get('/',              auth, getSessions);
router.post('/validate-qr',  auth, validateQR);          // ← before /:id

// Dynamic :id routes
router.get('/:id',           auth, getSessionById);
router.post('/:id/qr',       auth, authorize('faculty', 'admin'), generateQR);
router.get('/:id/attendance',auth, authorize('faculty', 'admin'), getSessionAttendance);
router.delete('/:id',        auth, authorize('faculty', 'admin'), deleteSession);

module.exports = router;
