/**
 * Course Routes — routes/courses.js
 *
 * DELIBERATE VULNERABILITIES:
 *  V-02: SQL Injection in course search (GET /api/courses?search=)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

// ── GET /api/courses ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { search, category } = req.query;

  try {
    let query;

    if (search) {
      const result = await db.query(
        `SELECT c.*, u.name as teacher_name FROM courses c
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE c.title ILIKE $1 OR c.description ILIKE $1
         ORDER BY c.created_at DESC`,
        [`%${search}%`]
      );
      return res.json(result.rows);
    } else if (category) {
      const result = await db.query(
        `SELECT c.*, u.name as teacher_name FROM courses c
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE c.category = $1 ORDER BY c.created_at DESC`,
        [category]
      );
      return res.json(result.rows);
    } else {
      const result = await db.query(
        `SELECT c.*, u.name as teacher_name FROM courses c
         LEFT JOIN users u ON c.teacher_id = u.id
         ORDER BY c.created_at DESC`
      );
      return res.json(result.rows);
    }
  } catch (err) {
    // DELIBERATE: Returns raw SQL error — exposes query structure
    res.status(500).json({ error: err.message, hint: err.hint, query: err.query });
  }
});

// ── GET /api/courses/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.name as teacher_name, u.bio as teacher_bio
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/courses ─────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { title, description, price, category } = req.body;

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only teachers and admins can create courses' });
  }

  try {
    const result = await db.query(
      'INSERT INTO courses (title, description, teacher_id, price, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, req.user.id, price || 0, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
