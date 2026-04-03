# PAPP — บันทึกความก้าวหน้า

> อัปเดตล่าสุด: **2026-04-02 (Session 7)**
> ระบบ: **ระบบบริหารจัดการพัสดุ เทศบาลนครนครสวรรค์**
> URL Production: https://app.nsm.go.th/phatsadu/

---

## ข้อมูล Infrastructure

| รายการ | ค่า |
|---|---|
| Backend | Node.js / Express, port **4004**, PM2 process name `papp-backend` |
| Frontend | React 18 + Vite + TailwindCSS, `basename="/phatsadu"` |
| Auth | UMS (external SSO) → JWT cookie `papp_token` |
| Database | MongoDB |
| Nginx config | `/data/phatsadu/nginx/papp.conf` |
| Frontend dist | `/data/phatsadu/frontend/dist/` |
| PM2 config | `/data/phatsadu/ecosystem.config.json` |

### คำสั่ง Deploy

```bash
# หลังแก้ Frontend
cd /data/phatsadu/frontend && npm run build

# หลังแก้ Backend
pm2 restart papp-backend

# ดู PM2 log
pm2 logs papp-backend --lines 50
```

---

## สิ่งที่แก้ไขแล้ว

### 2026-04-02 (Session 7)
- **[FEATURE]** Import ครุภัณฑ์ — รองรับรูปแบบวันที่ พ.ศ. (dd/mm/yyyy) ✅
  - ไฟล์: `backend/src/controllers/import.controller.js`
  - เพิ่มฟังก์ชัน `parseThaiDate()` — แปลง `วว/ดด/พ.ศ.` → JS Date
    - รองรับ `dd/mm/yyyy` (พ.ศ. เช่น `15/01/2568`) → หัก 543 อัตโนมัติ
    - รองรับ `yyyy-mm-dd` (ค.ศ. ปกติ) ด้วย
    - ถ้า parse ไม่ได้ → รายงาน error รายแถว (ไม่ crash)
  - เปลี่ยน Template header: `วันที่ได้มา* (วว/ดด/พ.ศ.)` + ตัวอย่าง `15/01/2568`
  - เปลี่ยน `acquired_date: new Date(acquiredDateRaw)` → ใช้ `parseThaiDate()` + validation

- **[FEATURE]** Import ครุภัณฑ์ — เพิ่มคอลัมน์สถานะใน Template ✅
  - ไฟล์: `backend/src/controllers/import.controller.js`
  - เพิ่มคอลัมน์ `สถานะ (ใช้งานได้/ชำรุด/อยู่ระหว่างซ่อม/รอตัดจำหน่าย/จำหน่ายแล้ว)` ใน Template
  - ตัวอย่างใน Template: `ใช้งานได้`
  - Import logic: อ่านค่าจากคอลัมน์ → ถ้าไม่กรอก = `ใช้งานได้` (default)
  - Validation: ถ้ากรอกค่านอก enum → รายงาน error รายแถว พร้อมแสดงค่าที่ถูกต้อง

### 2026-04-02 (Session 6)
- **[BUILD]** Build frontend dist หลัง Session 5 ✅
- **[BUG FIX]** AuditLog model — เพิ่ม `'maintenance'` และ `'import'` เข้า `module` enum ✅
  - ไฟล์: `backend/src/models/auditLog.model.js`
  - แก้ ValidationError ที่เกิดขึ้นเมื่อ maintenance หรือ import สร้าง AuditLog
- **[FEATURE]** Export repair Excel — เพิ่มคอลัมน์ใหม่ ✅
  - ไฟล์: `backend/src/controllers/export.controller.js`
  - เพิ่มคอลัมน์: `ผู้ซ่อม/ร้านซ่อม`, `รายการซ่อม`, `ราคารวม (บาท)`, `หมายเหตุ`
- **[FEATURE]** Dashboard Stats — ยอดรวมค่าซ่อม ✅
  - **Backend** (`dashboard.controller.js`): เพิ่ม aggregate sum `repair_total_price` จาก completed repairs → ส่งกลับใน `repair_cost_total`
  - **Frontend** (`DashboardPage.jsx`): เพิ่ม StatCard "💰 ยอดรวมค่าซ่อม (บ.)" ใน grid (เปลี่ยนเป็น 5 คอลัมน์)
