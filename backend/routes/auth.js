const express = require('express');
const router  = require('express').Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const BCRYPT_COST = 12;

// Legacy MD5 helper — only used to detect/migrate old hashes
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
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role || 'student']
    );
    const token = jwt.sign(
      { id: result.rows[0].id, email, role: result.rows[0].role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.status(201).json({ message: 'Registration successful', token, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    let valid = false;
    if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
      valid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Legacy MD5 — auto-migrate on successful login
      valid = user.password_hash === md5(password);
      if (valid) {
        const newHash = await bcrypt.hash(password, BCRYPT_COST);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
      }
    }
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
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
