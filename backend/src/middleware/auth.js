const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!ACCESS_SECRET) {
  // Fail loudly at boot rather than silently signing tokens with `undefined`.
  throw new Error("JWT_ACCESS_SECRET is not set in the environment");
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.teacherId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

function signAccessToken(teacherId, role = "ASHATEACHER", schoolId = null) {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ sub: teacherId, role, schoolId }, ACCESS_SECRET, { expiresIn });
}

module.exports = { requireAuth, signAccessToken };
