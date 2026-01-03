const express = require('express');
const {
    onboardEmployee, getEmployees, getEmployeeById, updateEmployee, updateEmployeeStatus, deleteEmployee, getMe, updateMe, uploadAvatar, uploadDocument
} = require('../controllers/employeeController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');
const { firstLoginGuard } = require('../middlewares/firstLoginGuard');
const upload = require('../middleware/uploadMiddleware'); // Import Multer

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(firstLoginGuard);

// Admin/HR Routes
router.route('/')
    .post(authorize('ADMIN', 'HR'), onboardEmployee)
    .get(authorize('ADMIN', 'HR'), getEmployees);

// Employee Self-Service
router.get('/me', getMe);
router.put('/me', updateMe);

// Upload Routes (Must be before /:id)
router.post('/upload-avatar', authorize('EMPLOYEE'), upload.single('file'), uploadAvatar);
router.post('/upload-document', authorize('ADMIN', 'HR', 'EMPLOYEE'), upload.single('file'), uploadDocument);

// Admin Routes for ID
router.route('/:id')
    .get(authorize('ADMIN', 'HR'), getEmployeeById)
    .put(authorize('ADMIN', 'HR'), updateEmployee)
    .delete(authorize('ADMIN', 'HR'), deleteEmployee);

router.route('/:id/status')
    .patch(authorize('ADMIN', 'HR'), updateEmployeeStatus);

module.exports = router;
