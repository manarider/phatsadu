# PAPP Nginx Deployment Guide

Version: 1.0  
Date: 2026-03-27

## 1. Nginx Overview
- Role: Reverse proxy + static file server
- Port: 80 (production can add 443 for HTTPS)
- Path: `/phatsadu/` routes to React app + NodeJS backend

## 2. Architecture
```
User Browser (port 80)
       ↓
   Nginx (port 80)
       ↓
   ├─→ React static files (root: /var/www/phatsadu)
       ↓
       └─→ /phatsadu/api/* → backend (port 3033)
```

## 3. Nginx Installation

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Check status
```bash
sudo systemctl status nginx
nginx -v
```

## 4. Nginx Configuration

### Main config file
Create `/etc/nginx/sites-available/phatsadu.conf`:

```nginx
upstream backend {
    server localhost:3033;
    keepalive 32;
}

server {
    listen 80;
    server_name app.nsm.go.th 192.168.100.152;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/html text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Root for static files
    root /var/www/phatsadu;
    index index.html;

    # Proxy settings
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # API routes
    location /phatsadu/api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Static files
    location /phatsadu/ {
        try_files $uri $uri/ /phatsadu/index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Logs
    access_log /var/log/nginx/phatsadu_access.log;
    error_log /var/log/nginx/phatsadu_error.log;
}
```

### Enable site
```bash
sudo ln -s /etc/nginx/sites-available/phatsadu.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### Test config
```bash
sudo nginx -t
```

### Reload Nginx
```bash
sudo systemctl reload nginx
```

## 5. SSL/TLS Setup (Optional for Production)

### Install Certbot
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Get certificate
```bash
sudo certbot certonly --nginx -d app.nsm.go.th
```

### Update Nginx config for HTTPS
```nginx
server {
    listen 80;
    server_name app.nsm.go.th;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.nsm.go.th;

    ssl_certificate /etc/letsencrypt/live/app.nsm.go.th/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.nsm.go.th/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of config ...
}
```

### Auto-renew certificates
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 6. Deploy React Build

### Build React app
```bash
cd /home/phatsadu/papp/frontend
npm install
npm run build
```

### Copy to web root
```bash
sudo mkdir -p /var/www/phatsadu
sudo cp -r /home/phatsadu/papp/frontend/dist/phatsadu/* /var/www/phatsadu/
sudo chown -R www-data:www-data /var/www/phatsadu
sudo chmod -R 755 /var/www/phatsadu
```

### Verify
```bash
ls -la /var/www/phatsadu/
```

## 7. Monitor Nginx

### Check processes
```bash
ps aux | grep nginx
```

### View logs
```bash
tail -f /var/log/nginx/phatsadu_access.log
tail -f /var/log/nginx/phatsadu_error.log
```

### Check connections
```bash
sudo netstat -tlnp | grep nginx
```

## 8. Troubleshooting

### 502 Bad Gateway
- Check if backend is running: `ps aux | grep node`
- Check backend logs
- Verify proxy_pass URL in Nginx config

### 404 on React routes
- Check if `try_files $uri $uri/ /phatsadu/index.html;` is set
- Clear browser cache

### CORS errors
- Add CORS headers to backend API
- Or configure Nginx to handle CORS

### Slow response
- Check backend performance
- Monitor CPU/Memory usage
- Enable caching headers

### Permission denied
- Check file ownership: `sudo chown -R www-data:www-data /var/www/phatsadu`
- Check permissions: `sudo chmod -R 755 /var/www/phatsadu`

## 9. Load Balancing (Multiple Backends)

If using multiple backend instances:

```nginx
upstream backend {
    least_conn;
    server backend1.local:3033;
    server backend2.local:3033;
    server backend3.local:3033;
    keepalive 32;
}
```

## 10. Rate Limiting

Add to Nginx config to prevent abuse:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

location /phatsadu/api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://backend;
}

location /phatsadu/ {
    limit_req zone=general_limit burst=50 nodelay;
    try_files $uri $uri/ /phatsadu/index.html;
}
```

## 11. Backup Config

```bash
sudo cp /etc/nginx/sites-available/phatsadu.conf /etc/nginx/sites-available/phatsadu.conf.backup
```

## 12. Docker Compose for Local Development

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./frontend/dist:/var/www/phatsadu
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3033:3033"
    environment:
      - PORT=3033
      - DATABASE_URL=postgresql://user:pass@db:5432/phatsadu
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=phatsadu
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=phatsadu
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

Run:
```bash
docker-compose up -d
```

## 13. Footer
copyright @ Information system development and preparation work, Nakhon Sawan Municipality.by Manarider

## 14. Correction Notes
- หากใช้ Vite ปกติ output จะอยู่ที่ `frontend/dist/` ไม่ใช่ `frontend/dist/phatsadu/`
- หาก deploy ภายใต้ subpath `/phatsadu/` ควรกำหนด base path ของ frontend ให้ตรง
- ควรทดสอบ `try_files` และ path static files กับ build จริงก่อนใช้งาน production

