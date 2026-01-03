const path = require('path');
const fs = require('fs');
const Employee = require('../models/Employee');

// @desc    Get Media File
// @route   GET /api/media/:filename
// @access  Private (Owner or Admin)
const getMedia = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../uploads', filename);

        // 1. Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // 2. Security Check: Who is accessing?
        // Admin: Allow Access to everything (simple for now)
        if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
            return res.sendFile(filePath);
        }

        // Employee: Must own the file
        // Helper: Check if this filename is in the employee's profile
        const employee = await Employee.findOne({ user: req.user._id });
        if (!employee) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Check Avatar
        const isAvatar = employee.profilePictureUrl && employee.profilePictureUrl.includes(filename);

        // Check Documents
        const isDocument = employee.documents.some(doc => doc.url.includes(filename));

        if (isAvatar || isDocument) {
            return res.sendFile(filePath);
        }

        return res.status(403).json({ success: false, message: 'Unauthorized access to this file' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMedia };
