# MyEduConnect — Setup Guide
## CCS6324 Final Assignment | Vulnerable Web Platform

> **IMPORTANT**: This platform is **intentionally vulnerable**. It is for educational and penetration testing purposes only. Do NOT expose it to the public internet.

---

## Quick Start (Recommended)

### Prerequisites
- Docker Desktop (Windows) — download from https://www.docker.com/products/docker-desktop/
- Docker Compose v2 (bundled with Docker Desktop 4.x+)
- Node.js 20+ (for the React Native mobile app only)

### 1. Clone the Repository
```bash
git clone <private-repo-url>
cd myeduconnect
```

### 2. Build and Start All Services
```bash
docker compose up --build -d
```

This command builds and starts:
- `myeduconnect-postgres` — PostgreSQL database (auto-seeded with test data)
- `myeduconnect-backend` — Node.js/Express API server
- `myeduconnect-nginx` — Nginx reverse proxy + static frontend

Wait ~30 seconds for the database to initialize.

### 3. Verify All Services Are Running
```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS          PORTS
myeduconnect-nginx      running         0.0.0.0:80->80/tcp
myeduconnect-backend    running         0.0.0.0:3000->3000/tcp, 0.0.0.0:2222->22/tcp
myeduconnect-postgres   running         0.0.0.0:5432->5432/tcp
```

### 4. Access the Web Application
Open your browser and navigate to: **http://localhost**

---

## Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@myeduconnect.my | admin123 | Full admin panel access |
| Teacher | teacher@myeduconnect.my | teach123 | Can create courses |
| Student (Alice) | alice@student.my | alice123 | Enrolled in courses 1, 3 |
| Student (Bob) | bob@student.my | bob123 | Enrolled in courses 1, 2 |
| Student (Carol) | carol@student.my | carol123 | Enrolled in courses 3, 5 |

---

## Service Access Points

| Service | URL/Command | Notes |
|---------|-------------|-------|
| Web App (via Nginx) | http://localhost | Primary access point |
| Backend API (direct) | http://localhost:3001/api | Bypasses Nginx — for admin vuln demo |
| API Health Check | http://localhost:3001/api/health | Shows stack info (info disclosure) |
| Admin API (no auth) | http://localhost:3001/api/admin/users | Returns all users + password hashes |
| PostgreSQL | `psql -h localhost -U edu_admin -d myeduconnect` | Password: `password123` |
| SSH (backend container) | `ssh root@localhost -p 2222` | Password: `root` |

---

## React Native Mobile App Setup

### Prerequisites
```bash
npm install -g expo-cli
```

### Install Dependencies
```bash
cd mobile/MyEduConnectApp
npm install
```

### Configure API Endpoint
Edit `src/config.js` and update `API_BASE` to your host machine's IP address:
```javascript
// Find your IP with: ipconfig (Windows)
export const API_BASE = 'http://YOUR_HOST_IP/api';
```

### Run the App
```bash
npx expo start
```

- Press `a` to open in Android Emulator
- Press `i` to open in iOS Simulator
- Scan QR code with Expo Go app on a physical device

---

## Useful Docker Commands

```bash
# View live logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Restart all services
docker compose restart

# Stop all services
docker compose down

# Completely reset (removes database data)
docker compose down -v
docker compose up --build -d

# Enter backend container shell
docker exec -it myeduconnect-backend /bin/bash

# Enter PostgreSQL interactive shell
docker exec -it myeduconnect-postgres psql -U edu_admin -d myeduconnect

# Re-seed the database
docker exec -i myeduconnect-postgres psql -U edu_admin -d myeduconnect < database/init.sql
```

---

## Directory Structure

```
myeduconnect/
├── docker-compose.yml      # Service orchestration
├── README.md               # This file
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf          # HTTP only (deliberate — no TLS)
├── backend/
│   ├── Dockerfile          # Includes SSH + cron setup
│   ├── start.sh            # Starts SSH, cron, and Node.js
│   ├── server.js           # Express app entry point
│   ├── db/index.js         # PostgreSQL pool
│   ├── middleware/auth.js  # JWT middleware (weak secret)
│   └── routes/
│       ├── auth.js         # Login/register (SQLi + MD5)
│       ├── users.js        # Profile (XSS + file upload)
│       ├── courses.js      # Courses (SQLi in search)
│       ├── enrolment.js    # Enrolments (IDOR)
│       ├── payment.js      # Payment (cleartext)
│       └── admin.js        # Admin (broken auth)
├── database/
│   └── init.sql            # Schema + seed data (MD5 passwords)
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js              # SPA (uses innerHTML for XSS)
└── mobile/
    └── MyEduConnectApp/    # React Native Expo app
```

---

## Known Issues / Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 80 already in use | Stop any existing web server: `netstat -ano \| findstr :80` then stop the process |
| Port 5432 already in use | Stop local PostgreSQL: `net stop postgresql-x64-14` |
| Database not initialized | Run: `docker compose down -v && docker compose up --build -d` |
| Backend can't connect to DB | Wait 20–30 seconds for PostgreSQL to fully start |
| Mobile app can't reach API | Update `API_BASE` in `src/config.js` with your correct local IP |

---

*Setup Guide — MyEduConnect Sdn Bhd | CCS6324 Final Assignment*
