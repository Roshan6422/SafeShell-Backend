import '../config/firebase'; // Initialize Firebase
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';

dotenv.config();

const createAdmin = async () => {
    try {
        console.log('Firebase initialized. Creating admin...');

        const email = 'admin@safeshell.com';
        const password = 'Admin123!';
        const name = 'System Admin';

        // Assuming User.findOne uses the Firestore implementation now
        const userExists = await User.findByEmail(email);

        if (userExists) {
            console.log('Admin user already exists');
            // Update password just in case
            const salt = await bcrypt.genSalt(10);
            userExists.password = await bcrypt.hash(password, salt);
            userExists.role = 'admin';
            await userExists.save();
            console.log('Admin password updated to: ' + password);
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'admin',
                createdAt: new Date()
            });
            console.log('Admin user created successfully');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
