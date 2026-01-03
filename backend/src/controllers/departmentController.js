const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Admin/HR)
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ company: req.user.company });
        res.json({ success: true, count: departments.length, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a department (Needed for setup/testing)
// @route   POST /api/departments
// @access  Private (Admin/HR)
const createDepartment = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }

        const department = await Department.create({
            name,
            company: req.user.company
        });

        res.status(201).json({ success: true, data: department });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDepartments,
    createDepartment,
};