- **[FEATURE]** Print/PDF ใบงานซ่อม ✅
  - สร้าง `frontend/src/pages/repair/RepairPrintPage.jsx`:
    - แสดงข้อมูลครบ: หัวกระดาษ, ข้อมูลครุภัณฑ์, ปัญหา, ผลการซ่อม, ตารางรายการ, ช่องลายเซ็น 3 ช่อง
    - เปิด tab ใหม่ + auto-print ทันที + ปุ่ม "พิมพ์/บันทึก PDF" และ "ปิด"
    - รองรับ A4, @media print ซ่อนปุ่มควบคุม
  - เพิ่ม route `/repair/:id/print` ใน `App.jsx`
  - เพิ่มปุ่ม "🖨️ พิมพ์ใบงานซ่อม" ใน `RepairChatPage.jsx` (เปิด tab ใหม่)

### 2026-04-01 (Session 5)
- **[FEATURE]** ฟอร์มบันทึกผลการซ่อม — ปรับปรุงครั้งใหญ่ ✅
  - **Backend Model** (`repairRequest.model.js`):
    - เพิ่มฟิลด์ `repairer` — ผู้ซ่อม/ร้านที่ซ่อม
    - เพิ่มฟิลด์ `repair_items[]` — รายการซ่อม `{ description, quantity, price }`
    - เพิ่มฟิลด์ `repair_total_price` — ราคารวม (คำนวณจาก items)
    - เพิ่มฟิลด์ `repair_attachments[]` — ไฟล์แนบ `{ filename, path, mime_type, size }`
    - เพิ่มฟิลด์ `repair_note` — หมายเหตุ
  - **Backend Middleware** (`upload.middleware.js`):
    - เพิ่ม `uploadRepairAttachments` — รองรับ image/PDF/Word/Excel, จำกัด 2 ไฟล์ ขนาดไม่เกิน 4MB ต่อไฟล์
  - **Backend Controller** (`repair.controller.js`):
    - เพิ่ม `require path, fs, helpers` เพื่อจัดการไฟล์
    - ปรับ `addRepairResult` รับ `multipart/form-data`, บันทึกไฟล์ลง `uploads/repairs/<id>/`
    - คำนวณ `repair_total_price` จาก items โดยอัตโนมัติ
  - **Backend Route** (`repair.routes.js`):
    - ใส่ `uploadRepairAttachments.array('files', 2)` middleware ใน `PATCH /:id/result`
  - **Frontend** (`RepairChatPage.jsx`):
    - ฟอร์มบันทึก: ผู้ซ่อม/ร้านซ่อม + ตารางรายการ + upload ไฟล์ + หมายเหตุ
    - ตารางรายการซ่อม: กด "+ เพิ่มบรรทัด" ได้, แสดงราคารวมด้านล่าง
    - อัพโหลดไฟล์: validate ประเภทและขนาด client-side ก่อน submit
    - **การแสดงผล**: ไม่แสดงรูปภาพ inline → ปุ่ม "📎 ดูไฟล์แนบ (N)" เปิด modal แทน
    - Modal ดูไฟล์แนบ: แสดง image inline, ไฟล์อื่นแสดงชื่อ+ขนาดพร้อมลิงก์ "เปิดไฟล์ →"

### 2026-04-01 (Session 4)
- **[CLEANUP]** ลบ Dead Code และ Empty Folders ✅
  - ลบ: `AppShell.jsx`, `DashboardStats.jsx`, `LowStockAlerts.jsx`, `PendingList.jsx`
  - ลบ empty folders: `components/equipment/`, `components/material/`, `components/repair/`

- **[FEATURE]** Import Excel — นำเข้าข้อมูลจากไฟล์ Excel ✅
  - **Backend:**
    - สร้าง `import.controller.js`: รองรับ import ครุภัณฑ์และวัสดุ + download template
    - สร้าง `import.routes.js` + mount ใน `app.js`
    - API: `GET /api/import/equipment/template`, `POST /api/import/equipment`
    - API: `GET /api/import/material/template`, `POST /api/import/material`
    - ข้ามแถวซ้ำอัตโนมัติ, แสดง error รายแถว, รองรับ admin เลือกหน่วยงานได้
  - **Frontend:**
    - เพิ่มปุ่ม "📋 Template" + "📤 Import Excel" ใน `EquipmentListPage.jsx` และ `MaterialListPage.jsx`
    - แสดงผลลัพธ์ inline (สำเร็จ N รายการ | ข้ามซ้ำ N | ผิดพลาด N)

