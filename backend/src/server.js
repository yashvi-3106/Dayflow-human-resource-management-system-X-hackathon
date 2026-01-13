require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Start server if running locally
if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
} else {
    // For Vercel: Connect to DB using cached connection pattern
    // This prevents creating a new connection on every function invocation (cold start optimization)
    if (mongoose.connection.readyState === 0) {
        connectDB().catch(err => console.error('Initial DB Connection Fail:', err));
    }
}

// Export the app for Vercel
module.exports = app;