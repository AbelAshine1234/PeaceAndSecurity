const axios = require('axios');

const BASE_URL = 'http://157.180.114.86:1221/api';

async function testGuestReport() {
    console.log(`🚀 Testing Guest Report at ${BASE_URL}...`);

    try {
        const payload = {
            violationType: 'Waste',
            description: 'Guest report from automated tester',
            latitude: 9.0212,
            longitude: 38.7469,
            isAnonymous: true
        };

        const response = await axios.post(`${BASE_URL}/reports`, payload);

        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✨ Guest Report Flow Working!');
        } else {
            console.log('❌ Report submission returned success: false');
        }

    } catch (error) {
        console.error('❌ Test Failed:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(error.message);
        }
    }
}

testGuestReport();
