/**
 * Admin Routes — routes/admin.js
 *
 * DELIBERATE VULNERABILITIES:
 *  V-08: Admin endpoints accessible WITHOUT authentication when accessed via
 *        port 3000 directly (bypasses Nginx which checks for an admin header).
 *        The verifyAdmin middleware only applies when the Authorization header is present.
 *        Since these routes are mounted without pre-authentication at the server level,
 *        accessing http://localhost:3000/api/admin/users directly returns all user data.
 *
 * NOTE: Nginx (port 80) does NOT block these routes either — it proxies everything.
 *       The "intended" protection is that the admin panel is only supposed to be
 *       used by admins with valid tokens, but there's no server-level firewall.
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// DELIBERATE BROKEN ACCESS CONTROL (V-08):
// The checkAdmin middleware here checks the token IF it's provided,
// but does NOT reject requests with NO token — allowing anonymous access.
// This simulates a developer mistake: forgetting to use verifyToken.
// FIX (Phase 5): Use the verifyAdmin middleware from middleware/auth.js on ALL routes
// ─────────────────────────────────────────────────────────────────────────────
const optionalAdminCheck = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // DELIBERATE: If no auth header, silently proceed (unauthenticated access allowed)
  if (!authHeader) return next();

  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../middleware/auth');
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
  } catch (e) {
    // DELIBERATE: Token errors ignored — still allows access
  }
  next();
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
// DELIBERATE: No auth required — returns ALL users including password hashes
router.get('/users', optionalAdminCheck, async (req, res) => {
  try {
    // DELIBERATE: Returns password_hash — should NEVER be exposed via API
    const result = await db.query(
      'SELECT id, name, email, password_hash, role, bio, avatar_url, created_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/courses ────────────────────────────────────────────────────
router.get('/courses', optionalAdminCheck, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, u.name as teacher_name,
             COUNT(e.id) as enrolment_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrolments e ON c.id = e.course_id
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/enrolments ─────────────────────────────────────────────────
router.get('/enrolments', optionalAdminCheck, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, u.name as student_name, u.email as student_email,
             c.title as course_title
      FROM enrolments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.enrolled_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/payments ───────────────────────────────────────────────────
// DELIBERATE: Returns full card numbers — massive PCI-DSS violation
router.get('/payments', optionalAdminCheck, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.name as student_name, u.email as student_email,
             c.title as course_title
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN courses c ON p.course_id = c.id
      ORDER BY p.paid_at DESC
    `);
    res.json(result.rows);  // DELIBERATE: card_number_full included
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
router.delete('/users/:id', optionalAdminCheck, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: `User ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/users/:id/role ─────────────────────────────────────────────
router.put('/users/:id/role', optionalAdminCheck, async (req, res) => {
  const { role } = req.body;
  try {
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
