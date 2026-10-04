const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const pool = require("../db/pool");
const { signAccessToken } = require("../middleware/auth");
const { SCHOOLS } = require("../data/schools");

const router = express.Router();

const REFRESH_COOKIE = "kp_refresh";
const REFRESH_TTL_DAYS = 30;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in a few minutes." },
});

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

async function issueRefreshToken(teacherId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (teacher_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [teacherId, hashToken(token), expiresAt]
  );
  return token;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, schoolName } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }
  if (!schoolName || !SCHOOLS.includes(schoolName)) {
    return res.status(400).json({ error: "Please select a valid school from the list" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const existing = await pool.query("SELECT id FROM teachers WHERE email = $1", [
      normalizedEmail,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO teachers (name, email, password_hash, school_name)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, school_name, created_at`,
      [name, normalizedEmail, passwordHash, schoolName]
    );

    const teacher = result.rows[0];
    const accessToken = signAccessToken(teacher.id);
    const refreshToken = await issueRefreshToken(teacher.id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({ accessToken, teacher });
  } catch (err) {
    console.error("register error", err);
    res.status(500).json({ error: "Could not create account" });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, school_name FROM teachers WHERE email = $1",
      [normalizedEmail]
    );
    const teacher = result.rows[0];

    // Constant-shape response whether or not the email exists, to avoid
    // leaking which emails are registered.
    if (!teacher) {
      await bcrypt.compare(password, "$2a$12$invalidsaltinvalidsaltinvalidsal.");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, teacher.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = signAccessToken(teacher.id);
    const refreshToken = await issueRefreshToken(teacher.id);
    setRefreshCookie(res, refreshToken);

    delete teacher.password_hash;
    res.json({ accessToken, teacher });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Could not log in" });
  }
});

// POST /api/auth/refresh — rotates the refresh token and issues a new access token
router.post("/refresh", async (req, res) => {
  const token = req.cookies && req.cookies[REFRESH_COOKIE];
  if (!token) {
    return res.status(401).json({ error: "No refresh token" });
  }

  const tokenHash = hashToken(token);

  try {
    const result = await pool.query(
      `SELECT id, teacher_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );
    const row = result.rows[0];

    if (!row || row.revoked || new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: "Refresh token invalid or expired" });
    }

    // Rotate: revoke the old one, issue a new one
    await pool.query("UPDATE refresh_tokens SET revoked = true WHERE id = $1", [row.id]);
    const newRefreshToken = await issueRefreshToken(row.teacher_id);
    setRefreshCookie(res, newRefreshToken);

    const accessToken = signAccessToken(row.teacher_id);
    res.json({ accessToken });
  } catch (err) {
    console.error("refresh error", err);
    res.status(500).json({ error: "Could not refresh session" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  const token = req.cookies && req.cookies[REFRESH_COOKIE];
  if (token) {
    await pool.query("UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1", [
      hashToken(token),
    ]);
  }
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.json({ ok: true });
});

const { OAuth2Client } = require("google-auth-library");
const { ROLES, rbacMiddleware } = require("../middleware/rbac");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google — Verify Google ID token and return Kanini Padhai JWT session
router.post("/google", async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) {
    return res.status(400).json({ error: "Google credential ID token is required" });
  }

  let payload = null;
  try {
    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else if (process.env.NODE_ENV !== "production") {
      // In local dev without GOOGLE_CLIENT_ID, allow decoding payload
      const parts = credential.split(".");
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
      } else {
        payload = JSON.parse(credential);
      }
    } else {
      return res.status(500).json({ error: "Google OAuth is not configured on this server." });
    }
  } catch (err) {
    console.error("Google token verification error:", err.message);
    return res.status(401).json({ error: "Invalid Google credentials: " + err.message });
  }

  if (!payload || !payload.email) {
    return res.status(400).json({ error: "Unable to extract email from Google credential token." });
  }

  const normalizedEmail = String(payload.email).trim().toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || "arjoe.basak@gmail.com")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim());

  let role = ROLES.GUEST;
  let schoolId = null;

  try {
    const teacherRes = await pool.query(
      "SELECT id, name, email, school_name FROM teachers WHERE email = $1",
      [normalizedEmail]
    );
    let teacher = teacherRes.rows[0];

    // Role resolution logic:
    // 1. Specified admin emails (default includes arjoe.basak@gmail.com) -> ADMIN
    // 2. Pre-registered teachers with school assignment or Asha organization accounts (@asha.org) -> ASHATEACHER
    // 3. Others -> GUEST (masked data, safe exploration)
    if (adminEmails.includes(normalizedEmail)) {
      role = ROLES.ADMIN;
    } else if (normalizedEmail.endsWith("@asha.org") || (teacher && teacher.school_name)) {
      role = ROLES.ASHATEACHER;
    } else {
      role = process.env.GOOGLE_OAUTH_DEFAULT_ROLE || ROLES.GUEST;
    }

    // Auto-provision teacher profile if not yet in database
    if (!teacher) {
      try {
        const insertRes = await pool.query(
          `INSERT INTO teachers (name, email, password_hash, school_name)
           VALUES ($1, $2, 'GOOGLE_OAUTH_USER', $3)
           ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
           RETURNING id, name, email, school_name`,
          [payload.name || normalizedEmail.split("@")[0], normalizedEmail, null]
        );
        teacher = insertRes.rows[0];
      } catch (insertErr) {
        console.warn("Could not upsert teacher record for OAuth user:", insertErr.message);
      }
    }

    const teacherId = teacher?.id || payload.sub || normalizedEmail;
    const accessToken = signAccessToken(teacherId, role, schoolId);

    if (teacher?.id && typeof teacher.id === "string" && teacher.id.length === 36) {
      try {
        const refreshToken = await issueRefreshToken(teacher.id);
        setRefreshCookie(res, refreshToken);
      } catch (refErr) {
        console.warn("Could not issue refresh token:", refErr.message);
      }
    }

    const isMasked = [ROLES.GUEST, ROLES.ADMIN_REPORTS].includes(role);

    return res.json({
      accessToken,
      role,
      schoolId,
      isMasked,
      user: {
        id: teacherId,
        name: payload.name || teacher?.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        picture: payload.picture,
        role,
        isMasked
      }
    });
  } catch (dbErr) {
    console.error("Database error during Google OAuth:", dbErr);
    return res.status(500).json({ error: "Failed to authenticate Google user." });
  }
});

// GET /api/auth/me — Returns current authenticated user and role scope
router.get("/me", rbacMiddleware({ required: true }), async (req, res) => {
  try {
    const teacherId = req.userScope?.teacherId;
    let teacher = null;
    if (teacherId) {
      const result = await pool.query(
        "SELECT id, name, email, school_name FROM teachers WHERE id::text = $1 OR email = $1",
        [teacherId]
      );
      teacher = result.rows[0];
    }

    res.json({
      user: teacher || { id: teacherId, role: req.userScope.role },
      role: req.userScope.role,
      schoolId: req.userScope.schoolId,
      isMasked: req.userScope.isMasked
    });
  } catch (err) {
    console.error("auth me error", err);
    res.status(500).json({ error: "Could not retrieve user profile" });
  }
});

// POST /api/auth/guest-token - Issues a temporary token with GUEST role for read-only masked analytics
router.post("/guest-token", (req, res) => {
  const guestToken = signAccessToken("guest_session", "GUEST", null);
  res.json({
    accessToken: guestToken,
    role: "GUEST",
    isMasked: true
  });
});

module.exports = router;
