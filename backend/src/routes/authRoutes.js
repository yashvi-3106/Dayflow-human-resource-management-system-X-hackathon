const express = require('express');
const multer = require('multer');
const path = require('path');
const { loginUser, changePassword, verifyEmail, registerCompany, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Multer Config
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/register', upload.single('logo'), registerCompany);
router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
