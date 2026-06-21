const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, bio, avatar_url, created_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/courses', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, u.name as teacher_name, COUNT(e.id) as enrolment_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrolments e ON c.id = e.course_id
      GROUP BY c.id, u.name ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/enrolments', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, u.name as student_name, u.email as student_email, c.title as course_title
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

router.get('/payments', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.id, p.user_id, p.course_id, p.amount, p.card_last4, p.status, p.paid_at,
             u.name as student_name, u.email as student_email, c.title as course_title
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN courses c ON p.course_id = c.id
      ORDER BY p.paid_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: `User ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', verifyToken, requireAdmin, async (req, res) => {
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
