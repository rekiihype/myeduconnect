/**
 * Payment Routes — routes/payment.js
 *
 * DELIBERATE VULNERABILITIES:
 *  V-12: Sensitive payment data transmitted over HTTP (cleartext — no TLS)
 *  V-13: Full card number stored in database (bad practice — demonstrates data exposure)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

// ── POST /api/payment ─────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { courseId, cardNumber, cardholderName, expiryDate, cvv } = req.body;

  if (!courseId || !cardNumber || !cardholderName) {
    return res.status(400).json({ error: 'courseId, cardNumber, and cardholderName are required' });
  }

  try {
    // Verify course exists
    const course = await db.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0) return res.status(404).json({ error: 'Course not found' });

    // ─────────────────────────────────────────────────────────────────────────
    // DELIBERATE BAD PRACTICE:
    // The full card number is stored in the database in plaintext (V-13).
    // In a real system, card data must NEVER be stored; use a payment gateway.
    // Combined with HTTP-only transmission (V-12), this data is visible in
    // Wireshark captures between client and server.
    // FIX (Phase 5): Never store card data; integrate a real payment gateway;
    //               enforce HTTPS for all payment endpoints.
    // ─────────────────────────────────────────────────────────────────────────
    const cardLast4 = cardNumber.slice(-4);

    // Store payment with full card number (deliberate bad practice)
    await db.query(
      `INSERT INTO payments (user_id, course_id, amount, card_last4, card_number_full, cardholder_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed')`,
      [req.user.id, courseId, course.rows[0].price, cardLast4, cardNumber, cardholderName]
    );

    // Update enrolment status
    await db.query(
      `INSERT INTO enrolments (user_id, course_id, payment_status)
       VALUES ($1, $2, 'completed')
       ON CONFLICT (user_id, course_id) DO UPDATE SET payment_status = 'completed'`,
      [req.user.id, courseId]
    );

    res.json({
      message: 'Payment successful',
      // DELIBERATE: Response includes card details (information disclosure)
      receipt: {
        courseTitle: course.rows[0].title,
        amount: course.rows[0].price,
        cardLast4,
        cardholderName,
        transactionDate: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payment/history ──────────────────────────────────────────────────
router.get('/history', verifyToken, async (req, res) => {
  try {
    // DELIBERATE: Returns full card numbers in payment history
    const result = await db.query(
      `SELECT p.*, c.title as course_title
       FROM payments p
       JOIN courses c ON p.course_id = c.id
       WHERE p.user_id = $1
       ORDER BY p.paid_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);  // DELIBERATE: Includes card_number_full in response
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
