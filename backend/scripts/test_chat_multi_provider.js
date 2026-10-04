const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const { signAccessToken } = require('../src/middleware/auth');

function postJson(path, data, token, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      ...customHeaders
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: process.env.PORT || 4000,
      path,
      method: 'POST',
      headers
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
  console.log("=================================================");
  console.log("   TESTING MULTI-PROVIDER CHAT ENDPOINT          ");
  console.log("=================================================\n");

  const adminToken = signAccessToken('admin-test-id', 'ADMIN', null);

  // Test 1: Check provider selection behavior when provider=groq
  console.log("--> TEST 1: Request with provider='groq'");
  const res1 = await postJson('/api/analytics/chat', {
    prompt: "Compare average Maths scores across classes for 2019",
    provider: "groq"
  }, adminToken);

  console.log("    Response status:", res1.status);
  if (res1.status === 200) {
    console.log("    [PASS] Provider used:", res1.data.provider);
    console.log("    Model used:", res1.data.modelUsed);
    console.log("    Tools called:", res1.data.toolStats);
    console.log("    Summary:", res1.data.summary);
  } else {
    console.log("    Response:", res1.data || res1.text);
  }

  // Test 2: Request with custom / mock Gemini header or Gemini provider without key
  console.log("\n--> TEST 2: Request with provider='gemini' (testing fallback / validation)");
  const res2 = await postJson('/api/analytics/chat', {
    prompt: "Show preschool impact on Maths 2019",
    provider: "gemini"
  }, adminToken);

  console.log("    Response status:", res2.status);
  if (res2.status === 200) {
    console.log("    [PASS] Active provider used:", res2.data.provider);
    console.log("    Model used:", res2.data.modelUsed);
    console.log("    Summary:", res2.data.summary);
  } else {
    console.log("    Response:", res2.data || res2.text);
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