- **[FEATURE]** Repair Result Form — ฟอร์มบันทึกผลการซ่อม ✅
  - ไฟล์: `frontend/src/pages/repair/RepairChatPage.jsx`
  - เพิ่มส่วน "ผลการซ่อม" ด้านล่าง status card
  - admin/staff กด "+ บันทึกผล" หรือ "✏️ แก้ไข" เพื่อกรอก textarea
  - บันทึกผ่าน `PATCH /repairs/:id/result` → เปลี่ยนสถานะเป็น "เสร็จสิ้น" อัตโนมัติ
  - แสดง `approved_by` และ `completed_at` ด้วย

- **[FEATURE]** Material Transaction History — ประวัติการเบิก/รับวัสดุ ✅
  - สร้าง `frontend/src/pages/material/MaterialTransactionPage.jsx`
  - เพิ่ม route `/material/transactions` ใน `App.jsx`
  - เพิ่มปุ่ม "📜 ประวัติ" ใน `MaterialListPage.jsx`
  - ดู transaction ทั้งหมด, filter ตามประเภท/สถานะ
  - admin/staff/manager อนุมัติรายการ pending ได้โดยตรง

- **[FEATURE]** Equipment Maintenance Schedule — แบบเต็มพร้อม export ✅
  - **Backend:**
    - สร้าง `maintenanceRecord.model.js` (fields: equipment, type, scheduled_date, status, completed info, cost)
    - สร้าง `maintenance.controller.js`: list, getById, create, complete, remove, summary, exportExcel
    - สร้าง `maintenance.routes.js` + mount ใน `app.js`
    - API: `GET /api/maintenance`, `POST /api/maintenance`, `PATCH /api/maintenance/:id/complete`, `DELETE /api/maintenance/:id`, `GET /api/maintenance/summary`, `GET /api/maintenance/export`
  - **Frontend:**
    - สร้าง `MaintenanceListPage.jsx`: ตารางแสดงทุกแผน, badge เกินกำหนด (สีแดง), modal บันทึกผล, ลบ, Export Excel
    - สร้าง `MaintenanceCreatePage.jsx`: ค้นหาครุภัณฑ์ live search, เลือกประเภท, กำหนดวันที่
    - เพิ่ม route `/maintenance` และ `/maintenance/new` ใน `App.jsx`
    - เพิ่มเมนู "🔩 บำรุงรักษา" ใน `HomePage.jsx`
  - **EquipmentDetailPage**: เพิ่มส่วน "ประวัติการบำรุงรักษา" + badge แจ้งเตือนเกินกำหนด + ปุ่ม "🔧 เพิ่มแผนบำรุงรักษา"

### 2026-04-01 (Session 3)
- **[MAJOR UPDATE]** ปรับปรุงหน้าครุภัณฑ์แบบครบถ้วน ✅
  - **Backend:**
    - เพิ่มฟิลด์ใน Equipment Model: `description`, `project`, `note`
    - ปรับ `equipment.controller.js`:
      - **Pagination**: limit 200 รายการ/หน้า, max 1000 รายการ
      - **Sort**: เรียงจากใหม่ไปเก่า (createdAt desc)
      - **Admin Department Filter**: admin กรองครุภัณฑ์ตามหน่วยงานได้ผ่าน query `?department=xxx`
    - สร้าง Department API: `GET /api/departments` (สำหรับ dropdown)
  
  - **Frontend:**
    - **EquipmentListPage**:
      - เปลี่ยน "eqid" → "รหัสครุภัณฑ์" (แสดง asset_code)
      - เพิ่ม Pagination (แสดงปุ่มหน้า-ถัดไป)
      - Admin: มี dropdown กรองตามหน่วยงาน
      - Non-admin: เห็นเฉพาะครุภัณฑ์หน่วยงานตัวเอง (scope filter)
    
    - **EquipmentDetailPage**:
      - แสดงครบทุกฟิลด์: รหัสครุภัณฑ์, **ชื่อครุภัณฑ์** (เปลี่ยนจาก "ชื่อหลัก"), ซีเรียล, ที่ตั้ง, ราคา, ผู้ดูแล, วันที่ได้มา, รายละเอียด, โครงการ, หน่วยงาน, หมายเหตุ
      - **รูปภาพ**: ย้ายไปด้านล่างสุด, ถ้าไม่มีรูปแสดงข้อความ "ไม่มีภาพประกอบ" แทนรูป default
    
    - **EquipmentCreatePage**:
      - เพิ่มฟิลด์ครบทุกตัว: description, project, note, department_name
      - **Required fields**: asset_code, name, location, price, acquired_date, department_name
      - Admin: dropdown เลือกหน่วยงานได้
      - Non-admin: locked ที่หน่วยงานตัวเอง
      - Label: "**ชื่อครุภัณฑ์**" (เปลี่ยนจาก "ชื่อหลัก")
    
    - **EquipmentEditPage**:
      - เพิ่มฟิลด์ครบเหมือน CreatePage
      - **Required fields**: name, location, price, acquired_date
      - Label: "**ชื่อครุภัณฑ์**" (เปลี่ยนจาก "ชื่อหลัก")
      - **Role-based Access Control**:
        - ฟิลด์ **"หน่วยงานเจ้าของครุภัณฑ์"**:
          - ✅ **Admin** → แก้ไขได้ (เป็น dropdown ดึงจาก `/api/departments`)
          - ❌ **Staff/User** → แก้ไขไม่ได้ (readonly, พื้นหลังสีเทา)
        - ฟิลด์ **"ผู้ดูแล"**:
          - ✅ **Admin + Staff** → แก้ไขได้
          - ❌ **User** → แก้ไขไม่ได้ (readonly, พื้นหลังสีเทา)

