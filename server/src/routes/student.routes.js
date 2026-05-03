const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth, authorize('student'));

module.exports = router;
