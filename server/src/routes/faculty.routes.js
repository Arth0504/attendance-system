const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const { getMyAnalytics, getRequests, reviewRequest } = require('../controllers/faculty.controller');

router.use(auth, authorize('faculty'));

router.get('/analytics', getMyAnalytics);
router.get('/requests', getRequests);
router.patch('/requests/:id', reviewRequest);

module.exports = router;