### 2026-04-01 (Session 2)
- **[FEATURE]** Material Edit Page — สร้างหน้าแก้ไขวัสดุ ✅
  - ไฟล์: `frontend/src/pages/material/MaterialEditPage.jsx`
  - เพิ่ม route `/material/:id/edit` ใน `App.jsx`
  - เพิ่มปุ่ม "แก้ไข" ใน `MaterialListPage.jsx`
  - ทำงานเหมือน MaterialCreatePage แต่ fetch ข้อมูลเดิมมาก่อน

- **[FEATURE]** Repair Status Update — เพิ่มการเปลี่ยนสถานะการซ่อม ✅
  - ไฟล์: `frontend/src/pages/repair/RepairChatPage.jsx`
  - เพิ่ม dropdown เลือกสถานะ: pending, approved, in_progress, completed
  - แสดง badge สถานะปัจจุบันพร้อมสีที่เหมาะสม
  - ใช้ API `PATCH /repairs/:id/status` (มีอยู่แล้วใน backend)

- **[FEATURE]** Settings Management UI — ปรับปรุงหน้าตั้งค่า ✅
  - ไฟล์: `frontend/src/pages/settings/SettingsPage.jsx`
  - แก้ response key จาก `data.settings` → `data.data`
  - เพิ่ม toggle switch สวยงามสำหรับ boolean settings
  - เพิ่มปุ่ม "บันทึก" สำหรับ string/number settings
  - แสดงชื่อและคำอธิบายภาษาไทยสำหรับแต่ละ setting
  - รองรับ 3 ประเภท: boolean (toggle), number (input + button), string (input + button)

- **[FEATURE]** Export to Excel — ระบบ export ข้อมูลเป็น Excel ✅
  - **Backend:**
    - ติดตั้ง package `xlsx`
    - สร้าง `backend/src/controllers/export.controller.js`
    - สร้าง `backend/src/routes/export.routes.js`
    - เพิ่ม route `/api/export/*` ใน `app.js`
    - API endpoints: 
      - `GET /api/export/equipment` — export ครุภัณฑ์
      - `GET /api/export/material` — export วัสดุ
      - `GET /api/export/repair` — export การแจ้งซ่อม
  - **Frontend:**
    - เพิ่มปุ่ม "📥 Export Excel" ใน 3 หน้า:
      - `EquipmentListPage.jsx`
      - `MaterialListPage.jsx`
      - `RepairListPage.jsx`
    - ฟังก์ชัน handleExport() ดาวน์โหลดไฟล์ .xlsx โดยอัตโนมัติ

### 2026-04-01 (Session 1)
- **[MAJOR UPDATE]** ปรับ Design ใหม่ทั้งหมด — เอา Sidebar ออก ใช้ Header Bar แทน
  - ไฟล์: `frontend/src/components/layout/MainLayout.jsx`
  - เพิ่มข้อมูลผู้ใช้บน navbar (ชื่อ, สิทธิ์, หน่วยงาน) พร้อม badge สีตาม role
  - สร้าง HomePage ใหม่ — แสดงเมนูการ์ด 5 หมวด (ครุภัณฑ์, แจ้งซ่อม, วัสดุ, ตั้งค่า, บันทึกกิจกรรม)
  - เปลี่ยน route `/` ให้เป็น HomePage แทน DashboardPage
  - DashboardPage ย้ายไปอยู่ที่ `/dashboard` สำหรับ admin ดูบันทึกกิจกรรม
  - Responsive design ทำงานได้ทุกขนาดจอ (mobile, tablet, desktop)

