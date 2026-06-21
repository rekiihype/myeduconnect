FROM node:20-alpine

RUN apk update && apk add --no-cache openssh dcron bash curl

WORKDIR /app

# SSH hardened — key-based only, no root password login
RUN ssh-keygen -A && \
    sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    echo "PermitRootLogin no" >> /etc/ssh/sshd_config && \
    echo "PasswordAuthentication no" >> /etc/ssh/sshd_config

# Cron script with correct permissions
RUN mkdir -p /opt
RUN echo -e '#!/bin/bash\nrm -rf /tmp/old_*\necho "Cleanup ran at $(date)" >> /var/log/cleanup.log' > /opt/cleanup.sh
RUN chmod 755 /opt/cleanup.sh && chown root:root /opt/cleanup.sh
RUN echo "* * * * * root /opt/cleanup.sh" > /etc/crontabs/root
RUN chmod 644 /etc/crontabs/root && chown root:root /etc/crontabs/root

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /uploads && chmod 755 /uploads

EXPOSE 3000 22

COPY start.sh /start.sh
RUN sed -i 's/\r//' /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
