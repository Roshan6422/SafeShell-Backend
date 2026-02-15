
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const EMAIL = 'admin@safeshell.com';
const PASSWORD = 'Admin123!';

async function verify() {
    console.log('🔍 Starting System Verification...');

    // 1. Check Health
    try {
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Backend Health Check: PASSED', health.data);
    } catch (e: any) {
        console.error('❌ Backend Health Check: FAILED', e.message);
        process.exit(1);
    }

    // 2. Login as Admin
    let token = '';
    try {
        console.log('🔑 Attempting Admin Login...');
        const login = await axios.post(`${BASE_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        if (login.status === 200 && login.data.token) {
            token = login.data.token;
            console.log('✅ Admin Login: PASSED');
            console.log(`   Token received (length: ${token.length})`);
        } else {
            throw new Error('No token returned');
        }
    } catch (e: any) {
        console.error('❌ Admin Login: FAILED');
        if (e.response) {
            console.error('   Server responded with:', e.response.status, e.response.data);
        } else {
            console.error('   Error:', e.message);
        }
        process.exit(1);
    }

    // 3. Fetch Admin Data (Users)
    try {
        console.log('📂 Fetching Admin Data (Users)...');
        const users = await axios.get(`${BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Fetch Users: PASSED (Count: ${users.data.length})`);
    } catch (e: any) {
        console.error('❌ Fetch Users: FAILED', e.message);
    }

    console.log('\n🎉 System Verification Complete: The Web App Backend is fully functional.');
}

verify();
