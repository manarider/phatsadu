<<<<<<< HEAD
# PAPP - ระบบบริหารจัดการพัสดุ เทศบาลนครนครสวรรค์

## 📋 เอกสารอ้างอิง

### Core Documents
- **PAPP-INDEX.md** - ดัชนีเอกสารทั้งหมด
- **PAPP-REQUIREMENTS.md** - ความต้องการระบบ
- **PAPP-DATABASE-DESIGN.md** - ออกแบบฐานข้อมูล
- **PAPP-WORKFLOW-SECURITY.md** - Workflow และ Security
- **PAPP-API-DESIGN.md** - API Endpoints
- **PAPP-SCREEN-LIST.md** - รายการหน้าจอ

### Development Documents
- **PAPP-DEVELOPMENT-PLAN.md** - แผนพัฒนา 4 Phases
- **PAPP-NGINX-DEPLOYMENT.md** - การ Deploy Nginx
- **PAPP-DB-SEED-DATA.sql** - Initial Database Schema & Seed

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)
- Nginx (for deployment)

### Local Development

1. Clone repository
```bash
git clone <repo-url>
cd papp
```

2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

4. Access Application
- Frontend: `http://localhost:5173/phatsadu/`
- Backend API: `http://localhost:3033/phatsadu/api`

### Using Docker
```bash
docker-compose up -d
```

Access: `http://localhost/phatsadu/`

## 📦 Project Structure

```
papp/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── docs/ (or documents folder)
│   ├── PAPP-*.md
│   └── PAPP-DB-SEED-DATA.sql
└── docker-compose.yml
```

## 🔐 Authentication

- Login via UMS: `http://192.168.100.151/ums/`
- Role mapping: admin, manager, staff, viewer
- No password storage in PAPP

## 📊 Modules

1. **ครุภัณฑ์** - Equipment Management
2. **แจ้งซ่อม** - Maintenance Tracking
3. **วัสดุ** - Materials Management
4. **เบิกจ่าย** - Withdrawal Requests
5. **รายงาน** - Reports & Analytics
6. **ตั้งค่า** - System Settings

## 🔗 Important URLs

### Development
- Backend: `http://localhost:3033`
- Frontend: `http://localhost:5173`

### Production
- App FQDN: `http://app.nsm.go.th/phatsadu/`
- App IP: `http://192.168.100.152/phatsadu/`

## 📞 Support

Contact: Information System Development Team

## 📄 License

Copyright @ Information system development and preparation work, Nakhon Sawan Municipality.by Manarider

---

Last Updated: 2026-03-27
=======
# phatsadu
phatsaduapp
>>>>>>> 8c73d1d46c2aee85b86274d78830105d152e74eb
