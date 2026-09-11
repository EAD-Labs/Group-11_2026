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

module.exports = router;
