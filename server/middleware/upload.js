const multer = require('multer');
const path = require('path');

// Face image storage
const faceStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `face_${req.user._id}_${Date.now()}${ext}`);
  },
});

// CSV storage (memory — we parse in-memory, no disk needed)
const csvStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
};

const csvFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

const uploadFace = multer({ storage: faceStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadCSV = multer({ storage: csvStorage, fileFilter: csvFilter, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { uploadFace, uploadCSV };
