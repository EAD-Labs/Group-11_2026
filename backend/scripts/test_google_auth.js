const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: process.env.PORT || 4000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
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
    req.write(payload);
    req.end();
  });
}

async function test() {
  console.log("Testing POST /api/auth/google endpoint...");

  // Mock ID token payload encoded in base64: header.payload.signature
  const createMockToken = (email, name) => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      email,
      name,
      picture: "https://example.com/avatar.jpg",
      sub: "google-1234567890",
      email_verified: true
    })).toString("base64url");
    const signature = "mock_sig";
    return `${header}.${payload}.${signature}`;
  };

  // Test 1: Admin user (arjoe.basak@gmail.com)
  const adminToken = createMockToken("arjoe.basak@gmail.com", "Arjoe Basak");
  const res1 = await postJson('/api/auth/google', { credential: adminToken });
  console.log("Admin test status:", res1.status);
  console.log("Admin test response:", res1.data);
  if (res1.data.role === 'ADMIN' && res1.data.isMasked === false) {
    console.log("--> PASS: arjoe.basak@gmail.com correctly recognized as ADMIN!");
  } else {
    console.error("--> FAIL: expected ADMIN role, got:", res1.data.role);
  }

  // Test 2: Asha Teacher user (asha teacher domain)
  const teacherToken = createMockToken("teacher1@asha.org", "Asha Teacher");
  const res2 = await postJson('/api/auth/google', { credential: teacherToken });
  console.log("\nTeacher test status:", res2.status);
  console.log("Teacher test response:", res2.data);
  if (res2.data.role === 'ASHATEACHER') {
    console.log("--> PASS: teacher1@asha.org correctly recognized as ASHATEACHER!");
  } else {
    console.error("--> FAIL: expected ASHATEACHER role, got:", res2.data.role);
  }

  // Test 3: Guest user
  const guestToken = createMockToken("random.user@gmail.com", "Random User");
  const res3 = await postJson('/api/auth/google', { credential: guestToken });
  console.log("\nGuest test status:", res3.status);
  console.log("Guest test response:", res3.data);
  if (res3.data.role === 'GUEST' && res3.data.isMasked === true) {
    console.log("--> PASS: random.user@gmail.com correctly recognized as GUEST with masking!");
  } else {
    console.error("--> FAIL: expected GUEST role, got:", res3.data.role);
  }
}

const app = require('../src/index');
const PORT = process.env.PORT || 4000;

const testReq = http.request({ hostname: 'localhost', port: PORT, path: '/api/health', method: 'GET' }, () => {
  test().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
});

testReq.on('error', () => {
  const server = app.listen(PORT, async () => {
    try {
      await test();
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
