const axios = require('axios');

const BASE_URL = 'http://157.180.114.86:1221/api';

async function testRemote() {
    console.log(`🚀 Testing remote API at ${BASE_URL}...`);

    try {
        // 1. Admin Login
        console.log('--- [Admin Login] ---');
        const loginRes = await axios.post(`${BASE_URL}/auth/user/login`, {
            email: 'superadmin@ecoguard.com',
            password: 'Password123!'
        });
        console.log('Login Response:', JSON.stringify(loginRes.data, null, 2));
        console.log('✅ Admin Login successful');
        const token = loginRes.data.data.accessToken;

        // 2. Get Report Types
        console.log('--- [Report Types] ---');
        const typesRes = await axios.get(`${BASE_URL}/report-types`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Retrieved ${typesRes.data.data.length} report types`);

        // 3. Create a Report Type if none exist
        if (typesRes.data.data.length === 0) {
            console.log('--- [Create Report Type] ---');
            const newType = await axios.post(`${BASE_URL}/report-types`, {
                name: 'Test Violation',
                description: 'Created during remote testing',
                requiresMedia: true
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Created report type:', newType.data.data.name);
        }

        // 4. Get Citizens
        console.log('--- [Citizens] ---');
        const citizensRes = await axios.get(`${BASE_URL}/citizens`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Retrieved ${citizensRes.data.data.length} citizens`);

        // 5. Get Reports
        console.log('--- [Reports] ---');
        const reportsRes = await axios.get(`${BASE_URL}/reports`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Retrieved ${reportsRes.data.data.length} reports`);

        // 6. Submit a Guest Report (No auth required)
        console.log('--- [Guest Report] ---');
        const guestReport = await axios.post(`${BASE_URL}/reports`, {
            violationType: 'Other',
            description: 'Remote test guest report',
            latitude: 9.0,
            longitude: 38.0,
            isAnonymous: true
        });
        console.log('✅ Guest Report submission:', guestReport.data.message);

        // 7. Get Stats
        console.log('--- [Dashboard Stats] ---');
        const statsRes = await axios.get(`${BASE_URL}/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Dashboard stats retrieved');
        console.log('   Total Reports:', statsRes.data.data.reports.total);

        console.log('\n✨ Remote API Smoke Test Passed!');

    } catch (error) {
        console.error('❌ Remote API Test Failed:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

testRemote();
