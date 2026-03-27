# PAPP - ระบบบริหารจัดการพัสดุ เทศบาลนครนครสวรรค์

ระบบบริหารจัดการพัสดุสำหรับ:
- ครุภัณฑ์
- วัสดุ
- งานแจ้งซ่อม
- งานซ่อมบำรุง
- สต๊อกและเบิกจ่ายวัสดุ

> สถานะปัจจุบันของ repository นี้: **Documentation First**
>
> ขณะนี้ repo นี้เก็บเอกสารออกแบบระบบและฐานข้อมูลเบื้องต้น  
> ส่วนโครงสร้าง `backend/` และ `frontend/` จะถูก scaffold ในขั้นตอนถัดไป

## 📋 เอกสารอ้างอิง

### Core Documents
- **PAPP-INDEX.md** - ดัชนีเอกสารทั้งหมด
- **PAPP-REQUIREMENTS.md** - ความต้องการระบบ
- **PAPP-DATABASE-DESIGN.md** - ออกแบบฐานข้อมูล
- **PAPP-WORKFLOW-SECURITY.md** - Workflow และ Security
- **PAPP-API-DESIGN.md** - API Design
- **PAPP-SCREEN-LIST.md** - รายการหน้าจอ

### Development Documents
- **PAPP-DEVELOPMENT-PLAN.md** - แผนพัฒนา
- **PAPP-NGINX-DEPLOYMENT.md** - แนวทาง deploy ด้วย Nginx
- **PAPP-DB-SEED-DATA.sql** - Seed/Master data เบื้องต้น

## 🚀 Repository Status

ไฟล์ที่มีแล้วใน repo:
- เอกสาร requirements / database / workflow / API / screens
- แผนพัฒนา
- แนวทาง Nginx deployment
- SQL seed data เบื้องต้น

ไฟล์ที่ยังไม่ได้ scaffold:
- `backend/`
- `frontend/`
- `docker-compose.yml`
- `.env.example`
- source code runtime จริง

## 🔐 Authentication
- Login ผ่าน UMS: `http://192.168.100.151/ums/`
- ใช้ role mapping: `admin`, `manager`, `staff`, `viewer`
- ระบบไม่เก็บรหัสผ่านผู้ใช้ใน PAPP

## 📊 Modules
1. **ครุภัณฑ์** - Equipment Management
2. **แจ้งซ่อม** - Maintenance Tracking
3. **วัสดุ** - Materials Management
4. **เบิกจ่าย** - Withdrawal Requests
5. **รายงาน** - Reports & Analytics
6. **ตั้งค่า** - System Settings

## 🔗 Important URLs

### Production
- FQDN: `http://app.nsm.go.th/phatsadu/`
- IP URL: `http://192.168.100.152/phatsadu/`

### UMS
- `http://192.168.100.151/ums/`

## 🗃️ Database
- Database: PostgreSQL
- Current SQL file: `PAPP-DB-SEED-DATA.sql`
- หมายเหตุ: ไฟล์นี้เป็น **seed/master data เบื้องต้น** ยังไม่ใช่ full migration set ของระบบทั้งหมด

ตัวอย่างการรัน:
```bash
psql -U phatsadu -d phatsadu -f PAPP-DB-SEED-DATA.sql
```

## 🧪 Suggested Next Steps
- ตรวจความสอดคล้องของเอกสารทั้งหมด
- สรุป canonical enum และ business rules
- Scaffold backend Node.js project
- Scaffold frontend React project
- เพิ่ม `.env.example`
- เพิ่ม Docker Compose
- เริ่ม Phase 1 implementation

## 📄 License
Copyright @ Information system development and preparation work, Nakhon Sawan Municipality.by Manarider

---

Last Updated: 2026-03-27
