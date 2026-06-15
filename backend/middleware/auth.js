/**
 * JWT Authentication Middleware — middleware/auth.js
 *
 * DELIBERATE VULNERABILITIES:
 *  V-11: JWT secret is the string "secret" (trivially guessable)
 *  V-06: No expiry check — tokens are valid forever
 *  V-06: Weak validation — only verifies signature, not expiry or audience
 */

const jwt = require('jsonwebtoken');

// DELIBERATE: Fallback to literal 'secret' if env var not set (V-11)
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // DELIBERATE: ignoreExpiration: true — expired tokens still accepted (V-06)
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token', details: err.message });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      // DELIBERATE: Error reveals the user's role (information disclosure)
      return res.status(403).json({
        error: 'Admin access required',
        yourRole: req.user.role,
        userId: req.user.id
      });
    }
    next();
  });
};

module.exports = { verifyToken, verifyAdmin, JWT_SECRET };
