const express = require('express');
const { getMyPayroll } = require('../controllers/payrollController');
const { protect } = require('../middlewares/authMiddleware');
const { firstLoginGuard } = require('../middlewares/firstLoginGuard');

const router = express.Router();

router.use(protect);
router.use(firstLoginGuard);

router.get('/me', getMyPayroll);

module.exports = router;
