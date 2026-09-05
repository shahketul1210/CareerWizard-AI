# 🌐 CareerWizard AI — Nginx Reverse Proxy & Free HTTPS (SSL) Setup Guide

Yeh complete step-by-step guide hai jisse aap CareerWizard-AI (FastAPI Backend + React Frontend) ko **Nginx Reverse Proxy** aur **Free Let's Encrypt SSL (HTTPS)** ke sath deploy kar sakte hain, taaki aapko secure `https://yourdomain.com` URL mil jaye.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites (Requirements)](#2-prerequisites)
3. [Backend Setup (Systemd 24/7 Service)](#3-backend-setup-systemd-service)
4. [Frontend Production Build](#4-frontend-production-build)
5. [Complete Nginx Configuration File](#5-complete-nginx-configuration-file)
6. [Free SSL Setup (HTTPS via Certbot)](#6-free-ssl-setup-https-via-certbot)
7. [Cloudflare Tunnel Option (No Port Forwarding Required)](#7-alternative-cloudflare-tunnel-zero-open-ports)
8. [Local Windows HTTPS Testing (with mkcert)](#8-local-windows-https-testing-optional)
9. [Troubleshooting & Verification Commands](#9-troubleshooting--cheat-sheet)

---

## 1. Architecture Overview

Jab Nginx configure ho jata hai, tab flow aese kaam karta hai:

```
                  ┌──────────────────────────────────────────────┐
                  │                 USER BROWSER                 │
                  └──────────────────────┬───────────────────────┘
                                         │
                               HTTPS (Port 443)
                          SSL Certificate Terminated
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │              NGINX REVERSE PROXY             │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        Static Assets (HTML/JS/CSS)      Proxy /api requests
                 │                               │
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │  Vite Frontend Dist   │       │  FastAPI / Uvicorn    │
     │ /var/www/careerwizard │       │  http://127.0.0.1:8000│
     └───────────────────────┘       └───────────────────────┘
```

- **HTTPS (`port 443`)**: Browser se Nginx tak traffic encrypted hota hai.
- **Frontend**: Nginx static pre-built files (`dist/`) ultra-fast serve karta hai.
- **Backend API (`/api/`)**: Nginx backend ko internal port `8000` par proxy karta hai.
- **Resume Uploads**: Nginx me file size limit 25MB set hoti hai.
- **AI Explanations**: Nginx me timeout 120s set hota hai taaki Gemini AI responses timeout na ho.

---

## 2. Prerequisites

Agar aap VPS (Ubuntu/Debian) par deploy kar rahe hain:
- Ek domain name (e.g. `careerwizard.com` ya `app.yourname.com`).
- Domain ke DNS settings me `A Record` add karein jo aapke VPS IP ko point kare.
- System packages update karein:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx python3-pip python3-venv git
```

---

## 3. Backend Setup (Systemd Service)

Backend ko background me 24/7 chalane ke liye ek `systemd` service banayein:

### Step 3.1: Project Directory setup
```bash
# Code clone/copy karein (agar nahi kiya hai)
cd /var/www/
sudo git clone https://github.com/your-username/CareerWizard-AI.git
cd /var/www/CareerWizard-AI/backend

# Virtual environment banayein aur packages install karein
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3.2: Environment File Configure Karein
```bash
nano /var/www/CareerWizard-AI/backend/.env
```
Ensure required keys are present:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_super_secret_jwt_key
DATABASE_URL=postgresql://user:password@localhost:5432/careerwizard
ENVIRONMENT=production
```

### Step 3.3: Systemd Service Create Karein
```bash
sudo nano /etc/systemd/system/careerwizard-backend.service
```

Paste following configuration:
```ini
[Unit]
Description=CareerWizard AI FastAPI Backend
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/CareerWizard-AI/backend
ExecStart=/var/www/CareerWizard-AI/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 3
Restart=always
RestartSec=5
EnvironmentFile=/var/www/CareerWizard-AI/backend/.env

[Install]
WantedBy=multi-user.target
```

### Step 3.4: Service Start & Enable Karein
```bash
sudo systemctl daemon-reload
sudo systemctl start careerwizard-backend
sudo systemctl enable careerwizard-backend

# Check status:
sudo systemctl status careerwizard-backend
```

---

## 4. Frontend Production Build

Frontend ka build banayein taaki Nginx use serve kar sake:

```bash
cd /var/www/CareerWizard-AI/frontend

# Install dependencies
npm install

# Production build generate karein
npm run build
```
Build files `/var/www/CareerWizard-AI/frontend/dist` folder me generate ho jayengi.

> **Note**: Frontend API base URL check karein:
> `frontend/src/api/axiosClient.js` me baseURL `/api` ya `https://yourdomain.com/api` hona chahiye:
> ```javascript
> const api = axios.create({
>   baseURL: '/api' // Nginx isse backend par forward kar dega
> });
> ```

---

## 5. Complete Nginx Configuration File

Ab Nginx configuration file banayein:

```bash
sudo nano /etc/nginx/sites-available/careerwizard
```

Niche diya gaya configuration copy aur paste karein (`yourdomain.com` ko apne actual domain name se replace karein):

```nginx
# 1. HTTP to HTTPS Auto-Redirect (Port 80 to 443)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Certbot challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# 2. Main HTTPS Production Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate Paths (Certbot auto fill karega, ya manual paths)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Modern SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Max upload size (Resume PDFs & Docs ke liye)
    client_max_body_size 25M;

    # Gzip Compression (Fast Page Loads)
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Root Directory for React/Vite Frontend
    root /var/www/CareerWizard-AI/frontend/dist;
    index index.html;

    # ─── FRONTEND (Single Page Application Router) ───
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ─── BACKEND FASTAPI PROXY (/api/) ───
    location /api/ {
        # Strip '/api/' prefix when forwarding to FastAPI
        rewrite ^/api/(.*)$ /$1 break;

        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;

        # WebSocket & Header Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Long timeouts for Gemini AI generation
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # ─── FASTAPI SWAGGER DOCS (/docs & /openapi.json) ───
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
        proxy_set_header Host $host;
    }

    # Static Assets Cache (Images, Fonts, CSS, JS)
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public, max-age=15552000, immutable";
    }
}
```

### Step 5.1: Site Enable & Nginx Reload Karein
```bash
# Link to sites-enabled
sudo ln -s /etc/nginx/sites-available/careerwizard /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Syntax test karein
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 6. Free SSL Setup (HTTPS via Certbot)

Ab free Let's Encrypt SSL certificate install karein. Certbot auto-configure kar dega:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Steps:
1. Apna email address enter karein (renewal notices ke liye).
2. Terms of service accept karein (`Y`).
3. Select karein ki auto-redirect chahiye ya nahi (option 2: **Redirect** select karein).

Certbot certificate generate karega aur Nginx file me SSL certificates automatic bind kar dega! 🎉

### Auto-Renewal Test:
Let's Encrypt certificates 90 days tak valid hote hain aur automatically renew hote hain. Test karne ke liye run karein:
```bash
sudo certbot renew --dry-run
```

---

## 7. Alternative: Cloudflare Tunnel (Zero Open Ports!)

Agar aapke paas **Public IP nahi hai**, ya port 80/443 blocked hai, ya **Local PC / Laptop se hi HTTPS URL** chahiye:

Cloudflare Tunnel completely **FREE** hai aur bina port forward kiye aapke local project ko HTTPS URL de deta hai!

### Step 7.1: Cloudflared Install Karein
```bash
# Ubuntu / Debian
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Windows (Powershell)
winget install --id Cloudflare.cloudflared
```

### Step 7.2: One-Command Instant HTTPS URL (Temporary Test):
```bash
cloudflared tunnel --url http://localhost:5173
```
Output me instant secure HTTPS URL mil jayega, jaise:
`https://random-words-1234.trycloudflare.com` -> Jo seedha aapke app se connect hoga!

### Step 7.3: Permanent Custom Domain Tunnel:
1. `cloudflared tunnel login`
2. `cloudflared tunnel create careerwizard-tunnel`
3. Route DNS: `cloudflared tunnel route dns careerwizard-tunnel yourdomain.com`
4. Run tunnel as service:
   ```bash
   cloudflared tunnel run careerwizard-tunnel
   ```

---

## 8. Local Windows HTTPS Testing (Optional)

Agar aap Windows PC par local development me `https://localhost` chalana chahte hain:

### Step 8.1: Install mkcert
```powershell
# In PowerShell (Run as Administrator)
choco install mkcert
mkcert -install
```

### Step 8.2: Generate Local Certificate
```powershell
cd "c:\Users\shahk\Desktop\ALL FILES\CODING\Main Projects\CareerWizard-AI"
mkcert localhost 127.0.0.1 ::1
```
Yeh do files banayega: `localhost+2.pem` (certificate) aur `localhost+2-key.pem` (private key).

### Step 8.3: Vite me HTTPS Enable Karein
`CareerWizard-AI/frontend/vite.config.js`:
```javascript
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('../localhost+2-key.pem'),
      cert: fs.readFileSync('../localhost+2.pem'),
    },
    port: 5173
  }
});
```
Ab `npm run dev` karte hi aapka local app `https://localhost:5173` par chalega with Green Lock! 🔒

---

## 9. Troubleshooting & Cheat Sheet

### Common Commands:

| Command | Purpose |
| :--- | :--- |
| `sudo nginx -t` | Check Nginx syntax errors |
| `sudo systemctl restart nginx` | Restart Nginx server |
| `sudo systemctl status nginx` | Check if Nginx is running |
| `sudo systemctl restart careerwizard-backend` | Restart FastAPI backend |
| `sudo journalctl -u careerwizard-backend -f` | Live backend error logs |
| `sudo tail -f /var/log/nginx/error.log` | Live Nginx error logs |
| `sudo certbot renew --dry-run` | Test SSL certificate renewal |

### Common Issues & Fixes:

1. **502 Bad Gateway**:
   - Cause: Backend service nahi chal rahi ya port 8000 band hai.
   - Solution: `sudo systemctl status careerwizard-backend` run karein aur dekhein uvicorn start hua ya nahi.

2. **413 Request Entity Too Large**:
   - Cause: Resume upload file size Nginx default (1MB) se badi hai.
   - Solution: `client_max_body_size 25M;` ko apne `nginx.conf` ke `server` block me add karein.

3. **504 Gateway Timeout (AI Explanation)**:
   - Cause: Gemini AI explanation generate hone me 60s se zyada time le raha hai.
   - Solution: `proxy_read_timeout 120s;` add karein `location /api/` block ke andar.

4. **CORS Error on HTTPS**:
   - Backend `main.py` me `allow_origins` me apna HTTPS domain add karein:
   ```python
   origins = [
       "https://yourdomain.com",
       "https://www.yourdomain.com",
       "http://localhost:5173"
   ]
   ```

---

*CareerWizard AI • Complete Nginx & HTTPS Production Reference*