- **[BUG FIX]** แก้ response key ไม่ตรง 7 จุด — ทำให้ข้อมูลแสดงผลได้แล้ว ✅
  1. `DashboardPage.jsx` — แก้ `data.stats` → `data.dashboard` และ key ภายใน
  2. `EquipmentListPage.jsx` — แก้ `data.equipment` → `data.data` + search param `{ q: search }`
  3. `RepairListPage.jsx` — แก้ `data.repairs` → `data.data`
  4. `MaterialListPage.jsx` — แก้ `data.materials` → `data.data` + แก้ withdraw endpoint เป็น `/materials/:id/transactions`
  5. `EquipmentDetailPage.jsx` — แก้ `data.equipment` → `data.data`
  6. `RepairChatPage.jsx` — แก้ `data.repair`, `data.messages` → `data.data`
  7. `backend/src/app.js` — Uncomment settings route (สร้าง `settings.routes.js` และ `settings.controller.js`)

- **[FEATURE]** สร้าง 4 หน้าใหม่ — ฟอร์มเพิ่ม/แก้ไขข้อมูล ✅
  1. `EquipmentCreatePage.jsx` — ฟอร์มเพิ่มครุภัณฑ์ (รองรับ upload รูป)
  2. `EquipmentEditPage.jsx` — ฟอร์มแก้ไขครุภัณฑ์
  3. `MaterialCreatePage.jsx` — ฟอร์มเพิ่มวัสดุ
  4. `RepairCreatePage.jsx` — ฟอร์มแจ้งซ่อม
  - เพิ่ม routes ทั้ง 4 หน้าใน `App.jsx`
  - สร้าง API endpoints: `GET /api/equipment/types`, `GET /api/materials/types`

### 2026-03-31
- **[BUG FIX]** Logout redirect ผิด — หน้า Login URL เป็น `app.nsm.go.th/login` แทนที่จะเป็น `app.nsm.go.th/phatsadu/login`
  - ไฟล์: `frontend/src/components/layout/MainLayout.jsx`
  - สาเหตุ: ใช้ `window.location.href = '/login'` ข้าม React Router basename
  - วิธีแก้: เปลี่ยนเป็น `useNavigate` + `navigate('/login', { replace: true })`
  - rebuild frontend dist แล้ว ✅

---

## สิ่งที่ต้องทำต่อ (เรียงลำดับความสำคัญ)

### สิ่งที่ต้องทำในครั้งต่อไป

#### � ปรับปรุงต่อยอด (ทำได้ในอนาคต)
1. **แจ้งเตือน Line/Email** เมื่อมีการแจ้งซ่อมใหม่ หรือสถานะเปลี่ยน

---

## สถานะปัจจุบัน (2026-04-02 Session 6)

> ✅ **ระบบพร้อมใช้งาน — build dist แล้ว**

✅ **ระบบใช้งานได้แล้ว (ครบถ้วน):**
- Authentication ผ่าน UMS
- Dashboard แสดงสถิติ, วัสดุเหลือน้อย, รายการซ่อมรอดำเนินการ
- ครุภัณฑ์: ดูรายการ, ค้นหา, ดูรายละเอียด, เพิ่ม, แก้ไข, Export Excel, **Import Excel + Template**
- วัสดุ: ดูรายการ, เบิกวัสดุ, เพิ่มวัสดุ, แก้ไขวัสดุ, Export Excel, **Import Excel + Template**, **ประวัติ Transaction + อนุมัติ**
- แจ้งซ่อม: ดูรายการ, filter ตามสถานะ, แจ้งซ่อมใหม่, chat, เปลี่ยนสถานะ, Export Excel, **บันทึกผลการซ่อม (ครบถ้วน)**
  - ✅ บันทึกผู้ซ่อม/ร้านซ่อม
  - ✅ ตารางรายการซ่อมพร้อมราคารวม
  - ✅ แนบไฟล์สูงสุด 2 ไฟล์ (image/PDF/Word/Excel) ขนาดไม่เกิน 4MB
  - ✅ หมายเหตุ
  - ✅ ดูไฟล์แนบผ่าน modal (ไม่แสดง inline)
