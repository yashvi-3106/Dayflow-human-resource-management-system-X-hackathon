const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * @param {string} userId - Receiver User ID
 * @param {string} companyId - Receiver Company ID
 * @param {string} title - Notification Title
 * @param {string} message - Notification Message
 * @param {string} type - 'INFO' | 'ACTION' | 'ALERT'
 */
const createNotification = async (userId, companyId, title, message, type = 'INFO') => {
    try {
        await Notification.create({
            user: userId,
            company: companyId,
            title,
            message,
            type,
        });
    } catch (error) {
        console.error('Notification Error:', error.message);
        // We don't throw here to avoid failing the main transaction if notification fails.
        // Just log it.
    }
};

module.exports = { createNotification };
