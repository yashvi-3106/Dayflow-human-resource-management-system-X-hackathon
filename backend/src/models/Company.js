const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        logo: {
            type: String, // Path or URL to logo
            default: null
        },
        address: {
            type: String,
            required: true,
        },
        website: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Company', companySchema);