- **บำรุงรักษา**: ตารางแผน, badge เกินกำหนด, บันทึกผล, Export Excel, badge ใน Equipment Detail
- ตั้งค่า: ดูและแก้ไขการตั้งค่าระบบ (admin เท่านั้น)
- Responsive design ทำงานได้ทุกขนาดจอ

✅ **API Endpoints ครบถ้วน:**
- Auth: `/api/auth/*`
- Dashboard: `/api/dashboard/*`
- Equipment: `/api/equipment/*`
- Materials: `/api/materials/*` (รวม transactions)
- Repairs: `/api/repairs/*` (รวม result + file upload)
- Chat: `/api/chat/*`
- Settings: `/api/settings/*`
- Export: `/api/export/*` (equipment, material, repair)
- **Import: `/api/import/*`** (equipment, material + templates)
- **Maintenance: `/api/maintenance/*`** (CRUD + complete + summary + export)

📁 **Upload paths:**
- ครุภัณฑ์: `/uploads/equipment/<type>/<asset_code>.webp`
- แชท: `/uploads/chats/`
- **ผลการซ่อม: `/uploads/repairs/<repair_id>/<timestamp_random>.<ext>`** ← ใหม่ Session 5

---

## Bugs ที่แก้ไขแล้ว ✅

## Bugs ที่แก้ไขแล้ว ✅

### 1. DashboardPage — response key ไม่ตรง
**ปัญหา:** Frontend ใช้ `data.stats`, `data.alerts`, `data.repairs` แต่ backend response เป็น `data.dashboard`, `data.data`
**สาเหตุ:** Frontend ถูกเขียนก่อน backend เปลี่ยน response format
**แก้ไข:** ✅ แก้ทุก response key ให้ตรงกับ backend

### 2. EquipmentListPage — response key + search param ผิด  
**ปัญหา:** ใช้ `data.equipment` และส่ง `{ search }` แต่ backend รับ `{ q }`
**แก้ไข:** ✅ แก้เป็น `data.data` + `params: { q: search }`

### 3. RepairListPage — response key ผิด
**ปัญหา:** ใช้ `data.repairs`
**แก้ไข:** ✅ แก้เป็น `data.data`

### 4. MaterialListPage — response key + endpoint ผิด
**ปัญหา:** ใช้ `data.materials` และ endpoint `/materials/:id/withdraw` ไม่มี
**แก้ไข:** ✅ แก้เป็น `data.data` + ใช้ `/materials/:id/transactions` พร้อม `{ type: 'withdraw', quantity }`

### 5. EquipmentDetailPage — response key ผิด
**ปัญหา:** ใช้ `data.equipment`
**แก้ไข:** ✅ แก้เป็น `data.data`

### 6. RepairChatPage — response key ผิด
**ปัญหา:** ใช้ `data.repair`, `data.messages`
**แก้ไข:** ✅ แก้เป็น `data.data`

### 7. Settings API ถูก comment out
**ปัญหา:** `backend/src/app.js` Settings route ถูก comment ทำให้ SettingsPage error 404
**แก้ไข:** ✅ Uncomment + สร้าง `settings.routes.js` และ `settings.controller.js`

---

## โครงสร้าง Role และสิทธิ์

| Role | สิทธิ์ |
|---|---|
| `admin` | เข้าถึงทุกหน่วยงาน, แก้ไข/ลบได้ทุกอย่าง |
| `manager` | เฉพาะหน่วยงานตัวเอง, อนุมัติ transaction ได้ |
| `staff` | เฉพาะหน่วยงานตัวเอง, เพิ่ม/แก้ไขได้ |
| `viewer` | เฉพาะหน่วยงานตัวเอง, ดูอย่างเดียว |

## API Response Format (backend มาตรฐาน)

```json
// success list
{ "status": "success", "data": [...], "pagination": { "total": 0, "page": 1, "limit": 20, "total_pages": 0 } }

// success single
{ "status": "success", "data": { ... } }

// error
{ "error": "message" }
```

> **สำคัญ**: frontend หลายหน้ายังใช้ key ผิด (เช่น `data.equipment`, `data.repairs`, `data.materials`) แทนที่จะใช้ `data.data` ซึ่งเป็น format จริงของ backend
