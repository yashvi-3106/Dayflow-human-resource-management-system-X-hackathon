const nodemailer = require('nodemailer');

// Configure Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        const fromName = process.env.FROM_NAME || 'Dayflow HRMS';
        const fromEmail = process.env.SMTP_FROM || process.env.FROM_EMAIL || '"Dayflow HRMS" <no-reply@hrms.com>';

        // Construct standard format: "Name <email>"
        const from = `"${fromName}" <${fromEmail.includes('<') ? fromEmail.match(/<([^>]+)>/)[1] : fromEmail}>`;

        const info = await transporter.sendMail({
            from: from,
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendWelcomeEmail = async (email, loginId, password, verifyLink) => {
    const subject = 'Welcome to Dayflow HRMS - Your Credentials';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Welcome to Dayflow HRMS!</h2>
            <p>Your account has been successfully created.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Login ID:</strong> ${loginId}</p>
                <p><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p>Please verify your email address to activate your account:</p>
            <a href="${verifyLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button above doesn't work, copy and paste this link:<br>${verifyLink}</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

const sendVerificationCode = async (email, code) => {
    const subject = 'Password Reset Verification Code';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Use the code below to proceed:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold; text-align: center; color: #333;">
                ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

module.exports = {
    sendWelcomeEmail,
    sendVerificationCode
};
