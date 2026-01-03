const express = require('express');
const { getDepartments, createDepartment } = require('../controllers/departmentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleGuard');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(authorize('ADMIN', 'HR'), getDepartments)
    .post(authorize('ADMIN', 'HR'), createDepartment);

module.exports = router;
