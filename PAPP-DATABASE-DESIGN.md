# PAPP Database Design

## 1. แนวคิดการออกแบบ
โครงสร้างฐานข้อมูลแบ่งเป็น 4 กลุ่มหลัก:
1. Master Data
2. Equipment Management
3. Materials & Stock
4. Security / Audit

ใช้ PostgreSQL เป็นฐานข้อมูลหลัก และควรจัดการ schema ผ่าน migration

## 2. Master Tables

### 2.1 departments
- id
- code
- name_th
- is_active
- created_at
- updated_at

### 2.2 equipment_types
- id
- code
- name_th
- is_active
- created_at
- updated_at

### 2.3 material_types
- id
- code
- name_th
- is_active
- created_at
- updated_at

### 2.4 system_settings
- key
- value
- description
- updated_at

## 3. Equipment Tables

### 3.1 equipments
- id
- equipment_code
- serial_number
- equipment_type_id
- item_name
- department_id
- acquired_date
- price
- location_text
- custodian_name
- status
- detail
- project_name
- note
- created_by
- updated_by
- created_at
- updated_at

ข้อกำหนด:
- `equipment_code` ต้อง unique
- `equipment_code` ต้องตรง regex `^[A-Z0-9]{3}-[A-Z0-9]{2}-[A-Z0-9]{4}$`
- `price >= 0`

### 3.2 equipment_images
- id
- equipment_id
- file_path
- file_name
- mime_type
- file_size_bytes
- sort_order
- uploaded_by
- uploaded_at

ข้อกำหนด:
- สูงสุด 4 ภาพต่อ 1 equipment
- ไฟล์ไม่เกิน 2MB
- รองรับเฉพาะ `image/jpeg`, `image/png`, `image/webp`

### 3.3 maintenance_requests
- id
- request_no
- equipment_id
- issue_title
- issue_detail
- priority
- status
- requested_by
- requested_at

สถานะ:
- OPEN
- IN_PROGRESS
- DONE
- CANCELLED

### 3.4 maintenance_records
- id
- maintenance_request_id
- vendor_name
- repair_detail
- repair_cost
- result_status
- repaired_at
- created_by

ผลการซ่อม:
- SUCCESS
- FAILED
- PARTIAL

## 4. Material Tables

### 4.1 materials
- id
- material_code
- material_type_id
- item_name
- department_id
- acquired_date
- unit_name
- unit_price
- quantity_on_hand
- min_stock_level
- note
- created_by
- updated_by
- created_at
- updated_at

ข้อกำหนด:
- `quantity_on_hand >= 0`
- `min_stock_level >= 0`
- `unit_price >= 0`

### 4.2 material_stock_txns
- id
- material_id
- txn_type
- qty_delta
- ref_no
- ref_type
- note
- txn_at
- created_by

ประเภท:
- IN
- OUT
- ADJUST

### 4.3 material_withdrawal_requests
- id
- request_no
- requester_name
- requester_department_id
- status
- requested_at
- approved_by
- approved_at
- note

สถานะ:
- DRAFT
- SUBMITTED
- APPROVED
- REJECTED
- ISSUED
- CANCELLED

### 4.4 material_withdrawal_items
- id
- withdrawal_request_id
- material_id
- request_qty
- approved_qty
- issued_qty

## 5. RBAC Tables

### 5.1 app_roles
- admin
- manager
- staff
- viewer

### 5.2 app_permissions
ตัวอย่าง:
- EQUIPMENT_VIEW
- EQUIPMENT_CREATE
- EQUIPMENT_EDIT
- EQUIPMENT_DELETE
- EQUIPMENT_APPROVE
- MATERIALS_VIEW
- MATERIALS_CREATE
- MATERIALS_EDIT
- MATERIALS_DELETE
- MATERIALS_APPROVE

### 5.3 app_role_permissions
เก็บความสัมพันธ์ role กับ permission

## 6. Audit Table

### 6.1 audit_logs
- id
- module
- action
- entity_name
- entity_id
- before_data
- after_data
- acted_by
- acted_at
- ip_address
- user_agent

## 7. ความสัมพันธ์หลัก
- departments 1:N equipments
- departments 1:N materials
- equipment_types 1:N equipments
- material_types 1:N materials
- equipments 1:N equipment_images
- equipments 1:N maintenance_requests
- maintenance_requests 1:N maintenance_records
- materials 1:N material_stock_txns
- material_withdrawal_requests 1:N material_withdrawal_items

## 8. Index ที่ควรมี
### equipments
- equipment_code
- serial_number
- item_name
- department_id
- status

### materials
- item_name
- material_type_id
- department_id

### material_stock_txns
- material_id, txn_at

### maintenance_requests
- equipment_id, status, requested_at

### audit_logs
- module, acted_at

## 9. กฎข้อมูลสำคัญ
- รหัสครุภัณฑ์ต้องไม่ซ้ำ
- ภาพต้องไม่เกินจำนวนที่กำหนด
- ห้ามสต๊อกติดลบ
- ควรใช้ soft delete ในบางตาราง
- ตารางสำคัญควรมี created_at / updated_at / created_by / updated_by

## 10. ข้อมูลเชื่อมต่อฐานข้อมูล
สำหรับเอกสารอ้างอิง ควรเก็บเฉพาะรูปแบบ:
- `postgresql://<user>:<password>@localhost:5432/phatsadu`

ไม่ควรบันทึก password จริงลงไฟล์เอกสาร  
ควรเก็บไว้ใน `.env` เท่านั้น
