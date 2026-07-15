const axios = require('axios');

const BASE_URL = 'http://localhost:1221/api';

async function testIntegration() {
    console.log('🚀 Starting Integration Tests...');

    try {
        // 1. Test invalid login (should return 401 and success: false)
        console.log('\n--- 1. Testing Invalid Login ---');
        try {
            const res = await axios.post(`${BASE_URL}/auth/user/login`, {
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });
            console.log('❌ FAIL: Invalid login should have failed but returned 200/201');
        } catch (error) {
            if (error.response) {
                console.log(`✅ SUCCESS: Received status ${error.response.status}`);
                console.log('Body:', JSON.stringify(error.response.data, null, 2));

                const data = error.response.data;
                if (data.success === false && data.statusCode === 401 && data.message) {
                    console.log('✅ Uniform error format verified');
                } else {
                    console.log('❌ FAIL: Uniform error format incomplete');
                }
            } else {
                console.log('❌ FAIL: Expected error response not received', error.message);
            }
        }

        // 2. Test Success Response (requires a public endpoint)
        console.log('\n--- 2. Testing Success Format (Public Endpoint) ---');
        try {
            // Using /report-types as it's usually public or has some public data
            const res = await axios.get(`${BASE_URL}/report-types`);
            console.log(`✅ SUCCESS: Received status ${res.status}`);
            console.log('Body snippet:', JSON.stringify(res.data, null, 2).substring(0, 200) + '...');

            const data = res.data;
            if (data.success === true && data.statusCode === 200 && data.data) {
                console.log('✅ Uniform success format verified');
            } else {
                console.log('❌ FAIL: Uniform success format incomplete');
            }
        } catch (error) {
            console.log('❌ FAIL: Public endpoint failed', error.response?.data || error.message);
        }

        // 3. Test Validation Error (Bad Request)
        console.log('\n--- 3. Testing Validation Error (Bad Request) ---');
        try {
            // Missing required fields for citizen registration
            await axios.post(`${BASE_URL}/auth/citizen/register`, {
                fullName: '' // Missing phoneNumber
            });
        } catch (error) {
            if (error.response) {
                console.log(`✅ SUCCESS: Received status ${error.response.status}`);
                console.log('Body:', JSON.stringify(error.response.data, null, 2));

                const data = error.response.data;
                if (data.success === false && data.statusCode === 400) {
                    console.log('✅ Validation error format verified');
                }
            }
        }

    } catch (err) {
        console.error('Unexpected error during tests:', err);
    }
}

testIntegration();
