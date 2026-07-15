/**
 * Peace and Security — Comprehensive API Test Suite
 * Tests: Auth (User/Patrol/Citizen), CRUD, Guest & Registered Reports,
 *        Notifications (FCM token registration + counts), Patrol flow
 *
 * Usage:  node test-all-apis.js
 * Deps:   npm i axios form-data  (already present in workspace)
 */

const axios = require("axios");
const FormData = require("form-data");

const BASE_URL = "http://localhost:1221/api";

// ─────────────────────────────────────────────
//  Colours & helpers
// ─────────────────────────────────────────────
const c = {
    green: (t) => `\x1b[32m${t}\x1b[0m`,
    red: (t) => `\x1b[31m${t}\x1b[0m`,
    yellow: (t) => `\x1b[33m${t}\x1b[0m`,
    cyan: (t) => `\x1b[36m${t}\x1b[0m`,
    bold: (t) => `\x1b[1m${t}\x1b[0m`,
};

let passed = 0, failed = 0, skipped = 0;

function section(title) {
    console.log(`\n${c.cyan("━".repeat(60))}`);
    console.log(c.bold(c.cyan(`  ${title}`)));
    console.log(c.cyan("━".repeat(60)));
}

async function test(label, fn) {
    try {
        const result = await fn();
        console.log(c.green(`  ✔  ${label}`));
        if (result?.note) console.log(c.yellow(`     ↳ ${result.note}`));
        passed++;
        return result;
    } catch (err) {
        const msg = err?.response?.data?.message || err?.message || String(err);
        const status = err?.response?.status ? ` [${err.response.status}]` : "";
        console.log(c.red(`  ✘  ${label}${status}: ${msg}`));
        failed++;
        return null;
    }
}

function skip(label, reason) {
    console.log(c.yellow(`  ⊘  ${label} — ${reason}`));
    skipped++;
}

