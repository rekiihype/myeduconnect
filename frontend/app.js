/**
 * MyEduConnect Frontend SPA — app.js
 *
 * Single-page application using vanilla JavaScript.
 * Routes: /, /login, /register, /courses, /courses/:id,
 *         /profile, /enrolments, /payment/:id, /admin
 *
 * DELIBERATE VULNERABILITY NOTE:
 * The bio field on profile pages is rendered using innerHTML (V-03 — Stored XSS).
 * This allows any script injected via the profile update form to execute in
 * every visitor's browser when viewing that profile.
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const API_BASE = '/api';

// ── State ─────────────────────────────────────────────────────────────────────
let currentUser = null;
let currentToken = null;

// ── Utilities ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const app = document.getElementById('app');

function getToken() {
  // DELIBERATE: Token stored in localStorage (vulnerable to XSS theft)
  return localStorage.getItem('mec_token');
}

function setToken(token) {
  localStorage.setItem('mec_token', token);
  currentToken = token;
}

function clearToken() {
  localStorage.removeItem('mec_token');
  localStorage.removeItem('mec_user');
  currentToken = null;
  currentUser = null;
}

function getUser() {
  const u = localStorage.getItem('mec_user');
  return u ? JSON.parse(u) : null;
}

function setUser(user) {
  localStorage.setItem('mec_user', JSON.stringify(user));
  currentUser = user;
}

async function apiCall(method, path, body = null, requireAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth || getToken()) headers['Authorization'] = `Bearer ${getToken()}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const EMOJIS = { Programming: '💻', 'Web Development': '🌐', Security: '🔒', Database: '🗄️', Mobile: '📱', 'AI/ML': '🤖' };

// ── Router ────────────────────────────────────────────────────────────────────
function navigate(path) {
  history.pushState({}, '', path);
  render(path);
}

window.addEventListener('popstate', () => render(location.pathname));

function render(path = location.pathname) {
  currentToken = getToken();
  currentUser = getUser();

  if (path === '/' || path === '/home')         return renderHome();
  if (path === '/login')                         return renderLogin();
  if (path === '/register')                      return renderRegister();
  if (path === '/courses')                       return renderCourses();
  if (path.startsWith('/courses/'))              return renderCourseDetail(path.split('/')[2]);
  if (path === '/profile')                       return currentToken ? renderProfile() : navigate('/login');
  if (path === '/enrolments')                    return currentToken ? renderEnrolments() : navigate('/login');
  if (path.startsWith('/payment/'))             return currentToken ? renderPayment(path.split('/')[2]) : navigate('/login');
  if (path === '/admin')                         return renderAdmin();
  navigate('/');
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function renderNav() {
  const user = getUser();
  return `
  <nav>
    <div class="nav-inner">
      <a class="nav-brand" href="/" onclick="navigate('/');return false;">MyEduConnect</a>
      <div class="nav-links">
        <a href="/courses" onclick="navigate('/courses');return false;">Courses</a>
        ${user ? `
          <a href="/enrolments" onclick="navigate('/enrolments');return false;">My Learning</a>
          <a href="/profile" onclick="navigate('/profile');return false;">Profile</a>
          ${user.role === 'admin' ? `<a href="/admin" onclick="navigate('/admin');return false;">Admin</a>` : ''}
          <button onclick="logout()">Logout</button>
        ` : `
          <a href="/login" onclick="navigate('/login');return false;">Login</a>
          <a class="btn-nav-cta" href="/register" onclick="navigate('/register');return false;">Get Started</a>
        `}
      </div>
    </div>
  </nav>`;
}

function renderFooter() {
  return `
  <footer>
    <div class="container footer-inner">
      <span class="footer-brand">MyEduConnect</span>
      <span class="footer-copy">© 2026 MyEduConnect Sdn Bhd. All rights reserved.</span>
    </div>
  </footer>`;
}

function logout() {
  clearToken();
  navigate('/');
}

// ── Home Page ─────────────────────────────────────────────────────────────────
function renderHome() {
  app.innerHTML = renderNav() + `
  <div class="hero">
    <div class="container">
      <h1>Learn Without <span>Limits</span></h1>
      <p>Join thousands of Malaysian students and professionals advancing their careers with MyEduConnect's expert-led online courses.</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="/courses" onclick="navigate('/courses');return false;">Browse Courses</a>
        ${!getToken() ? `<a class="btn btn-outline" href="/register" onclick="navigate('/register');return false;">Start for Free</a>` : ''}
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-num">12,000+</div><div class="stat-lbl">Students Enrolled</div></div>
        <div class="stat"><div class="stat-num">200+</div><div class="stat-lbl">Expert Courses</div></div>
        <div class="stat"><div class="stat-num">50+</div><div class="stat-lbl">Certified Instructors</div></div>
        <div class="stat"><div class="stat-num">98%</div><div class="stat-lbl">Satisfaction Rate</div></div>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Featured Courses</h2>
        <a class="btn btn-outline btn-sm" href="/courses" onclick="navigate('/courses');return false;">View All</a>
      </div>
      <div id="featured-courses"><div class="loading"><div class="spinner"></div></div></div>
    </div>
  </div>
  ` + renderFooter();

  loadFeaturedCourses();
}

async function loadFeaturedCourses() {
  try {
    const courses = await apiCall('GET', '/courses');
    const el = document.getElementById('featured-courses');
    if (!el) return;
    el.innerHTML = `<div class="course-grid">` +
      courses.slice(0, 3).map(c => courseCard(c)).join('') +
      `</div>`;
  } catch (e) {
    document.getElementById('featured-courses').innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

function courseCard(c) {
  return `
  <div class="course-card" onclick="navigate('/courses/${c.id}')">
    <div class="course-thumb">${EMOJIS[c.category] || '📚'}</div>
    <div class="course-body">
      <div class="course-category">${c.category || 'General'}</div>
      <div class="course-title">${c.title}</div>
      <div class="course-desc">${c.description || ''}</div>
      <div class="course-footer">
        <span class="course-price">RM ${parseFloat(c.price).toFixed(2)}</span>
        <span class="btn btn-sm btn-primary">Enrol Now</span>
      </div>
    </div>
  </div>`;
}

// ── Login Page ────────────────────────────────────────────────────────────────
function renderLogin() {
  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo"><h2>MyEduConnect</h2></div>
      <h3>Welcome back</h3>
      <p>Sign in to continue learning</p>
      <div id="login-alert"></div>
      <form onsubmit="handleLogin(event)">
        <div class="form-group">
          <label for="login-email">Email Address</label>
          <input id="login-email" type="text" placeholder="you@example.com" autocomplete="username" />
        </div>
        <div class="form-group">
          <label for="login-password">Password</label>
          <input id="login-password" type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary btn-block">Sign In</button>
      </form>
      <div class="auth-switch">Don't have an account? <a onclick="navigate('/register')">Register here</a></div>
    </div>
  </div>`;
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const alertEl  = document.getElementById('login-alert');

  try {
    const data = await apiCall('POST', '/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    navigate('/');
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// ── Register Page ─────────────────────────────────────────────────────────────
function renderRegister() {
  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo"><h2>MyEduConnect</h2></div>
      <h3>Create your account</h3>
      <p>Join thousands of learners today</p>
      <div id="reg-alert"></div>
      <form onsubmit="handleRegister(event)">
        <div class="form-group">
          <label for="reg-name">Full Name</label>
          <input id="reg-name" type="text" placeholder="Ahmad Razif" />
        </div>
        <div class="form-group">
          <label for="reg-email">Email Address</label>
          <input id="reg-email" type="email" placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label for="reg-password">Password</label>
          <input id="reg-password" type="password" placeholder="Choose a password" />
        </div>
        <div class="form-group">
          <label for="reg-role">I am a...</label>
          <select id="reg-role">
            <option value="student">Student</option>
            <option value="teacher">Teacher / Instructor</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Create Account</button>
      </form>
      <div class="auth-switch">Already have an account? <a onclick="navigate('/login')">Sign in</a></div>
    </div>
  </div>`;
}

async function handleRegister(e) {
  e.preventDefault();
  const alertEl = document.getElementById('reg-alert');
  try {
    const data = await apiCall('POST', '/auth/register', {
      name:     document.getElementById('reg-name').value,
      email:    document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
      role:     document.getElementById('reg-role').value
    });
    setToken(data.token);
    setUser(data.user);
    navigate('/courses');
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// ── Courses Page ──────────────────────────────────────────────────────────────
function renderCourses() {
  app.innerHTML = renderNav() + `
  <div class="container">
    <div class="page-header">
      <h1>All Courses</h1>
      <p>Expand your skills with expert-led online courses</p>
    </div>
    <div class="form-group search-bar" style="max-width:500px;margin-bottom:2rem;">
      <input id="search-input" type="text" placeholder="Search courses..." oninput="searchCourses()" />
    </div>
    <div id="courses-grid"><div class="loading"><div class="spinner"></div></div></div>
  </div>
  ` + renderFooter();

  loadCourses();
}

let searchTimeout;
async function searchCourses() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const q = document.getElementById('search-input')?.value?.trim();
    await loadCourses(q);
  }, 400);
}

async function loadCourses(search = '') {
  const el = document.getElementById('courses-grid');
  if (!el) return;
  el.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  try {
    const url = search ? `/courses?search=${encodeURIComponent(search)}` : '/courses';
    const courses = await apiCall('GET', url);
    el.innerHTML = courses.length
      ? `<div class="course-grid">${courses.map(c => courseCard(c)).join('')}</div>`
      : `<div class="alert alert-error">No courses found.</div>`;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// ── Course Detail Page ────────────────────────────────────────────────────────
async function renderCourseDetail(id) {
  app.innerHTML = renderNav() + `<div class="container"><div class="loading"><div class="spinner"></div></div></div>` + renderFooter();
  try {
    const c = await apiCall('GET', `/courses/${id}`);
    app.innerHTML = renderNav() + `
    <div class="container" style="max-width:800px;padding-top:2rem;">
      <div class="course-thumb" style="border-radius:16px;height:200px;margin-bottom:1.5rem;">${EMOJIS[c.category] || '📚'}</div>
      <div class="badge badge-primary" style="margin-bottom:0.5rem;">${c.category}</div>
      <h1 style="font-size:1.8rem;margin-bottom:0.5rem;">${c.title}</h1>
      <p style="color:var(--text-muted);margin-bottom:1rem;">By <strong>${c.teacher_name || 'Unknown Instructor'}</strong></p>
      <p style="margin-bottom:2rem;">${c.description}</p>
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem;">
        <span style="font-size:1.5rem;font-weight:700;color:var(--primary);">RM ${parseFloat(c.price).toFixed(2)}</span>
        <button class="btn btn-primary" onclick="navigate('/payment/${c.id}')">Enrol Now</button>
      </div>
      ${c.teacher_bio ? `
        <div class="card">
          <h3 style="margin-bottom:0.5rem;">About the Instructor</h3>
          <!-- DELIBERATE XSS: teacher bio rendered as innerHTML (V-03) -->
          <div class="profile-bio" id="teacher-bio"></div>
        </div>` : ''}
    </div>
    ` + renderFooter();

    // DELIBERATE XSS: bio rendered as raw HTML (V-03)
    const bioel = document.getElementById('teacher-bio');
    if (bioel && c.teacher_bio) bioel.innerHTML = c.teacher_bio;
  } catch (err) {
    app.innerHTML = renderNav() + `<div class="container"><div class="alert alert-error">${err.message}</div></div>` + renderFooter();
  }
}

// ── Profile Page ──────────────────────────────────────────────────────────────
async function renderProfile() {
  app.innerHTML = renderNav() + `<div class="container"><div class="loading"><div class="spinner"></div></div></div>` + renderFooter();
  try {
    const user = await apiCall('GET', '/users/profile', null, true);
    setUser(user);
    app.innerHTML = renderNav() + `
    <div class="container" style="padding-top:2rem;">
      <div class="page-header"><h1>My Profile</h1></div>
      <div class="profile-layout">
        <div class="profile-card">
          <div class="avatar-circle" id="avatar-preview">
            ${user.avatar_url ? `<img src="${user.avatar_url}" alt="avatar"/>` : user.name[0]}
          </div>
          <div class="profile-name">${user.name}</div>
          <span class="profile-role">${user.role}</span>
          <!-- DELIBERATE XSS: bio rendered as innerHTML (V-03) -->
          <div class="profile-bio" id="profile-bio-display"></div>
          <div style="margin-top:1rem;">
            <label class="btn btn-outline btn-sm btn-block" for="avatar-upload">📷 Change Avatar</label>
            <input id="avatar-upload" type="file" style="display:none" onchange="uploadAvatar(event)"/>
          </div>
        </div>
        <div>
          <div class="card" style="margin-bottom:1.5rem;">
            <h3 style="margin-bottom:1rem;">Edit Profile</h3>
            <div id="profile-alert"></div>
            <form onsubmit="updateProfile(event)">
              <div class="form-group"><label>Full Name</label><input id="p-name" type="text" value="${user.name}"/></div>
              <div class="form-group">
                <label>Bio <span style="color:var(--text-muted);font-size:0.8rem;">(HTML allowed)</span></label>
                <textarea id="p-bio">${user.bio || ''}</textarea>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
          </div>
          <div class="card">
            <h3 style="margin-bottom:0.5rem;">Account Info</h3>
            <p style="color:var(--text-muted);font-size:0.9rem;">Email: ${user.email}</p>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-top:0.3rem;">Member since: ${new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
    ` + renderFooter();

    // DELIBERATE: innerHTML used (V-03)
    const bioEl = document.getElementById('profile-bio-display');
    if (bioEl) bioEl.innerHTML = user.bio || '<em>No bio set</em>';
  } catch (err) {
    app.innerHTML = renderNav() + `<div class="container"><div class="alert alert-error">${err.message}</div></div>` + renderFooter();
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const alertEl = document.getElementById('profile-alert');
  try {
    const data = await apiCall('PUT', '/users/profile', {
      name: document.getElementById('p-name').value,
      bio:  document.getElementById('p-bio').value   // XSS payload stored here
    }, true);
    setUser({ ...getUser(), ...data.user });
    alertEl.innerHTML = `<div class="alert alert-success">Profile updated successfully!</div>`;
    // DELIBERATE: Re-render bio as innerHTML (V-03)
    const bioEl = document.getElementById('profile-bio-display');
    if (bioEl) bioEl.innerHTML = data.user.bio || '';
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function uploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('avatar', file);
  try {
    const res = await fetch(`${API_BASE}/users/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    alert(`File uploaded: ${data.storedAs}\nAccess at: ${data.avatarUrl}`);
    renderProfile();
  } catch (err) {
    alert('Upload failed: ' + err.message);
  }
}

// ── Enrolments Page ───────────────────────────────────────────────────────────
async function renderEnrolments() {
  app.innerHTML = renderNav() + `<div class="container"><div class="loading"><div class="spinner"></div></div></div>` + renderFooter();
  try {
    const enrolments = await apiCall('GET', '/enrolments', null, true);
    app.innerHTML = renderNav() + `
    <div class="container">
      <div class="page-header"><h1>My Learning</h1><p>Courses you are enrolled in</p></div>
      ${enrolments.length === 0 ? `
        <div class="card" style="text-align:center;padding:3rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">📚</div>
          <h3>No courses yet</h3>
          <p style="color:var(--text-muted);margin-bottom:1.5rem;">Browse our catalogue and start learning today</p>
          <a class="btn btn-primary" href="/courses" onclick="navigate('/courses');return false;">Browse Courses</a>
        </div>
      ` : `
        <div class="course-grid">
          ${enrolments.map(e => `
            <div class="course-card" onclick="navigate('/courses/${e.course_id}')">
              <div class="course-thumb">${EMOJIS[e.category] || '📚'}</div>
              <div class="course-body">
                <div class="course-category">${e.category || 'Course'}</div>
                <div class="course-title">${e.course_title}</div>
                <div class="course-footer">
                  <span class="badge badge-${e.payment_status === 'completed' ? 'success' : 'warning'}">${e.payment_status}</span>
                  <span style="font-size:0.8rem;color:var(--text-muted);">ID: ${e.id}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
    ` + renderFooter();
  } catch (err) {
    app.innerHTML = renderNav() + `<div class="container"><div class="alert alert-error">${err.message}</div></div>` + renderFooter();
  }
}

// ── Payment Page ──────────────────────────────────────────────────────────────
async function renderPayment(courseId) {
  app.innerHTML = renderNav() + `<div class="container"><div class="loading"><div class="spinner"></div></div></div>` + renderFooter();
  try {
    const c = await apiCall('GET', `/courses/${courseId}`);
    app.innerHTML = renderNav() + `
    <div class="container" style="max-width:500px;padding-top:2rem;">
      <div class="page-header"><h1>Complete Enrolment</h1><p>Secure your spot in ${c.title}</p></div>
      <div class="card-preview">
        <div class="card-preview-number" id="card-num-preview">•••• •••• •••• ••••</div>
        <div class="card-preview-details">
          <span id="card-name-preview">CARDHOLDER NAME</span>
          <span id="card-exp-preview">MM/YY</span>
        </div>
      </div>
      <div class="payment-card">
        <h3 style="margin-bottom:0.3rem;">${c.title}</h3>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.5rem;">Total: <strong style="color:var(--primary);">RM ${parseFloat(c.price).toFixed(2)}</strong></p>
        <div id="pay-alert"></div>
        <form onsubmit="handlePayment(event,'${courseId}')">
          <div class="form-group"><label>Cardholder Name</label>
            <input id="card-name" type="text" placeholder="Ahmad Razif" oninput="document.getElementById('card-name-preview').textContent=this.value||'CARDHOLDER NAME'"/>
          </div>
          <div class="form-group"><label>Card Number</label>
            <input id="card-number" type="text" placeholder="4111 1111 1111 1111" maxlength="19"
              oninput="this.value=this.value.replace(/[^0-9]/g,'').replace(/(.{4})/g,'$1 ').trim();document.getElementById('card-num-preview').textContent=this.value||'•••• •••• •••• ••••'"/>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group"><label>Expiry</label>
              <input id="card-expiry" type="text" placeholder="MM/YY" maxlength="5"
                oninput="document.getElementById('card-exp-preview').textContent=this.value||'MM/YY'"/>
            </div>
            <div class="form-group"><label>CVV</label><input id="card-cvv" type="text" placeholder="123" maxlength="3"/></div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Pay RM ${parseFloat(c.price).toFixed(2)}</button>
        </form>
      </div>
    </div>
    ` + renderFooter();
  } catch (err) {
    app.innerHTML = renderNav() + `<div class="container"><div class="alert alert-error">${err.message}</div></div>` + renderFooter();
  }
}

async function handlePayment(e, courseId) {
  e.preventDefault();
  const alertEl = document.getElementById('pay-alert');
  try {
    await apiCall('POST', '/payment', {
      courseId: parseInt(courseId),
      cardNumber:     document.getElementById('card-number').value.replace(/\s/g, ''),
      cardholderName: document.getElementById('card-name').value,
      expiryDate:     document.getElementById('card-expiry').value,
      cvv:            document.getElementById('card-cvv').value
    }, true);
    alertEl.innerHTML = `<div class="alert alert-success">✅ Payment successful! You are now enrolled.</div>`;
    setTimeout(() => navigate('/enrolments'), 2000);
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
let adminTab = 'users';
async function renderAdmin() {
  app.innerHTML = renderNav() + `
  <div class="container" style="padding-top:2rem;">
    <div class="page-header">
      <h1>Admin Panel</h1>
      <p>Manage users, courses, enrolments, and payments</p>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab active" id="tab-users" onclick="switchAdminTab('users')">Users</button>
      <button class="admin-tab" id="tab-courses" onclick="switchAdminTab('courses')">Courses</button>
      <button class="admin-tab" id="tab-enrolments" onclick="switchAdminTab('enrolments')">Enrolments</button>
      <button class="admin-tab" id="tab-payments" onclick="switchAdminTab('payments')">Payments</button>
    </div>
    <div id="admin-content"><div class="loading"><div class="spinner"></div></div></div>
  </div>
  ` + renderFooter();

  loadAdminTab('users');
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  const el = document.getElementById('admin-content');
  if (!el) return;
  el.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  try {
    // DELIBERATE: No auth header sent — testing unauthenticated admin access (V-08)
    const data = await apiCall('GET', `/admin/${tab}`);

    if (tab === 'users') {
      el.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Password Hash (MD5)</th><th>Actions</th></tr></thead>
            <tbody>${data.map(u => `
              <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-primary">${u.role}</span></td>
                <td><code style="font-size:0.75rem;color:var(--accent);">${u.password_hash}</code></td>
                <td>
                  <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Delete</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } else if (tab === 'courses') {
      el.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Title</th><th>Teacher</th><th>Price</th><th>Enrolments</th></tr></thead>
            <tbody>${data.map(c => `
              <tr>
                <td>${c.id}</td><td>${c.title}</td>
                <td>${c.teacher_name || 'N/A'}</td>
                <td>RM ${parseFloat(c.price).toFixed(2)}</td>
                <td>${c.enrolment_count}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } else if (tab === 'enrolments') {
      el.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Student</th><th>Email</th><th>Course</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>${data.map(e => `
              <tr>
                <td>${e.id}</td><td>${e.student_name}</td><td>${e.student_email}</td>
                <td>${e.course_title}</td>
                <td><span class="badge badge-${e.payment_status==='completed'?'success':'warning'}">${e.payment_status}</span></td>
                <td>${new Date(e.enrolled_at).toLocaleDateString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } else if (tab === 'payments') {
      el.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Student</th><th>Course</th><th>Amount</th><th>Card (FULL)</th><th>Status</th></tr></thead>
            <tbody>${data.map(p => `
              <tr>
                <td>${p.id}</td><td>${p.student_name}</td><td>${p.course_title}</td>
                <td>RM ${parseFloat(p.amount).toFixed(2)}</td>
                <td><code style="color:var(--accent);font-size:0.8rem;">${p.card_number_full}</code></td>
                <td><span class="badge badge-success">${p.status}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }
  } catch (err) {
    el.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function deleteUser(id) {
  if (!confirm(`Delete user #${id}?`)) return;
  try {
    await apiCall('DELETE', `/admin/users/${id}`);
    loadAdminTab('users');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
render();
