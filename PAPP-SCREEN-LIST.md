# PAPP Screen List

Version: 1.0  
Date: 2026-03-27

## 1. แนวคิด UI
- เรียบง่าย ชัดเจน
- รองรับ PC / Tablet / Mobile
- ใช้ layout แบบ sidebar + topbar
- ใช้ breadcrumb ในหน้ารายละเอียด
- ฟอร์มแบ่ง section ชัดเจน
- ปุ่มหลักวางตำแหน่งคงที่

## 2. โครงสร้างเมนูหลัก
1. Dashboard
2. ครุภัณฑ์
3. แจ้งซ่อม
4. วัสดุ
5. เบิกจ่ายวัสดุ
6. รายงาน
7. ตั้งค่า

## 3. รายการหน้าจอ

### 3.1 Dashboard
**Route:** `/phatsadu/`
- ภาพรวมครุภัณฑ์
- งานซ่อมค้าง
- จำนวนวัสดุใกล้หมด
- รายการล่าสุด

### 3.2 รายการครุภัณฑ์
**Route:** `/phatsadu/equipments`
- search
- filter
- sort
- pagination
- create/edit/delete ตามสิทธิ์

### 3.3 สร้างครุภัณฑ์
**Route:** `/phatsadu/equipments/create`
ฟิลด์:
- รหัสครุภัณฑ์
- Serial Number
- ประเภทครุภัณฑ์
- รายการครุภัณฑ์
- หน่วยงานเจ้าของ
- วันที่ได้มา
- ราคา
- ตำแหน่งที่ตั้ง
- ผู้ดูแล
- สถานะ
- รายละเอียด
- โครงการ
- หมายเหตุ
- รูปภาพ

### 3.4 รายละเอียดครุภัณฑ์
**Route:** `/phatsadu/equipments/:id`
- ข้อมูลทั้งหมด
- แกลเลอรีรูปภาพ
- ประวัติแจ้งซ่อม
- ปุ่มแจ้งซ่อม
- ปุ่มแก้ไข

### 3.5 แก้ไขครุภัณฑ์
**Route:** `/phatsadu/equipments/:id/edit`

### 3.6 รายการแจ้งซ่อม
**Route:** `/phatsadu/maintenance`
- filter ตามสถานะ / หน่วยงาน / priority
- update status
- add repair record

### 3.7 สร้างใบแจ้งซ่อม
**Route:** `/phatsadu/maintenance/create`

### 3.8 รายละเอียดงานซ่อม
**Route:** `/phatsadu/maintenance/:id`
- timeline
- repair records
- ค่าใช้จ่าย

### 3.9 รายการวัสดุ
**Route:** `/phatsadu/materials`
- search/filter
- ดูคงเหลือ
- low stock alert
- รับเข้า / เบิก / ปรับยอด

### 3.10 สร้างวัสดุ
**Route:** `/phatsadu/materials/create`

### 3.11 รายละเอียดวัสดุ
**Route:** `/phatsadu/materials/:id`
- ข้อมูลวัสดุ
- คงเหลือปัจจุบัน
- ประวัติ movement

### 3.12 รับเข้าวัสดุ
**Route:** `/phatsadu/materials/:id/stock-in`

### 3.13 เบิกจ่ายวัสดุ
**Route:** `/phatsadu/withdrawals`
- สร้างใบเบิก
- อนุมัติ/ไม่อนุมัติ
- จ่ายจริง

### 3.14 สร้างใบเบิกวัสดุ
**Route:** `/phatsadu/withdrawals/create`

### 3.15 รายละเอียดใบเบิกวัสดุ
**Route:** `/phatsadu/withdrawals/:id`

### 3.16 รายงาน
**Route:** `/phatsadu/reports`
- รายงานครุภัณฑ์ตามหน่วยงาน
- รายงานครุภัณฑ์ตามสถานะ
- รายงานประวัติซ่อม
- รายงานวัสดุคงเหลือ
- รายงานวัสดุใกล้หมด
- รายงานการเบิกจ่ายวัสดุ

### 3.17 ตั้งค่า Master Data
**Route:** `/phatsadu/settings/master-data`
- หน่วยงาน
- ประเภทครุภัณฑ์
- ประเภทวัสดุ

### 3.18 ตั้งค่าระบบ
**Route:** `/phatsadu/settings/system`

### 3.19 Audit Log
**Route:** `/phatsadu/settings/audit-logs`

## 4. ตารางสิทธิ์ต่อหน้าจอ

| Screen | viewer | staff | manager | admin |
|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Equipment List | ✓ | ✓ | ✓ | ✓ |
| Equipment Create | ✗ | ✓ | ✓ | ✓ |
| Equipment Edit | ✗ | ✓ | ✓ | ✓ |
| Equipment Delete | ✗ | ✗ | ✗ | ✓ |
| Maintenance List | ✓ | ✓ | ✓ | ✓ |
| Maintenance Create | ✗ | ✓ | ✓ | ✓ |
| Maintenance Approve/Update | ✗ | ✗ | ✓ | ✓ |
| Materials List | ✓ | ✓ | ✓ | ✓ |
| Materials Create | ✗ | ✓ | ✓ | ✓ |
| Materials Edit | ✗ | ✗ | ✓ | ✓ |
| Materials Delete | ✗ | ✗ | ✗ | ✓ |
| Withdrawal Create | ✗ | ✓ | ✓ | ✓ |
| Withdrawal Approve/Issue | ✗ | ✗ | ✓ | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓ |
| Master Data Settings | ✗ | ✗ | ✓ | ✓ |
| System Settings | ✗ | ✗ | ✗ | ✓ |
| Audit Logs | ✗ | ✗ | ✗ | ✓ |

## 5. แนวทางออกแบบ Responsive
- Desktop: sidebar ถาวร + table เต็มรูปแบบ
- Tablet: sidebar ยุบได้
- Mobile: ใช้ card list แทน table บางหน้า และฟอร์มแบบ step/accordion

## 6. Footer มาตรฐานทุกหน้า
copyright @ Information system development and preparation work, Nakhon Sawan Municipality.by Manarider
