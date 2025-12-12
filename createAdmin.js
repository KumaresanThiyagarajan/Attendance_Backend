import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createDefaultAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'kumaresanthiyagarajan11@gmail.com' });

        if (existingAdmin) {
            console.log('ℹ️  Admin user already exists');

            // Ensure admin has correct role
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Updated existing user to admin role');
            }
        } else {
            // Create admin user
            const adminUser = new User({
                username: 'kumaresanthiyagarajan11@gmail.com',
                password: 'Kumar112227',
                role: 'admin'
            });

            await adminUser.save();
            console.log('✅ Default admin user created successfully');
            console.log('   Username: kumaresanthiyagarajan11@gmail.com');
            console.log('   Password: Kumar112227');
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error creating default admin:', error);
        process.exit(1);
    }
};

createDefaultAdmin();
