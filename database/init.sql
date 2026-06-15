-- ============================================================
-- MyEduConnect Database Schema & Seed Data
-- NOTICE: Password hashes use MD5 (DELIBERATE WEAKNESS — V-10)
-- ============================================================

-- Drop existing tables
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS enrolments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── Users Table ──────────────────────────────────────────────
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- MD5 hashed (DELIBERATE: V-10)
  role        VARCHAR(50) DEFAULT 'student',  -- 'student', 'teacher', 'admin'
  bio         TEXT,                           -- Stored XSS location (V-03)
  avatar_url  VARCHAR(500),                   -- File upload result URL
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Courses Table ─────────────────────────────────────────────
CREATE TABLE courses (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  teacher_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  price         DECIMAL(10,2) DEFAULT 0.00,
  category      VARCHAR(100),
  thumbnail_url VARCHAR(500),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── Enrolments Table ──────────────────────────────────────────
CREATE TABLE enrolments (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id      INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  enrolled_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ── Payments Table ────────────────────────────────────────────
-- DELIBERATE: Stores full card numbers in plaintext (bad practice for demo)
CREATE TABLE payments (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  amount          DECIMAL(10,2),
  card_last4      VARCHAR(4),
  card_number_full VARCHAR(20),  -- DELIBERATE: full card stored plaintext
  cardholder_name  VARCHAR(255),
  status          VARCHAR(50) DEFAULT 'completed',
  paid_at         TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- MD5 hashes (verified):
--   admin123  → 0192023a7bbd73250516f069df18b500
--   teach123  → b96a660dba3176b85743eb7b28eb03e5
--   alice123  → 7abdccbea8473767e91378e37850d296
--   bob123    → 2acba7f51acfd4fd5102ad090fc612ee
--   carol123  → 35d9b8a73dad4919a46dfed32701f481
-- ============================================================

INSERT INTO users (name, email, password_hash, role, bio) VALUES
  ('Admin User',    'admin@myeduconnect.my',   '0192023a7bbd73250516f069df18b500', 'admin',   'Platform administrator'),
  ('Dr. Ahmad Faris','teacher@myeduconnect.my','b96a660dba3176b85743eb7b28eb03e5', 'teacher', 'Senior lecturer in Computer Science'),
  ('Alice Wong',    'alice@student.my',         '7abdccbea8473767e91378e37850d296', 'student', 'Year 2 Computer Science student'),
  ('Bob Tan',       'bob@student.my',           '2acba7f51acfd4fd5102ad090fc612ee', 'student', 'Year 1 IT student'),
  ('Carol Lim',     'carol@student.my',         '35d9b8a73dad4919a46dfed32701f481', 'student', 'Year 3 Cybersecurity student');

INSERT INTO courses (title, description, teacher_id, price, category, thumbnail_url) VALUES
  ('Introduction to Python Programming', 'Learn Python from scratch. Covers variables, loops, functions, and OOP.', 2, 99.00,  'Programming',    '/static/thumbnails/python.jpg'),
  ('Web Development with Node.js',       'Build REST APIs and full-stack web apps using Node.js and Express.',    2, 149.00, 'Web Development', '/static/thumbnails/nodejs.jpg'),
  ('Cybersecurity Fundamentals',         'Understand network security, encryption, and ethical hacking basics.',  2, 199.00, 'Security',        '/static/thumbnails/cyber.jpg'),
  ('Database Design with PostgreSQL',    'Master relational database design, SQL queries, and optimization.',     2, 129.00, 'Database',        '/static/thumbnails/postgres.jpg'),
  ('Mobile App Development',             'Build cross-platform mobile apps using React Native and Expo.',        2, 179.00, 'Mobile',          '/static/thumbnails/mobile.jpg'),
  ('Machine Learning Basics',            'Introduction to ML concepts, Python scikit-learn, and model training.',2, 249.00, 'AI/ML',           '/static/thumbnails/ml.jpg');

INSERT INTO enrolments (user_id, course_id, payment_status) VALUES
  (3, 1, 'completed'),
  (3, 3, 'completed'),
  (4, 1, 'completed'),
  (4, 2, 'pending'),
  (5, 3, 'completed'),
  (5, 5, 'completed');

INSERT INTO payments (user_id, course_id, amount, card_last4, card_number_full, cardholder_name, status) VALUES
  (3, 1,  99.00, '4242', '4111111111114242', 'Alice Wong', 'completed'),
  (3, 3, 199.00, '4242', '4111111111114242', 'Alice Wong', 'completed'),
  (4, 1,  99.00, '1234', '5500000000001234', 'Bob Tan',    'completed'),
  (5, 3, 199.00, '5678', '4012888888885678', 'Carol Lim',  'completed'),
  (5, 5, 179.00, '5678', '4012888888885678', 'Carol Lim',  'completed');
