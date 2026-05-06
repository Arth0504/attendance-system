const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadCSV } = require('../middleware/upload');
const { getAllUsers, createFaculty, uploadStudentsCSV, updateUser, deleteUser } = require('../controllers/userController');

router.use(protect);
router.use(authorize('admin'));
router.get('/', getAllUsers);
router.post('/faculty', createFaculty);
router.post('/upload-csv', uploadCSV.single('file'), uploadStudentsCSV);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
