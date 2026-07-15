const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://157.180.114.86:1221/api';

async function testGuestReportWithMedia() {
    console.log(`🚀 Testing Guest Report with Media at ${BASE_URL}...`);

    try {
        const form = new FormData();
        // For multipart, everything is a string. NestJS transform:true will handle numbers if they look like numbers.
        form.append('violationType', 'Pollution');
        form.append('reportDescription', 'Report with media test');
        form.append('latitude', '9.0212');
        form.append('longitude', '38.7469');
        form.append('isAnonymous', 'true');

        // Create a dummy image file
        const dummyImagePath = path.join(__dirname, 'dummy.jpg');
        fs.writeFileSync(dummyImagePath, 'this is a dummy image content');

        form.append('images', fs.createReadStream(dummyImagePath));

        const response = await axios.post(`${BASE_URL}/reports`, form, {
            headers: form.getHeaders()
        });

        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✨ Guest Report with Media Flow Working!');
            if (response.data.data.evidenceUrls && response.data.data.evidenceUrls.length > 0) {
                const evidenceUrl = response.data.data.evidenceUrls[0];
                console.log('📸 Evidence URL:', evidenceUrl);

                // Try to fetch the evidence to see if it's publicly accessible
                console.log('🔍 Verifying media accessibility...');
                try {
                    const mediaRes = await axios.get(evidenceUrl);
                    console.log('✅ Media is accessible! Status:', mediaRes.status);
                } catch (err) {
                    console.error('❌ Media is NOT accessible or URL is wrong:', err.message);
                }
            }
        } else {
            console.log('❌ Report submission failed');
        }

        // Cleanup
        fs.unlinkSync(dummyImagePath);

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

testGuestReportWithMedia();
