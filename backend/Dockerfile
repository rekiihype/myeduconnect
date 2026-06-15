FROM node:20-alpine

# Install SSH server and cron (for deliberate misconfigurations V-07 and V-09)
RUN apk update && apk add --no-cache \
    openssh \
    dcron \
    bash \
    curl

WORKDIR /app

# ── Deliberate Misconfiguration V-07: Weak SSH with root login ──────────────
# Set root password to 'root' (trivially guessable)
RUN echo 'root:root' | chpasswd
RUN ssh-keygen -A

# Enable root login and password authentication (insecure defaults)
RUN sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    echo "PermitRootLogin yes" >> /etc/ssh/sshd_config && \
    echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config

# ── Deliberate Misconfiguration V-09: World-writable cron script ─────────────
RUN mkdir -p /opt
RUN echo -e '#!/bin/bash\n# Cleanup temporary files\nrm -rf /tmp/old_*\necho "Cleanup ran at $(date)" >> /var/log/cleanup.log' > /opt/cleanup.sh
RUN chmod 777 /opt/cleanup.sh

# Create cron job running as root every minute (world-writable — attackers can overwrite)
RUN echo "* * * * * root /opt/cleanup.sh" > /etc/crontabs/root
RUN chmod 777 /etc/crontabs/root

# ── Application Setup ─────────────────────────────────────────────────────────
COPY package*.json ./
RUN npm install

COPY . .

# Create uploads directory (no restrictions — deliberate for V-05)
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Expose ports
EXPOSE 3000 22

# Startup script: run SSH, cron, and Node.js
COPY start.sh /start.sh
RUN sed -i 's/\r//' /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
