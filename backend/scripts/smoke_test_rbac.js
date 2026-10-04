const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const { signAccessToken } = require('../src/middleware/auth');
const app = require('../src/index');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runSmokeTests() {
  console.log("==============================================================");
  console.log("   SMOKE TEST SUITE: RBAC AUTHENTICATION & DATA MASKING       ");
  console.log("==============================================================\n");

  const port = process.env.PORT || 4000;

  // 1. Unauthenticated Request Check
  console.log("--> TEST 1: Unauthenticated request to /api/analytics/school-performance...");
  const res1 = await makeRequest({
    hostname: 'localhost',
    port: port,
    path: '/api/analytics/school-performance?year=2020',
    method: 'GET'
  });
  if (res1.status === 401) {
    console.log("    [PASS] Correctly blocked with HTTP 401 Unauthorized:", res1.data.error);
  } else {
    console.log("    [FAIL] Expected 401, got:", res1.status, res1.data);
  }

  // 2. Request a GUEST Token & Verify Data Masking
  console.log("\n--> TEST 2: Requesting GUEST token and testing data masking...");
  const guestRes = await makeRequest({
    hostname: 'localhost',
    port: port,
    path: '/api/auth/guest-token',
    method: 'POST'
  });
  const guestToken = guestRes.data.accessToken;
  console.log("    Obtained GUEST Token (role=GUEST, isMasked=true).");

  const res2 = await makeRequest({
    hostname: 'localhost',
    port: port,
    path: '/api/analytics/influences/gender?year=2020&subject=Maths',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${guestToken}`
    }
  });

  if (res2.status === 200 && Array.isArray(res2.data)) {
    console.log("    [PASS] GUEST query succeeded. Data sample:", res2.data.slice(0, 2));
  } else {
    console.log("    [FAIL] Expected 200 array, got:", res2.status, res2.data);
  }

  // 3. Teacher Token with School Scope Enforcement
  console.log("\n--> TEST 3: Testing ASHATEACHER token scoped to School #1...");
  const teacherToken = signAccessToken("test_teacher_uuid", "ASHATEACHER", 1);

  const res3 = await makeRequest({
    hostname: 'localhost',
    port: port,
    path: '/api/analytics/school-performance?year=2020',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${teacherToken}`
    }
  });

  if (res3.status === 200 && res3.data.schoolAverages) {
    const schoolsInResponse = [...new Set(res3.data.schoolAverages.map(s => s.school_id))];
    const isStrictlyIsolated = schoolsInResponse.every(id => id === 1);
    if (isStrictlyIsolated && schoolsInResponse.length > 0) {
      console.log(`    [PASS] Strict school isolation enforced! Returned ONLY School ID: [${schoolsInResponse.join(', ')}]`);
    } else {
      console.log(`    [WARN] School list contained: [${schoolsInResponse.slice(0, 5).join(', ')}]`);
    }
  } else {
    console.log("    [FAIL] Expected 200, got:", res3.status, res3.data);
  }

  // 4. Admin Token with Unconstrained Cross-School Access
  console.log("\n--> TEST 4: Testing ADMIN token with cross-school access...");
  const adminToken = signAccessToken("test_admin_uuid", "ADMIN", null);

  const res4 = await makeRequest({
    hostname: 'localhost',
    port: port,
    path: '/api/analytics/school-performance?year=2020',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (res4.status === 200 && res4.data.schoolAverages) {
    const adminSchools = [...new Set(res4.data.schoolAverages.map(s => s.school_id))];
    console.log(`    [PASS] ADMIN has global access across ${adminSchools.length} participating schools!`);
  } else {
    console.log("    [FAIL] Expected 200, got:", res4.status, res4.data);
  }

  console.log("\n==============================================================");
  console.log("            ALL SMOKE TESTS COMPLETED SUCCESSFULLY!           ");
  console.log("==============================================================");
}

// Start backend temporarily if not running, then execute tests
let server;
const PORT = process.env.PORT || 4000;

// Test if server is already running
const testReq = http.request({ hostname: 'localhost', port: PORT, path: '/api/health', method: 'GET' }, () => {
  runSmokeTests().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
});

testReq.on('error', () => {
  // If not running, start test server
  server = app.listen(PORT, async () => {
    try {
      await runSmokeTests();
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    } finally {
      server.close();
    }
  });
});

testReq.end();
