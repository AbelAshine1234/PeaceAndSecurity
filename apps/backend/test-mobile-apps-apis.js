require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');

const BASE_URL = `http://localhost:${process.env.PORT || 1221}/api`;
const DB_CONFIG = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'peace_and_security',
};

async function getLatestOtp(phoneNumber) {
    const client = new Client(DB_CONFIG);
    await client.connect();
    try {
        const res = await client.query(
            'SELECT "code" FROM otps WHERE "phoneNumber" = $1 ORDER BY "createdAt" DESC LIMIT 1',
            [phoneNumber]
        );
        return res.rows[0]?.code;
    } finally {
        await client.end();
    }
}

async function testMobileAPIs() {
    console.log('🚀 Starting Mobile Apps API Tests (Citizen & Patrol)...');

    try {
        // --- ADMIN LOGIN (For Setup) ---
        const setupClient = new Client(DB_CONFIG);
        await setupClient.connect();
        const adminUser = await setupClient.query("SELECT * FROM users WHERE role = 'SYSTEM_SUPER_ADMIN' AND \"isPasswordSet\" = true LIMIT 1");
        await setupClient.end();

        if (!adminUser.rows[0]) throw new Error('No super admin found. Run reset-admin.js first.');
        const ADMIN_EMAIL = adminUser.rows[0].email;
        const adminLogin = await axios.post(`${BASE_URL}/auth/user/login`, { email: ADMIN_EMAIL, password: 'Password123!' });
        const adminToken = adminLogin.data.data.accessToken;
        console.log(`✅ Admin Login Successful: ${ADMIN_EMAIL}`);

        // Ensure Report Type exists
        const typesRes = await axios.get(`${BASE_URL}/report-types`);
        let pollutionType = typesRes.data.data[0];
        if (!pollutionType) {
            const rt = await axios.post(`${BASE_URL}/report-types`, {
                name: 'General Pollution',
                description: 'Environmental hazard',
                requiresMedia: true
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            pollutionType = rt.data.data;
        }

        // --- CITIZEN FLOWS ---
        console.log('\n--- [CITIZEN FLOWS] ---');
        const ts = Date.now().toString().slice(-6);
        const CIT_PHONE = `+251977${ts}`;

        // 1. Registration
        await axios.post(`${BASE_URL}/auth/citizen/register`, {
            fullName: 'Test Citizen ' + ts,
            phoneNumber: CIT_PHONE
        });
        console.log(`✅ Citizen Registration: ${CIT_PHONE}`);

        // 2. Pre-login / Send OTP
        const citPre = await axios.post(`${BASE_URL}/auth/citizen/pre-login`, { phoneNumber: CIT_PHONE });
        const citOtp = await getLatestOtp(CIT_PHONE);
        console.log(`✅ Citizen Pre-login / Send OTP: SUCCESS (Phone: ${CIT_PHONE})`);

        // 3. Verify OTP & Set PIN
        const citVerify = await axios.post(`${BASE_URL}/auth/citizen/verify`, {
            otpCode: citOtp,
            otpType: 'REGISTRATION-OTP'
        }, { headers: { Authorization: `Bearer ${citPre.data.data.registrationToken}` } });
        const citSetPinToken = citVerify.data.data.setPinToken;
        await axios.post(`${BASE_URL}/auth/citizen/set-pin`, { pin: '1111' }, { headers: { Authorization: `Bearer ${citSetPinToken}` } });
        console.log(`✅ Citizen Verify OTP & Set PIN: SUCCESS`);

        // 4. Login
        const citLog = await axios.post(`${BASE_URL}/auth/citizen/login`, { phoneNumber: CIT_PHONE, pin: '1111' });
        let citToken = citLog.data.data.accessToken;
        console.log(`✅ Citizen Login: SUCCESS`);

        // 5. Change PIN
        await axios.patch(`${BASE_URL}/auth/pin/change`, {
            currentPin: '1111',
            newPin: '2222'
        }, { headers: { Authorization: `Bearer ${citToken}` } });
        console.log(`✅ Citizen Change PIN: SUCCESS (New PIN: 2222)`);

        // 6. PIN Reset (Forgot PIN)
        const citResetReq = await axios.post(`${BASE_URL}/auth/citizen/pin-reset/request`, {
            phoneNumber: CIT_PHONE,
            type: 'RESET'
        });
        const resetOtp = await getLatestOtp(CIT_PHONE);
        const resetToken = citResetReq.data.data.resetToken;
        await axios.post(`${BASE_URL}/auth/citizen/pin-reset/confirm`, {
            otpCode: resetOtp,
            newPin: '3333'
        }, { headers: { Authorization: `Bearer ${resetToken}` } });
        console.log(`✅ Citizen PIN Reset Request / Confirm (Forgot PIN): SUCCESS`);

        // Login with reset PIN
        const citLogFinal = await axios.post(`${BASE_URL}/auth/citizen/login`, { phoneNumber: CIT_PHONE, pin: '3333' });
        citToken = citLogFinal.data.data.accessToken;

        // 7. Submit Report (Logged-in)
        const citRep = await axios.post(`${BASE_URL}/reports`, {
            violationTypeId: pollutionType.id,
            description: 'Logged-in citizen report',
            latitude: 9.02, longitude: 38.75,
            evidenceUrls: ['http://example.com/e.jpg']
        }, { headers: { Authorization: `Bearer ${citToken}` } });
        const reportId = citRep.data.data.id;
        console.log(`✅ Citizen Logged-in Report Submission: SUCCESS (ID: ${reportId})`);

        // 8. Submit Report (Guest)
        await axios.post(`${BASE_URL}/reports`, {
            violationType: 'Other',
            description: 'Guest report submission',
            latitude: 9.03, longitude: 38.76,
            isAnonymous: true
        });
        console.log(`✅ Guest Report Submission: SUCCESS`);


        // --- PATROL FLOWS ---
        console.log('\n--- [PATROL FLOWS] ---');
        const pts = Date.now().toString().slice(-6);
        const PAT_PHONE = `+251988${pts}`;

        // 1. Admin Create Patrol
        const patRes = await axios.post(`${BASE_URL}/patrols`, {
            fullName: 'Officer ' + pts,
            phoneNumber: PAT_PHONE,
            assignedArea: 'Test Zone',
            officeLatitude: 9.02, officeLongitude: 38.75
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const patId = patRes.data.data.id;
        console.log(`✅ Admin Created Patrol: ${PAT_PHONE} (ID: ${patId})`);

        // 2. Pre-login / Send OTP
        const patPre = await axios.post(`${BASE_URL}/auth/patrol/pre-login`, { phoneNumber: PAT_PHONE });
        const patOtp = await getLatestOtp(PAT_PHONE);
        console.log(`✅ Patrol Pre-login / Send OTP: SUCCESS`);

        // 3. Verify OTP & Set PIN
        const patVerify = await axios.post(`${BASE_URL}/auth/patrol/verify`, {
            otpCode: patOtp,
            otpType: 'REGISTRATION-OTP'
        }, { headers: { Authorization: `Bearer ${patPre.data.data.registrationToken}` } });
        const patSetPinToken = patVerify.data.data.setPinToken;
        await axios.post(`${BASE_URL}/auth/patrol/set-pin`, { pin: '4444' }, { headers: { Authorization: `Bearer ${patSetPinToken}` } });
        console.log(`✅ Patrol Verify OTP & Set PIN: SUCCESS`);

        // 4. Login
        const patLog = await axios.post(`${BASE_URL}/auth/patrol/login`, { phoneNumber: PAT_PHONE, pin: '4444' });
        let patAuthToken = patLog.data.data.accessToken;
        console.log(`✅ Patrol Login: SUCCESS`);

        // 5. Change PIN
        await axios.patch(`${BASE_URL}/auth/pin/change`, {
            currentPin: '4444',
            newPin: '5555'
        }, { headers: { Authorization: `Bearer ${patAuthToken}` } });
        console.log(`✅ Patrol Change PIN: SUCCESS`);

        // Refresh token after PIN change
        const patLog2 = await axios.post(`${BASE_URL}/auth/patrol/login`, { phoneNumber: PAT_PHONE, pin: '5555' });
        patAuthToken = patLog2.data.data.accessToken;

        // 6. PIN Reset (Forgot PIN)
        const patResetReq = await axios.post(`${BASE_URL}/auth/patrol/pin-reset/request`, {
            phoneNumber: PAT_PHONE,
            type: 'RESET'
        });
        const patResetOtp = await getLatestOtp(PAT_PHONE);
        const patResetToken = patResetReq.data.data.resetToken;
        await axios.post(`${BASE_URL}/auth/patrol/pin-reset/confirm`, {
            otpCode: patResetOtp,
            newPin: '6666'
        }, { headers: { Authorization: `Bearer ${patResetToken}` } });
        console.log(`✅ Patrol PIN Reset Request / Confirm (Forgot PIN): SUCCESS`);

        // Final login
        const patLogFinal = await axios.post(`${BASE_URL}/auth/patrol/login`, { phoneNumber: PAT_PHONE, pin: '6666' });
        patAuthToken = patLogFinal.data.data.accessToken;

        // --- REPORT MANAGEMENT FLOW ---
        console.log('\n--- [REPORT MANAGEMENT FLOW] ---');

        // 1. Admin Assign Report
        await axios.patch(`${BASE_URL}/reports/${reportId}/assign`, { patrolId: patId }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log(`✅ Admin Assigned Report ${reportId} to Patrol ${patId}`);

        // 2. Patrol View Assigned Reports
        const assignedRes = await axios.get(`${BASE_URL}/reports/assigned-to-me`, { headers: { Authorization: `Bearer ${patAuthToken}` } });
        if (assignedRes.data.data.length === 0) throw new Error("Patrol: Assigned reports list is empty!");
        console.log(`✅ Patrol View Assigned Reports: SUCCESS (Found ${assignedRes.data.data.length})`);

        // 3. Verify Patrol Notification
        const patNotifs = await axios.get(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${patAuthToken}` } });
        const notifications = patNotifs.data?.data || patNotifs.data;
        const hasAssignmentNotif = Array.isArray(notifications) && notifications.some(n => n.type === 'REPORT_ASSIGNED' || n.title.includes('Assigned'));
        if (!hasAssignmentNotif) console.warn("⚠️ Patrol: Assignment notification not found in /notifications");
        else console.log("✅ Patrol Received Notification: SUCCESS");

        // 4. Patrol Accept Report (Sets to IN_PROGRESS)
        await axios.patch(`${BASE_URL}/reports/${reportId}/accept`, {}, { headers: { Authorization: `Bearer ${patAuthToken}` } });
        console.log(`✅ Patrol Accept Report: SUCCESS (Status: IN_PROGRESS)`);

        // 4. Patrol Add Notes / Follow-up
        await axios.patch(`${BASE_URL}/reports/${reportId}/follow-up`, {
            notes: 'Verified the pollution on-site.',
            latitude: 9.02, longitude: 38.75,
            evidenceUrls: ['http://example.com/inspection.jpg']
        }, { headers: { Authorization: `Bearer ${patAuthToken}` } });
        console.log(`✅ Patrol Add Notes & Evidence: SUCCESS`);

        // 5. Patrol Close Report
        await axios.patch(`${BASE_URL}/reports/${reportId}/close`, {}, { headers: { Authorization: `Bearer ${patAuthToken}` } });
        console.log(`✅ Patrol Close Report: SUCCESS (Status: CLOSED)`);

        console.log('\n✨ ALL MOBILE APP API FLOWS VERIFIED SUCCESSFULLY!');

    } catch (e) {
        console.error('\n❌ TEST FAILED:');
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            console.error(`Data: ${JSON.stringify(e.response.data, null, 2)}`);
        } else {
            console.error(e.stack);
        }
        process.exit(1);
    }
}

testMobileAPIs();
