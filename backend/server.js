/**
 * MyEduConnect Backend — server.js
 * Entry point for the Express application.
 *
 * SECURITY NOTICE (for CCS6324 assignment):
 * This server intentionally contains multiple vulnerabilities for
 * penetration testing demonstration purposes. Do NOT deploy in production.
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const courseRoutes    = require('./routes/courses');
const enrolmentRoutes = require('./routes/enrolment');
const paymentRoutes   = require('./routes/payment');
const adminRoutes     = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
// DELIBERATE: Allow all origins (overly permissive CORS)
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static file serving ───────────────────────────────────────────────────────
// DELIBERATE: Serve uploads directory with no access control (V-05)
// Any uploaded file (including webshells) is directly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/courses',    courseRoutes);
app.use('/api/enrolments', enrolmentRoutes);
app.use('/api/payment',    paymentRoutes);

// DELIBERATE: Admin routes have NO authentication middleware at this level (V-08)
// Admins can be accessed directly via port 3000 bypassing Nginx
app.use('/api/admin',      adminRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MyEduConnect API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    // DELIBERATE: Information disclosure — reveals stack details
    stack: {
      node: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV,
      database: process.env.DATABASE_URL
    }
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
// DELIBERATE: Verbose error messages exposing stack traces
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: err.stack,  // DELIBERATE: Stack trace in response (information disclosure)
    query: err.query   // DELIBERATE: May expose SQL query
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MyEduConnect] Backend running on port ${PORT}`);
  console.log(`[MyEduConnect] Environment: ${process.env.NODE_ENV}`);
  console.log(`[MyEduConnect] JWT Secret: ${process.env.JWT_SECRET}`);  // DELIBERATE: logs secret
});

module.exports = app;
