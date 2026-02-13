import User from '../models/User';
import bcrypt from 'bcryptjs';

export const seedAdmin = async () => {
    try {
        const email = 'admin@safeshell.com';
        const password = 'Admin123!';
        const name = 'System Admin';

        // Check if admin exists
        const userExists = await User.findOne({ email });

        if (!userExists) {
            console.log('Seeding: Creating admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'admin'
            });
            console.log(`Seeding: Admin created. Email: ${email}, Password: ${password}`);
        } else {
            // Ensure verify role
            if (userExists.role !== 'admin') {
                console.log('Seeding: Promoting user to admin...');
                userExists.role = 'admin';
                await userExists.save();
                console.log('Seeding: User promoted to admin');
            } else {
                console.log('Seeding: Admin user already exists');
            }
        }
    } catch (error) {
        console.error('Seeding error:', error);
    }
};
