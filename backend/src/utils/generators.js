const crypto = require('crypto');

// Generate Smart Login ID
// Format: [CompanyCode][NameCode][Year][Serial]
// Example: OIJODO20220001
const generateLoginId = (company, firstName, lastName, joiningDate, serialNumber) => {
    // 1. Company Code (First 2 chars of Company Name)
    const companyCode = company.name.substring(0, 2).toUpperCase();

    // 2. Name Code (First letter of First Name + First letter of Last Name)
    // Wireframe says: "First two letters of employee's first name and last name" -> JODO (John Doe)
    // Actually wireframe explanation: "JODO -> First two letters of employee's First name and last name"
    // So 2 chars from First Name + 2 chars from Last Name? 
    // Example: John Doe -> JO + DO = JODO.
    const nameCode = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();

    // 3. Year of Joining
    const year = new Date(joiningDate).getFullYear();

    // 4. Serial Number (4 digits, padded)
    const serial = String(serialNumber).padStart(4, '0');

    return `${companyCode}${nameCode}${year}${serial}`;
};

// Generate Temporary Password
const generateTempPassword = () => {
    // 8 characters random string
    return crypto.randomBytes(4).toString('hex');
};

module.exports = {
    generateLoginId,
    generateTempPassword
};
