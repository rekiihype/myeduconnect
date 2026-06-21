/**
 * Enrolment Routes — routes/enrolment.js
 *
 * DELIBERATE VULNERABILITIES:
 *  V-04: Insecure Direct Object Reference (IDOR)
 *        GET /api/enrolments/:id returns any enrolment regardless of ownership
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

// ── GET /api/enrolments ───────────────────────────────────────────────────────
// Returns enrolments for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, c.title as course_title, c.price, c.category, c.thumbnail_url
       FROM enrolments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/enrolments/:id ───────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // ─────────────────────────────────────────────────────────────────────────
    // DELIBERATE IDOR (V-04):
    // The endpoint retrieves an enrolment by its ID without verifying that
    // the requesting user is the owner of that enrolment.
    //
    // Exploit: Authenticate as User A (id=3), then request:
    //   GET /api/enrolments/4  (which belongs to User B / id=4)
    //   → Returns User B's enrolment data (user_id, course, payment_status)
    //
    // FIX (Phase 5): Add WHERE user_id = $2 to the query and pass req.user.id
    // ─────────────────────────────────────────────────────────────────────────
    const result = await db.query(
      `SELECT e.*, c.title as course_title, c.price, c.description,
              u.name as student_name, u.email as student_email
       FROM enrolments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1 AND e.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/enrolments ──────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { courseId } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO enrolments (user_id, course_id, payment_status) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, courseId, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/enrolments/check/:courseId ───────────────────────────────────────
router.get('/check/:courseId', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM enrolments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, req.params.courseId]
    );
    res.json({ enrolled: result.rows.length > 0, enrolment: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
