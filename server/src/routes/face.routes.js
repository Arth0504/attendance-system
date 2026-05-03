const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const { registerFace, verifyFace, deleteFace } = require('../controllers/face.controller');

// All face routes require student auth
router.use(auth, authorize('student'));

router.post('/register', registerFace);
router.post('/verify', verifyFace);
router.delete('/delete', deleteFace);

module.exports = router;
