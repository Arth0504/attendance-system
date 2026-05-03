const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const { csvUpload } = require('../middleware/upload.middleware');
const {
  uploadStudents, createFaculty, getFaculty, getStudents,
  toggleUser, deleteUser, getAnalytics, getRequests, reviewRequest
} = require('../controllers/admin.controller');

router.use(auth, authorize('admin'));

router.post('/upload-students', csvUpload.single('file'), uploadStudents);
router.post('/faculty', createFaculty);
router.get('/faculty', getFaculty);
router.get('/students', getStudents);
router.patch('/users/:id/toggle', toggleUser);
router.delete('/users/:id', deleteUser);
router.get('/analytics', getAnalytics);
router.get('/requests', getRequests);
router.patch('/requests/:id', reviewRequest);

module.exports = router;
