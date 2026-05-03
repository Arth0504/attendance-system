const router = require('express').Router();
const { login, getMe, registerFace } = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/register-face', auth, registerFace);

module.exports = router;
