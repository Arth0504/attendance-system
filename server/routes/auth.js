const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateFaceDescriptor, uploadFaceImage } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadFace } = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/face-descriptor', protect, updateFaceDescriptor);
router.post('/face-image', protect, uploadFace.single('faceImage'), uploadFaceImage);

module.exports = router;
