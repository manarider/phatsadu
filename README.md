# PAPP — ระบบบริหารจัดการพัสดุ

ระบบบริหารจัดการพัสดุและครุภัณฑ์สำหรับ **เทศบาลนครนครสวรรค์**  
พัฒนาด้วย Node.js + React รองรับการจัดการครุภัณฑ์ วัสดุ การซ่อมบำรุง และการจำหน่าย

---

## สารบัญ

- [คุณสมบัติระบบ](#คุณสมบัติระบบ)
- [Tech Stack](#tech-stack)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [สิทธิ์การใช้งาน](#สิทธิ์การใช้งาน)
- [การติดตั้ง](#การติดตั้ง)
- [Environment Variables](#environment-variables)
- [การรันระบบ](#การรันระบบ)
- [Nginx Configuration](#nginx-configuration)
- [API Overview](#api-overview)
- [การ Import/Export ข้อมูล](#การ-importexport-ข้อมูล)

---

## คุณสมบัติระบบ

| โมดูล | รายละเอียด |
|---|---|
| 📊 **Dashboard** | สรุปสถิติครุภัณฑ์ วัสดุคงเหลือน้อย งานซ่อมค้าง |
| 💻 **ครุภัณฑ์** | ทะเบียนครุภัณฑ์, รหัส EQID อัตโนมัติ, อัปโหลดรูปภาพ |
| 📦 **วัสดุ** | คลังวัสดุ, เบิก-รับ-ปรับ, แจ้งเตือน stock ต่ำ |
| 🔧 **แจ้งซ่อม** | ใบแจ้งซ่อม, อนุมัติ/ปฏิเสธ, ระบบแชทแนบรูปในแต่ละใบซ่อม |
| 🔩 **บำรุงรักษา** | ตารางบำรุงรักษา, ติดตามครุภัณฑ์เกินกำหนด |
| 🏷️ **จำหน่ายครุภัณฑ์** | เตรียมรายการจำหน่าย, อัปโหลดเอกสาร, บันทึกประวัติ |
| 📥 **Import Excel** | นำเข้าครุภัณฑ์และวัสดุจากไฟล์ .xlsx พร้อม template |
| 📤 **Export Excel** | ส่งออกครุภัณฑ์, วัสดุ, ใบแจ้งซ่อม |
| ⚙️ **ตั้งค่าระบบ** | จัดการประเภทครุภัณฑ์, ประเภทวัสดุ, หน่วยงาน, ค่าระบบ |
| 📋 **บันทึกกิจกรรม** | Audit log ทุกการกระทำในระบบ กรองได้หลายมิติ |

---

## Tech Stack

### Backend
| Package | เวอร์ชัน | ใช้ทำอะไร |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| Express | ^4.18 | HTTP Framework |
| Mongoose | ^8.1 | MongoDB ORM |
| jsonwebtoken | ^9.0 | JWT Authentication |
| helmet | ^7.1 | Security Headers |
| express-rate-limit | ^7.2 | Rate Limiting |
| express-mongo-sanitize | ^2.2 | NoSQL Injection Prevention |
| multer | ^2.1 | File Upload |
| sharp | ^0.33 | Image Processing/Resize |
| exceljs / xlsx | latest | Excel Export/Import |
| morgan | ^1.10 | HTTP Request Logging |

### Frontend
| Package | เวอร์ชัน | ใช้ทำอะไร |
|---|---|---|
| React | ^18.2 | UI Framework |
| Vite | ^8.0 | Build Tool |
| React Router DOM | ^6.22 | Client-side Routing |
| Tailwind CSS | ^3.4 | Utility-first CSS |
| Axios | ^1.6 | HTTP Client |
| react-hot-toast | ^2.4 | Notifications |

### Infrastructure
- **MongoDB** — Database
- **Nginx** — Reverse Proxy + Static File Serving
- **PM2** — Process Manager

---

## โครงสร้างโปรเจกต์

```
/data/phatsadu/
├── backend/
│   ├── server.js              # Entry point
│   ├── seed.js                # Seed master data
│   ├── src/
│   │   ├── app.js             # Express app setup
│   │   ├── config/db.js       # MongoDB connection
│   │   ├── controllers/       # Business logic
│   │   ├── middlewares/       # Auth, Role, Scope, Audit, Upload
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # UMS auth, EqID generator, Settings
│   │   └── utils/             # asyncHandler, helpers, jwt, constants
│   └── uploads/               # ไฟล์อัปโหลด (รูปครุภัณฑ์, เอกสารซ่อม, เอกสารจำหน่าย)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Route definitions
│   │   ├── context/           # AuthContext
│   │   ├── lib/api.js         # Axios instance
│   │   ├── components/        # Layout, Sidebar
│   │   └── pages/             # หน้าแต่ละโมดูล
│   └── dist/                  # Build output (Nginx serve จากที่นี่)
│
├── nginx/papp.conf            # Nginx config
├── ecosystem.config.json      # PM2 config
└── logs/                      # Application logs
```

---

## สิทธิ์การใช้งาน (Roles)

ระบบเชื่อมต่อกับ **UMS (User Management System)** ภายนอก สิทธิ์แต่ละ role:

| Role | ดูข้อมูล | สร้าง/แก้ไข | ลบ | ตั้งค่าระบบ |
|---|:---:|:---:|:---:|:---:|
| `admin` | ✅ ทุกหน่วยงาน | ✅ | ✅ | ✅ |
| `manager` | ✅ หน่วยงานตนเอง | ✅ | ❌ | ❌ |
| `staff` | ✅ หน่วยงานตนเอง | ✅ | ❌ | ❌ |
| `viewer` | ✅ หน่วยงานตนเอง | ❌ | ❌ | ❌ |

> **หมายเหตุ:** ผู้ใช้ที่ไม่ใช่ `admin` จะเห็นเฉพาะข้อมูลของหน่วยงานตนเอง (Department Scope)

---

## การติดตั้ง

### ความต้องการของระบบ
- Node.js ≥ 18
- MongoDB ≥ 6
- Nginx

### 1. Clone และติดตั้ง dependencies

```bash
# Backend
cd /data/phatsadu/backend
npm install

# Frontend
cd /data/phatsadu/frontend
npm install
```

### 2. ตั้งค่า Environment Variables

```bash
cp /data/phatsadu/backend/.env.example /data/phatsadu/backend/.env
# แก้ไขค่าใน .env ตามสภาพแวดล้อม
```

### 3. Seed ข้อมูลตั้งต้น

```bash
cd /data/phatsadu/backend
npm run seed
```

จะสร้าง: หน่วยงาน, ประเภทครุภัณฑ์, ประเภทวัสดุ, System Settings

### 4. Build Frontend

```bash
cd /data/phatsadu/frontend
npm run build
```

---

## Environment Variables

สร้างไฟล์ `.env` ใน `backend/`:

```env
# App
NODE_ENV=production
PORT=4004
APP_NAME=PAPP

# MongoDB
MONGODB_URI=mongodb://localhost:27017/papp

# JWT
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRES_IN=8h

# CORS (URL ของ Frontend คั่นด้วยจุลภาค)
ALLOWED_ORIGINS=http://app.nsm.go.th,http://192.168.100.15

# UMS Integration
UMS_BASE_URL=https://ums.nsm.go.th
UMS_LOGIN_PATH=login
PAPP_AUTH_CALLBACK_URL=http://app.nsm.go.th/phatsadu/auth-callback

# Upload
UPLOAD_DIR=./uploads
MAX_IMAGE_SIZE_MB=4
```

---

## การรันระบบ

### Development

```bash
# Backend (พร้อม hot-reload)
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Production (PM2)

```bash
# Start
pm2 start /data/phatsadu/ecosystem.config.json

# Reload (zero-downtime)
pm2 reload papp-backend

# ดู logs
pm2 logs papp-backend

# ดูสถานะ
pm2 status
```

---

## Nginx Configuration

```bash
# เชื่อม config
sudo ln -s /data/phatsadu/nginx/papp.conf /etc/nginx/sites-enabled/papp

# ตรวจสอบ syntax
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

**URL ที่ใช้งาน:**
- Frontend: `http://app.nsm.go.th/phatsadu/`
- API: `http://app.nsm.go.th/phatsadu/api/`
- Uploads: `http://app.nsm.go.th/phatsadu/uploads/`

---

## API Overview

Base URL: `/phatsadu/api`

| Endpoint | Method | คำอธิบาย |
|---|---|---|
| `/auth/login-url` | GET | รับ URL สำหรับ redirect ไป UMS |
| `/auth/callback` | POST/GET | รับ token จาก UMS แล้วออก cookie |
| `/auth/me` | GET | ข้อมูลผู้ใช้ปัจจุบัน |
| `/auth/logout` | POST | ล้าง cookie |
| `/dashboard` | GET | สถิติภาพรวม |
| `/equipment` | GET/POST | รายการ/สร้างครุภัณฑ์ |
| `/equipment/:id` | GET/PUT/DELETE | จัดการครุภัณฑ์รายชิ้น |
| `/materials` | GET/POST | รายการ/สร้างวัสดุ |
| `/repairs` | GET/POST | รายการ/สร้างใบแจ้งซ่อม |
| `/chat/:repair_id/messages` | GET/POST | ข้อความในใบแจ้งซ่อม |
| `/maintenance` | GET/POST | ตารางบำรุงรักษา |
| `/sale/pending` | GET | ครุภัณฑ์รอจำหน่าย |
| `/sale/draft` | POST | สร้างรายการเตรียมจำหน่าย |
| `/sale/history` | GET | ประวัติการจำหน่าย |
| `/export/equipment` | GET | Export ครุภัณฑ์ (.xlsx) |
| `/import/equipment` | POST | Import ครุภัณฑ์ (.xlsx) |
| `/settings` | GET/PUT | ค่าระบบ (admin) |
| `/audit-logs` | GET | บันทึกกิจกรรม (admin) |
| `/api/health` | GET | Health check |

---

## การ Import/Export ข้อมูล

### Import ครุภัณฑ์
1. ดาวน์โหลด template: `GET /api/import/equipment/template`
2. กรอกข้อมูลในไฟล์ .xlsx
3. อัปโหลด: `POST /api/import/equipment` (multipart `file`)

### Import วัสดุ
1. ดาวน์โหลด template: `GET /api/import/material/template`
2. อัปโหลด: `POST /api/import/material`

### รูปแบบวันที่
รองรับ 2 รูปแบบ:
- `dd/mm/yyyy` (พ.ศ.) เช่น `15/04/2568`
- `yyyy-mm-dd` (ค.ศ.) เช่น `2025-04-15`

---

## Security

- **JWT** เก็บใน HttpOnly Cookie (ป้องกัน XSS)
- **CORS** จำกัดเฉพาะ origin ที่กำหนด
- **Rate Limiting** — API: 300 req/15 min, Auth: 20 req/15 min
- **Helmet** — Security Headers ครบ
- **mongoSanitize** — ป้องกัน NoSQL Injection
- **Multer file filter** — จำกัด mimetype ทุก endpoint
- **Department Scope** — ผู้ใช้เห็นเฉพาะข้อมูลหน่วยงานตนเอง
- **Soft Delete** — ข้อมูลไม่ถูกลบถาวร ใช้ `deleted_at`

---

## License

งานจัดทำและพัฒนาระบบข้อมูลสารสนเทศ กลุ่มงานสถิติข้อมูลและสารสนเทศ เทศบาลนครนครสวรค์ by manarider
