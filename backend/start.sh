#!/bin/bash
# Startup script for backend container
# Starts SSH daemon, cron daemon, and Node.js application

echo "[*] Starting SSH daemon..."
/usr/sbin/sshd

echo "[*] Starting cron daemon..."
crond

echo "[*] Starting Node.js backend on port 3000..."
exec node server.js
