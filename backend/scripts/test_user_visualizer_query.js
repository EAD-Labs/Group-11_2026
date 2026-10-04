require('dotenv').config();
const http = require('http');
const { signAccessToken } = require('../src/middleware/auth');

async function testUserQuery() {
  console.log("=== Testing Visualizer User Query on Port 4000 ===");

  const token = signAccessToken({ id: 1, email: 'admin@asha.org', role: 'ADMIN' });
  const postData = JSON.stringify({
    prompt: "help me explore the year on year trend for the maths and english subjects split across by boys and girls and classes"
  });

  console.log("Sending POST /api/analytics/chat with user prompt...");
  const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT || 4000,
    path: '/api/analytics/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`HTTP Status: ${res.statusCode}`);
      try {
        const data = JSON.parse(body);
        if (res.statusCode === 200) {
          console.log("\n[SUCCESS] Response received with HTTP 200!");
          console.log("Model Used:", data.modelUsed);
          console.log("Tools Executed:", JSON.stringify(data.toolsExecuted, null, 2));
          console.log("Summary:", data.summary);
          console.log("UI Layout Type:", data.ui_layout?.layout_type);
          console.log("Widgets Count:", data.ui_layout?.widgets?.length);
          data.ui_layout?.widgets?.forEach((w, i) => {
            console.log(`  Widget ${i + 1}: [${w.type}] ${w.title}`);
          });
          process.exit(0);
        } else {
          console.error("[FAILURE] Unexpected status or error:", data);
          process.exit(1);
        }
      } catch (e) {
        console.error("Failed to parse response JSON:", body);
        process.exit(1);
      }
    });
  });

  req.on('error', (err) => {
    console.error("HTTP request error:", err);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

testUserQuery();