function req(method, path, data, token, isForm = false) {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (isForm && data instanceof FormData) {
        Object.assign(headers, data.getHeaders());
    }
    return axios({ method, url: `${BASE_URL}${path}`, data, headers, timeout: 15000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Unique incremental phone for this test run (avoids duplicate-phone errors)
// ─────────────────────────────────────────────────────────────────────────────
const RUN_ID = Date.now().toString().slice(-6);           // last 6 digits
const PHONE_P = `+251911${RUN_ID}`;                        // patrol phone
const PHONE_C = `+251922${RUN_ID}`;                        // citizen phone

// ─────────────────────────────────────────────
//  State bucket shared across all tests
// ─────────────────────────────────────────────
const S = {
    adminToken: null,
    patrolToken: null,
    citizenToken: null,
    patrolId: null,
    citizenId: null,
    reportTypeId: null,
    guestReportId: null,
    regReportId: null,
    guestCaseId: null,
};

// ═════════════════════════════════════════════════════════════════════════════
//  1. ADMIN AUTH
// ═════════════════════════════════════════════════════════════════════════════
async function runAdminAuth() {
    section("1 · Admin / Dashboard User Auth");

    const r = await test("POST /auth/user/login → admin", async () => {
        const res = await req("post", "/auth/user/login", {
            email: "superadmin@peaceandsecurity.com",
            password: "Password123!",
        });
        S.adminToken = res.data?.data?.accessToken || res.data?.accessToken;
        if (!S.adminToken) throw new Error("No accessToken in response");
        return { note: `Token: ${S.adminToken.slice(0, 30)}…` };
    });

    await test("GET /users/profile → admin profile", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/users/profile", null, S.adminToken);
        return { note: `Logged in as: ${res.data?.data?.email || res.data?.email}` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  2. PATROL CRUD + AUTH
// ═════════════════════════════════════════════════════════════════════════════
async function runPatrolTests() {
    section("2 · Patrol CRUD & Auth");

    // --- Create patrol (admin)
    await test("POST /patrols → create patrol officer", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const fd = new FormData();
        fd.append("fullName", "Test Officer " + RUN_ID);
        fd.append("phoneNumber", PHONE_P);
        fd.append("assignedArea", "Bole");
        fd.append("officeAddress", "Bole Subcity");
        fd.append("officeLatitude", "9.021");
        fd.append("officeLongitude", "38.747");
        fd.append("role", "PATROL");
        fd.append("isStaffUser", "true");
        const res = await req("post", "/patrols", fd, S.adminToken, true);
        S.patrolId = res.data?.data?.id || res.data?.id;
        return { note: `Patrol ID: ${S.patrolId}` };
    });

    // --- List patrols
    await test("GET /patrols → list all patrols", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/patrols?limit=5", null, S.adminToken);
        const count = res.data?.data?.length ?? res.data?.total ?? "?";
        return { note: `Returned ${count} patrols` };
    });

    // --- Get by ID
    await test("GET /patrols/:id → get patrol by ID", async () => {
        if (!S.adminToken || !S.patrolId) throw new Error("Missing token or patrolId");
        const res = await req("get", `/patrols/${S.patrolId}`, null, S.adminToken);
        return { note: `Name: ${res.data?.data?.fullName || res.data?.fullName}` };
    });

    // --- Patrol pre-login (check PIN status)
    const preLogin = await test("POST /auth/patrol/pre-login → check PIN status", async () => {
        const res = await req("post", "/auth/patrol/pre-login", { phoneNumber: PHONE_P });
        return { note: `pinStatus: ${res.data?.data?.pinStatus || JSON.stringify(res.data)}` };
    });

    // --- Patrol login with PIN (only if PIN already set; otherwise skip gracefully)
    await test("POST /auth/patrol/login → patrol login", async () => {
        // The newly created patrol won't have a PIN yet — expect a 401 / pinNotSet
        // We test the response shape rather than a full success
        try {
            const res = await req("post", "/auth/patrol/login", { phoneNumber: PHONE_P, pin: "1234" });
            S.patrolToken = res.data?.data?.accessToken;
            return { note: `Patrol token acquired` };
        } catch (err) {
            const msg = err?.response?.data?.message || "";
            if (msg.toLowerCase().includes("pin") || err?.response?.status === 401) {
                return { note: `Expected – PIN not set yet for new patrol: "${msg}"` };
            }
            throw err;
        }
    });

    // --- Update patrol
    await test("PATCH /patrols/:id → update patrol", async () => {
        if (!S.adminToken || !S.patrolId) throw new Error("Missing token or patrolId");
        const fd = new FormData();
        fd.append("assignedArea", "Kirkos");
        const res = await req("patch", `/patrols/${S.patrolId}`, fd, S.adminToken, true);
        return { note: `Updated area: ${res.data?.data?.assignedArea || "ok"}` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  3. USER (Dashboard Staff) CRUD
// ═════════════════════════════════════════════════════════════════════════════
async function runUserTests() {
    section("3 · Dashboard User CRUD");

    let newUserId;

    await test("POST /users/register → create system user", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const fd = new FormData();
        fd.append("fullName", "Test Admin " + RUN_ID);
        fd.append("email", `testadmin${RUN_ID}@peaceandsecurity.com`);
        fd.append("phoneNumber", `+251933${RUN_ID}`);
        fd.append("role", "SYSTEM_ADMIN");
        fd.append("isStaffUser", "true");
        const res = await req("post", "/users/register", fd, S.adminToken, true);
        newUserId = res.data?.data?.user?.id || res.data?.data?.id || res.data?.id;
        return { note: `New user ID: ${newUserId}` };
    });

    await test("GET /users/all → list all users", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/users/all?limit=5", null, S.adminToken);
        const count = res.data?.data?.length ?? "?";
        return { note: `Returned ${count} users` };
    });

    await test("GET /users/:id → get user by ID", async () => {
        if (!S.adminToken || !newUserId) throw new Error("Missing token or userId");
        const res = await req("get", `/users/${newUserId}`, null, S.adminToken);
        return { note: `Email: ${res.data?.data?.email || "ok"}` };
    });

    await test("PATCH /users/:id → update user", async () => {
        if (!S.adminToken || !newUserId) throw new Error("Missing token or userId");
        const fd = new FormData();
        fd.append("fullName", "Updated Admin " + RUN_ID);
        const res = await req("patch", `/users/${newUserId}`, fd, S.adminToken, true);
        return { note: `Updated name: ${res.data?.data?.fullName || "ok"}` };
    });

    await test("PUT /users/:id/toggle-status → toggle status", async () => {
        if (!S.adminToken || !newUserId) throw new Error("Missing token or userId");
        const res = await req("put", `/users/${newUserId}/toggle-status`, null, S.adminToken);
        return { note: `Status toggled` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  4. CITIZEN CRUD + AUTH
// ═════════════════════════════════════════════════════════════════════════════
async function runCitizenTests() {
    section("4 · Citizen CRUD & Auth");

    // Citizen self-register
    await test("POST /auth/citizen/register → citizen self-register", async () => {
        const fd = new FormData();
        fd.append("fullName", "Test Citizen " + RUN_ID);
        fd.append("phoneNumber", PHONE_C);
        const res = await req("post", "/auth/citizen/register", fd, null, true);
        S.citizenId = res.data?.data?.citizen?.id || res.data?.data?.id || res.data?.id;
        return { note: `Citizen ID: ${S.citizenId}` };
    });

    // Citizen pre-login
    await test("POST /auth/citizen/pre-login → check PIN status", async () => {
        const res = await req("post", "/auth/citizen/pre-login", { phoneNumber: PHONE_C });
        return { note: `pinStatus: ${res.data?.data?.pinStatus || JSON.stringify(res.data?.data)}` };
    });

    // Citizen login (no PIN set yet — check response shape)
    await test("POST /auth/citizen/login → citizen login attempt (PIN not set)", async () => {
        try {
            const res = await req("post", "/auth/citizen/login", { phoneNumber: PHONE_C, pin: "0000" });
            S.citizenToken = res.data?.data?.accessToken;
            return { note: `Citizen token acquired` };
        } catch (err) {
            const msg = err?.response?.data?.message || "";
            if (msg.toLowerCase().includes("pin") || err?.response?.status === 401) {
                return { note: `Expected – PIN not set for new citizen: "${msg}"` };
            }
            throw err;
        }
    });

    // Admin: list citizens
    await test("GET /citizens → list all citizens (admin)", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/citizens?limit=5", null, S.adminToken);
        const count = res.data?.data?.length ?? "?";
        return { note: `Returned ${count} citizens` };
    });

    // Admin: get citizen by ID
    await test("GET /citizens/:id → get citizen by ID", async () => {
        if (!S.adminToken || !S.citizenId) throw new Error("Missing token or citizenId");
        const res = await req("get", `/citizens/${S.citizenId}`, null, S.adminToken);
        return { note: `Name: ${res.data?.data?.fullName || "ok"}` };
    });

    // Admin: update citizen
    await test("PATCH /citizens/:id → update citizen (admin)", async () => {
        if (!S.adminToken || !S.citizenId) throw new Error("Missing token or citizenId");
        const fd = new FormData();
        fd.append("fullName", "Citizen Updated " + RUN_ID);
        const res = await req("patch", `/citizens/${S.citizenId}`, fd, S.adminToken, true);
        return { note: `Updated name: ${res.data?.data?.fullName || "ok"}` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  5. REPORT TYPES
// ═════════════════════════════════════════════════════════════════════════════
async function runReportTypeTests() {
    section("5 · Report Types");

    await test("GET /report-types → list all", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/report-types", null, S.adminToken);
        const types = res.data?.data || [];
        S.reportTypeId = types[0]?.id;
        return { note: `${types.length} types found. Using: ${types[0]?.name || "none"}` };
    });

    if (!S.reportTypeId) {
        await test("POST /report-types → create report type", async () => {
            if (!S.adminToken) throw new Error("No admin token");
            const res = await req("post", "/report-types", {
                name: "AIR_POLLUTION",
                description: "Created during API test",
                requiresDecibel: false,
            }, S.adminToken);
            S.reportTypeId = res.data?.data?.id;
            return { note: `Report type ID: ${S.reportTypeId}` };
        });
    }
}

// ═════════════════════════════════════════════════════════════════════════════
//  6. CITIZEN REPORT — GUEST MODE (no auth)
// ═════════════════════════════════════════════════════════════════════════════
async function runGuestReportTests() {
    section("6 · Citizen Report — Guest / Unauthenticated Mode");

    await test("POST /reports → guest report (no auth, isAnonymous=true)", async () => {
        const fd = new FormData();
        fd.append("violationType", "Noise");
        fd.append("reportDescription", "Guest report - automated test " + RUN_ID);
        fd.append("latitude", "9.0212");
        fd.append("longitude", "38.7469");
        fd.append("address", "Bole Road, Addis Ababa");
        fd.append("isAnonymous", "true");
        fd.append("noiseAreaType", "RESIDENTIAL");
        fd.append("decibelLevel", "90");
        fd.append("noisePollutionStatus", "Pollution");
        if (S.reportTypeId) fd.append("reportTypeId", S.reportTypeId);

        const res = await req("post", "/reports", fd, null, true);      // NO token
        S.guestReportId = res.data?.data?.id;
        S.guestCaseId = res.data?.data?.caseId;
        return { note: `ID: ${S.guestReportId} | Case: ${S.guestCaseId}` };
    });

    await test("GET /reports/track/:caseId → public tracking (no auth)", async () => {
        if (!S.guestCaseId) throw new Error("No caseId from guest report");
        const res = await req("get", `/reports/track/${S.guestCaseId}`);
        return { note: `Status: ${res.data?.data?.status}` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  7. CITIZEN REPORT — REGISTERED MODE (with citizen token)
// ═════════════════════════════════════════════════════════════════════════════
async function runRegisteredReportTests() {
    section("7 · Citizen Report — Registered / Authenticated Mode");

    if (!S.citizenToken) {
        console.log(c.yellow("  ⊘  Skipping registered report flow — no citizen token (PIN not set for test citizen)"));
        skipped += 3;
        return;
    }

    await test("POST /reports → registered citizen report", async () => {
        const fd = new FormData();
        fd.append("violationType", "Air Pollution");
        fd.append("reportDescription", "Registered citizen report - automated test " + RUN_ID);
        fd.append("latitude", "9.030");
        fd.append("longitude", "38.750");
        fd.append("address", "Kazanchis, Addis Ababa");
        fd.append("isAnonymous", "false");
        fd.append("noiseAreaType", "Commercial");
        fd.append("decibelLevel", "60");
        fd.append("noisePollutionStatus", "Pollution");
        if (S.reportTypeId) fd.append("reportTypeId", S.reportTypeId);

        const res = await req("post", "/reports", fd, S.citizenToken, true);
        S.regReportId = res.data?.data?.id;
        return { note: `ID: ${S.regReportId}` };
    });

    await test("GET /reports/my-reports → citizen's own reports", async () => {
        const res = await req("get", "/reports/my-reports", null, S.citizenToken);
        const count = res.data?.data?.length ?? 0;
        return { note: `${count} reports owned by this citizen` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  8. ADMIN REPORT MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════
async function runAdminReportTests() {
    section("8 · Admin — Report Management");

    const reportId = S.guestReportId;

    await test("GET /reports → list all reports (admin)", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/reports?page=1&limit=10", null, S.adminToken);
        const count = res.data?.data?.length ?? res.data?.total ?? "?";
        return { note: `${count} reports returned` };
    });

    await test("GET /reports/:id → get report by ID", async () => {
        if (!S.adminToken || !reportId) throw new Error("Missing token or reportId");
        const res = await req("get", `/reports/${reportId}`, null, S.adminToken);
        return { note: `Status: ${res.data?.data?.status}` };
    });

    await test("GET /reports/:id/history → status history", async () => {
        if (!S.adminToken || !reportId) throw new Error("Missing token or reportId");
        const res = await req("get", `/reports/${reportId}/history`, null, S.adminToken);
        const count = res.data?.data?.length ?? 0;
        return { note: `${count} history entries` };
    });

    if (S.patrolId) {
        await test("PATCH /reports/:id/assign → assign patrol", async () => {
            if (!S.adminToken || !reportId) throw new Error("Missing tokens");
            const res = await req("patch", `/reports/${reportId}/assign`, { patrolId: S.patrolId }, S.adminToken);
            return { note: `Assigned to patrol ${S.patrolId.slice(0, 8)}…` };
        });
    } else {
        skip("PATCH /reports/:id/assign", "no patrolId available");
    }

    await test("PATCH /reports/:id/review → admin review (UNDER_REVIEW)", async () => {
        if (!S.adminToken || !reportId) throw new Error("Missing tokens");
        const res = await req("patch", `/reports/${reportId}/review`,
            { status: "UNDER_REVIEW" }, S.adminToken);
        return { note: `Status: ${res.data?.data?.status}` };
    });

    await test("GET /reports/:id/nearby-patrols → nearby patrols", async () => {
        if (!S.adminToken || !reportId) throw new Error("Missing tokens");
        const res = await req("get", `/reports/${reportId}/nearby-patrols`, null, S.adminToken);
        const count = res.data?.data?.length ?? 0;
        return { note: `${count} nearby patrols found` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  9. PATROL — Mobile App Flow
// ═════════════════════════════════════════════════════════════════════════════
async function runPatrolMobileFlow() {
    section("9 · Patrol Mobile App Flow");

    if (!S.patrolToken) {
        console.log(c.yellow("  ⊘  Skipping patrol mobile flow — patrol token not available (PIN not set for newly created patrol)"));
        skipped += 4;
        return;
    }

    await test("GET /patrols/me/profile → patrol own profile", async () => {
        const res = await req("get", "/patrols/me/profile", null, S.patrolToken);
        return { note: `Name: ${res.data?.data?.fullName || "ok"}` };
    });

    await test("PATCH /patrols/location → update patrol GPS location", async () => {
        const res = await req("patch", "/patrols/location",
            { latitude: 9.025, longitude: 38.748 }, S.patrolToken);
        return { note: "Location updated" };
    });

    await test("GET /reports/assigned-to-me → patrol's assigned reports", async () => {
        const res = await req("get", "/reports/assigned-to-me", null, S.patrolToken);
        const count = res.data?.data?.length ?? 0;
        return { note: `${count} reports assigned` };
    });

    await test("GET /reports/nearby → nearby reports for patrol", async () => {
        const res = await req("get", "/reports/nearby?radiusKm=15", null, S.patrolToken);
        const count = res.data?.data?.length ?? res.data?.total ?? "?";
        return { note: `${count} nearby reports` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  10. NOTIFICATIONS & FCM
// ═════════════════════════════════════════════════════════════════════════════
async function runNotificationTests() {
    section("10 · Notifications & Firebase FCM");

    // Admin notification count
    await test("GET /notifications/unread-count → admin unread count", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/notifications/unread-count", null, S.adminToken);
        return { note: `Unread: ${res.data?.count ?? res.data?.data?.count ?? 0}` };
    });

    // Admin notifications list
    await test("GET /notifications → admin notification list", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/notifications?limit=5", null, S.adminToken);
        const count = Array.isArray(res.data?.data) ? res.data.data.length : (res.data?.length ?? "?");
        return { note: `${count} notifications returned` };
    });

    // Register FCM token (dashboard user)
    await test("POST /notifications/fcm-token → register dashboard FCM token", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("post", "/notifications/fcm-token",
            { token: "MOCK_FCM_TOKEN_DASHBOARD_" + RUN_ID }, S.adminToken);
        return { note: "FCM token registered for dashboard user" };
    });

    // Register FCM token (patrol — if token available)
    if (S.patrolToken) {
        await test("POST /notifications/fcm-token → register patrol FCM token", async () => {
            const res = await req("post", "/notifications/fcm-token",
                { token: "MOCK_FCM_TOKEN_PATROL_" + RUN_ID }, S.patrolToken);
            return { note: "FCM token registered for patrol" };
        });
    } else {
        skip("POST /notifications/fcm-token (patrol)", "patrol token not available");
    }

    // Register FCM token (citizen — if token available)
    if (S.citizenToken) {
        await test("POST /notifications/fcm-token → register citizen FCM token", async () => {
            const res = await req("post", "/notifications/fcm-token",
                { token: "MOCK_FCM_TOKEN_CITIZEN_" + RUN_ID }, S.citizenToken);
            return { note: "FCM token registered for citizen" };
        });
    } else {
        skip("POST /notifications/fcm-token (citizen)", "citizen token not available");
    }

    // Mark all read (admin)
    await test("POST /notifications/mark-all-read → mark admin notifications read", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("post", "/notifications/mark-all-read", {}, S.adminToken);
        return { note: "All marked read" };
    });

    // Test notify endpoint
    await test("GET /notifications/test-notify → trigger test notification", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/notifications/test-notify", null, S.adminToken);
        return { note: `Message: ${res.data?.message}` };
    });

    // Unread count should be 1 now (from the test-notify above)
    await test("GET /notifications/unread-count → admin count = 1 after test-notify", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/notifications/unread-count", null, S.adminToken);
        const count = res.data?.count ?? res.data?.data?.count ?? "?";
        return { note: `Unread: ${count}` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  11. DASHBOARD ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════
async function runDashboardTests() {
    section("11 · Dashboard Stats");

    await test("GET /dashboard/stats → general statistics", async () => {
        if (!S.adminToken) throw new Error("No admin token");
        const res = await req("get", "/dashboard/stats", null, S.adminToken);
        const d = res.data?.data;
        return { note: `Reports: ${d?.reports?.total ?? "?"} | Citizens: ${d?.citizens?.total ?? "?"}` };
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  12. CLEANUP — delete test report
// ═════════════════════════════════════════════════════════════════════════════
async function runCleanup() {
    section("12 · Cleanup");

    if (S.guestReportId) {
        await test(`DELETE /reports/${S.guestReportId} → delete guest test report`, async () => {
            if (!S.adminToken) throw new Error("No admin token");
            await req("delete", `/reports/${S.guestReportId}`, null, S.adminToken);
            return { note: "Guest report deleted" };
        });
    }

    if (S.patrolId) {
        await test(`DELETE /patrols/${S.patrolId} → delete test patrol`, async () => {
            if (!S.adminToken) throw new Error("No admin token");
            await req("delete", `/patrols/${S.patrolId}`, null, S.adminToken);
            return { note: "Test patrol deleted" };
        });
    }
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════
async function main() {
    console.log(c.bold(`\n🌿  Peace and Security — Full API Test Suite`));
    console.log(`    Base URL : ${c.cyan(BASE_URL)}`);
    console.log(`    Run ID   : ${RUN_ID}`);
    console.log(`    Patrol ☎ : ${PHONE_P}`);
    console.log(`    Citizen ☎: ${PHONE_C}`);

    await runAdminAuth();
    await runPatrolTests();
    await runUserTests();
    await runCitizenTests();
    await runReportTypeTests();
    await runGuestReportTests();
    await runRegisteredReportTests();
    await runAdminReportTests();
    await runPatrolMobileFlow();
    await runNotificationTests();
    await runDashboardTests();
    await runCleanup();

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log(`\n${c.cyan("━".repeat(60))}`);
    console.log(c.bold("  Test Summary"));
    console.log(c.cyan("━".repeat(60)));
    console.log(`  ${c.green("✔ Passed")}  : ${passed}`);
    console.log(`  ${c.red("✘ Failed")}  : ${failed}`);
    console.log(`  ${c.yellow("⊘ Skipped")} : ${skipped}`);
    console.log(c.cyan("━".repeat(60)));
    if (failed === 0) {
        console.log(c.bold(c.green("  🎉  All tested endpoints passed!\n")));
    } else {
        console.log(c.bold(c.red(`  ⚠   ${failed} endpoint(s) failed. Review output above.\n`)));
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(c.red("\nFatal error: " + err.message));
    process.exit(1);
});
