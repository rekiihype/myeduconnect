/**
 * Authentication Routes — routes/auth.js
 *
 * DELIBERATE VULNERABILITIES:
 *  V-01: SQL Injection in login query (string interpolation instead of parameterized query)
 *  V-10: Passwords hashed with MD5 (weak hashing algorithm)
 *  V-11: JWT signed with weak secret and no expiry
 *  V-06: No rate limiting on login endpoint (brute force possible)
 */

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// DELIBERATE: MD5 password hashing helper (V-10)
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // DELIBERATE: MD5 hashing (V-10) — should be bcrypt/argon2
    const passwordHash = md5(password);

    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role || 'student']
    );

    // DELIBERATE: Weak JWT — no expiry, weak secret (V-11)
    const token = jwt.sign(
      { id: result.rows[0].id, email, role: result.rows[0].role },
      JWT_SECRET
      // NOTE: no { expiresIn: ... } option — token never expires
    );

    res.status(201).json({ message: 'Registration successful', token, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // DELIBERATE: MD5 hashing for comparison (V-10)
  const passwordHash = md5(password);

  // ─────────────────────────────────────────────────────────────────────────
  // DELIBERATE SQL INJECTION (V-01):
  // User-supplied email is directly interpolated into the SQL string.
  // Attacker payload: email = ' OR '1'='1' --
  // This constructs: SELECT * FROM users WHERE email = '' OR '1'='1' --' AND ...
  // Result: returns all users, logs in as the first user (usually admin).
  // FIX (Phase 5): Use parameterized query: db.query('... WHERE email=$1 AND password_hash=$2', [email, passwordHash])
  // ─────────────────────────────────────────────────────────────────────────
  const query = `SELECT * FROM users WHERE email = '${email}' AND password_hash = '${passwordHash}'`;

  try {
    const result = await db.query(query);  // VULNERABLE: raw string interpolation

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // DELIBERATE: Weak JWT — no expiry (V-11)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    // DELIBERATE: SQL errors returned to client — may expose query structure (information disclosure)
    res.status(500).json({ error: err.message, query: query });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', require('../middleware/auth').verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, bio, avatar_url FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
