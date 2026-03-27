# PAPP Workflow, Security and Deployment

## 1. สถาปัตยกรรมระบบ
ผู้ใช้ -> Nginx -> NodeJS API -> PostgreSQL

### การทำงาน
- Nginx รับ request ที่ port 80
- route `/phatsadu/` ไปยัง NodeJS backend port 3033
- React UI ทำงานภายใต้ path `/phatsadu/`
- PostgreSQL เป็นฐานข้อมูลหลัก

## 2. Login Workflow ผ่าน UMS
1. ผู้ใช้เปิด `/phatsadu/`
2. หากยังไม่มี session ให้ redirect ไป UMS
3. UMS ยืนยันตัวตน
4. UMS ส่ง token หรือ session claim กลับมายัง PAPP
5. Backend ตรวจสอบ token
6. Backend map role จาก UMS เป็น role ของระบบ
7. Frontend แสดงเมนูตามสิทธิ์

## 3. Workflow ครุภัณฑ์

### 3.1 เพิ่มครุภัณฑ์
1. ผู้ใช้กรอกฟอร์ม
2. เลือกประเภทครุภัณฑ์
3. เลือกหน่วยงานเจ้าของ
4. กรอกรหัสครุภัณฑ์
5. upload รูป
6. backend ตรวจสอบข้อมูล
7. บันทึกลงตาราง equipments
8. บันทึกรูปลง equipment_images
9. เขียน audit log

### 3.2 แก้ไขครุภัณฑ์
1. ค้นหารายการ
2. เปิดหน้ารายละเอียด
3. แก้ไขข้อมูล
4. backend ตรวจสอบสิทธิ์
5. บันทึกข้อมูลใหม่
6. เขียน audit log ก่อน/หลังแก้ไข

### 3.3 แจ้งซ่อม
1. เปิดจากหน้าครุภัณฑ์
2. สร้าง maintenance request
3. เปลี่ยนสถานะเป็น OPEN
4. ระหว่างดำเนินการเปลี่ยนเป็น IN_PROGRESS
5. เมื่อเสร็จงาน เปลี่ยนเป็น DONE
6. บันทึกรายละเอียดใน maintenance_records

## 4. Workflow วัสดุ

### 4.1 เพิ่มวัสดุ
1. กรอกข้อมูลวัสดุ
2. เลือกประเภทวัสดุ
3. เลือกหน่วยงาน
4. ระบุหน่วยนับ
5. บันทึกข้อมูล

### 4.2 รับเข้า
1. สร้าง stock transaction แบบ IN
2. เพิ่มยอด quantity_on_hand
3. บันทึก audit log

### 4.3 เบิกจ่าย
1. ผู้ใช้สร้างใบเบิก
2. ผู้มีสิทธิ์อนุมัติรายการ
3. เมื่อจ่ายจริง สร้าง stock transaction แบบ OUT
4. ระบบตรวจยอดคงเหลือก่อนบันทึก
5. ห้ามยอดติดลบ

### 4.4 ปรับปรุงยอด
1. ใช้ transaction แบบ ADJUST
2. ต้องระบุเหตุผลทุกครั้ง
3. เก็บ log ให้ตรวจสอบย้อนหลังได้

## 5. แนวทาง UI/UX
- หน้า dashboard สรุปภาพรวม
- เมนูหลักแบ่งเป็น:
  - Dashboard
  - ครุภัณฑ์
  - แจ้งซ่อม
  - วัสดุ
  - เบิกจ่าย
  - รายงาน
  - ตั้งค่า
- ฟอร์มควรแบ่ง section ชัดเจน
- ปุ่มบันทึก/ยกเลิกอยู่ตำแหน่งเดิมทุกหน้า
- รองรับมือถือโดยใช้ responsive layout

## 6. ความปลอดภัย
- ตรวจสิทธิ์ทุก API
- Validate input ฝั่ง backend เสมอ
- ใช้ parameterized query / ORM ที่ปลอดภัย
- จำกัดชนิดไฟล์ upload
- จำกัดขนาดไฟล์ upload
- เปิดใช้งาน audit log
- ใช้ CSRF protection ถ้าใช้ cookie session
- sanitize output เพื่อป้องกัน XSS
- กำหนด CORS เฉพาะ domain ที่ใช้งานจริง
- ควรใช้ HTTPS ใน production
- ห้าม hardcode secret ใน source code

## 7. Deployment Guideline
- Nginx เป็น reverse proxy
- React build แล้วเสิร์ฟภายใต้ `/phatsadu/`
- NodeJS รันเป็น service
- PostgreSQL แยก account สำหรับ app
- backup database รายวัน
- ใช้ log rotation สำหรับ nginx และ app logs

## 8. Environment Variables ที่ควรมี
- `PORT=3033`
- `BASE_PATH=/phatsadu`
- `APP_URL=http://app.nsm.go.th/phatsadu/`
- `APP_URL_IP=http://192.168.100.152/phatsadu/`
- `UMS_BASE_URL=http://192.168.100.151/ums/`
- `DATABASE_URL=postgresql://...`
- `SESSION_SECRET=...`
- `ALLOWED_HOSTS=app.nsm.go.th,192.168.100.152`

## 9. Roadmap แนะนำ
### Phase 1
- Login ผ่าน UMS
- Master data
- CRUD ครุภัณฑ์
- Search / Filter

### Phase 2
- ระบบแจ้งซ่อม
- ประวัติซ่อม
- Upload รูปภาพ

### Phase 3
- ระบบวัสดุ
- สต๊อก
- เบิกจ่าย
- แจ้งเตือน low stock

### Phase 4
- รายงาน
- Dashboard
- Export
- hardening security

## 10. Footer มาตรฐาน
copyright @ Information system development and preparation work, Nakhon Sawan Municipality.by Manarider
