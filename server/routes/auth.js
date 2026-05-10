const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateFaceDescriptor, uploadFaceImage } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadFace } = require('../middleware/upload');

<<<<<<< HEAD
router.post('/register', register);
=======
>>>>>>> f189c11bf04c4deab4119623ee19d79b2934894f
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/face-descriptor', protect, updateFaceDescriptor);
router.post('/face-image', protect, uploadFace.single('faceImage'), uploadFaceImage);

module.exports = router;
